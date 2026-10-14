/**
 * Phase 2G-68 — CORE → Orchestrator/Adaptive closed-loop bridge (pure helpers).
 * 2P-25 — Start vs Continue aligned with Hub / Growth LearningAction labels.
 *
 * CORE remains authoring/study. This bridge only resolves an Adaptive
 * start/resume CTA for a learner-owned conceptId already grounded via the
 * Knowledge bridge. Does not diagnose, write evidence, update mastery,
 * create Concepts, or manage AdaptiveSequenceRun state.
 *
 * Reuses the same Adaptive entry contract as Study Hub (2G-59).
 */

import {
  hubAdaptiveRunHref,
  resolveHubAdaptivePrimaryCta,
  type HubAdaptivePrimaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";

export type CoreAdaptivePrimaryCta =
  | {
      kind: "resume";
      runId: string;
      label: "Continue learning";
      href: string;
    }
  | {
      kind: "start";
      conceptId: string;
      label: "Start learning";
    }
  | { kind: "none" };

/**
 * Primary CORE learning CTA for a grounded concept.
 * Never fabricates conceptId or runId. Returns none when concept missing.
 */
export function resolveCoreAdaptivePrimaryCta(input: {
  conceptId?: string | null;
  activeRunId?: string | null;
}): CoreAdaptivePrimaryCta {
  const hub = resolveHubAdaptivePrimaryCta(input);
  if (hub.kind === "none") return { kind: "none" };
  if (hub.kind === "resume") {
    return {
      kind: "resume",
      runId: hub.runId,
      label: "Continue learning",
      href: hub.href,
    };
  }
  return {
    kind: "start",
    conceptId: hub.conceptId,
    label: "Start learning",
  };
}

/** Prefer last-confirmed concept, else first linked id. Never invents ids. */
export function pickCoreBridgeFocusConceptId(input: {
  confirmedConceptId?: string | null;
  linkedConceptIds?: string[] | null;
}): string | null {
  const confirmed =
    typeof input.confirmedConceptId === "string"
      ? input.confirmedConceptId.trim()
      : "";
  if (confirmed) return confirmed;

  const linked = input.linkedConceptIds ?? [];
  for (const id of linked) {
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return null;
}

export function coreAdaptiveRunHref(runId: string): string {
  return hubAdaptiveRunHref(runId);
}

/** Return to CORE notebook after Adaptive (preserves noteId; never invents ids). */
export function coreNotebookReturnHref(noteId: string): string {
  const id = noteId.trim();
  if (!id) return "/core";
  return `/core?noteId=${encodeURIComponent(id)}`;
}

/** Adaptive run URL with optional CORE return note for round-trip navigation. */
export function coreAdaptiveRunHrefWithReturn(
  runId: string,
  noteId?: string | null,
): string {
  const base = hubAdaptiveRunHref(runId);
  const id = typeof noteId === "string" ? noteId.trim() : "";
  if (!id) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}fromNote=${encodeURIComponent(id)}`;
}

/** Type guard mirroring Hub CTA shapes for tests. */
export function isHubCompatibleCoreCta(
  cta: CoreAdaptivePrimaryCta,
): cta is Exclude<CoreAdaptivePrimaryCta, { kind: "none" }> {
  return cta.kind === "start" || cta.kind === "resume";
}

export type { HubAdaptivePrimaryCta };
