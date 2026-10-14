/**
 * Phase 2G-9 — Start or resume AdaptiveSequenceRun for an owned Concept.
 * Thin domain helper for the Study Hub start API. Never trusts client userId.
 */
import { AdaptiveSequenceRunError } from "@/lib/learning/sequence/errors";
import {
  listActiveAdaptiveSequenceRuns,
  startAdaptiveSequenceRun,
} from "@/lib/learning/sequence/coordinator";

export type StartOrResumeAdaptiveResult =
  | { kind: "ok"; runId: string; resumed: boolean }
  | { kind: "not_found" }
  | { kind: "no_sequence"; reason: string }
  | { kind: "error"; message: string };

/**
 * Reuse the most recently updated ACTIVE run, or start one via the coordinator.
 * Does not auto-complete, abandon, or invent interventions.
 */
export async function startOrResumeAdaptiveSequenceForConcept(
  userId: string,
  conceptId: string,
): Promise<StartOrResumeAdaptiveResult> {
  const trimmed = conceptId.trim();
  if (!trimmed) {
    return { kind: "not_found" };
  }

  try {
    const active = await listActiveAdaptiveSequenceRuns(userId, trimmed);
    if (active.length > 0) {
      return { kind: "ok", runId: active[0]!.id, resumed: true };
    }

    const started = await startAdaptiveSequenceRun({
      userId,
      conceptId: trimmed,
    });

    if (started.kind === "no_sequence_needed") {
      return { kind: "no_sequence", reason: started.reason };
    }

    return { kind: "ok", runId: started.run.id, resumed: false };
  } catch (error) {
    if (error instanceof AdaptiveSequenceRunError) {
      // Ownership / missing concept — treat as not found (no cross-user leak).
      return { kind: "not_found" };
    }
    const message =
      error instanceof Error ? error.message : "Failed to start adaptive study.";
    return { kind: "error", message };
  }
}
