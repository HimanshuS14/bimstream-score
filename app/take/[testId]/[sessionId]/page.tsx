import { notFound } from "next/navigation";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import type { TestId, TestSchema } from "@/lib/types";
import TestRunner from "./TestRunner";

export const dynamic = "force-dynamic";

function isTestId(value: string): value is TestId {
  return value === "modeler" || value === "leadership";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RunTestPage({
  params,
}: {
  params: Promise<{ testId: string; sessionId: string }>;
}) {
  const { testId, sessionId } = await params;
  if (!isTestId(testId) || !UUID_RE.test(sessionId)) notFound();

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("tests")
    .select("id, title, duration_minutes, schema")
    .eq("id", testId)
    .single();

  if (error || !data) notFound();

  const schema = data.schema as TestSchema;

  return (
    <TestRunner
      testId={testId}
      sessionId={sessionId}
      title={data.title}
      durationMinutes={data.duration_minutes}
      schema={schema}
    />
  );
}
