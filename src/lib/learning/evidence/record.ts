import { db } from "@/lib/db";
import type { EvidenceEnvelope } from "@/lib/learning/types";

/** Persist standardized evidence. Domain internals must not appear here. */
export async function recordEvidence(envelope: EvidenceEnvelope) {
  return db.learningAttempt.create({
    data: {
      userId: envelope.learnerId,
      learningObjectId: envelope.learningObjectId,
      conceptId: envelope.conceptId ?? null,
      skillFacet: envelope.skillFacet,
      outcome: envelope.outcome,
      score: envelope.score ?? null,
      confidence: envelope.confidence ?? null,
      misconceptionSignalsJson: JSON.stringify(
        envelope.misconceptionSignals ?? [],
      ),
      sourceRefJson: JSON.stringify(envelope.sourceRef),
      evidencePayloadJson: JSON.stringify(envelope.evidencePayload ?? {}),
      startedAt: envelope.startedAt ?? new Date(),
      endedAt: envelope.endedAt ?? new Date(),
    },
  });
}
