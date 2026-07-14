import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. NEVER import this from a client component or
// expose it to the browser. This bypasses RLS entirely and is used exclusively
// for the server-side scoring computation on submit (fetching the authoritative
// test schema and writing scores/flags/recommendation), so a candidate can never
// forge their own result by tampering with client-side requests.
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
