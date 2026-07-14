import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TRAIT_LABELS } from "@/lib/traits";
import { TRAIT_KEYS } from "@/lib/types";
import type {
  CompositeScores,
  EthicsFlag,
  RecommendationBand,
  TraitKey,
} from "@/lib/types";

// Server-rendered PDF report for a single candidate session, used from
// app/admin/sessions/[id]/report/route.ts. Intentionally text-only (no
// embedded raster logo) so it renders reliably in Vercel's serverless
// function environment without depending on public/ asset file-tracing.

const COLORS = {
  ink: "#1a1a1a",
  muted: "#5f6368",
  border: "#e2e2e2",
  surfaceAlt: "#f6f6f7",
  success: "#1a7d3a",
  successBg: "#e6f4ea",
  warning: "#8a5a00",
  warningBg: "#fff3d6",
  error: "#b3261e",
  errorBg: "#fce8e6",
  primary: "#2f5fce",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: COLORS.ink, fontFamily: "Helvetica" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  generatedAt: { fontSize: 8, color: COLORS.muted, textAlign: "right" },
  hr: { borderBottomWidth: 1, borderBottomColor: COLORS.border, marginVertical: 14 },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sub: { fontSize: 9, color: COLORS.muted, marginBottom: 1 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 18,
  },
  bandCard: {
    borderRadius: 6,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bandLabel: { fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  bandValue: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 2 },
  bandName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  noteBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 6,
    padding: 10,
    fontSize: 9,
    marginTop: 10,
  },
  traitRow: { marginBottom: 9 },
  traitLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 9,
  },
  traitTrackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    width: "100%",
  },
  traitTrackFill: {
    height: 6,
    borderRadius: 3,
  },
  flagCard: {
    borderWidth: 1,
    borderColor: COLORS.errorBg,
    backgroundColor: COLORS.errorBg,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  flagQ: { fontSize: 8, color: COLORS.muted, marginBottom: 2 },
  flagPrompt: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  flagAnswer: { fontSize: 9, fontStyle: "italic", marginBottom: 3 },
  flagDeltas: { fontSize: 8, color: COLORS.muted },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7.5,
    color: COLORS.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
});

function bandColors(band: RecommendationBand | null) {
  if (band === "Strong Fit") return { bg: COLORS.successBg, fg: COLORS.success };
  if (band === "Conditional") return { bg: COLORS.warningBg, fg: COLORS.warning };
  if (band === "Not Recommended") return { bg: COLORS.errorBg, fg: COLORS.error };
  return { bg: COLORS.surfaceAlt, fg: COLORS.muted };
}

function barColor(score: number) {
  if (score >= 66) return COLORS.success;
  if (score >= 40) return COLORS.warning;
  return COLORS.error;
}

export interface CandidateReportProps {
  candidateName: string;
  candidateEmail: string;
  targetRole: string | null;
  testTitle: string;
  submittedAt: string | null;
  traitScores: Record<TraitKey, number>;
  composite: CompositeScores;
  recommendation: RecommendationBand | null;
  manualReviewRecommended: boolean;
  leadershipPotentialNote: string | null;
  flags: EthicsFlag[];
}

export default function CandidateReport({
  candidateName,
  candidateEmail,
  targetRole,
  testTitle,
  submittedAt,
  traitScores,
  composite,
  recommendation,
  manualReviewRecommended,
  leadershipPotentialNote,
  flags,
}: CandidateReportProps) {
  const primaryLabel = composite.kind === "modeler" ? "Team & Delivery Fit" : "Leadership Readiness";
  const primaryValue =
    composite.kind === "modeler" ? composite.teamDeliveryFit : composite.leadershipReadiness;
  const { bg, fg } = bandColors(recommendation);

  return (
    <Document title={`${candidateName} - BIMstream SCORE Report`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>BIMstream SCORE</Text>
            <Text style={styles.brandSub}>
              Situational Competency &amp; Organizational Readiness Evaluation
            </Text>
          </View>
          <Text style={styles.generatedAt}>
            Generated {new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.hr} />

        <Text style={styles.h1}>{candidateName}</Text>
        <Text style={styles.sub}>{candidateEmail}</Text>
        <Text style={styles.sub}>
          {testTitle}
          {targetRole ? ` · Target role: ${targetRole}` : ""}
        </Text>
        {submittedAt && (
          <Text style={styles.sub}>Submitted {new Date(submittedAt).toLocaleString()}</Text>
        )}

        {recommendation && (
          <View style={[styles.bandCard, { backgroundColor: bg, marginTop: 16 }]}>
            <View>
              <Text style={[styles.bandLabel, { color: fg }]}>{primaryLabel}</Text>
              <Text style={[styles.bandValue, { color: fg }]}>{Math.round(primaryValue)}/100</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.bandLabel, { color: fg }]}>Overall recommendation</Text>
              <Text style={[styles.bandName, { color: fg }]}>{recommendation}</Text>
            </View>
          </View>
        )}

        {manualReviewRecommended && (
          <View style={styles.noteBox}>
            <Text>Manual review recommended - see flags below before finalizing a decision.</Text>
          </View>
        )}

        {leadershipPotentialNote && (
          <View style={styles.noteBox}>
            <Text>{leadershipPotentialNote}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Trait breakdown (7 dimensions)</Text>
        {TRAIT_KEYS.map((key) => {
          const score = Math.max(0, Math.min(100, traitScores[key] ?? 0));
          return (
            <View key={key} style={styles.traitRow}>
              <View style={styles.traitLabelRow}>
                <Text>{TRAIT_LABELS[key]}</Text>
                <Text>{Math.round(score)}/100</Text>
              </View>
              <View style={styles.traitTrackBg}>
                <View
                  style={[
                    styles.traitTrackFill,
                    { width: `${score}%`, backgroundColor: barColor(score) },
                  ]}
                />
              </View>
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>
          Ethics concern flags {flags.length > 0 ? `(${flags.length})` : ""}
        </Text>
        {flags.length === 0 ? (
          <Text style={{ fontSize: 9, color: COLORS.muted }}>
            No ethics concern flags on this session.
          </Text>
        ) : (
          flags.map((f, i) => (
            <View key={i} style={styles.flagCard}>
              <Text style={styles.flagQ}>Question {f.questionId}</Text>
              <Text style={styles.flagPrompt}>{f.prompt}</Text>
              <Text style={styles.flagAnswer}>Selected: &quot;{f.optionText}&quot;</Text>
              <Text style={styles.flagDeltas}>
                Trait impact:{" "}
                {Object.entries(f.traitDeltas)
                  .map(([k, v]) => `${k} ${v! > 0 ? "+" : ""}${v}`)
                  .join(", ")}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.footer}>
          For internal hiring discussion use only. Generated automatically by BIMstream SCORE from
          the candidate&apos;s situational-judgment responses - not a substitute for the Personal
          Interview or reference checks.
        </Text>
      </Page>
    </Document>
  );
}
