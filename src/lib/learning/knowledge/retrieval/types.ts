/**
 * Phase 7/8 — Universal Knowledge Retrieval types + Phase 8 provenance.
 *
 * Knowledge Library remains the structured gold layer.
 * Retrieval obtains teachable knowledge when KL does not already contain the target.
 * Phase 8 adds source/provenance intelligence without replacing Phase 7.
 */

import type {
  InstructionalConceptKnowledge,
  InstructionalDomain,
} from "@/lib/learning/knowledge/instructional-library";

export type KnowledgeSourceKind =
  | "knowledge-library"
  | "course-material"
  | "user-note"
  | "retrieved-web"
  | "general-ai"
  | "combined";

export type RetrievalConfidence = "low" | "medium" | "high";

/** Normalized learning request (preserves original wording). */
export type NormalizedLearningTarget = {
  original: string;
  /** Cleaned title for teaching (e.g. "psychology"). */
  normalizedTitle: string;
  /** Stable slug for general: identity (e.g. "psychology"). */
  slug: string;
  subject?: string;
  domain?: InstructionalDomain;
  /** Explicit level only when user stated it — never invented. */
  requestedLevel?: string;
  learningGoal?: string;
};

/**
 * Phase 8 — Provenance record for a knowledge contribution.
 * Never invent reference/URL/author — omit when unknown.
 */
export type KnowledgeSource = {
  kind: KnowledgeSourceKind;
  id?: string;
  title?: string;
  /** Real reference only (URL, citation key). Never fabricated. */
  reference?: string;
  provider?: string;
  confidence?: RetrievalConfidence;
  retrievedAt?: string;
  excerpt?: string;
  limitations?: string[];
};

/** Legacy grounding ref (Phase 7) — still used; maps into KnowledgeSource. */
export type TeachingGroundingReference = {
  kind: "course-material" | "uploaded-text" | "lms" | "user-note";
  label: string;
  /** Short excerpt only — never treated as canonical KL. */
  excerpt?: string;
  materialId?: string;
  courseId?: string;
  noteId?: string;
};

/**
 * Phase 8 — Separates canonical / course / notes / external / AI explanation.
 * AI explanation is NOT a retrieved source.
 */
export type KnowledgeGroundingContext = {
  canonical?: KnowledgeSource;
  courseMaterials: KnowledgeSource[];
  userNotes: KnowledgeSource[];
  retrievedExternal: KnowledgeSource[];
  /** Generated explanation provenance — not a citation trail. */
  generatedExplanation?: KnowledgeSource;
  /** Flat list preserving individual provenance (never anonymous "combined only"). */
  allSources: KnowledgeSource[];
};

/** Structured AI/general teaching knowledge (not a lesson; not canonical KL). */
export type GeneralTeachingKnowledge = {
  targetTitle: string;
  subject?: string;
  domain?: InstructionalDomain;
  summary: string;
  concepts: Array<{
    /** Temporary id — must use general: namespace when persisted. */
    id: string;
    title: string;
    explanation: string;
    prerequisites?: string[];
    examples?: string[];
    misconceptions?: string[];
    relatedConcepts?: string[];
    vocabulary?: string[];
    practiceIdeas?: string[];
    recallPrompts?: string[];
  }>;
  suggestedSequence?: string[];
  limitations?: string[];
};

export type TeachingKnowledgeConcept = InstructionalConceptKnowledge;

/** External retrieval snippet — only when a real provider returned it. */
export type RetrievedExternalSnippet = {
  source: KnowledgeSource;
  content: string;
  relevance?: number;
};

export type RetrievedTeachingKnowledge = {
  target: NormalizedLearningTarget;
  sourceKind: KnowledgeSourceKind;
  title: string;
  subject?: string;
  domain?: InstructionalDomain;
  concepts: TeachingKnowledgeConcept[];
  /** Ordered concept ids for path advancement (must exist in concepts). */
  pathConceptIds?: string[];
  grounding?: TeachingGroundingReference[];
  /** Phase 8 — individual provenance records. */
  sources?: KnowledgeSource[];
  groundingContext?: KnowledgeGroundingContext;
  externalSnippets?: RetrievedExternalSnippet[];
  confidence: RetrievalConfidence;
  sourceSummary?: string;
  limitations?: string[];
};

export type KnowledgeRetrievalInput = {
  target: string;
  userId?: string;
  groundingText?: string | null;
  courseId?: string | null;
  materialId?: string | null;
  courseTitle?: string | null;
  materialTitle?: string | null;
  /** Optional user-note body (already owned/loaded by caller). */
  noteText?: string | null;
  noteTitle?: string | null;
  noteId?: string | null;
  /**
   * Injected general-knowledge provider (tests).
   * When omitted, uses default AI-backed provider (may be unavailable).
   */
  generalProvider?: GeneralKnowledgeProvider | null;
  /**
   * Injected external/web provider (tests / future integration).
   * Default is a no-op — General AI is NEVER treated as web retrieval.
   */
  externalProvider?: ExternalKnowledgeProvider | null;
  /** Skip general AI (honest miss when KL + course insufficient). */
  disableGeneralAi?: boolean;
  /** Skip external retrieval even if a provider is configured. */
  disableExternalRetrieval?: boolean;
};

export type GeneralKnowledgeProvider = {
  retrieve(
    target: NormalizedLearningTarget,
    options?: { groundingExcerpt?: string | null },
  ): Promise<GeneralTeachingKnowledge | null>;
};

/** Optional boundary for real web/external retrieval — not implemented in-repo. */
export type ExternalKnowledgeProvider = {
  retrieve(
    target: NormalizedLearningTarget,
    options?: { userId?: string; limit?: number },
  ): Promise<RetrievedExternalSnippet[]>;
};

export type KnowledgeRetrievalResult =
  | {
      ok: true;
      knowledge: RetrievedTeachingKnowledge;
    }
  | {
      ok: false;
      reason:
        | "empty-target"
        | "protected-specialized-path"
        | "no-provider"
        | "provider-failed"
        | "invalid-knowledge"
        | "ambiguous-unsupported"
        | "invalid-external-source";
      message: string;
    };
