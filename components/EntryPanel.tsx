"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, ListChecks, Mail, User } from "lucide-react";
import { startSession } from "@/lib/actions/session";
import type { TestId } from "@/lib/types";
import LoginForm from "@/app/admin/login/LoginForm";

export interface TestSummary {
  id: TestId;
  title: string;
  program: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
}

type Tab = "register" | "signin";
type RegisterStep = "details" | "pick-test";

/**
 * Single unified entry point for both audiences, hosted inside the
 * homepage's floating white card (see app/page.tsx):
 *  - Candidates: "Candidate" tab -> enter name/email -> pick which of the two
 *    tests they're taking -> startSession() -> redirected into the test.
 *  - Reviewers/admins: "Reviewer / Admin" tab -> the existing LoginForm
 *    (now with the enterprise input styling, forgot-password flow, and
 *    Microsoft SSO placeholder), which signs in via Supabase Auth and
 *    redirects to /admin.
 */
export default function EntryPanel({
  initialTab,
  tests,
}: {
  initialTab: Tab;
  tests: TestSummary[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [step, setStep] = useState<RegisterStep>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingTestId, setPendingTestId] = useState<TestId | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      setError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setStep("pick-test");
  }

  function handleStart(testId: TestId) {
    setError(null);
    setPendingTestId(testId);
    startTransition(async () => {
      const result = await startSession(testId, name, email, "");
      if (!result.ok) {
        setError(result.error);
        setPendingTestId(null);
        return;
      }
      router.push(`/take/${testId}/${result.sessionId}`);
    });
  }

  return (
    <div>
      <div className="inline-flex rounded-[var(--radius-full)] bg-[var(--md-surface-variant)] p-1 mb-7">
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition ${
            tab === "register"
              ? "bg-[var(--card)] text-[var(--text-dark)] shadow-sm"
              : "text-[var(--text-secondary)]"
          }`}
        >
          Candidate
        </button>
        <button
          type="button"
          onClick={() => setTab("signin")}
          className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition ${
            tab === "signin"
              ? "bg-[var(--card)] text-[var(--text-dark)] shadow-sm"
              : "text-[var(--text-secondary)]"
          }`}
        >
          Reviewer / Admin
        </button>
      </div>

      {tab === "signin" ? (
        <div>
          <h2 className="text-fs-section text-[var(--text-dark)]">Welcome back</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-6">
            Sign in to continue.
          </p>
          <LoginForm />
        </div>
      ) : step === "details" ? (
        <div>
          <h2 className="text-fs-section text-[var(--text-dark)]">Take an assessment</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-6">
            Enter your details to register, then choose which assessment you&apos;re taking.
          </p>
          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="name">
                Full name
              </label>
              <div className="relative">
                <span className="input-icon">
                  <User size={17} />
                </span>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input input-lg input-with-icon"
                  placeholder="Jane Doe"
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <span className="input-icon">
                  <Mail size={17} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-lg input-with-icon"
                  placeholder="jane@company.com"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary w-full !py-3">
              Continue
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("details");
            }}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--md-primary)] transition inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h2 className="text-fs-section text-[var(--text-dark)]">Choose your assessment</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-6">
            Hi {name.trim().split(" ")[0]}, select the test you&apos;re taking today.
          </p>

          <div className="space-y-4">
            {tests.map((t) => (
              <div key={t.id} className="surface-card surface-card-interactive p-6 space-y-3">
                <span className="badge badge-primary">{t.program}</span>
                <h3 className="font-semibold text-[var(--text-dark)]">{t.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {t.description}
                </p>
                <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={13} /> {t.durationMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ListChecks size={13} /> {t.totalQuestions} questions
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStart(t.id)}
                  className="btn btn-primary w-full mt-1"
                >
                  {isPending && pendingTestId === t.id ? "Starting..." : "Start assessment"}
                  {!(isPending && pendingTestId === t.id) && <ArrowRight size={15} />}
                </button>
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
