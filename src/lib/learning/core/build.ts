/**
 * Phase 16 — Build CoreLearningContent + learning action hints.
 * Read-only interpretation. Original content never mutated.
 */

import { extractCoreText } from "@/lib/learning/core/extract";
import {
  associateConceptsFromText,
  isValidCoreConceptId,
} from "@/lib/learning/core/associate";
import type {
  CoreConceptAssociation,
  CoreLearningActionHint,
  CoreLearningContent,
} from "@/lib/learning/core/types";

/**
 * Interpret owned Core note content for the learning engine.
 * Caller must enforce userId ownership before passing note fields.
 */
export function buildCoreLearningContent(input: {
  sourceId: string;
  userId: string;
  title?: string | null;
  content?: string | null;
  contentJson?: string | null;
  userSelectedConceptIds?: readonly string[];
  /** Pre-associated from personal retrieval / course material. */
  materialConceptIds?: readonly string[];
}): CoreLearningContent {
  const extracted = extractCoreText({
    content: input.content,
    contentJson: input.contentJson,
  });

  const concepts = associateConceptsFromText(extracted.text, {
    userSelectedConceptIds: input.userSelectedConceptIds,
    title: input.title,
  });

  // Material-linked concepts (advisory, medium confidence).
  for (const id of input.materialConceptIds ?? []) {
    if (!isValidCoreConceptId(id)) continue;
    if (concepts.some((c) => c.conceptId === id)) continue;
    concepts.push({
      conceptId: id,
      confidence: "medium",
      source: "course-material",
    });
  }

  return {
    sourceId: input.sourceId,
    userId: input.userId,
    sourceType: extracted.sourceType,
    title: input.title?.trim() || undefined,
    text: extracted.text || undefined,
    concepts: concepts.length ? concepts : undefined,
    understanding: extracted.understanding,
    sourceMetadata: {
      contentUnchanged: true,
      extractedCharCount: extracted.text.length,
      hasDocument: Boolean(extracted.document),
    },
  };
}

/**
 * Additive learning action hints from Core associations.
 * Routes into existing rooms — does not create a Core orchestrator.
 */
export function coreLearningActionHints(
  content: CoreLearningContent,
): CoreLearningActionHint[] {
  const primary = primaryAssociation(content.concepts);
  if (!primary) {
    if (content.understanding === "unavailable") {
      return [
        {
          action: "connect-concept",
          reason:
            "Content could not be interpreted automatically — select a concept to continue.",
        },
      ];
    }
    return [
      {
        action: "connect-concept",
        reason: "No confident concept association yet.",
      },
    ];
  }

  return [
    {
      action: "learn",
      conceptId: primary.conceptId,
      room: "learn",
      sixTechnique: "detailed-explanation",
      reason: `Learn ${primary.title ?? primary.conceptId} from your notes.`,
    },
    {
      action: "practice",
      conceptId: primary.conceptId,
      room: "practice",
      sixTechnique: "hands-on-practice",
      reason: `Practice ${primary.title ?? primary.conceptId}.`,
    },
    {
      action: "recall",
      conceptId: primary.conceptId,
      room: "remember",
      sixTechnique: "active-recall",
      reason: `Recall ${primary.title ?? primary.conceptId}.`,
    },
    {
      action: "explain",
      conceptId: primary.conceptId,
      room: "learn",
      sixTechnique: "feynman",
      reason: `Explain ${primary.title ?? primary.conceptId} in your own words.`,
    },
  ];
}

function primaryAssociation(
  concepts?: CoreConceptAssociation[],
): CoreConceptAssociation | null {
  if (!concepts?.length) return null;
  const rank = { high: 0, medium: 1, low: 2 };
  return [...concepts].sort(
    (a, b) => rank[a.confidence] - rank[b.confidence],
  )[0];
}

/**
 * Ownership check helper — associations must stay on the owning user.
 */
export function filterCoreContentForUser(
  userId: string,
  content: CoreLearningContent,
): CoreLearningContent | null {
  if (content.userId !== userId) return null;
  return content;
}
