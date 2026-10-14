/**
 * 2P-48 — Progression ladder for proportional-scaling (all-ages depth pack).
 */

import type { ContentProgressionEntry } from "@/lib/learning/content-progression/types";

function entry(
  partial: Omit<ContentProgressionEntry, "contentVersion" | "authorship"> & {
    authorship?: ContentProgressionEntry["authorship"];
    contentVersion?: string;
    ownerLearnerId?: string | null;
    readiness?: ContentProgressionEntry["readiness"];
  },
): ContentProgressionEntry {
  return {
    ...partial,
    authorship: partial.authorship ?? "system",
    contentVersion: partial.contentVersion ?? `v1:${partial.contentKey}`,
    ownerLearnerId: partial.ownerLearnerId ?? null,
    readiness: partial.readiness ?? "READY",
  };
}

/** Complements existing PRACTICE recipe lab with UNDERSTAND→CHALLENGE→RETAIN. */
export const ALL_AGES_DEPTH_PROGRESSION_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "math-proportional-scale-understand",
    conceptKey: "proportional-scaling",
    conceptTitle: "Proportional scaling",
    stage: "UNDERSTAND",
    difficulty: 1,
    contextVariant: "picture blocks 2 per tower",
    activityKind: "lab",
    contentId: "lab-proportional-scale-blocks",
    objective: "Build total from equal groups (concrete proportional start).",
    domainContext: "mathematics",
  }),
  entry({
    contentKey: "math-proportional-scale-apply-map",
    conceptKey: "proportional-scaling",
    conceptTitle: "Proportional scaling",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "map scale cm to km",
    activityKind: "lab",
    contentId: "lab-proportional-scale-map",
    objective: "Apply a map scale to compute real distance.",
    domainContext: "mathematics",
  }),
  entry({
    contentKey: "math-proportional-scale-challenge-rate",
    conceptKey: "proportional-scaling",
    conceptTitle: "Proportional scaling",
    stage: "CHALLENGE",
    difficulty: 4,
    contextVariant: "printer rate transfer",
    activityKind: "lab",
    contentId: "lab-proportional-scale-rate",
    objective: "Transfer proportion to a rate problem with a new surface.",
    domainContext: "mathematics",
  }),
  entry({
    contentKey: "math-proportional-scale-retain",
    conceptKey: "proportional-scaling",
    conceptTitle: "Proportional scaling",
    stage: "RETAIN",
    difficulty: 2,
    contextVariant: "pencils unit price retrieval",
    activityKind: "lab",
    contentId: "lab-proportional-scale-retain",
    objective: "Retrieve proportional setup on a fresh price problem.",
    domainContext: "mathematics",
  }),
];
