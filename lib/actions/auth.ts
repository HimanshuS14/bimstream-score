"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export interface ActionOk {
  ok: true;
}
export interface ActionError {
  ok: false;
  error: string;
}

/**
 * Sends a Supabase Auth password-reset email. Always reports success (even
 * if the address isn't registered) so this endpoint can't be used to
 * enumerate admin accounts. The emailed link lands on /admin/reset-password,
 * which is exempted from the auth gate in proxy.ts since the recovery
 * session is only established client-side after the URL fragment is parsed.
 */
export async function requestPasswordReset(email: string): Promise<ActionOk | ActionError> {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = createSupabaseAnonClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bimstream-score-delta.vercel.app";

  await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${siteUrl}/admin/reset-password`,
  });

  return { ok: true };
}
