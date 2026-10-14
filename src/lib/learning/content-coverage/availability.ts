/**
 * 2P-10 — Content / activity runtime availability (lightweight).
 * Distinguishes "content exists" from "can currently run".
 */

import { getActivityContentDescriptor } from "@/lib/learning/activities/content-contract";
import type { ContentProgressionEntry } from "@/lib/learning/content-progression/types";
import type { ContentCoverageActivityKind } from "./types";

export type ContentAvailabilityIssue =
  | "unavailable_activity_kind"
  | "unavailable_content_key"
  | "missing_catalog_content"
  | "six_ok"
  | "ok";

/**
 * Check whether a progression entry can currently launch.
 * Does not rewrite activity engines — uses catalog presence + caller runtime flags.
 */
export function evaluateContentAvailability(
  entry: ContentProgressionEntry,
  opts?: {
    unavailableActivityKinds?: readonly ContentCoverageActivityKind[] | null;
    unavailableContentKeys?: readonly string[] | null;
  },
): { available: boolean; issue: ContentAvailabilityIssue } {
  const unavailableKinds = new Set(opts?.unavailableActivityKinds ?? []);
  const unavailableKeys = new Set(
    (opts?.unavailableContentKeys ?? []).map((k) => k.trim()).filter(Boolean),
  );

  if (unavailableKeys.has(entry.contentKey)) {
    return { available: false, issue: "unavailable_content_key" };
  }
  if (unavailableKinds.has(entry.activityKind)) {
    return { available: false, issue: "unavailable_activity_kind" };
  }

  if (entry.activityKind === "six") {
    return { available: true, issue: "six_ok" };
  }

  if (!entry.contentId) {
    return { available: false, issue: "missing_catalog_content" };
  }

  const descriptor = getActivityContentDescriptor(
    entry.activityKind,
    entry.contentId,
  );
  if (!descriptor) {
    return { available: false, issue: "missing_catalog_content" };
  }

  return { available: true, issue: "ok" };
}
