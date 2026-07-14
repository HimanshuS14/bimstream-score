import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Flag, ListChecks, XCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminShell from "@/components/AdminShell";
import { getMyAdminProfile } from "@/lib/actions/adminTeam";
import type { EthicsFlag, RecommendationBand } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  test_id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  recommendation: RecommendationBand | null;
  flags: EthicsFlag[] | null;
  candidates: { name: string; email: string; target_role: string | null } | null;
  tests: { title: string } | null;
}

function BandBadge({ band }: { band: RecommendationBand | null }) {
  if (!band) return <span className="text-[var(--md-on-surface-muted)]">—</span>;
  if (band === "Strong Fit") {
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={12} /> {band}
      </span>
    );
  }
  if (band === "Conditional") {
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={12} /> {band}
      </span>
    );
  }
  return (
    <span className="badge badge-error">
      <XCircle size={12} /> {band}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const myProfile = await getMyAdminProfile();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, test_id, status, submitted_at, created_at, recommendation, flags, candidates(name, email, target_role), tests(title)"
    )
    .order("created_at", { ascending: false });

  const sessions = (data ?? []) as unknown as SessionRow[];

  const totalSessions = sessions.length;
  const strongFitCount = sessions.filter((s) => s.recommendation === "Strong Fit").length;
  const flaggedCount = sessions.filter((s) => (s.flags?.length ?? 0) > 0).length;

  return (
    <AdminShell userEmail={user.email} role={myProfile?.role ?? null}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-fs-section text-[var(--text-dark)]">Candidate sessions</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Review submitted assessments and ethics-concern flags.
          </p>
        </div>
        <p className="text-sm text-[var(--text-secondary)] flex-none">
          {sessions.length} total
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6 fade-in-up">
        <div className="stat-tile">
          <div
            className="stat-tile-icon"
            style={{ background: "var(--md-primary-container)", color: "var(--md-primary)" }}
          >
            <ListChecks size={20} />
          </div>
          <div>
            <div className="stat-tile-value">{totalSessions}</div>
            <div className="stat-tile-label">Total sessions</div>
          </div>
        </div>
        <div className="stat-tile">
          <div
            className="stat-tile-icon"
            style={{ background: "var(--md-success-container)", color: "var(--md-success)" }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-tile-value">{strongFitCount}</div>
            <div className="stat-tile-label">Strong Fit</div>
          </div>
        </div>
        <div className="stat-tile">
          <div
            className="stat-tile-icon"
            style={{ background: "var(--md-warning-container)", color: "var(--md-warning)" }}
          >
            <Flag size={20} />
          </div>
          <div>
            <div className="stat-tile-value">{flaggedCount}</div>
            <div className="stat-tile-label">Flagged</div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2 mb-4">
          {error.message}
        </p>
      )}

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--md-surface-variant)] text-[var(--md-on-surface-variant)] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Test</th>
              <th className="px-4 py-3 font-medium">Target role</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Recommendation</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-outline-variant)]">
            {sessions.map((s) => {
              const flagged = (s.flags?.length ?? 0) > 0;
              return (
                <tr
                  key={s.id}
                  className={`transition ${
                    flagged ? "row-flagged" : "hover:bg-[var(--md-surface-variant)]"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--md-on-surface)]">
                      {s.candidates?.name ?? "—"}
                    </div>
                    <div className="text-[var(--md-on-surface-variant)] text-xs">
                      {s.candidates?.email ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--md-on-surface)]">
                    {s.tests?.title ?? s.test_id}
                  </td>
                  <td className="px-4 py-3 text-[var(--md-on-surface)]">
                    {s.candidates?.target_role ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "submitted" ? (
                      <span className="text-[var(--md-on-surface)]">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                      </span>
                    ) : (
                      <span className="badge badge-neutral">in progress</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <BandBadge band={s.recommendation} />
                  </td>
                  <td className="px-4 py-3">
                    {flagged ? (
                      <span
                        title={`${s.flags!.length} ethics concern flag(s)`}
                        className="badge badge-error"
                      >
                        <Flag size={12} /> {s.flags!.length}
                      </span>
                    ) : (
                      <span className="text-[var(--md-on-surface-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/sessions/${s.id}`}
                      className="text-[var(--md-primary)] font-medium hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--md-on-surface-muted)]">
                  No sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
