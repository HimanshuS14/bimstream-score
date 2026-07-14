"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { AdminProfile, AdminRole } from "@/lib/types";

export interface ActionOk {
  ok: true;
}
export interface ActionError {
  ok: false;
  error: string;
}

/**
 * Returns the calling user's own admin_profiles row, or null if they don't
 * have one yet (e.g. an account created directly in the Supabase dashboard
 * before being backfilled - see supabase/migrations/0002_admin_roles.sql).
 */
export async function getMyAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("admin_profiles").select("*").eq("id", user.id).single();
  return (data as AdminProfile) ?? null;
}

async function requireAdminCaller(): Promise<{ ok: true; userId: string } | ActionError> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only Admins can manage the team." };
  }

  return { ok: true, userId: user.id };
}

/**
 * Invites a new team member by email via the Supabase Auth admin API (sends
 * them an email with a link to set their own password), then records their
 * name/role in admin_profiles. Only callable by an existing Admin.
 */
export async function inviteAdmin(
  name: string,
  email: string,
  role: AdminRole
): Promise<ActionOk | ActionError> {
  const caller = await requireAdminCaller();
  if (!caller.ok) return caller;

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail) {
    return { ok: false, error: "Name and email are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (role !== "admin" && role !== "reviewer") {
    return { ok: false, error: "Invalid role." };
  }

  const service = createSupabaseServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bimstream-score-delta.vercel.app";

  const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(
    trimmedEmail,
    { redirectTo: `${siteUrl}/admin/login` }
  );

  if (inviteError || !invited?.user) {
    return { ok: false, error: inviteError?.message ?? "Could not send invite." };
  }

  const { error: profileError } = await service.from("admin_profiles").upsert({
    id: invited.user.id,
    name: trimmedName,
    email: trimmedEmail,
    role,
  });

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  return { ok: true };
}

/**
 * Removes a team member: deletes their admin_profiles row (which immediately
 * revokes their access to candidate data under the tightened RLS policies in
 * 0002_admin_roles.sql) and deletes their Supabase Auth account outright, so
 * they can no longer sign in at all. Only callable by an existing Admin, and
 * never against your own account (avoids accidental self-lockout) or the
 * last remaining Admin (avoids a team with no one able to manage it).
 */
export async function removeAdmin(targetId: string): Promise<ActionOk | ActionError> {
  const caller = await requireAdminCaller();
  if (!caller.ok) return caller;

  if (targetId === caller.userId) {
    return { ok: false, error: "You can't remove your own account." };
  }

  const service = createSupabaseServiceClient();

  const { data: target } = await service
    .from("admin_profiles")
    .select("role")
    .eq("id", targetId)
    .single();

  if (target?.role === "admin") {
    const { count } = await service
      .from("admin_profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "Can't remove the last remaining Admin." };
    }
  }

  await service.from("admin_profiles").delete().eq("id", targetId);
  await service.auth.admin.deleteUser(targetId);

  return { ok: true };
}

/**
 * Changes a team member's role. Same self/last-admin guards as removeAdmin.
 */
export async function updateAdminRole(
  targetId: string,
  role: AdminRole
): Promise<ActionOk | ActionError> {
  const caller = await requireAdminCaller();
  if (!caller.ok) return caller;

  if (role !== "admin" && role !== "reviewer") {
    return { ok: false, error: "Invalid role." };
  }
  if (targetId === caller.userId && role !== "admin") {
    return { ok: false, error: "You can't demote your own account." };
  }

  const service = createSupabaseServiceClient();

  if (role === "reviewer") {
    const { data: target } = await service
      .from("admin_profiles")
      .select("role")
      .eq("id", targetId)
      .single();
    if (target?.role === "admin") {
      const { count } = await service
        .from("admin_profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        return { ok: false, error: "Can't demote the last remaining Admin." };
      }
    }
  }

  const { error } = await service.from("admin_profiles").update({ role }).eq("id", targetId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
