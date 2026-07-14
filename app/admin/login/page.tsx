import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="px-6 py-6 flex items-center justify-center">
        <Logo variant="full" height={24} />
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm w-full surface-card p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--md-on-surface)]">Reviewer sign in</h1>
            <p className="text-sm text-[var(--md-on-surface-variant)] mt-1">
              Access the BIMstream SCORE assessment dashboard with your admin account.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
