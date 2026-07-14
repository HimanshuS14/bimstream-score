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
        <div className="max-w-xl w-full surface-card p-8 space-y-6 fade-in-up">
          <div>
            <div className="badge badge-primary mb-3">{schema.program}</div>
            <h1 className="text-fs-section text-[var(--md-on-surface)]">{data.title}</h1>
            <p className="mt-2 text-[var(--md-on-surface-variant)] text-sm leading-relaxed">
              {schema.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="stat-tile">
              <div
                className="stat-tile-icon"
                style={{ background: "var(--md-primary-container)", color: "var(--md-primary)" }}
              >
                <Clock3 size={18} />
              </div>
              <div>
                <div className="stat-tile-value">{data.duration_minutes} min</div>
                <div className="stat-tile-label">Duration</div>
              </div>
            </div>
            <div className="stat-tile">
              <div
                className="stat-tile-icon"
                style={{ background: "var(--md-primary-container)", color: "var(--md-primary)" }}
              >
                <ListChecks size={18} />
              </div>
              <div>
                <div className="stat-tile-value">{totalQuestions}</div>
                <div className="stat-tile-label">Situational judgment questions</div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] text-sm p-4 flex items-start gap-2.5">
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
