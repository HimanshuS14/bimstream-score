"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { requestPasswordReset } from "@/lib/actions/auth";

/** Four-color Microsoft "windows" glyph, inline so no extra asset is needed. */
function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="0" y="0" width="7.2" height="7.2" fill="#F25022" />
      <rect x="8.8" y="0" width="7.2" height="7.2" fill="#7FBA00" />
      <rect x="0" y="8.8" width="7.2" height="7.2" fill="#00A4EF" />
      <rect x="8.8" y="8.8" width="7.2" height="7.2" fill="#FFB900" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setResetSent(true);
    });
  }

  if (mode === "forgot") {
    return (
      <div>
        {resetSent ? (
          <div className="text-sm text-[var(--text-secondary)]">
            <p>
              If an account exists for <strong className="text-[var(--text-dark)]">{email}</strong>,
              a password reset link is on its way. Check your inbox.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setResetSent(false);
              }}
              className="mt-4 text-sm font-medium text-[var(--md-primary)] hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] -mt-1 mb-2">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div>
              <label className="field-label" htmlFor="forgot-email">
                Email
              </label>
              <div className="relative">
                <span className="input-icon">
                  <Mail size={17} />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-lg input-with-icon"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" disabled={isPending} className="btn btn-primary w-full !py-3">
              {isPending ? "Sending..." : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--md-primary)] transition"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <span className="input-icon">
              <Mail size={17} />
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-lg input-with-icon"
              placeholder="name@company.com"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="field-label !mb-0" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("forgot");
              }}
              className="text-xs font-medium text-[var(--md-primary)] hover:underline mb-1.5"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <span className="input-icon">
              <Lock size={17} />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-lg input-with-icon"
              placeholder="••••••••"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="input-icon-trailing"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[var(--md-error)] bg-[var(--md-error-container)] rounded-[var(--radius-sm)] px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={isPending} className="btn btn-primary w-full !py-3">
          {isPending ? "Signing in..." : "Sign in"}
          {!isPending && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--border-enterprise)]" />
        <span className="text-xs text-[var(--text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--border-enterprise)]" />
      </div>

      <button
        type="button"
        disabled
        title="Microsoft sign-in isn't connected yet"
        className="btn btn-outline w-full !py-3 !text-[var(--text-dark)] !border-[var(--border-enterprise)] opacity-70 cursor-not-allowed"
      >
        <MicrosoftMark />
        Sign in with Microsoft
      </button>

      <p className="mt-5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Lock size={12} />
        Enterprise-grade security. Your data is encrypted and protected.
      </p>
    </div>
  );
}
