import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CandidateReport from "@/lib/pdf/CandidateReport";
import type {
  CompositeScores,
  EthicsFlag,
  RecommendationBand,
  TraitKey,
} from "@/lib/types";

// Node runtime required - @react-pdf/renderer is not edge-compatible.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StoredScores {
  traitScores: Record<TraitKey, number>;
  composite: CompositeScores;
  manualReviewRecommended: boolean;
  leadershipPotentialNote: string | null;
}

interface SessionDetailRow {
  id: string;
  test_id: string;
  status: string;
  submitted_at: string | null;
  scores: StoredScores | null;
  flags: EthicsFlag[] | null;
  recommendation: RecommendationBand | null;
  candidates: { name: string; email: string; target_role: string | null } | null;
  tests: { title: string } | null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Uses the caller's own authenticated Supabase session (not the service
  // role), so this endpoint is subject to the same RLS policies as the admin
  // dashboard - only a signed-in team member (admin_profiles row) can fetch
  // any session's report; an unauthenticated or non-team request gets nothing.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, test_id, status, submitted_at, scores, flags, recommendation, candidates(name, email, target_role), tests(title)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const session = data as unknown as SessionDetailRow;

  if (session.status !== "submitted" || !session.scores) {
    return NextResponse.json({ error: "This session has not been submitted yet." }, { status: 400 });
  }

  const candidateName = session.candidates?.name ?? "Candidate";
  const buffer = await renderToBuffer(
    CandidateReport({
      candidateName,
      candidateEmail: session.candidates?.email ?? "",
      targetRole: session.candidates?.target_role ?? null,
      testTitle: session.tests?.title ?? session.test_id,
      submittedAt: session.submitted_at,
      traitScores: session.scores.traitScores,
      composite: session.scores.composite,
      recommendation: session.recommendation,
      manualReviewRecommended: session.scores.manualReviewRecommended,
      leadershipPotentialNote: session.scores.leadershipPotentialNote,
      flags: session.flags ?? [],
    })
  );

  const fileSafeName = candidateName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  // Copy into a plain Uint8Array backed by a real ArrayBuffer - Buffer's type
  // (Uint8Array<ArrayBufferLike>, which can include SharedArrayBuffer) isn't
  // structurally assignable to BodyInit/BlobPart under strict TS lib types.
  const bytes = Uint8Array.from(buffer);

  return new NextResponse(new Blob([bytes], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="score-report-${fileSafeName}.pdf"`,
    },
  });
}
