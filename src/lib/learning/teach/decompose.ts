/**
 * Bundle D — Concept decomposition for Teach.
 * Uses Knowledge Library relationships, pack siblings, vocabulary structure,
 * and (when needed) validated general AI structured knowledge.
 * Never fabricates canonical KL IDs. Never promotes into permanent KL.
 */

import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";
import {
  findInstructionalConceptById,
} from "@/lib/learning/knowledge/instructional-library";
import {
  generalConceptId,
  registerGeneralTeachingContext,
} from "@/lib/learning/knowledge/retrieval/general-identity";
import { normalizeLearningTarget } from "@/lib/learning/knowledge/retrieval/normalize-target";
import { validateGeneralTeachingKnowledge } from "@/lib/learning/knowledge/retrieval/validate-general-knowledge";
import type {
  GeneralKnowledgeProvider,
  GeneralTeachingKnowledge,
  KnowledgeRetrievalInput,
} from "@/lib/learning/knowledge/retrieval/types";
import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type { UnderstoodLearningTarget } from "@/lib/learning/knowledge/retrieval/learning-target";
import {
  detectTeachScope,
  minConceptsForTeachScope,
  shouldExpandTeachPath,
  type TeachScope,
} from "@/lib/learning/teach/scope";
import {
  dedupeTeachConcepts,
  validateTeachPathConcepts,
} from "@/lib/learning/teach/validate-path";

function slugifyLocal(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "concept";
}

/** BFS relatedConcepts within registered KL only. */
export function expandRelatedKnowledgeConcepts(
  seed: InstructionalConceptKnowledge,
  options?: { maxConcepts?: number; maxDepth?: number },
): InstructionalConceptKnowledge[] {
  const maxConcepts = options?.maxConcepts ?? 8;
  const maxDepth = options?.maxDepth ?? 2;
  const ordered: InstructionalConceptKnowledge[] = [];
  const seen = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [
    { id: seed.id, depth: 0 },
  ];

  while (queue.length > 0 && ordered.length < maxConcepts) {
    const cur = queue.shift()!;
    if (seen.has(cur.id)) continue;
    const hit =
      cur.id === seed.id
        ? { concept: seed }
        : findInstructionalConceptById(cur.id);
    if (!hit) continue;
    seen.add(cur.id);
    ordered.push(hit.concept);
    if (cur.depth >= maxDepth) continue;
    for (const rel of hit.concept.relatedConcepts ?? []) {
      if (!seen.has(rel) && findInstructionalConceptById(rel)) {
        queue.push({ id: rel, depth: cur.depth + 1 });
      }
    }
  }
  return ordered;
}

/**
 * Deterministic sub-concepts from vocabulary + structural fields.
 * Uses general: namespace — never invents KL pack IDs.
 */
export function expandVocabularyTeachingUnits(
  seed: InstructionalConceptKnowledge,
  topicSlug: string,
): InstructionalConceptKnowledge[] {
  const terms = (seed.vocabulary ?? [])
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .filter((t) => t.toLowerCase() !== seed.title.toLowerCase());

  const blob = [
    seed.definition,
    seed.explanation,
    seed.purpose,
    seed.example,
    ...(seed.examples ?? []),
    ...(seed.misconceptions ?? []),
    seed.misconception,
  ]
    .filter(Boolean)
    .join(" ");

  const units: InstructionalConceptKnowledge[] = [];
  for (const term of terms) {
    const local = slugifyLocal(term);
    const id = generalConceptId(topicSlug, local);
    const explanation = explanationForVocabularyUnit(seed, term, blob);
    if (explanation.length < 60) continue;
    units.push({
      id,
      title: titleCaseTerm(term),
      definition: `${titleCaseTerm(term)} is a core idea within ${seed.title}.`,
      explanation,
      example: seed.example,
      misconception: seed.misconception,
      misconceptions: seed.misconceptions,
      relatedConcepts: [seed.id],
      vocabulary: [term],
      difficulty: seed.difficulty ?? 2,
      checkPrompt: `In your own words, what is ${term} in the context of ${seed.title}?`,
      practiceForms: ["explain"],
    });
  }
  return units;
}

