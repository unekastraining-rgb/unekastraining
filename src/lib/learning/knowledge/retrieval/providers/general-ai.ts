/**
 * Phase 7 — Provider 3: General AI teaching knowledge.
 * Constructs structured teaching knowledge for unknown targets.
 * Does NOT decide learner progression. Does NOT write canonical KL packs.
 */

import { completeForUser } from "@/lib/ai/complete-for-user";
import { parseAiJson } from "@/lib/ai/parse-json-response";
import type {
  GeneralKnowledgeProvider,
  GeneralTeachingKnowledge,
  NormalizedLearningTarget,
} from "@/lib/learning/knowledge/retrieval/types";
import { validateGeneralTeachingKnowledge } from "@/lib/learning/knowledge/retrieval/validate-general-knowledge";

function buildPrompt(
  target: NormalizedLearningTarget,
  groundingExcerpt?: string | null,
): string {
  const lines = [
    "Return JSON only for structured introductory teaching knowledge.",
    "This is instructional knowledge for a learning system — not a finished lesson script.",
    "Do not invent citations or claim Knowledge Library authorship.",
    "Create a bounded introductory sequence (4–8 concepts), not an entire discipline.",
    "Include likely prerequisites early in the sequence when relevant.",
    "",
    `Target title: ${target.normalizedTitle}`,
    `Original request: ${target.original}`,
    target.subject ? `Subject hint: ${target.subject}` : "",
    target.domain ? `Domain hint: ${target.domain}` : "",
    target.requestedLevel ? `Stated level: ${target.requestedLevel}` : "",
    groundingExcerpt
      ? `Optional learner material excerpt (grounding only):\n${groundingExcerpt.slice(0, 1200)}`
      : "",
    "",
    "JSON shape:",
    "{",
    '  "targetTitle": string,',
    '  "subject": string,',
    '  "domain": string,',
    '  "summary": string,',
    '  "concepts": [{ "id": string, "title": string, "explanation": string, "prerequisites"?: string[], "examples"?: string[], "misconceptions"?: string[], "vocabulary"?: string[], "practiceIdeas"?: string[], "recallPrompts"?: string[] }],',
    '  "suggestedSequence": string[],',
    '  "limitations": string[]',
    "}",
    "Concept id values should be short kebab-case local ids (e.g. research-methods), not URLs.",
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Default provider — uses existing completeForUser when a userId is supplied.
 * Returns null when AI is unavailable or validation fails.
 */
export function createAiGeneralKnowledgeProvider(userId: string): GeneralKnowledgeProvider {
  return {
    async retrieve(target, options) {
      try {
        const result = await completeForUser(
          userId,
          [
            {
              role: "system",
              content:
                "You produce structured introductory teaching knowledge JSON for Study Haul. Stay on the requested subject. No study-meta tips. No fake citations.",
            },
            {
              role: "user",
              content: buildPrompt(target, options?.groundingExcerpt),
            },
          ],
          { temperature: 0.35, maxTokens: 4096, jsonMode: true },
        );
        const parsed = parseAiJson<GeneralTeachingKnowledge>(result.content);
        if (!parsed) return null;
        const validation = validateGeneralTeachingKnowledge(parsed, target);
        if (!validation.accepted) return null;
        return parsed;
      } catch {
        return null;
      }
    },
  };
}

/** Deterministic mock provider for integrity tests (no network). */
export function createMockGeneralKnowledgeProvider(
  factory: (target: NormalizedLearningTarget) => GeneralTeachingKnowledge | null,
): GeneralKnowledgeProvider {
  return {
    async retrieve(target) {
      // Return raw factory output — retrieveTeachingKnowledge validates.
      return factory(target);
    },
  };
}
