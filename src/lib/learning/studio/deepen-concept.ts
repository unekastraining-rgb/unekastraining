/**
 * Bundle G — Expand a focused KL concept into depth-section instructional chunks.
 * Uses existing InstructionalConceptKnowledge fields — does not invent engines.
 */

import type {
  InstructionalConceptKnowledge,
  InstructionalDomain,
} from "@/lib/learning/knowledge/instructional-library";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type { SixLessonChunk } from "@/lib/csl/six-worked-lesson";
import type { TeachingDepthSection } from "@/lib/learning/teach/depth";
import { teachingDepthSectionsForScope } from "@/lib/learning/teach/depth";
import type { TeachScope } from "@/lib/learning/teach/scope";
import type { ConceptRelationshipMap } from "@/lib/learning/studio/types";

function conceptLabel(idOrTitle: string): string {
  const hit = findInstructionalConceptById(idOrTitle);
  if (hit) return hit.concept.title;
  // Already a title, or unknown id — do not invent depth
  if (!idOrTitle.includes("-") || /\s/.test(idOrTitle)) return idOrTitle;
  return idOrTitle.replace(/^.*:/, "").replace(/-/g, " ");
}

export function buildConceptRelationshipMap(input: {
  conceptTitles: string[];
  currentIndex: number;
  prerequisites?: string[];
  relatedTitles?: string[];
}): ConceptRelationshipMap {
  const nodes = input.conceptTitles.filter(Boolean);
  const edges: ConceptRelationshipMap["edges"] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      from: nodes[i]!,
      to: nodes[i + 1]!,
      relation: "leads-to",
    });
  }
  const current = nodes[input.currentIndex] ?? nodes[0];
  if (current) {
    for (const p of input.prerequisites ?? []) {
      if (p && p !== current) {
        edges.push({ from: p, to: current, relation: "prerequisite" });
      }
    }
    for (const r of input.relatedTitles ?? []) {
      if (r && r !== current && !nodes.includes(r)) {
        edges.push({ from: current, to: r, relation: "related" });
      }
    }
  }

  const chain =
    nodes.length > 0
      ? nodes.map((n, i) => (i === input.currentIndex ? `● ${n}` : n)).join(" → ")
      : current ?? "Concept";

  return {
    nodes: Array.from(
      new Set([
        ...nodes,
        ...(input.prerequisites ?? []),
        ...(input.relatedTitles ?? []),
      ]),
    ),
    edges,
    visual: chain,
  };
}

function pickExample(concept: InstructionalConceptKnowledge, offset = 0): string {
  const pool = [
    concept.example,
    ...(concept.examples ?? []),
    ...(concept.workedExamples ?? []),
  ].filter((x): x is string => Boolean(x?.trim()));
  if (pool.length === 0) {
    return `Concrete situation involving ${concept.title}.`;
  }
  return pool[Math.min(offset, pool.length - 1)]!;
}

function pickMisconception(
  concept: InstructionalConceptKnowledge,
): string | null {
  return (
    concept.misconceptionDetails?.[0]?.misconception ??
    concept.misconception ??
    concept.misconceptions?.[0] ??
    concept.nonExample ??
    concept.nonExamples?.[0] ??
    null
  );
}

