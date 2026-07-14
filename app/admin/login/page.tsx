import { ClipboardCheck, Flag, ShieldCheck } from "lucide-react";
import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Situational judgment scoring",
    description: "Every response scored across 7 behavioral dimensions, automatically.",
  },
  {
    icon: Flag,
    title: "Ethics-flag detection",
    description: "Integrity concerns surface for manual review, regardless of overall score.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based team access",
    description: "Admins manage the team; Reviewers see candidate results only.",
  },
];

export default function AdminLoginPage() {
  return (
    <main className="flex-1 split-auth">
      <div className="hero-dark flex flex-col px-10 py-10">
        <div className="hero-dark-glow" />
        <div className="relative z-10">
          <Logo variant="full" height={26} onDark />
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md py-12">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--on-dark-primary)] leading-tight">
            Streamline your
            <br />
            <span className="text-gradient-cyan">candidate review</span>
          </h1>
          <p className="mt-3 text-[var(--on-dark-secondary)] text-[15px]">
            Situational Competency &amp; Organizational Readiness Evaluation for BIM coordination
            teams - all in one dashboard.
          </p>
          <div className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="glass-card p-4 flex items-start gap-3">
                <div className="glass-icon-chip">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="font-medium text-sm text-[var(--on-dark-primary)]">{title}</p>
                  <p className="text-xs text-[var(--on-dark-secondary)] mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-16 bg-[var(--md-surface)]">
        <div className="max-w-sm w-full space-y-6 fade-in-up">
          <div>
            <h2 className="text-xl font-bold text-[var(--md-on-surface)]">Welcome back</h2>
            <p className="text-sm text-[var(--md-on-surface-variant)] mt-1">
              Sign in to review candidate results.
            </p>
          </div>
          <LoginForm />
          <p className="text-xs text-[var(--md-on-surface-muted)] text-center pt-6 border-t border-[var(--md-outline-variant)]">
            &copy; {new Date().getFullYear()} BIMstream SCORE. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