function explanationForVocabularyUnit(
  seed: InstructionalConceptKnowledge,
  term: string,
  blob: string,
): string {
  const re = new RegExp(
    `[^.?!]*\\b${escapeRegExp(term)}\\b[^.?!]*[.?!]?`,
    "i",
  );
  const sentence = blob.match(re)?.[0]?.trim();
  if (sentence && sentence.length >= 60) {
    return `${sentence} This sits inside ${seed.title}: ${
      seed.definition?.trim() || seed.explanation?.slice(0, 120) || ""
    }`.slice(0, 500);
  }
  const base =
    seed.definition?.trim() ||
    seed.explanation?.trim() ||
    `${seed.title} is a teachable concept.`;
  return (
    `${titleCaseTerm(term)} is one of the building blocks of ${seed.title}. ` +
    `${base} Pay attention to how ${term} connects to the rest of the idea, ` +
    `and be ready to explain ${term} with a concrete example.`
  ).slice(0, 500);
}

function titleCaseTerm(term: string): string {
  if (/^[A-Z0-9]+$/.test(term) || /\d/.test(term)) return term;
  return term
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Map validated general knowledge into InstructionalConceptKnowledge[]. */
export function conceptsFromGeneralTeachingKnowledge(
  knowledge: GeneralTeachingKnowledge,
  topicSlug: string,
): InstructionalConceptKnowledge[] {
  const seq =
    knowledge.suggestedSequence && knowledge.suggestedSequence.length > 0
      ? knowledge.suggestedSequence
      : knowledge.concepts.map((c) => c.id);
  const byLocal = new Map(
    knowledge.concepts.map((c) => [c.id.toLowerCase(), c] as const),
  );
  const ordered: InstructionalConceptKnowledge[] = [];
  const seen = new Set<string>();
  for (const localId of seq) {
    const raw =
      byLocal.get(localId.toLowerCase()) ??
      knowledge.concepts.find(
        (c) => c.title.toLowerCase() === localId.toLowerCase(),
      );
    if (!raw?.title?.trim() || !raw.explanation?.trim()) continue;
    const id = generalConceptId(topicSlug, raw.id || raw.title);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push({
      id,
      title: raw.title.trim(),
      explanation: raw.explanation,
      examples: raw.examples,
      example: raw.examples?.[0],
      misconceptions: raw.misconceptions,
      misconception: raw.misconceptions?.[0],
      relatedConcepts: raw.relatedConcepts,
      vocabulary: raw.vocabulary,
      prerequisites: raw.prerequisites,
      practiceForms: raw.practiceIdeas,
      checkPrompt: raw.recallPrompts?.[0],
      difficulty: 2,
    });
  }
  return ordered;
}

function titlesRoughlyMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const nb = b.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Merge KL seed concepts with general complements — KL first, no title dupes.
 */
export function mergeTeachConceptSequences(
  primary: InstructionalConceptKnowledge[],
  complements: InstructionalConceptKnowledge[],
  maxConcepts = 10,
): InstructionalConceptKnowledge[] {
  const out = dedupeTeachConcepts(primary);
  for (const c of complements) {
    if (out.length >= maxConcepts) break;
    if (out.some((p) => titlesRoughlyMatch(p.title, c.title))) continue;
    out.push(c);
  }
  return out.slice(0, maxConcepts);
}

export type DecomposeTeachResult = {
  context: TeachingKnowledgeContext;
  scope: TeachScope;
  expanded: boolean;
  source: "unchanged" | "related" | "vocabulary" | "general-ai" | "combined";
};

/**
 * Expand a teaching context into a validated multi-concept teach path when scope requires it.
 */
export async function decomposeTeachConcepts(input: {
  context: TeachingKnowledgeContext;
  understood: UnderstoodLearningTarget;
  generalProvider?: GeneralKnowledgeProvider | null;
  retrievalInput?: Pick<
    KnowledgeRetrievalInput,
    "userId" | "groundingText" | "courseId" | "materialId"
  >;
}): Promise<DecomposeTeachResult> {
  const scope = detectTeachScope(input.understood);
  const ctx = input.context;

  if (!shouldExpandTeachPath(input.understood.activity, scope)) {
    return { context: ctx, scope, expanded: false, source: "unchanged" };
  }

  // Already a multi-concept path/pack — keep, optionally trim for broad intro.
  if (ctx.concepts.length >= minConceptsForTeachScope(scope)) {
    const validated = validateTeachPathConcepts(ctx.concepts, { scope });
    if (validated.accepted && validated.concepts.length >= 2) {
      const trimmed =
        scope === "broad-subject"
          ? validated.concepts.slice(0, 6)
          : validated.concepts;
      return {
        context: {
          ...ctx,
          concepts: trimmed,
          primaryConcept: trimmed[0] ?? ctx.primaryConcept,
          resolution:
            trimmed.length > 1 ? "learning-path" : ctx.resolution,
          learningPathId:
            ctx.learningPathId ??
            (trimmed.length > 1
              ? `teach-path:${slugifyLocal(ctx.target)}`
              : undefined),
        },
        scope,
        expanded: trimmed.length > ctx.concepts.length,
        source: "unchanged",
      };
    }
  }

  const seed = ctx.primaryConcept ?? ctx.concepts[0];
  if (!seed) {
    return { context: ctx, scope, expanded: false, source: "unchanged" };
  }

  const topicSlug =
    normalizeLearningTarget(ctx.target)?.slug ??
    slugifyLocal(ctx.target);

  // 1) KL related graph
  let candidates = expandRelatedKnowledgeConcepts(seed, {
    maxConcepts: 8,
    maxDepth: 2,
  });
  let source: DecomposeTeachResult["source"] =
    candidates.length > 1 ? "related" : "unchanged";

  // 2) Vocabulary teaching units (deterministic, general: ids)
  if (candidates.length < minConceptsForTeachScope(scope)) {
    const vocabUnits = expandVocabularyTeachingUnits(seed, topicSlug);
    candidates = mergeTeachConceptSequences(candidates, vocabUnits, 10);
    if (vocabUnits.length > 0) {
      source = source === "related" ? "combined" : "vocabulary";
    }
  }

  // 3) General AI structured knowledge when still thin
  if (
    candidates.length < minConceptsForTeachScope(scope) &&
    input.generalProvider
  ) {
    try {
      const normalized =
        normalizeLearningTarget(input.understood.rawRequest) ??
        normalizeLearningTarget(ctx.target);
      if (normalized) {
        const general = await input.generalProvider.retrieve(normalized, {
          groundingExcerpt: input.retrievalInput?.groundingText?.slice(0, 1200),
        });
        if (general) {
          const validation = validateGeneralTeachingKnowledge(
            general,
            normalized,
          );
          if (validation.accepted) {
            const fromAi = conceptsFromGeneralTeachingKnowledge(
              general,
              topicSlug,
            );
            candidates = mergeTeachConceptSequences(candidates, fromAi, 10);
            source =
              candidates.some((c) => !c.id.startsWith("general:")) &&
              fromAi.length > 0
                ? "combined"
                : "general-ai";
          }
        }
      }
    } catch {
      // AI failure — keep deterministic candidates; never invent.
    }
  }

  const validated = validateTeachPathConcepts(candidates, { scope });
  const finalConcepts =
    validated.concepts.length >= 2
      ? validated.concepts
      : dedupeTeachConcepts([seed, ...candidates]).slice(0, 10);

  // If we still only have one concept, keep honest single-concept teaching
  // with depth contract applied later — do not fabricate siblings.
  if (finalConcepts.length < 2) {
    return { context: ctx, scope, expanded: false, source: "unchanged" };
  }

  const hasGeneral = finalConcepts.some((c) => c.id.startsWith("general:"));
  const hasKl = finalConcepts.some((c) => !c.id.startsWith("general:"));
  const next: TeachingKnowledgeContext = {
    ...ctx,
    concepts: finalConcepts,
    primaryConcept: finalConcepts[0] ?? seed,
    resolution: "learning-path",
    learningPathId:
      ctx.learningPathId ?? `teach-family:${topicSlug}`,
    knowledgeSourceKind:
      hasGeneral && hasKl
        ? "combined"
        : hasGeneral
          ? ctx.knowledgeSourceKind === "knowledge-library"
            ? "combined"
            : ctx.knowledgeSourceKind ?? "general-ai"
          : ctx.knowledgeSourceKind ?? "knowledge-library",
    source:
      hasGeneral && hasKl
        ? "combined"
        : hasGeneral && !hasKl
          ? "general-ai"
          : ctx.source,
    limitations: [
      ...(ctx.limitations ?? []),
      ...(hasGeneral
        ? [
            "Supplemental teaching concepts may use general structured knowledge — not promoted to Knowledge Library.",
          ]
        : []),
    ],
    sourceSummary:
      hasGeneral && hasKl
        ? "Knowledge Library concepts with general teaching-path expansion."
        : ctx.sourceSummary,
  };

  if (hasGeneral) {
    registerGeneralTeachingContext(next, topicSlug);
  }

  return {
    context: next,
    scope,
    expanded: true,
    source,
  };
}

/** Sync helper for tests — related + vocabulary only. */
export function decomposeTeachConceptsDeterministic(input: {
  context: TeachingKnowledgeContext;
  understood: UnderstoodLearningTarget;
}): DecomposeTeachResult {
  const scope = detectTeachScope(input.understood);
  if (!shouldExpandTeachPath(input.understood.activity, scope)) {
    return {
      context: input.context,
      scope,
      expanded: false,
      source: "unchanged",
    };
  }
  const seed = input.context.primaryConcept ?? input.context.concepts[0];
  if (!seed) {
    return {
      context: input.context,
      scope,
      expanded: false,
      source: "unchanged",
    };
  }
  if (input.context.concepts.length >= minConceptsForTeachScope(scope)) {
    return {
      context: {
        ...input.context,
        resolution:
          input.context.concepts.length > 1
            ? "learning-path"
            : input.context.resolution,
      },
      scope,
      expanded: false,
      source: "unchanged",
    };
  }
  const topicSlug =
    normalizeLearningTarget(input.context.target)?.slug ??
    slugifyLocal(input.context.target);
  let candidates = expandRelatedKnowledgeConcepts(seed);
  let source: DecomposeTeachResult["source"] =
    candidates.length > 1 ? "related" : "unchanged";
  if (candidates.length < minConceptsForTeachScope(scope)) {
    const vocab = expandVocabularyTeachingUnits(seed, topicSlug);
    candidates = mergeTeachConceptSequences(candidates, vocab, 10);
    if (vocab.length) source = source === "related" ? "combined" : "vocabulary";
  }
  const validated = validateTeachPathConcepts(candidates, { scope });
  if (validated.concepts.length < 2) {
    return {
      context: input.context,
      scope,
      expanded: false,
      source: "unchanged",
    };
  }
  const hasGeneral = validated.concepts.some((c) =>
    c.id.startsWith("general:"),
  );
  const next: TeachingKnowledgeContext = {
    ...input.context,
    concepts: validated.concepts,
    primaryConcept: validated.concepts[0] ?? seed,
    resolution: "learning-path",
    learningPathId:
      input.context.learningPathId ?? `teach-family:${topicSlug}`,
    source: hasGeneral ? "combined" : input.context.source,
    knowledgeSourceKind: hasGeneral
      ? "combined"
      : input.context.knowledgeSourceKind,
  };
  if (hasGeneral) registerGeneralTeachingContext(next, topicSlug);
  return { context: next, scope, expanded: true, source };
}
