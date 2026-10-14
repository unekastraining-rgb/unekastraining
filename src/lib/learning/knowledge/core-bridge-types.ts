/**
 * Phase 2E-1 — CORE Note ↔ Knowledge Model association metadata (no Prisma FK).
 */

export const LEARNING_KNOWLEDGE_META_VERSION = 1 as const;

export type KnowledgeCandidateSourceType =
  | "definition"
  | "learning_objective"
  | "framework"
  | "process"
  | "topic_concept";

export type KnowledgeCandidateStatus =
  | "proposed"
  | "existing"
  | "linked"
  | "rejected";

/** Deterministic candidate derived from ChapterStudyExtract (or Topic concept). */
export interface KnowledgeConceptCandidate {
  /** Stable key for UI / confirm / reject (not a Concept id). */
  key: string;
  title: string;
  normalizedTitle: string;
  sourceType: KnowledgeCandidateSourceType;
  /** Human-readable path, e.g. definitions[0].term */
  sourcePath: string;
  definition?: string | null;
  /** Set when an owned Concept already matches. */
  existingConceptId?: string | null;
  status: KnowledgeCandidateStatus;
}

export interface LearningKnowledgeMeta {
  version: typeof LEARNING_KNOWLEDGE_META_VERSION;
  linkedConceptIds: string[];
  confirmedAt: string | null;
  /** Snapshot of last preview / rejected keys for UX continuity. */
  candidateConcepts: KnowledgeConceptCandidate[];
}

export function emptyLearningKnowledgeMeta(): LearningKnowledgeMeta {
  return {
    version: LEARNING_KNOWLEDGE_META_VERSION,
    linkedConceptIds: [],
    confirmedAt: null,
    candidateConcepts: [],
  };
}

export function readLearningKnowledgeMeta(
  raw: unknown,
): LearningKnowledgeMeta {
  const base = emptyLearningKnowledgeMeta();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  const linked = Array.isArray(obj.linkedConceptIds)
    ? obj.linkedConceptIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : [];
  const candidates = Array.isArray(obj.candidateConcepts)
    ? obj.candidateConcepts
        .map((item) => readCandidate(item))
        .filter((item): item is KnowledgeConceptCandidate => item != null)
    : [];
  return {
    version: LEARNING_KNOWLEDGE_META_VERSION,
    linkedConceptIds: [...new Set(linked)],
    confirmedAt:
      typeof obj.confirmedAt === "string" || obj.confirmedAt === null
        ? (obj.confirmedAt as string | null)
        : null,
    candidateConcepts: candidates,
  };
}

function readCandidate(raw: unknown): KnowledgeConceptCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const key = typeof obj.key === "string" ? obj.key.trim() : "";
  if (!title || !key) return null;
  const sourceType = obj.sourceType as KnowledgeCandidateSourceType;
  const allowed: KnowledgeCandidateSourceType[] = [
    "definition",
    "learning_objective",
    "framework",
    "process",
    "topic_concept",
  ];
  if (!allowed.includes(sourceType)) return null;
  const status = (obj.status as KnowledgeCandidateStatus) ?? "proposed";
  return {
    key,
    title,
    normalizedTitle:
      typeof obj.normalizedTitle === "string"
        ? obj.normalizedTitle
        : title.toLowerCase(),
    sourceType,
    sourcePath: typeof obj.sourcePath === "string" ? obj.sourcePath : sourceType,
    definition: typeof obj.definition === "string" ? obj.definition : null,
    existingConceptId:
      typeof obj.existingConceptId === "string" ? obj.existingConceptId : null,
    status:
      status === "existing" ||
      status === "linked" ||
      status === "rejected" ||
      status === "proposed"
        ? status
        : "proposed",
  };
}
