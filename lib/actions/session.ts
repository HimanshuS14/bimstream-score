"use server";

import { randomUUID } from "crypto";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { scoreSubmission } from "@/lib/scoring";
import type { Answer, TestId, TestSchema } from "@/lib/types";

export interface StartSessionResult {
  ok: true;
  sessionId: string;
  candidateId: string;
}

export interface StartSessionError {
  ok: false;
  error: string;
}

/**
 * Creates a candidate row and an in_progress session row for that candidate.
 * Uses the ANON key client (not service role) so this exercises the same RLS
 * policies a direct browser call would be subject to: anon may INSERT a
 * candidate row and INSERT a session row, nothing else.
 */
export async function startSession(
  testId: TestId,
  name: string,
  email: string,
  targetRole: string
): Promise<StartSessionResult | StartSessionError> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName || !trimmedEmail) {
    return { ok: false, error: "Name and email are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (testId !== "modeler" && testId !== "leadership") {
    return { ok: false, error: "Unknown test." };
  }

  const supabase = createSupabaseAnonClient();

  // IDs are generated here (not read back via RETURNING/`.select()`) on purpose:
  // the anon key is only ever granted INSERT on candidates/sessions, never
  // SELECT, so candidate data can't be listed via the public API. Requesting
  // the row back after insert would require SELECT privilege we deliberately
  // don't grant, so we mint the UUIDs client-side and insert them explicitly.
  const candidateId = randomUUID();
  const { error: candidateError } = await supabase.from("candidates").insert({
    id: candidateId,
    name: trimmedName,
    email: trimmedEmail,
    target_role: targetRole || testId,
  });

  if (candidateError) {
    return { ok: false, error: candidateError.message };
  }

  const sessionId = randomUUID();
  const { error: sessionError } = await supabase.from("sessions").insert({
    id: sessionId,
    candidate_id: candidateId,
    test_id: testId,
    status: "in_progress",
    answers: [],
  });

  if (sessionError) {
    return { ok: false, error: sessionError.message };
  }

  return { ok: true, sessionId, candidateId };
}

export interface SubmitSessionResult {
  ok: true;
}
export interface SubmitSessionError {
  ok: false;
  error: string;
}

/**
 * Server-side-only scoring entry point. Never trusts a client-submitted score:
 * re-fetches the authoritative test schema with the service-role key and
 * recomputes everything from the candidate's raw selected option indices.
 */
export async function submitSession(
  sessionId: string,
  testId: TestId,
  answers: Answer[]
): Promise<SubmitSessionResult | SubmitSessionError> {
  if (!sessionId || (testId !== "modeler" && testId !== "leadership")) {
    return { ok: false, error: "Invalid submission." };
  }

  const supabase = createSupabaseServiceClient();

  // Confirm the session exists, belongs to this test, and hasn't already been submitted.
  const { data: existing, error: fetchError } = await supabase
    .from("sessions")
    .select("id, test_id, status")
    .eq("id", sessionId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Session not found." };
  }
  if (existing.test_id !== testId) {
    return { ok: false, error: "Test mismatch for this session." };
  }
  if (existing.status === "submitted") {
    // Idempotent: treat re-submits (e.g. double-click, timer race) as success.
    return { ok: true };
  }

  const { data: testRow, error: testError } = await supabase
    .from("tests")
    .select("schema")
    .eq("id", testId)
    .single();

  if (testError || !testRow) {
    return { ok: false, error: "Could not load test definition." };
  }

  const schema = testRow.schema as TestSchema;
  const result = scoreSubmission(testId, schema, answers);

  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      answers,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      scores: {
        traitScores: result.traitScores,
        composite: result.composite,
        manualReviewRecommended: result.manualReviewRecommended,
        leadershipPotentialNote: result.leadershipPotentialNote ?? null,
      },
      flags: result.flags,
      recommendation: result.recommendation,
    })
    .eq("id", sessionId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}
