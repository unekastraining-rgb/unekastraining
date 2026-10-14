/**
 * Phase 16 — Core Intelligence (additive read/interpret layer).
 * Does not replace Core UI, notes, canvas, or ink.
 */

export type {
  CoreSourceType,
  CoreUnderstandingStatus,
  CoreConceptAssociation,
  CoreLearningContent,
  CoreLearningAction,
  CoreLearningActionHint,
} from "@/lib/learning/core/types";

export {
  extractTextFromNoteDocument,
  parseNoteDocumentJson,
  extractCoreText,
} from "@/lib/learning/core/extract";

export {
  associateConceptsFromText,
  isValidCoreConceptId,
} from "@/lib/learning/core/associate";

export {
  buildCoreLearningContent,
  coreLearningActionHints,
  filterCoreContentForUser,
} from "@/lib/learning/core/build";

export {
  summarizeCoreSourceHonesty,
  type CoreSourceHonesty,
} from "@/lib/learning/core/source-honesty";
