import { notFound } from "next/navigation";
import { Clock3, ListChecks, TimerReset } from "lucide-react";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import type { TestId, TestSchema } from "@/lib/types";
import Logo from "@/components/Logo";
import StartForm from "./StartForm";

export const dynamic = "force-dynamic";

function isTestId(value: string): value is TestId {
  return value === "modeler" || value === "leadership";
}

export default async function TakeTestLandingPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  if (!isTestId(testId)) notFound();

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("tests")
    .select("id, title, duration_minutes, schema")
    .eq("id", testId)
    .single();

  if (error || !data) {
    notFound();
  }

  const schema = data.schema as TestSchema;
  // All sections in the current content are situational_judgment (100%
  // behavioral instrument - no analytical/technical MCQ section anymore), but
  // this sums across whatever sections the schema actually has rather than
  // assuming a fixed count.
  const totalQuestions = schema.sections.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-6 py-6 flex items-center justify-center sm:justify-start">
        <Logo variant="full" height={24} />
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full surface-card p-8 space-y-6">
          <div>
            <div className="badge badge-primary mb-3">{schema.program}</div>
            <h1 className="text-2xl font-bold text-[var(--md-on-surface)]">{data.title}</h1>
            <p className="mt-2 text-[var(--md-on-surface-variant)] text-sm leading-relaxed">
              {schema.description}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-[var(--radius-md)] bg-[var(--md-surface-variant)] p-4">
              <dt className="text-[var(--md-on-surface-variant)] flex items-center gap-1.5 mb-1">
                <Clock3 size={14} /> Duration
              </dt>
              <dd className="font-semibold text-[var(--md-on-surface)]">
                {data.duration_minutes} min
              </dd>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--md-surface-variant)] p-4">
              <dt className="text-[var(--md-on-surface-variant)] flex items-center gap-1.5 mb-1">
                <ListChecks size={14} /> Situational judgment
              </dt>
              <dd className="font-semibold text-[var(--md-on-surface)]">
                {totalQuestions} questions
              </dd>
            </div>
          </dl>

          <div className="rounded-[var(--radius-md)] bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] text-sm p-3.5 flex items-start gap-2.5">
            <TimerReset size={18} className="flex-none mt-0.5" />
            <span>
              Once you start, a countdown timer begins and the test will auto-submit when time
              runs out. Make sure you have {data.duration_minutes} uninterrupted minutes before
              starting.
            </span>
          </div>

          <StartForm testId={testId} />
        </div>
      </div>
    </main>
  );
}
