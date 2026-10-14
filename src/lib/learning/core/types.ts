/**
 * Phase 16 — Core Intelligence types (read/interpret layer).
 * Does NOT own or mutate Note / canvas / ink storage.
 */

export type CoreSourceType =
  | "note"
  | "handwriting"
  | "drawing"
  | "pdf"
  | "image"
  | "template"
  | "attachment"
  | "mixed";

export type CoreUnderstandingStatus =
  | "understood"
  | "partially_understood"
  | "unavailable";

export type CoreConceptAssociation = {
  conceptId: string;
  confidence: "low" | "medium" | "high";
  source:
    | "knowledge-library"
    | "personal-retrieval"
    | "course-material"
    | "user-selected"
    | "general";
  title?: string;
};

/**
 * Interpretation of Core content for the learning engine.
 * Original user content remains untouched elsewhere.
 */
export type CoreLearningContent = {
  sourceId: string;
  userId: string;
  sourceType: CoreSourceType;
  title?: string;
  /** Extracted plain text for association — never written back to the note. */
  text?: string;
  concepts?: CoreConceptAssociation[];
  understanding: CoreUnderstandingStatus;
  sourceMetadata?: Record<string, unknown>;
};

export type CoreLearningAction =
  | "learn"
  | "practice"
  | "recall"
  | "explain"
  | "connect-concept";

export type CoreLearningActionHint = {
  action: CoreLearningAction;
  conceptId?: string;
  /** Existing Study room / Six component preference. */
  room?: "learn" | "practice" | "remember" | "check";
  sixTechnique?: string;
  reason: string;
};
