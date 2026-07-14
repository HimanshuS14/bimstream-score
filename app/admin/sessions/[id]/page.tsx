import { notFound, redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Flag, XCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminShell from "@/components/AdminShell";
import { TRAIT_LABELS } from "@/lib/traits";
import { TRAIT_KEYS } from "@/lib/types";
import type {
  CompositeScores,
  EthicsFlag,
  RecommendationBand,
  TraitKey,
} from "@/lib/types";

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
  created_at: string;
  submitted_at: string | null;
  scores: StoredScores | null;
  flags: EthicsFlag[] | null;
  recommendation: RecommendationBand | null;
  candidates: { name: string; email: string; target_role: string | null } | null;
  tests: { title: string } | null;
}

function bandVisuals(band: RecommendationBand | null) {
  switch (band) {
    case "Strong Fit":
      return {
        classes: "bg-[var(--md-success-container)] text-[var(--md-on-success-container)] border-transparent",
        Icon: CheckCircle2,
      };
    case "Conditional":
      return {
        classes: "bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] border-transparent",
        Icon: AlertTriangle,
      };
    case "Not Recommended":
      return {
        classes: "bg-[var(--md-error-container)] text-[var(--md-on-error-container)] border-transparent",
        Icon: XCircle,
      };
    default:
      return {
        classes: "bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)] border-transparent",
        Icon: CheckCircle2,
      };
  }
}

function barColor(score: number) {
  if (score >= 66) return "var(--md-success)";
  if (score >= 40) return "var(--md-warning)";
  return "var(--md-error)";
}

function TraitBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-[var(--md-on-surface)]">{label}</span>
        <span className="text-[var(--md-on-surface-variant)] font-mono text-xs">
          {Math.round(score)}/100
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${Math.max(0, Math.min(100, score))}%`,
            background: barColor(score),
          }}
        />
      </div>
    </div>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, test_id, status, created_at, submitted_at, scores, flags, recommendation, candidates(name, email, target_role), tests(title)"
    )
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const session = data as unknown as SessionDetailRow;
  const scores = session.scores;
  const flags = session.flags ?? [];

  const primaryCompositeLabel =
    scores?.composite.kind === "modeler" ? "Team & Delivery Fit" : "Leadership Readiness";
  const primaryCompositeValue = scores
    ? scores.composite.kind === "modeler"
      ? scores.composite.teamDeliveryFit
      : scores.composite.leadershipReadiness
    : 0;

  const { classes: bandClasses, Icon: BandIcon } = bandVisuals(session.recommendation);

  return (
    <AdminShell userEmail={user.email}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--md-on-surface)]">
          {session.candidates?.name ?? "Candidate"}
        </h1>
        <p className="text-[var(--md-on-surface-variant)] text-sm">{session.candidates?.email}</p>
        <p className="text-[var(--md-on-surface-variant)] text-sm">
          {session.tests?.title ?? session.test_id} · Target role:{" "}
          {session.candidates?.target_role ?? "—"}
        </p>
      </div>

      {session.status !== "submitted" && (
        <div className="rounded-[var(--radius-md)] bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)] text-sm p-3 mb-6">
          This session is still in progress and has not been submitted.
        </div>
      )}

      {session.recommendation && (
        <div className={`rounded-[var(--radius-lg)] border p-5 mb-6 elevation-1 ${bandClasses}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {scores && (
              <div>
                <p className="text-xs uppercase tracking-wide opacity-70 font-medium">
                  {primaryCompositeLabel}
                </p>
                <p className="text-3xl font-bold">{Math.round(primaryCompositeValue)}/100</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <BandIcon size={26} />
              <div>
                <p className="text-xs uppercase tracking-wide opacity-70 font-medium">
                  Overall recommendation
                </p>
                <p className="text-lg font-bold">{session.recommendation}</p>
              </div>
            </div>
            {scores?.manualReviewRecommended && (
              <span className="badge bg-white/60 text-current flex-none">
                <AlertTriangle size={12} /> Manual review recommended
              </span>
            )}
          </div>
        </div>
      )}

      {scores?.leadershipPotentialNote && (
        <div className="rounded-[var(--radius-md)] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] text-sm p-3.5 mb-6">
          {scores.leadershipPotentialNote}
        </div>
      )}

      {scores && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="surface-card p-5">
            <h2 className="font-semibold mb-4 text-[var(--md-on-surface)]">Composite score</h2>
            <div className="space-y-4">
              <TraitBar label={primaryCompositeLabel} score={primaryCompositeValue} />
              {scores.composite.kind === "modeler" && (
                <p className="text-xs text-[var(--md-on-surface-variant)] leading-relaxed">
                  Team &amp; Delivery Fit = Team Play x0.30 + Communication x0.25 +
                  Problem-Solving x0.25 + Leadership x0.20 (all normalized 0-100). Dispute
                  Resolution, Organizational Mindset, and Ethics &amp; Integrity are reported
                  individually below rather than folded into this composite.
                </p>
              )}
              {scores.composite.kind === "leadership" && (
                <p className="text-xs text-[var(--md-on-surface-variant)] leading-relaxed">
                  Leadership Readiness = Leadership x0.35 + Dispute Resolution x0.20 +
                  Communication x0.20 + Organizational Mindset x0.15 + Team Play x0.05 +
                  Problem-Solving x0.05 (all normalized 0-100). Ethics &amp; Integrity is reported
                  individually below and always able to override the recommendation via the flag
                  mechanism.
                </p>
              )}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="font-semibold mb-4 text-[var(--md-on-surface)]">
              Trait breakdown (7 dimensions)
            </h2>
            <div className="space-y-4">
              {TRAIT_KEYS.map((key) => (
                <TraitBar
                  key={key}
                  label={TRAIT_LABELS[key]}
                  score={scores.traitScores[key] ?? 0}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="surface-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-[var(--md-on-surface)]">
          Ethics concern flags
          {flags.length > 0 && (
            <span className="badge badge-error">
              <Flag size={12} /> {flags.length}
            </span>
          )}
        </h2>
        {flags.length === 0 ? (
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            No ethics concern flags on this session.
          </p>
        ) : (
          <ul className="space-y-4">
            {flags.map((f, i) => (
              <li
                key={i}
                className="rounded-[var(--radius-md)] border border-[var(--md-error-container)] bg-[var(--md-error-container)]/40 p-4"
              >
                <p className="text-xs text-[var(--md-on-surface-variant)] mb-1">
                  Question {f.questionId}
                </p>
                <p className="font-medium mb-2 text-[var(--md-on-surface)]">{f.prompt}</p>
                <p className="text-sm text-[var(--md-on-surface)] italic">
                  Selected: &ldquo;{f.optionText}&rdquo;
                </p>
                <p className="text-xs text-[var(--md-on-surface-variant)] mt-2">
                  Trait impact:{" "}
                  {Object.entries(f.traitDeltas)
                    .map(([k, v]) => `${k} ${v! > 0 ? "+" : ""}${v}`)
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
