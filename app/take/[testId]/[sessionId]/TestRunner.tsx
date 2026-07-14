"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3 } from "lucide-react";
import { submitSession } from "@/lib/actions/session";
import { rngForSession, seededShuffle } from "@/lib/shuffle";
import type { Answer, TestId, TestSchema } from "@/lib/types";
import Logo from "@/components/Logo";

interface Props {
  testId: TestId;
  sessionId: string;
  title: string;
  durationMinutes: number;
  schema: TestSchema;
}

// A single option as presented to the candidate, in (possibly shuffled)
// display position, but carrying the option's `originalIndex` - its index in
// `question.options` as returned by the server. That original index is what
// gets recorded when the candidate picks this option, never the display
// position. This is the whole ballgame for keeping scoring correct: the
// server-side scoring engine (lib/scoring.ts) re-fetches the schema fresh and
// does `q.options[selectedIndex]`, so as long as `selectedIndex` is always the
// *original* index, shuffling display order is 100% invisible to scoring.
interface DisplayOption {
  originalIndex: number;
  label: string;
}

interface DisplayQuestion {
  id: string;
  prompt: string;
  options: DisplayOption[];
}

interface DisplaySection {
  type: string;
  instructions: string;
  questions: DisplayQuestion[];
}

// All current content is `situational_judgment` (options are `{ text, trait_deltas }`
// objects), but this stays defensive about option shape (string vs. `{ text }`)
// so a differently-shaped section type would render without crashing rather
// than assuming the current 100%-SJT layout.
function optionLabel(o: unknown): string {
  return typeof o === "string" ? o : (o as { text: string }).text;
}

// Builds a per-session, per-candidate display order: question order within
// each section is shuffled, and each question's option order is
// independently shuffled. Both shuffles are driven by one PRNG seeded from
// the session id (via rngForSession), and always requested in the same
// order (section by section, then question by question), so the exact same
// sessionId always reproduces the exact same display order - this is what
// makes it stable across page reloads for a given session while differing
// across sessions/candidates. This never touches question/option content,
// trait_deltas, flags, or scoring - it's purely a rendering-order transform
// applied on top of the schema fetched from the server.
function buildDisplaySections(schema: TestSchema, sessionId: string): DisplaySection[] {
  const rng = rngForSession(sessionId);
  return schema.sections.map((section) => {
    const questionOrder = seededShuffle(
      section.questions.map((_, i) => i),
      rng
    );
    const questions: DisplayQuestion[] = questionOrder.map((qIdx) => {
      const q = section.questions[qIdx];
      const optionOrder = seededShuffle(
        q.options.map((_, i) => i),
        rng
      );
      return {
        id: q.id,
        prompt: q.prompt,
        options: optionOrder.map((originalIndex) => ({
          originalIndex,
          label: optionLabel(q.options[originalIndex]),
        })),
      };
    });
    return {
      type: section.type,
      instructions: section.instructions,
      questions,
    };
  });
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function TestRunner({ testId, sessionId, title, durationMinutes, schema }: Props) {
  const router = useRouter();

  // Recomputed only when the schema or session changes - not persisted
  // anywhere - so the shuffle is fully deterministic from (schema, sessionId)
  // and reloading the page mid-test yields the identical order again.
  const displaySections = useMemo(
    () => buildDisplaySections(schema, sessionId),
    [schema, sessionId]
  );
  const questions = useMemo(
    () => displaySections.flatMap((s) => s.questions),
    [displaySections]
  );

  // Keyed by question id -> the *original* option index (not display
  // position). This is exactly the shape lib/types.ts's Answer /
  // lib/actions/session.ts already expect, so submission and scoring are
  // untouched.
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const doSubmit = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    const payload: Answer[] = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: answers[q.id] ?? -1,
    }));

    const result = await submitSession(sessionId, testId, payload);
    if (!result.ok) {
      hasSubmittedRef.current = false;
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    router.push("/take/thank-you");
  }, [answers, questions, sessionId, testId, router]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      const timeout = setTimeout(() => {
        doSubmit();
      }, 0);
      return () => clearTimeout(timeout);
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, doSubmit]);

  const low = secondsLeft <= 60;

  return (
    <main className="flex-1 pb-28">
      <div className="sticky top-0 z-10 bg-[var(--md-surface)]/95 backdrop-blur border-b border-[var(--md-outline-variant)] elevation-1">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo variant="mark" href={null} height={22} className="flex-none hidden sm:block" />
            <div className="min-w-0">
              <h1 className="font-semibold truncate text-[var(--md-on-surface)]">{title}</h1>
              <p className="text-xs text-[var(--md-on-surface-variant)]">
                {answeredCount} / {questions.length} answered
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 font-mono text-lg font-bold px-3.5 py-1.5 rounded-[var(--radius-full)] flex-none transition-colors duration-300 ${
              low
                ? "bg-[var(--md-error-container)] text-[var(--md-error)]"
                : "bg-[var(--md-surface-variant)] text-[var(--md-on-surface)]"
            }`}
          >
            <Clock3 size={17} />
            {formatTime(secondsLeft)}
          </div>
        </div>
        <div className="progress-track rounded-none h-1">
          <div
            className="progress-fill"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-10">
        {displaySections.map((section, sIdx) => {
          return (
            <section key={sIdx} className="space-y-4">
              <div className="border-b border-[var(--md-outline-variant)] pb-3">
                <h2 className="text-fs-label">
                  {section.type === "situational_judgment" ? "Situational judgment" : section.type}
                </h2>
                <p className="text-sm text-[var(--md-on-surface-variant)] mt-1">
                  {section.instructions}
                </p>
              </div>

              {section.questions.map((q, qIdx) => {
                const selected = answers[q.id];

                return (
                  <div key={q.id} className="surface-card p-5 sm:p-6 fade-in-up">
                    <p className="font-medium mb-4 text-[var(--md-on-surface)] leading-relaxed">
                      <span className="text-[var(--md-on-surface-variant)] font-normal">
                        {sIdx + 1}.{qIdx + 1}
                      </span>{" "}
                      {q.prompt}
                    </p>
                    <div className="space-y-2.5">
                      {q.options.map((opt) => {
                        const isSelected = selected === opt.originalIndex;
                        return (
                          <label
                            key={opt.originalIndex}
                            className={`option-card${isSelected ? " is-selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              className="sr-only"
                              checked={isSelected}
                              onChange={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: opt.originalIndex }))
                              }
                            />
                            <span className="option-radio-dot" aria-hidden="true">
                              {isSelected && <Check size={11} strokeWidth={3.5} className="text-[var(--md-primary)]" />}
                            </span>
                            <span className="text-[var(--md-on-surface)]">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-[var(--md-surface)] border-t border-[var(--md-outline-variant)] elevation-2">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            {allAnswered
              ? "All questions answered."
              : `${questions.length - answeredCount} question(s) remaining.`}
          </p>
          <div className="flex items-center gap-3">
            {submitError && <p className="text-sm text-[var(--md-error)]">{submitError}</p>}
            <button onClick={doSubmit} disabled={submitting} className="btn btn-primary">
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
