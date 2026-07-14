import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server-side Supabase client bound to the current user's auth cookies (anon key).
// Respects RLS as the logged-in user - used for admin pages/middleware so that only
// an authenticated Supabase user can SELECT across candidates/sessions.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component without a mutable response - safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}
