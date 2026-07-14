"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

/**
 * Landing page for the link in the password-reset email (see
 * requestPasswordReset() in lib/actions/auth.ts). Supabase's browser client
 * auto-detects the recovery token in the URL hash on mount and establishes a
 * temporary session for this page only - submitting the form below calls
 * auth.updateUser() to set a real new password, then sends the admin on to
 * the dashboard already signed in.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(
          updateError.message.includes("session")
            ? "This reset link has expired. Request a new one from the sign-in page."
            : updateError.message
        );
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-[var(--bg-light)] px-6 py-16">
      <div className="floating-card max-w-sm w-full fade-in-up">
        <Logo variant="full" height={28} />
        <h1 className="text-fs-h2 text-[var(--text-dark)] mt-6">Set a new password</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 mb-6">
          Choose a new password for your BIMstream SCORE account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="password">
              New password
            </label>
            <div className="relative">
              <span className="input-icon">
                <KeyRound size={17} />
              </span>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-lg input-with-icon"
                placeholder="At least 8 characters"
              />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <div className="relative">
              <span className="input-icon">
                <KeyRound size={17} />
              </span>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-lg input-with-icon"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2">
              {error}
            </p>
          )}
          <button type="submit" disabled={isPending} className="btn btn-primary w-full !py-3">
            {isPending ? "Saving..." : "Save new password"}
          </button>
        </form>
      </div>
    </main>
  );
}
