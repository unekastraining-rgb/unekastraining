/**
 * 2P-7 — Reject Adaptive concept mismatch before writing evidence.
 * Adaptive bind already rejects concept_mismatch after the attempt exists;
 * this gate prevents writing ConceptMastery for the wrong concept when
 * adaptiveRunId is present.
 */

import {
  parseAdaptiveRunId,
} from "@/lib/learning/sequence/adaptive-launch-context";
import { getCurrentAdaptiveSequenceStep } from "@/lib/learning/sequence/coordinator";

export async function assertAdaptiveLaunchConceptMatch(input: {
  learnerId: string;
  conceptId: string;
  clientBody: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; reason: "concept_mismatch" }> {
  const runId = parseAdaptiveRunId(
    typeof input.clientBody.adaptiveRunId === "string"
      ? input.clientBody.adaptiveRunId
      : typeof input.clientBody.runId === "string"
        ? input.clientBody.runId
        : null,
  );
  if (!runId) return { ok: true };

  try {
    const current = await getCurrentAdaptiveSequenceStep(
      input.learnerId,
      runId,
    );
    if (current.kind !== "active") return { ok: true };
    if (current.run.conceptId !== input.conceptId.trim()) {
      return { ok: false, reason: "concept_mismatch" };
    }
    return { ok: true };
  } catch {
    // Soft: if run lookup fails, allow submit; bind path still enforces.
    return { ok: true };
  }
}
