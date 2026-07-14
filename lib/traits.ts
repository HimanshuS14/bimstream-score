import type { TraitKey } from "./types";

// Mirrors content/traits.json - used for display labels in the admin UI.
export const TRAIT_LABELS: Record<TraitKey, string> = {
  LD: "Leadership & Decision-Making",
  TP: "Team Play",
  CM: "Communication",
  PS: "Problem-Solving",
  DR: "Dispute Resolution",
  OM: "Organizational Mindset",
  ET: "Ethics & Integrity",
};
