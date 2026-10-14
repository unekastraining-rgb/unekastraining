/**
 * Bundle I/L — Curriculum position labels (not mastery).
 * Path position ≠ mastery unless Learner Model asserts it.
 *
 * Canonical statuses: visited | current | next | available
 * Legacy aliases done→visited, upcoming→available are accepted at boundaries only.
 */

import { PATH_POSITION_DISCLAIMER } from "@/lib/learning/unified-experience/copy";

export type CurriculumPositionStatus =
  | "visited"
  | "current"
  | "next"
  | "available";

/** @deprecated Use CurriculumPositionStatus — kept for migration at call sites. */
export type LegacyCurriculumStatus = "done" | "current" | "upcoming";

/** Re-export shared disclaimer — single source with unified-experience copy. */
export { PATH_POSITION_DISCLAIMER };

/** Human label for rail UI — never "Mastered" from position alone. */
export function curriculumPositionLabel(
  status: CurriculumPositionStatus | LegacyCurriculumStatus,
): string {
  switch (status) {
    case "done":
    case "visited":
      return "Visited";
    case "current":
      return "Current";
    case "next":
      return "Next";
    case "available":
    case "upcoming":
    default:
      return "Available";
  }
}

/**
 * Map path index → canonical position status.
 * Prefer this over storing legacy done/upcoming on items.
 */
export function curriculumStatusForIndex(
  pathIndex: number,
  currentIndex: number,
): CurriculumPositionStatus {
  if (pathIndex === currentIndex) return "current";
  if (pathIndex < currentIndex) return "visited";
  if (pathIndex === currentIndex + 1) return "next";
  return "available";
}

/** Map legacy done/current/upcoming → canonical position statuses. */
export function toCurriculumPositionStatus(
  status: LegacyCurriculumStatus | CurriculumPositionStatus,
  pathIndex: number,
  currentIndex: number,
): CurriculumPositionStatus {
  if (status === "current" || pathIndex === currentIndex) return "current";
  if (status === "done" || status === "visited" || pathIndex < currentIndex) {
    return "visited";
  }
  if (status === "next" || pathIndex === currentIndex + 1) return "next";
  return "available";
}
