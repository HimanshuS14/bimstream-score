import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyAdminProfile } from "@/lib/actions/adminTeam";
import AdminShell from "@/components/AdminShell";
import TeamManager from "@/components/admin/TeamManager";
import type { AdminProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const myProfile = await getMyAdminProfile();

  if (!myProfile || myProfile.role !== "admin") {
    return (
      <AdminShell userEmail={user.email} role={myProfile?.role ?? null}>
        <div className="surface-card p-8 max-w-lg mx-auto text-center">
          <h1 className="text-xl font-bold text-[var(--md-on-surface)] mb-2">Admins only</h1>
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            {myProfile
              ? "Your account has the Reviewer role, which can view candidate results but can't manage the team."
              : "Your account doesn't have a team profile yet. Ask an existing Admin to add you, or run the backfill step from the README if you're the studio's first admin."}
          </p>
        </div>
      </AdminShell>
    );
  }

  const { data } = await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const members = (data ?? []) as AdminProfile[];

  return (
    <AdminShell userEmail={user.email} role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--md-on-surface)]">Team</h1>
        <p className="text-sm text-[var(--md-on-surface-variant)] mt-0.5">
          Admins can manage the team and view candidate results. Reviewers can view candidate
          results only.
        </p>
      </div>
      <TeamManager members={members} currentUserId={user.id} />
    </AdminShell>
  );
}
