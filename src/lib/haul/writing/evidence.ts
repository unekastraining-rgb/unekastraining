/**
 * Light evidence bridge for Haul writing — meaningful actions only.
 * Opening a template does NOT create evidence.
 * Uses existing Learner State service; never invents mastery.
 */

import "@/lib/learning/knowledge/packs";
import { isRegisteredKnowledgeConceptId } from "@/lib/learning/learner-state/concept-identity";
import { recordLearningEvidence } from "@/lib/learning/learner-state/service";
import type {
  LearningEvidenceType,
  RecordLearningEvidenceResult,
} from "@/lib/learning/learner-state/types";
import { generalConceptId } from "@/lib/learning/knowledge/retrieval/general-identity";

export type HaulWritingEvidenceSignal = {
  writingTypeId: string;
  sectionId: string;
  action:
    | "section_substantial_write"
    | "revision_applied"
    | "feedback_requested";
  /** Preferred KL concept ids from the writing type section (may be unregistered). */
  knowledgeConceptIds?: string[];
  documentId?: string;
};

/**
 * Returns true when section text is substantial enough to count as practice writing.
 */
export function isSubstantialHaulWriting(text: string): boolean {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length >= 80;
}

export function buildHaulWritingEvidenceNote(
  signal: HaulWritingEvidenceSignal,
): string {
  return `haul-writing:${signal.action}:${signal.writingTypeId}:${signal.sectionId}`;
}

/**
 * Map preferred writing concept ids to registered KL or general:writing:* identities.
 * Never fabricates arbitrary ids that fail concept-identity checks.
 */
export function resolveHaulWritingEvidenceConceptId(
  preferredIds?: string[],
): string | undefined {
  for (const raw of preferredIds ?? []) {
    const id = raw.trim();
    if (!id) continue;
    if (isRegisteredKnowledgeConceptId(id)) return id;
  }
  // Phase 7 general-topic fallback for writing practice (not a second knowledge engine).
  const first = preferredIds?.find((x) => x.trim())?.trim();
  const slug = (first ?? "practice")
    .replace(/^writing[-:]/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "practice";
  const generalId = generalConceptId("writing", slug);
  if (isRegisteredKnowledgeConceptId(generalId)) return generalId;
  return undefined;
}

function evidenceTypeForAction(
  action: HaulWritingEvidenceSignal["action"],
): LearningEvidenceType {
  if (action === "feedback_requested") return "explanation_attempt";
  if (action === "revision_applied") return "practice_attempt";
  return "practice_attempt";
}

/**
 * Record meaningful Haul writing into existing Learner State.
 * No-op for open-template; caller must gate with isSubstantialHaulWriting when needed.
 */
export async function recordHaulWritingEvidence(input: {
  userId: string;
  signal: HaulWritingEvidenceSignal;
}): Promise<RecordLearningEvidenceResult> {
  const { userId, signal } = input;
  if (!userId.trim()) {
    return { recorded: false, reason: "userId_required" };
  }

  const conceptId = resolveHaulWritingEvidenceConceptId(
    signal.knowledgeConceptIds,
  );
  const eventKey = [
    "haul-writing",
    signal.documentId ?? "doc",
    signal.action,
    signal.writingTypeId,
    signal.sectionId,
  ].join(":");

  return recordLearningEvidence({
    userId,
    type: evidenceTypeForAction(signal.action),
    conceptId,
    outcome: "attempted",
    source: "haul-writing",
    eventKey,
    metadata: {
      note: buildHaulWritingEvidenceNote(signal),
      writingTypeId: signal.writingTypeId,
      sectionId: signal.sectionId,
      action: signal.action,
    },
  });
}
