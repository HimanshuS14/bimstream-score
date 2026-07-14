import Link from "next/link";
import { ArrowRight, HardHat, ShieldCheck, Users } from "lucide-react";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

const PROGRAM_FULL_NAME = "Situational Competency & Organizational Readiness Evaluation";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="px-6 py-6 flex items-center">
        <Logo variant="full" height={26} />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-3xl w-full space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 badge badge-primary">
              <ShieldCheck size={14} />
              BIMstream SCORE
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--md-on-surface)]">
              Role-fit assessment, built for BIM teams
            </h1>
            <p className="text-[var(--md-on-surface-variant)] max-w-xl mx-auto text-[15px]">
              {PROGRAM_FULL_NAME}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 text-left">
            <Link
              href="/take/modeler"
              className="group surface-card p-6 hover:elevation-2 hover:border-[var(--md-primary)] transition"
            >
              <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-[var(--md-primary-container)] text-[var(--md-primary)] flex items-center justify-center mb-4">
                <HardHat size={20} />
              </div>
              <h2 className="font-semibold text-lg text-[var(--md-on-surface)]">
                Modeler / Senior Modeler
              </h2>
              <p className="mt-2 text-sm text-[var(--md-on-surface-variant)] leading-relaxed">
                30-question, 30-minute situational-judgment assessment covering team play,
                communication, problem-solving, leadership, dispute resolution, organizational
                mindset, and ethics &amp; integrity. Technical/software skill is assessed
                separately.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--md-primary)]">
                Start assessment
                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href="/take/leadership"
              className="group surface-card p-6 hover:elevation-2 hover:border-[var(--md-primary)] transition"
            >
              <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-[var(--md-primary-container)] text-[var(--md-primary)] flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h2 className="font-semibold text-lg text-[var(--md-on-surface)]">
                Assistant Manager / Manager
              </h2>
              <p className="mt-2 text-sm text-[var(--md-on-surface-variant)] leading-relaxed">
                30-question, 30-minute situational-judgment assessment covering leadership,
                dispute resolution, communication, organizational mindset, team play,
                problem-solving, and ethics &amp; integrity under managerial pressure.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--md-primary)]">
                Start assessment
                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          <div className="pt-6 border-t border-[var(--md-outline-variant)] text-center">
            <Link
              href="/admin"
              className="text-sm text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] transition"
            >
              Reviewer / admin sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
