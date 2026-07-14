"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (anon key). Used for admin login / logout,
// where Supabase Auth needs to keep the browser and server in sync via cookies.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
