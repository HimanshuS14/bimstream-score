import Link from "next/link";
import { LayoutDashboard, LogOut, Users } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import Logo from "@/components/Logo";
import type { AdminRole } from "@/lib/types";

const navItemClass =
  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--on-dark-secondary)] hover:bg-[var(--on-dark-surface-hover)] hover:text-[var(--on-dark-primary)] transition";

export default function AdminShell({
  children,
  userEmail,
  role = null,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  role?: AdminRole | null;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Dark vertical sidebar */}
      <aside className="w-60 flex-none flex flex-col h-screen sticky top-0 bg-[var(--surface-dark)]">
        <div className="flex items-center px-5 h-16 border-b border-[var(--on-dark-border)]">
          <Logo variant="mark" href={null} height={26} onDark />
        </div>

        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          <Link href="/admin" className={navItemClass}>
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          {role === "admin" && (
            <Link href="/admin/team" className={navItemClass}>
              <Users size={17} />
              Team
            </Link>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-[var(--on-dark-border)]">
          <form action={signOut}>
            <button type="submit" className={`${navItemClass} w-full`}>
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Top bar + page content */}
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-light)]">
        <header className="h-16 flex-none flex items-center justify-between gap-4 px-6 border-b border-[var(--border-enterprise)] bg-[var(--card)]">
          <div className="flex items-baseline gap-2">
            <span className="text-fs-section text-[var(--text-dark)]">BIMstream SCORE</span>
            <span className="text-sm font-normal text-[var(--text-secondary)]">— Admin</span>
          </div>
          {userEmail && (
            <span className="text-sm text-[var(--text-secondary)] text-right">{userEmail}</span>
          )}
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
