/**
 * Phase 8 — User-note grounding provider.
 * Notes remain user material — never promoted to Knowledge Library.
 */

import {
  domainForGeneral,
  ensureRootGeneralConcept,
  generalConceptId,
} from "@/lib/learning/knowledge/retrieval/general-identity";
import type {
  KnowledgeRetrievalInput,
  NormalizedLearningTarget,
  RetrievedTeachingKnowledge,
} from "@/lib/learning/knowledge/retrieval/types";

const MIN_NOTE = 80;

export function retrieveFromUserNote(
  target: NormalizedLearningTarget,
  input: KnowledgeRetrievalInput,
): RetrievedTeachingKnowledge | null {
  const text = input.noteText?.trim() ?? "";
  if (text.length < MIN_NOTE) return null;

  const root = ensureRootGeneralConcept(target);
  const noteConcept = {
    id: generalConceptId(target.slug, "from-notes"),
    title: `${target.normalizedTitle} (from your notes)`,
    explanation: text.slice(0, 900),
  };

  return {
    target,
    sourceKind: "user-note",
    title: target.normalizedTitle,
    subject: target.subject,
    domain: domainForGeneral(target),
    concepts: [
      {
        ...root,
        explanation: `Using your notes to teach ${target.normalizedTitle}.`,
      },
      noteConcept,
    ],
    pathConceptIds: [root.id, noteConcept.id],
    grounding: [
      {
        kind: "user-note",
        label: input.noteTitle?.trim() || "Your notes",
        excerpt: text.slice(0, 400),
        noteId: input.noteId ?? undefined,
        courseId: input.courseId ?? undefined,
      },
    ],
    sources: [
      {
        kind: "user-note",
        id: input.noteId ?? undefined,
        title: input.noteTitle?.trim() || "Your notes",
        excerpt: text.slice(0, 400),
        confidence: "medium",
        limitations: [
          "User notes — not Study Haul Knowledge Library canonical knowledge.",
        ],
      },
    ],
    confidence: "medium",
    sourceSummary: "Instructional grounding from learner notes.",
    limitations: [
      "Derived from learner notes — not Knowledge Library canonical knowledge.",
    ],
  };
}
