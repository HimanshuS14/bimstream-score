import { createClient } from "@supabase/supabase-js";

// Plain anon-key server-side client (no cookie/session handling) used by the
// candidate-facing server actions: creating a candidate + session row, and
// reading the public test question bank. RLS policies on `tests`,
// `candidates` and `sessions` govern exactly what this key is allowed to do.
export function createSupabaseAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
