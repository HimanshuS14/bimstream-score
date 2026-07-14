import type {
  Answer,
  EthicsFlag,
  LeadershipCompositeScores,
  ModelerCompositeScores,
  RecommendationBand,
  ScoringResult,
  SjtQuestion,
  SjtSection,
  TestId,
  TestSchema,
  TraitKey,
} from "./types";
import { TRAIT_KEYS } from "./types";

/**
 * Server-side scoring engine implementing content/scoring-methodology.md exactly
 * (v2 methodology: pure behavioral, 7 trait dimensions, both tests 100%
 * situational-judgment, 30 questions / 30 minutes each).
 *
 * This must never run in the browser and must never trust a client-submitted
 * score - it always recomputes from the authoritative test schema (fetched
 * server-side) and the candidate's raw selected option indices.
 *
 * Nothing here hardcodes a question count or a fixed trait quota: per-trait
 * normalization is always computed dynamically from whatever situational_judgment
 * question(s) the loaded schema actually contains for that trait.
 */

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// Collects every question from every `situational_judgment` section in the
// schema (there is currently exactly one such section per test, holding all 30
// questions, but this stays dynamic rather than assuming that shape). Any other
// section type present in the schema is simply skipped rather than crashing -
// there is no `analytical_mcq` section anymore, but this keeps the engine
// forward/backward tolerant if one is ever reintroduced for a different test.
function collectSjtQuestions(test: TestSchema): SjtQuestion[] {
  return test.sections
    .filter((s): s is SjtSection => (s as { type?: string }).type === "situational_judgment")
    .flatMap((s) => s.questions);
}

function scoreSjt(questions: SjtQuestion[], answers: Map<string, number>) {
  const traitScores = {} as Record<TraitKey, number>;
  for (const key of TRAIT_KEYS) traitScores[key] = 0;

  const flags: EthicsFlag[] = [];

  // Track running raw/min/max per trait, only over questions where the trait
  // has a nonzero delta on at least one option (per scoring-methodology.md).
  // This is what makes the per-trait normalization fully dynamic: it doesn't
  // matter how many questions exist for a trait, or what a question's `topic`
  // label says - only which options actually carry a nonzero delta for it.
  const raw: Partial<Record<TraitKey, number>> = {};
  const min: Partial<Record<TraitKey, number>> = {};
  const max: Partial<Record<TraitKey, number>> = {};

  for (const q of questions) {
    const selectedIndex = answers.get(q.id);
    const selectedOption = selectedIndex !== undefined ? q.options[selectedIndex] : undefined;

    // Which traits does this question have a nonzero delta for, on any option?
    const traitsInQuestion = new Set<TraitKey>();
    for (const opt of q.options) {
      for (const key of Object.keys(opt.trait_deltas) as TraitKey[]) {
        if ((opt.trait_deltas[key] ?? 0) !== 0) traitsInQuestion.add(key);
      }
    }

    for (const trait of traitsInQuestion) {
      const deltasForTrait = q.options.map((o) => o.trait_deltas[trait] ?? 0);
      const questionMax = Math.max(...deltasForTrait);
      const questionMin = Math.min(...deltasForTrait);

      max[trait] = (max[trait] ?? 0) + questionMax;
      min[trait] = (min[trait] ?? 0) + questionMin;

      const selectedDelta = selectedOption ? selectedOption.trait_deltas[trait] ?? 0 : 0;
      raw[trait] = (raw[trait] ?? 0) + selectedDelta;
    }

    // Ethics red flags are recorded verbatim regardless of trait scoring, and
    // regardless of the question's `topic` - a flag can appear on any question
    // (e.g. a Problem-Solving or Organizational Mindset question), not only the
    // small dedicated Ethics quota. This widens the net for catching integrity
    // issues, per traits.json / scoring-methodology.md.
    if (selectedOption && selectedOption.flag === "ethics_concern") {
      flags.push({
        questionId: q.id,
        prompt: q.prompt,
        optionText: selectedOption.text,
        traitDeltas: selectedOption.trait_deltas,
      });
    }
  }

  for (const trait of TRAIT_KEYS) {
    const rawT = raw[trait];
    const maxT = max[trait];
    const minT = min[trait];
    if (rawT === undefined || maxT === undefined || minT === undefined) {
      // Trait never appears with a nonzero delta anywhere in this test's SJT
      // questions (shouldn't happen with the current 7-trait question banks,
      // but stays defensive/dynamic rather than assuming full coverage).
      traitScores[trait] = 0;
      continue;
    }
    if (maxT === minT) {
      // No discrimination possible - default neutral.
      traitScores[trait] = 50;
      continue;
    }
    const normalized = ((rawT - minT) / (maxT - minT)) * 100;
    traitScores[trait] = clamp(normalized, 0, 100);
  }

  return { traitScores, flags };
}

