import Link from "next/link";
import { ArrowRight, HardHat, Users } from "lucide-react";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

const PROGRAM_FULL_NAME = "Situational Competency & Organizational Readiness Evaluation";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col hero-dark">
      <div className="hero-dark-glow" />
      <header className="relative z-10 px-6 py-6 flex items-center">
        <Logo variant="full" height={26} onDark />
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-3xl w-full space-y-10">
          <div className="text-center space-y-3 fade-in-up">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--on-dark-primary)]">
              Role-fit assessment,
              <br />
              <span className="text-gradient-cyan">built for BIM teams</span>
            </h1>
            <p className="text-[var(--on-dark-secondary)] max-w-xl mx-auto text-[15px]">
              {PROGRAM_FULL_NAME}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 text-left">
            <Link href="/take/modeler" className="group glass-card p-6 block">
              <div className="glass-icon-chip mb-4">
                <HardHat size={18} />
              </div>
              <h2 className="font-semibold text-lg text-[var(--on-dark-primary)]">
                Modeler / Senior Modeler
              </h2>
              <p className="mt-2 text-sm text-[var(--on-dark-secondary)] leading-relaxed">
                30-question, 45-minute situational-judgment assessment covering team play,
                communication, problem-solving, leadership, dispute resolution, organizational
                mindset, and ethics &amp; integrity. Technical/software skill is assessed
                separately.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-cyan)]">
                Start assessment
                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link href="/take/leadership" className="group glass-card p-6 block">
              <div className="glass-icon-chip mb-4">
                <Users size={18} />
              </div>
              <h2 className="font-semibold text-lg text-[var(--on-dark-primary)]">
                Assistant Manager / Manager
              </h2>
              <p className="mt-2 text-sm text-[var(--on-dark-secondary)] leading-relaxed">
                30-question, 45-minute situational-judgment assessment covering leadership,
                dispute resolution, communication, organizational mindset, team play,
                problem-solving, and ethics &amp; integrity under managerial pressure.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-cyan)]">
                Start assessment
                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          <div className="pt-6 border-t border-[var(--on-dark-border)] text-center">
            <Link
              href="/admin"
              className="text-sm text-[var(--on-dark-secondary)] hover:text-[var(--accent-cyan)] transition"
            >
              Reviewer / admin sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
