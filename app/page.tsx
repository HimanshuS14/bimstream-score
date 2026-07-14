import { BarChart3, Brain, ShieldCheck, Target } from "lucide-react";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import type { TestId, TestSchema } from "@/lib/types";
import Logo from "@/components/Logo";
import EntryPanel, { type TestSummary } from "@/components/EntryPanel";

export const dynamic = "force-dynamic";

const TEST_IDS: TestId[] = ["modeler", "leadership"];

const FEATURES = [
  {
    icon: Brain,
    title: "Psychometric Intelligence",
    description: "Science-backed insight into true potential, not just a resume.",
  },
  {
    icon: Target,
    title: "Role Fit Prediction",
    description: "Identify the best fit for every open role.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Decisions",
    description: "Every response scored across 7 behavioral dimensions, automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Ethics & Integrity Check",
    description: "Integrity concerns flagged for review, regardless of overall score.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === "signin" ? "signin" : "register";

  const supabase = createSupabaseAnonClient();
  const { data } = await supabase
    .from("tests")
    .select("id, title, duration_minutes, schema")
    .in("id", TEST_IDS);

  const tests: TestSummary[] = (data ?? [])
    .map((row) => {
      const schema = row.schema as TestSchema;
      const totalQuestions = schema.sections.reduce((sum, s) => sum + s.questions.length, 0);
      return {
        id: row.id as TestId,
        title: row.title as string,
        program: schema.program,
        description: schema.description,
        durationMinutes: row.duration_minutes as number,
        totalQuestions,
      };
    })
    .sort((a, b) => TEST_IDS.indexOf(a.id) - TEST_IDS.indexOf(b.id));

  return (
    <main className="flex-1 hero-balanced flex items-center">
      <div className="mesh-bg" />
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-16 py-16 flex flex-col lg:flex-row items-center gap-14">
        {/* Left: brand, headline, capabilities - informative, not decorative */}
        <div className="flex-1 max-w-xl">
          <div className="brand-lockup">
            <Logo variant="full" height={32} onDark />
            <span className="brand-lockup-product">SCORE</span>
          </div>

          <h1 className="text-fs-hero text-[var(--on-dark-primary)] mt-10">
            Better insights.
            <br />
            <span style={{ color: "var(--md-primary)" }}>Smarter</span>{" "}
            <span style={{ color: "var(--md-primary-2)" }}>hires.</span>
          </h1>
          <p className="mt-4 text-[15px] text-[var(--on-dark-secondary)] max-w-md leading-relaxed">
            Situational-judgment and behavioral assessments that reveal candidate potential beyond
            a resume.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="glass-icon-chip">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="font-medium text-sm text-[var(--on-dark-primary)]">{title}</p>
                  <p className="text-xs text-[var(--on-dark-secondary)] mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card inline-flex items-center gap-2.5 mt-10 px-4 py-2.5">
            <ShieldCheck size={15} className="text-[var(--on-dark-secondary)] flex-none" />
            <span className="text-xs text-[var(--on-dark-secondary)]">
              Trusted by forward-thinking teams to build high-performing workplaces
            </span>
          </div>
        </div>

        {/* Right: floating card, register/sign-in */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end">
          <div className="floating-card w-full max-w-[500px] fade-in-up">
            <EntryPanel initialTab={initialTab} tests={tests} />
          </div>
        </div>
      </div>
    </main>
  );
}
