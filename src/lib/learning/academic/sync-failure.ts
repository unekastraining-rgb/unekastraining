/**
 * Phase 14 — LMS sync failure representation (graceful; local preserved).
 */

import type {
  AcademicSource,
  AcademicSyncFailure,
} from "@/lib/learning/academic/types";

export function academicSyncFailure(
  source: AcademicSource,
  message: string,
): AcademicSyncFailure {
  return {
    source,
    message: message.trim() || "LMS sync unavailable",
    recoverable: true,
    localDataPreserved: true,
  };
}

/**
 * Merge previously synced (local) items with a failed remote sync.
 * Remote failure never clears local normalized items.
 */
export function mergeAcademicItemsAfterSyncFailure(input: {
  localItems: readonly import("@/lib/learning/academic/types").AcademicItem[];
  failure: AcademicSyncFailure;
}): {
  items: import("@/lib/learning/academic/types").AcademicItem[];
  failure: AcademicSyncFailure;
} {
  return {
    items: [...input.localItems],
    failure: input.failure,
  };
}
