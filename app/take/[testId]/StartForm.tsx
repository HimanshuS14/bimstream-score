"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { startSession } from "@/lib/actions/session";
import type { TestId } from "@/lib/types";

export default function StartForm({ testId }: { testId: TestId }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startSession(testId, name, email, targetRole);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/take/${testId}/${result.sessionId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input input-lg"
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input input-lg"
          placeholder="jane@example.com"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="targetRole">
          Role you are applying for (optional)
        </label>
        <input
          id="targetRole"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="input input-lg"
          placeholder="e.g. Senior Modeler"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary w-full">
        {isPending ? "Starting..." : "Start assessment"}
        {!isPending && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
