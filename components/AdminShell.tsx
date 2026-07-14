import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import Logo from "@/components/Logo";

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-[var(--md-outline-variant)] bg-[var(--md-surface)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo variant="mark" href={null} height={22} />
            <span className="font-semibold text-[var(--md-on-surface)]">
              BIMstream SCORE <span className="text-[var(--md-on-surface-variant)] font-normal">— Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-[var(--md-on-surface-variant)]">
            {userEmail && <span className="hidden sm:inline">{userEmail}</span>}
            <form action={signOut}>
              <button type="submit" className="btn btn-outline !py-1.5 !px-3.5 text-sm">
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