function pickMisconceptionRemediation(
  concept: InstructionalConceptKnowledge,
): string | null {
  const detail = concept.misconceptionDetails?.[0];
  if (!detail) return null;
  const parts = [detail.correction, detail.contrast].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

/**
 * Build progressive chunks for ONE focused concept using depth sections.
 * When the concept already has rich fields, each section becomes a teachable beat.
 */
export function deepenConceptToChunks(input: {
  concept: InstructionalConceptKnowledge;
  scope: TeachScope;
  pathTitles?: string[];
  pathIndex?: number;
  domain?: InstructionalDomain;
}): SixLessonChunk[] {
  const { concept, scope } = input;
  const sections = teachingDepthSectionsForScope(scope);
  const pathTitles = input.pathTitles ?? [];
  const pathIndex = input.pathIndex ?? 0;
  const relations = buildConceptRelationshipMap({
    conceptTitles: pathTitles.length > 0 ? pathTitles : [concept.title],
    currentIndex: pathTitles.length > 0 ? pathIndex : 0,
    prerequisites: [
      ...(concept.prerequisites ?? []).map(conceptLabel),
      ...((concept.relationships ?? [])
        .filter((r) => r.kind === "prerequisite" || r.kind === "depends_on")
        .map((r) => conceptLabel(r.targetConceptId))),
    ],
    relatedTitles: [
      ...(concept.relatedConcepts ?? concept.related ?? []).map(conceptLabel),
      ...((concept.relationships ?? [])
        .filter(
          (r) =>
            r.kind === "related_to" ||
            r.kind === "leads_to" ||
            r.kind === "commonly_confused_with" ||
            r.kind === "contrasts_with",
        )
        .map((r) => conceptLabel(r.targetConceptId))),
    ].slice(0, 6),
  });

  const vocab =
    concept.vocabulary && concept.vocabulary.length > 0
      ? concept.vocabulary.slice(0, 6).join(", ")
      : null;

  const chunks: SixLessonChunk[] = [];

  for (const section of sections) {
    const chunk = chunkForDepthSection({
      section,
      concept,
      relations,
      vocab,
      domain: input.domain,
    });
    if (chunk) chunks.push(chunk);
  }

  // Ensure at least foundation + check when sections somehow empty.
  if (chunks.length === 0) {
    chunks.push({
      title: concept.title,
      role: "concept",
      explanation: concept.explanation,
      example: pickExample(concept),
      misconception: pickMisconception(concept) ?? undefined,
      checkPrompt:
        concept.checkPrompt ??
        `In your own words, what is ${concept.title}?`,
      representation: relations.visual,
    });
  }

  return chunks;
}

function chunkForDepthSection(input: {
  section: TeachingDepthSection;
  concept: InstructionalConceptKnowledge;
  relations: ConceptRelationshipMap;
  vocab: string | null;
  domain?: InstructionalDomain;
}): SixLessonChunk | null {
  const { section, concept, relations, vocab, domain } = input;
  const title = concept.title;

  switch (section) {
    case "foundation": {
      const why = concept.purpose?.trim();
      const def = concept.definition?.trim();
      const body = [
        def ? `${def}` : null,
        concept.explanation.trim(),
        why ? `Why it matters: ${why}` : null,
        vocab ? `Key terms: ${vocab}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");
      return {
        title: `Understand ${title}`,
        role: "concept",
        explanation: body,
        example: pickExample(concept, 0),
        representation: relations.visual,
      };
    }
    case "breakdown": {
      const breakdown =
        concept.breakdown?.trim() ||
        (vocab
          ? vocab
              .split(", ")
              .map((t, i) => `${i + 1}) ${t}`)
              .join("\n")
          : null);
      if (!breakdown && !concept.explanation) return null;
      return {
        title: `Break down ${title}`,
        role: "breakdown",
        explanation: `Let's decompose ${title} into usable parts.`,
        example: pickExample(concept, 1),
        breakdown: breakdown ?? concept.explanation.slice(0, 400),
        representation: concept.representation ?? relations.visual,
      };
    }
    case "connections": {
      return {
        title: `How ${title} connects`,
        role: "visualize",
        explanation: `Concepts become useful when they connect. Place ${title} in the learning path and related ideas so you can see what depends on what.`,
        example:
          relations.edges.length > 0
            ? relations.edges
                .slice(0, 4)
                .map((e) => `${e.from} ${edgeVerb(e.relation)} ${e.to}`)
                .join("; ")
            : `${title} supports later application on this path.`,
        representation: relations.visual,
      };
    }
    case "example": {
      return {
        title: `Example · ${title}`,
        role: "worked",
        explanation: `Here is a concrete illustration of ${title} in action.`,
        example: pickExample(concept, 0),
        breakdown:
          concept.breakdown ??
          (domain === "programming"
            ? "Read the example line by line. Predict the outcome before moving on."
            : "Identify which part of the example maps to the core idea."),
        representation: concept.representation,
      };
    }
    case "contrast": {
      const miss = pickMisconception(concept);
      if (!miss) return null;
      const remediation = pickMisconceptionRemediation(concept);
      return {
        title: `Watch for · ${title}`,
        role: "clarify",
        explanation: remediation
          ? `A useful distinction prevents shallow memorization. ${remediation}`
          : `A useful distinction prevents shallow memorization.`,
        example: concept.nonExample ?? concept.nonExamples?.[0] ?? miss,
        misconception: miss,
        checkPrompt: `What is a common mistake people make about ${title}?`,
      };
    }
    case "application": {
      const applyPrompt =
        concept.practiceForms?.includes("apply") ||
        concept.practiceForms?.includes("application")
          ? `Apply ${title} to a new realistic situation.`
          : `Use ${title} to decide what a person or system should do next.`;
      return {
        title: `Apply ${title}`,
        role: "apply",
        explanation: `Now use ${title} — do not only define it.`,
        example: pickExample(concept, 1),
        checkPrompt: applyPrompt,
      };
    }
    case "understanding-check": {
      return {
        title: `Check · ${title}`,
        role: "check",
        explanation: `Pause and retrieve. If you can explain and recognize ${title}, you are ready to move on.`,
        example: pickExample(concept, 0),
        misconception: pickMisconception(concept) ?? undefined,
        checkPrompt:
          concept.checkPrompt ??
          `Explain ${title} in your own words and give one new example.`,
      };
    }
    default:
      return null;
  }
}

function edgeVerb(
  relation: ConceptRelationshipMap["edges"][number]["relation"],
): string {
  switch (relation) {
    case "prerequisite":
      return "is needed for";
    case "leads-to":
      return "→";
    case "contrasts":
      return "≠";
    default:
      return "relates to";
  }
}
