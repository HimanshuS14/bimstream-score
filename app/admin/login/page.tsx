import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The unified entry point now lives at "/" (candidate register + reviewer
// sign-in tabs, see components/EntryPanel.tsx). This route is kept only
// because proxy.ts, signOut(), and the admin invite email all still point
// unauthenticated/expired sessions at /admin/login - it just forwards them
// on to the sign-in tab of the unified page.
export default function AdminLoginRedirectPage() {
  redirect("/?tab=signin");
}
