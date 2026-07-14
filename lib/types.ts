// Shared types for the BIM assessment test schema, answers and scoring results.
// These mirror the structure of content/modeler-test.json and content/leadership-test.json.
//
// v3 content revision: both tests are now 100% situational-judgment (30 questions
// each, 30-minute timer), across 7 behavioral trait dimensions. The old AR
// (Analytical Reasoning) trait and the `analytical_mcq` section type are gone -
// technical/software skill is now assessed by a separate test + the Personal
// Interview, not this instrument. See content/traits.json and
// content/scoring-methodology.md for the authoritative definitions.

export type TraitKey = "LD" | "TP" | "CM" | "PS" | "DR" | "OM" | "ET";

export const TRAIT_KEYS: TraitKey[] = ["LD", "TP", "CM", "PS", "DR", "OM", "ET"];

export interface Trait {
  key: TraitKey;
  name: string;
  description: string;
}

export interface TraitsFile {
  traits: Trait[];
  notes: string;
}

export interface SjtOption {
  text: string;
  trait_deltas: Partial<Record<TraitKey, number>>;
  flag?: "ethics_concern";
}

export interface SjtQuestion {
  id: string;
  // One of the 7 trait keys, for organization/reporting only - scoring always
  // runs off trait_deltas, never off this label (per scoring-methodology.md).
  topic: TraitKey;
  prompt: string;
  options: SjtOption[];
}

export interface SjtSection {
  type: "situational_judgment";
  instructions: string;
  questions: SjtQuestion[];
}

// The current content only ever produces `situational_judgment` sections, but
// the type stays a union (and downstream code filters by `type` rather than
// assuming array shape) so that a future section kind added to the schema
// would be safely ignored by scoring/UI rather than crashing them.
export type Section = SjtSection;

export type TestId = "modeler" | "leadership";

export interface TestSchema {
  testId: TestId;
  // Platform-level branding, present on every test schema as of the
  // "BIMstream SCORE" content revision (SCORE = Situational Competency &
  // Organizational Readiness Evaluation). `title` remains the test-specific
  // title (e.g. "SCORE — Modeler / Senior Modeler Assessment") and should
  // always be shown on that test's own pages instead of a hardcoded string.
  program: string;
  programFullName: string;
  title: string;
  durationMinutes: number;
  audience: string;
  description: string;
  // topicWeights is informational (question quota per trait) - not used by scoring.
  topicWeights?: Partial<Record<TraitKey, number>>;
  sections: Section[];
}

// A single candidate answer: which option index they picked for a given question id.
export interface Answer {
  questionId: string;
  selectedIndex: number;
}

export interface EthicsFlag {
  questionId: string;
  prompt: string;
  optionText: string;
  traitDeltas: Partial<Record<TraitKey, number>>;
}

export interface ModelerCompositeScores {
  kind: "modeler";
  // Primary composite, "Team & Delivery Fit" =
  //   TP*0.30 + CM*0.25 + PS*0.25 + LD*0.20 (all normalized 0-100 first).
  teamDeliveryFit: number;
  leadershipPotential: boolean; // normalized LD >= 70
}

export interface LeadershipCompositeScores {
  kind: "leadership";
  // Primary composite, "Leadership Readiness" =
  //   LD*0.35 + DR*0.20 + CM*0.20 + OM*0.15 + TP*0.05 + PS*0.05 (all normalized 0-100 first).
  leadershipReadiness: number;
}

export type CompositeScores = ModelerCompositeScores | LeadershipCompositeScores;

export type RecommendationBand = "Strong Fit" | "Conditional" | "Not Recommended";

export interface ScoringResult {
  traitScores: Record<TraitKey, number>; // normalized 0-100 for every trait that appears in the test
  composite: CompositeScores;
  flags: EthicsFlag[];
  manualReviewRecommended: boolean;
  recommendation: RecommendationBand;
  leadershipPotentialNote?: string;
}
