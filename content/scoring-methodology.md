# Scoring Methodology (v2 — pure behavioral, 7 dimensions)

## Trait dimensions
LD (Leadership & Decision-Making), TP (Team Play), CM (Communication), PS (Problem-Solving), DR (Dispute Resolution), OM (Organizational Mindset), ET (Ethics & Integrity). Definitions in `traits.json`.

Both tests are now 100% situational-judgment (no technical/analytical MCQ section — software/technical skill is covered by the separate technical test and the Personal Interview). 30 questions each, ~90 seconds/question, 45-minute timer.

## Question topic quotas
Each question carries a `topic` field (one of the 7 trait keys) purely for organization/reporting. Scoring itself always runs off each option's `trait_deltas` vector, never off the `topic` label — so a question tagged topic `PS` can still carry a secondary `ET` delta, and an `ethics_concern` flag can appear on a question whose primary topic isn't Ethics. This widens the net for catching integrity issues beyond the small dedicated Ethics quota.

- **Modeler test** (individual-contributor weighting): TP 7, CM 6, PS 6, LD 4, DR 3, OM 2, ET 2 = 30
- **Leadership test** (managerial weighting): LD 7, CM 6, TP 5, PS 5, DR 3, OM 2, ET 2 = 30

## Per-trait normalization
For each trait T, after all 30 questions are answered:
```
raw_T = sum of trait_deltas.T across all selected options
max_possible_T = sum of the highest achievable delta.T per question (best option each time)
min_possible_T = sum of the lowest achievable delta.T per question
normalized_T = (raw_T - min_possible_T) / (max_possible_T - min_possible_T) * 100
```
Clamp to [0, 100]. Compute only over questions where trait T has a non-zero delta on at least one option (i.e. the question actually measures that trait at all, whatever its `topic` tag says) — this is unchanged from v1 and remains fully dynamic based on whatever schema is loaded, no hardcoded question counts anywhere in the scoring code.

## Ethics red flags
Unchanged from v1: any option tagged `"flag": "ethics_concern"` that a candidate selects is recorded verbatim (question id + text + trait_deltas) in a `flags` array, independent of the ET score, and surfaced to reviewers as "Manual review recommended" regardless of aggregate score. Because flags can appear on non-Ethics-topic questions too (e.g. the Problem-Solving question about hiding a quality/deadline trade-off from a client, or the Organizational Mindset question about prioritizing short-term numbers), the real surface area for catching integrity issues is larger than the 2-question Ethics quota suggests.

## Composite scores & role-fit output

### Modeler / Senior Modeler test
Primary composite, **Team & Delivery Fit** = TP×0.30 + CM×0.25 + PS×0.25 + LD×0.20 (all normalized 0-100 first). This reflects the individual-contributor weighting: collaboration, communication, and hands-on problem-solving matter most day to day; leadership is present at lighter weight to catch early potential without over-indexing on it for a role that isn't yet managing people.

DR, OM, and ET are reported individually rather than folded into the primary composite — they're measured (with smaller but real question quotas) and shown to reviewers, but at IC level they're secondary signals rather than the main hiring lever.

- **Leadership Potential flag**: if normalized LD ≥ 70 despite the IC-level weighting, output "Leadership potential — consider for fast-track / Assistant Manager pipeline."
- **Overall recommendation bands**:
  - Strong Fit: Team & Delivery Fit ≥ 70 AND ET ≥ 60 AND no ethics flags
  - Conditional: Team & Delivery Fit 50-70, or a single non-critical flag
  - Not Recommended: ET < 50, OR any ethics_concern flag, OR Team & Delivery Fit < 40

### Leadership (Assistant Manager / Manager) test
Primary composite, **Leadership Readiness** = LD×0.35 + DR×0.20 + CM×0.20 + OM×0.15 + TP×0.05 + PS×0.05 (all normalized 0-100 first). Note: composite *weight* and question *quota* are intentionally different levers — Team Play and Problem-Solving still get 5 questions each (enough to measure reasonably), but contribute less to the final hiring decision than Leadership, Dispute Resolution, Communication, and Organizational Mindset, which matter most for this role's actual day-to-day.

ET is reported individually and always able to override the recommendation via the flag mechanism, same as the modeler test.

- **Overall recommendation bands**:
  - Strong Fit: Leadership Readiness ≥ 75, no ethics flags
  - Conditional: Leadership Readiness 55-75, or a single non-critical flag
  - Not Recommended: Leadership Readiness < 55, OR any ethics_concern flag, OR ET < 50

## Why this design
- Dropping the technical/analytical section entirely avoids redundancy with the studio's separate software-skills test and keeps this instrument focused on what it's actually good at: judgment, collaboration, leadership instinct, and integrity under pressure.
- Composite *weights* differ from question *quotas* on purpose — you can measure a dimension with a reasonable number of items (for score stability) while still deciding it should count for less in the final decision, and vice versa.
- The ethics-flag mechanism intentionally isn't confined to the small Ethics quota; several Problem-Solving, Organizational Mindset, and Leadership questions also carry a flagged option, so integrity is being tested throughout the instrument, not just in 2 dedicated questions.
