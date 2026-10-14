/**
 * 2P-39 — Math workspace progression for linear-equation-solving.
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

export const MATH_WORKSPACE_PROGRESSION_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "math-ws-linear-basic",
    conceptKey: "linear-equation-solving",
    conceptTitle: "Linear equation solving",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "2x+4=10 workspace",
    activityKind: "math",
    contentId: "math-linear-basic",
    objective: "Solve 2x+4=10 with valid step transforms.",
    domainContext: "mathematics",
  }),
  entry({
    contentKey: "math-ws-linear-subtract",
    conceptKey: "linear-equation-solving",
    conceptTitle: "Linear equation solving",
    stage: "APPLY",
    difficulty: 2,
    contextVariant: "3x-7=11 workspace",
    activityKind: "math",
    contentId: "math-linear-subtract",
    objective: "Solve 3x−7=11 with valid step transforms.",
    domainContext: "mathematics",
  }),
  entry({
    contentKey: "math-ws-linear-distribute",
    conceptKey: "linear-equation-solving",
    conceptTitle: "Linear equation solving",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "5(x+2)=25 workspace",
    activityKind: "math",
    contentId: "math-linear-distribute",
    objective: "Distribute then solve 5(x+2)=25.",
    domainContext: "mathematics",
  }),
  entry({
    contentKey: "math-ws-linear-both-sides",
    conceptKey: "linear-equation-solving",
    conceptTitle: "Linear equation solving",
    stage: "CHALLENGE",
    difficulty: 3,
    contextVariant: "2x+3=x+9 workspace",
    activityKind: "math",
    contentId: "math-linear-both-sides",
    objective: "Solve variables on both sides with justification.",
    domainContext: "mathematics",
  }),
  entry({
    contentKey: "math-ws-linear-retain",
    conceptKey: "linear-equation-solving",
    conceptTitle: "Linear equation solving",
    stage: "RETAIN",
    difficulty: 2,
    contextVariant: "4x+8=0 workspace",
    activityKind: "math",
    contentId: "math-linear-retain",
    objective: "Recall and solve 4x+8=0 in steps.",
    domainContext: "mathematics",
  }),
];