function computeModelerComposite(traitScores: Record<TraitKey, number>): ModelerCompositeScores {
  // "Team & Delivery Fit" = TP*0.30 + CM*0.25 + PS*0.25 + LD*0.20
  const teamDeliveryFit =
    traitScores.TP * 0.3 + traitScores.CM * 0.25 + traitScores.PS * 0.25 + traitScores.LD * 0.2;
  const leadershipPotential = traitScores.LD >= 70;
  return { kind: "modeler", teamDeliveryFit, leadershipPotential };
}

function computeLeadershipComposite(traitScores: Record<TraitKey, number>): LeadershipCompositeScores {
  // "Leadership Readiness" = LD*0.35 + DR*0.20 + CM*0.20 + OM*0.15 + TP*0.05 + PS*0.05
  const leadershipReadiness =
    traitScores.LD * 0.35 +
    traitScores.DR * 0.2 +
    traitScores.CM * 0.2 +
    traitScores.OM * 0.15 +
    traitScores.TP * 0.05 +
    traitScores.PS * 0.05;
  return { kind: "leadership", leadershipReadiness };
}

function hasCriticalFlag(flags: EthicsFlag[]): boolean {
  // The question banks' ethics_concern options are all drawn from the
  // categorical "critical" set described in traits.json (falsifying hours,
  // hiding errors from clients/reviewers, complying with a request to
  // misreport/defraud, etc). The JSON schema carries no severity sub-tag, so -
  // per scoring-methodology.md, which only ever describes a hypothetical
  // "single non-critical flag" for the Conditional band without adding a real
  // severity field - every ethics_concern flag in this bank is treated as
  // critical: any flag forces "Not Recommended" for both tests, same as v1.
  return flags.length > 0;
}

function recommendModeler(
  composite: ModelerCompositeScores,
  traitScores: Record<TraitKey, number>,
  flags: EthicsFlag[]
): RecommendationBand {
  const { teamDeliveryFit } = composite;
  const et = traitScores.ET;
  if (et < 50 || hasCriticalFlag(flags) || teamDeliveryFit < 40) {
    return "Not Recommended";
  }
  if (teamDeliveryFit >= 70 && et >= 60 && flags.length === 0) {
    return "Strong Fit";
  }
  return "Conditional";
}

function recommendLeadership(
  composite: LeadershipCompositeScores,
  traitScores: Record<TraitKey, number>,
  flags: EthicsFlag[]
): RecommendationBand {
  const { leadershipReadiness } = composite;
  const et = traitScores.ET;
  if (leadershipReadiness < 55 || hasCriticalFlag(flags) || et < 50) {
    return "Not Recommended";
  }
  if (leadershipReadiness >= 75 && flags.length === 0) {
    return "Strong Fit";
  }
  return "Conditional";
}

export function scoreSubmission(testId: TestId, test: TestSchema, answers: Answer[]): ScoringResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));
  const questions = collectSjtQuestions(test);

  const { traitScores, flags } = scoreSjt(questions, answerMap);
  const manualReviewRecommended = flags.length > 0;

  if (testId === "modeler") {
    const composite = computeModelerComposite(traitScores);
    const recommendation = recommendModeler(composite, traitScores, flags);
    const leadershipPotentialNote = composite.leadershipPotential
      ? "Leadership potential - consider for fast-track / Assistant Manager pipeline."
      : undefined;
    return {
      traitScores,
      composite,
      flags,
      manualReviewRecommended,
      recommendation,
      leadershipPotentialNote,
    };
  }

  const composite = computeLeadershipComposite(traitScores);
  const recommendation = recommendLeadership(composite, traitScores, flags);
  return {
    traitScores,
    composite,
    flags,
    manualReviewRecommended,
    recommendation,
  };
}
