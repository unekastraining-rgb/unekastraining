/**
 * Bundle J/L — Haul writing loop phases (Learn → Plan → Write → Feedback → Revise → Finish).
 * Presentation/inference over existing document + tools — not a second writing engine.
 *
 * Authority boundary (Bundle L):
 * - `doc.mode` (`learn` | `write` | `improve`) = document editing mode / tool surface
 * - `HaulWritingPhase` = workflow strip position inferred from content progress
 * These are related but not the same field — do not treat mode as phase persistence.
 */

import type { HaulWritingDocument } from "@/lib/haul/writing/types";
import { sectionHasContent } from "@/lib/haul/writing/document";

export const HAUL_WRITING_PHASES = [
  "learn",
  "plan",
  "write",
  "feedback",
  "revise",
  "finish",
] as const;

export type HaulWritingPhase = (typeof HAUL_WRITING_PHASES)[number];

export const HAUL_WRITING_PHASE_LABELS: Record<HaulWritingPhase, string> = {
  learn: "Learn",
  plan: "Plan",
  write: "Write",
  feedback: "Feedback",
  revise: "Revise",
  finish: "Finish",
};

/**
 * Infer current phase from document content (heuristic, not mastery).
 */
export function inferHaulWritingPhase(doc: HaulWritingDocument): HaulWritingPhase {
  const filled = doc.sections.filter((s) => sectionHasContent(s)).length;
  const total = Math.max(doc.sections.length, 1);
  const ratio = filled / total;

  if (filled === 0) return "learn";
  if (ratio < 0.35) return "plan";
  if (ratio < 0.75) return "write";
  if (ratio < 0.95) return "feedback";
  if (ratio < 1) return "revise";
  return "finish";
}

export function nextSuggestedHaulPhase(
  current: HaulWritingPhase,
): HaulWritingPhase | null {
  const i = HAUL_WRITING_PHASES.indexOf(current);
  if (i < 0 || i >= HAUL_WRITING_PHASES.length - 1) return null;
  return HAUL_WRITING_PHASES[i + 1]!;
}
