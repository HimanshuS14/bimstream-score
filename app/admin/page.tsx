import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Flag, XCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminShell from "@/components/AdminShell";
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

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, test_id, status, submitted_at, created_at, recommendation, flags, candidates(name, email, target_role), tests(title)"
    )
    .order("created_at", { ascending: false });

  const sessions = (data ?? []) as unknown as SessionRow[];

  return (
    <AdminShell userEmail={user.email}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--md-on-surface)]">Candidate sessions</h1>
          <p className="text-sm text-[var(--md-on-surface-variant)] mt-0.5">
            Review submitted assessments and ethics-concern flags.
          </p>
        </div>
        <p className="text-sm text-[var(--md-on-surface-variant)] flex-none">
          {sessions.length} total
        </p>
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
