/**
 * Phase 3B-2 — Teaching knowledge context.
 *
 * Bridges Knowledge Library resolution → Teaching Engine input.
 * This is NOT a lesson. Packs/concepts remain knowledge; the teaching engine
 * turns this context into SixWorkedLesson (AI or deterministic adapter).
 */

import type { SixComponent } from "@/lib/csl/six";
import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import type {
  InstructionalConceptKnowledge,
  InstructionalDomain,
  InstructionalKnowledgePack,
} from "@/lib/learning/knowledge/instructional-library";
import {
  lessonFromInstructionalPack,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import {
  KNOWLEDGE_LEARNING_PATHS,
  matchKnowledgeLearningPath,
  type KnowledgeLearningPath,
} from "@/lib/learning/knowledge/learning-paths";
import type {
  KnowledgeGroundingContext,
  KnowledgeSource,
  KnowledgeSourceKind,
  RetrievalConfidence,
  RetrievedExternalSnippet,
  TeachingGroundingReference,
} from "@/lib/learning/knowledge/retrieval/types";
import { applyPersonalizationToLibraryLesson } from "@/lib/learning/personalized-teaching/apply-deterministic";
import type { PersonalizedTeachingContext } from "@/lib/learning/personalized-teaching/types";
import { enrichLessonForStudio } from "@/lib/learning/studio/enrich-lesson";
import type { TeachScope } from "@/lib/learning/teach/scope";
import {
  assembleTeachingKnowledge,
  orderedConceptsFromAssembly,
  type AssembledTeachingSlice,
} from "@/lib/learning/knowledge/assemble-teaching-knowledge";

export type TeachingKnowledgeConcept = InstructionalConceptKnowledge;
export type { KnowledgeLearningPath };
export { KNOWLEDGE_LEARNING_PATHS, matchKnowledgeLearningPath };
export type { AssembledTeachingSlice };

/**
 * Intermediate teaching input built from Library knowledge
 * (or Phase 7/8 Universal Knowledge Retrieval).
 * Knowledge → TeachingKnowledgeContext → Teaching Engine → Lesson.
 */
export type TeachingKnowledgeContext = {
  target: string;
  domain: InstructionalDomain;
  subject: string | null;
  pack: InstructionalKnowledgePack | null;
  concepts: InstructionalConceptKnowledge[];
  primaryConcept: InstructionalConceptKnowledge | null;
  /** Phase 7/8 — extended source kinds; KL remains "knowledge-library". */
  source:
    | "knowledge-library"
    | "general-ai"
    | "course-material"
    | "user-note"
    | "retrieved-web"
    | "combined";
  resolution:
    | "single-concept"
    | "pack"
    | "learning-path"
    | "general-retrieval";
  learningPathId?: string;
  /** Phase 7/8 additive metadata — optional for existing KL consumers. */
  knowledgeSourceKind?: KnowledgeSourceKind;
  confidence?: RetrievalConfidence;
  grounding?: TeachingGroundingReference[];
  sources?: KnowledgeSource[];
  groundingContext?: KnowledgeGroundingContext;
  externalSnippets?: RetrievedExternalSnippet[];
  limitations?: string[];
  sourceSummary?: string;
  /**
   * Phase B — layered assembly from Knowledge Library (exact → prereqs →
   * relationships → teaching resources). Optional; absent for general-only paths.
   */
  assembled?: AssembledTeachingSlice;
};

export type ResolveTeachingKnowledgeOptions = {
  scope?: TeachScope;
  activity?: string | null;
  struggling?: boolean;
};

/**
 * Resolve Library knowledge into a teaching context for the Teaching Engine.
 * Returns null when the library has no legitimate knowledge for the target.
 */
export function resolveTeachingKnowledgeContext(
  target: string,
  options?: ResolveTeachingKnowledgeOptions,
): TeachingKnowledgeContext | null {
  const clean = target.trim();
  if (!clean) return null;

  const path = matchKnowledgeLearningPath(clean);
  const resolved = resolveInstructionalKnowledge(clean);
  if (!resolved) return null;

  const assembled = assembleTeachingKnowledge({
    target: clean,
    scope: options?.scope,
    activity: options?.activity,
    struggling: options?.struggling,
  });

  const expandConcepts =
    options?.scope === "concept-family" ||
    options?.scope === "broad-subject" ||
    options?.scope === "course-section";

  const assembledConcepts =
    expandConcepts && assembled
      ? orderedConceptsFromAssembly(assembled)
      : null;

  if (path && resolved.pack.id === path.packId) {
    const pathConcepts = path.conceptIds
      .map((id) => resolved.pack.concepts.find((c) => c.id === id))
      .filter((c): c is InstructionalConceptKnowledge => Boolean(c));
    return {
      target: clean,
      domain: resolved.domain,
      subject: resolved.subject,
      pack: resolved.pack,
      concepts: pathConcepts.length > 0 ? pathConcepts : resolved.pack.concepts,
      primaryConcept:
        assembled?.targetConcept ?? pathConcepts[0] ?? resolved.pack.concepts[0] ?? null,
      source: "knowledge-library",
      resolution: "learning-path",
      learningPathId: path.id,
      assembled: assembled ?? undefined,
    };
  }

  if (resolved.source === "concept" && resolved.matchedConcept) {
    return {
      target: clean,
      domain: resolved.domain,
      subject: resolved.subject,
      pack: resolved.pack,
      concepts:
        assembledConcepts && assembledConcepts.length > 1
          ? assembledConcepts
          : [resolved.matchedConcept],
      primaryConcept: assembled?.targetConcept ?? resolved.matchedConcept,
      source: "knowledge-library",
      resolution: "single-concept",
      assembled: assembled ?? undefined,
    };
  }

  return {
    target: clean,
    domain: resolved.domain,
    subject: resolved.subject,
    pack: resolved.pack,
    concepts:
      assembledConcepts && assembledConcepts.length > 1
        ? assembledConcepts
        : resolved.pack.concepts,
    primaryConcept:
      assembled?.targetConcept ??
      resolved.matchedConcept ??
      resolved.pack.concepts[0] ??
      null,
    source: "knowledge-library",
    resolution: "pack",
    assembled: assembled ?? undefined,
  };
}

/**
 * Format Library / retrieval knowledge for the AI Teaching Engine prompt.
 * Phase 8 — source-aware sections; never claims unsupported citations.
 */
export function formatKnowledgeLibraryPromptBlock(
  ctx: TeachingKnowledgeContext,
): string {
  const isCanonical = ctx.source === "knowledge-library";
  const lines: string[] = [
    isCanonical
      ? "## KNOWLEDGE LIBRARY CONTEXT"
      : "## TEACHING KNOWLEDGE (SOURCE-AWARE)",
    isCanonical
      ? "Authoritative instructional knowledge from Study Haul's Knowledge Library."
      : "Instructional knowledge for this request. Respect provenance sections below. Do NOT invent URLs, authors, publications, or claim web research unless RETRIEVED EXTERNAL SOURCES lists them.",
    `Primary source kind: ${ctx.knowledgeSourceKind ?? ctx.source}`,
    ctx.confidence ? `Confidence: ${ctx.confidence}` : "",
    `Domain: ${ctx.domain}`,
    `Subject: ${ctx.subject ?? "n/a"}`,
    `Resolution: ${ctx.resolution}${ctx.learningPathId ? ` (${ctx.learningPathId})` : ""}`,
    ctx.sourceSummary ? `Summary: ${ctx.sourceSummary}` : "",
    ctx.limitations?.length
      ? `Limitations: ${ctx.limitations.slice(0, 4).join("; ")}`
      : "",
    "",
  ].filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""));

  const gc = ctx.groundingContext;
  if (gc?.canonical) {
    lines.push("### CANONICAL (Knowledge Library)");
    lines.push(
      `- ${gc.canonical.title ?? "Knowledge Library concept"} [${gc.canonical.kind}]`,
    );
    lines.push("");
  }

  if (gc?.courseMaterials?.length || ctx.grounding?.some((g) => g.kind !== "user-note")) {
    lines.push("### COURSE / USER MATERIAL GROUNDING");
    lines.push(
      "Optional grounding only — do not treat as Knowledge Library authority.",
    );
    for (const s of gc?.courseMaterials?.slice(0, 3) ?? []) {
      lines.push(
        `- ${s.title ?? "Course material"}${s.excerpt ? `: ${s.excerpt.slice(0, 180)}` : ""}`,
      );
    }
    if (!gc?.courseMaterials?.length) {
      for (const g of (ctx.grounding ?? [])
        .filter((x) => x.kind !== "user-note")
        .slice(0, 2)) {
        lines.push(
          `- ${g.label}${g.excerpt ? `: ${g.excerpt.slice(0, 180)}` : ""}`,
        );
      }
    }
    lines.push("");
  }

  if (gc?.userNotes?.length || ctx.grounding?.some((g) => g.kind === "user-note")) {
    lines.push("### USER NOTES GROUNDING");
    lines.push("Learner notes — not canonical Knowledge Library.");
    for (const s of gc?.userNotes?.slice(0, 2) ?? []) {
      lines.push(
        `- ${s.title ?? "Notes"}${s.excerpt ? `: ${s.excerpt.slice(0, 180)}` : ""}`,
      );
    }
    for (const g of (ctx.grounding ?? [])
      .filter((x) => x.kind === "user-note")
      .slice(0, 2)) {
      if (gc?.userNotes?.length) break;
      lines.push(
        `- ${g.label}${g.excerpt ? `: ${g.excerpt.slice(0, 180)}` : ""}`,
      );
    }
    lines.push("");
  }

  if (gc?.retrievedExternal?.length || ctx.externalSnippets?.length) {
    lines.push("### RETRIEVED EXTERNAL SOURCES");
    lines.push(
      "Only these external references are real. Do not invent additional citations.",
    );
    for (const s of gc?.retrievedExternal?.slice(0, 5) ?? []) {
      lines.push(
        `- ${s.title ?? "External source"}${s.reference ? ` (${s.reference})` : " (no reference URL provided)"}`,
      );
    }
    for (const snip of (ctx.externalSnippets ?? []).slice(0, 3)) {
      lines.push(
        `Excerpt: ${snip.content.slice(0, 240)}${snip.content.length > 240 ? "…" : ""}`,
      );
    }
    lines.push("");
  } else if (!isCanonical) {
    lines.push("### RETRIEVED EXTERNAL SOURCES");
    lines.push("None. Do not claim web research or invent citations.");
    lines.push("");
  }

  if (gc?.generatedExplanation || ctx.source === "general-ai" || ctx.source === "combined") {
    lines.push("### GENERAL AI EXPLANATION LAYER");
    lines.push(
      "AI may synthesize a learner-friendly explanation. This is NOT a source citation and NOT web retrieval.",
    );
    lines.push("");
  }

  const assembled = ctx.assembled;
  if (assembled) {
    lines.push("### ASSEMBLED TEACHING KNOWLEDGE (LIBRARY LAYERS)");
    lines.push(`Emphasis: ${assembled.emphasis}`);
    lines.push(`Layers: ${assembled.layersUsed.join(" → ")}`);
    lines.push(
      `Target teachable (Library health, not mastery): ${assembled.targetTeachable ? "yes" : "no"}`,
    );
    if (assembled.prerequisites.length) {
      lines.push(
        `Prerequisites: ${assembled.prerequisites.map((c) => c.title).join(" → ")}`,
      );
    }
    if (assembled.relationships.length) {
      lines.push("Relationships:");
      for (const r of assembled.relationships.slice(0, 8)) {
        lines.push(
          `- ${r.kind} → ${r.targetConceptId}${r.reason ? ` (${r.reason})` : ""}`,
        );
      }
    }
    if (assembled.misconceptions.length) {
      lines.push("Misconceptions (structured):");
      for (const m of assembled.misconceptions.slice(0, 3)) {
        lines.push(`- ${m.misconception}`);
        if (m.correction) lines.push(`  Correction: ${m.correction}`);
        if (m.contrast) lines.push(`  Contrast: ${m.contrast}`);
      }
    }
    if (assembled.practiceForms.length) {
      lines.push(`Practice forms: ${assembled.practiceForms.join(", ")}`);
    }
    if (assembled.assessmentForms.length) {
      lines.push(`Assessment forms: ${assembled.assessmentForms.slice(0, 6).join(", ")}`);
    }
    if (assembled.curriculumMappings.length) {
      lines.push(
        `Curriculum mappings: ${assembled.curriculumMappings.map((m) => m.label).join("; ")}`,
      );
    }
    lines.push("");
  }

  for (const concept of ctx.concepts.slice(0, 8)) {
    lines.push(`### ${concept.title} (${concept.id})`);
    if (concept.definition) lines.push(`Definition: ${concept.definition}`);
    lines.push(`Explanation: ${concept.explanation}`);
    const examples = [
      concept.example,
      ...(concept.examples ?? []),
      ...(concept.workedExamples ?? []),
    ].filter(Boolean);
    if (examples.length) {
      lines.push("Examples:");
      for (const ex of examples.slice(0, 3)) lines.push(`- ${ex}`);
    }
    const nons = [concept.nonExample, ...(concept.nonExamples ?? [])].filter(
      Boolean,
    );
    if (nons.length) {
      lines.push("Non-examples:");
      for (const n of nons.slice(0, 2)) lines.push(`- ${n}`);
    }
    const miss = [
      concept.misconception,
      ...(concept.misconceptions ?? []),
    ].filter(Boolean);
    if (miss.length) {
      lines.push("Misconceptions:");
      for (const m of miss.slice(0, 2)) lines.push(`- ${m}`);
    }
    if (concept.vocabulary?.length) {
      lines.push(`Vocabulary: ${concept.vocabulary.slice(0, 8).join(", ")}`);
    }
    if (concept.prerequisites?.length) {
      lines.push(`Prerequisites: ${concept.prerequisites.join(", ")}`);
    }
    if (concept.masteryCriteria?.length) {
      lines.push(
        `Mastery criteria: ${concept.masteryCriteria.slice(0, 3).join("; ")}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Deterministic Teaching Engine adapter: context → SixWorkedLesson.
 * Optional personalization adjusts presentation only (Phase 4B).
 */
export function lessonFromTeachingKnowledgeContext(
  component: SixComponent,
  topic: string,
  ctx: TeachingKnowledgeContext,
  personalized?: PersonalizedTeachingContext | null,
  options?: {
    reteachEmphasis?: boolean;
    /** Full path titles when lesson is focused on one concept (Bundle G). */
    pathTitles?: string[];
    pathIndex?: number;
    teachScope?: TeachScope;
  },
): SixWorkedLesson {
  let lesson: SixWorkedLesson;
  if (!ctx.pack) {
    const shell: InstructionalKnowledgePack = {
      id: "ephemeral-teaching-context",
      match: [],
      domain: ctx.domain,
      subject: ctx.subject ?? undefined,
      displayTitle: topic,
      learningFrame: `You're learning ${topic}.`,
      cheatSheet: ctx.concepts.map((c) => c.title).join(" → "),
      concepts: ctx.concepts,
    };
    lesson = lessonFromInstructionalPack(component, topic, shell);
  } else if (
    ctx.resolution === "pack" &&
    ctx.concepts.length === ctx.pack.concepts.length
  ) {
    lesson = lessonFromInstructionalPack(component, topic, ctx.pack);
  } else {
    const shell: InstructionalKnowledgePack = {
      ...ctx.pack,
      concepts: ctx.concepts,
      learningFrame:
        ctx.resolution === "learning-path"
          ? `You're learning ${topic} through ${ctx.concepts.map((c) => c.title).join(" → ")}.`
          : ctx.pack.learningFrame,
      cheatSheet: ctx.concepts.map((c) => c.title).join(" → "),
    };
    lesson = lessonFromInstructionalPack(component, topic, shell);
  }

  const personalizedLesson = applyPersonalizationToLibraryLesson(
    lesson,
    personalized,
    { reteachEmphasis: options?.reteachEmphasis },
  );

  // Bundle G — deepen thin focused lessons + transfer prompts + relationship visual.
  // Scope comes from the Teach pipeline when provided; otherwise infer from concept count.
  const scope: TeachScope =
    options?.teachScope ??
    (ctx.concepts.length >= 3
      ? "concept-family"
      : ctx.concepts.length === 1
        ? "focused-concept"
        : "concept-family");
  const pathTitles =
    options?.pathTitles ??
    (ctx.concepts.length > 1
      ? ctx.concepts.map((c) => c.title)
      : undefined);
  const focusConcept =
    ctx.concepts.length >= 1 ? ctx.concepts[0]! : null;

  return enrichLessonForStudio({
    lesson: personalizedLesson,
    scope,
    focusConcept,
    pathTitles,
    pathIndex: options?.pathIndex ?? 0,
    domain: ctx.domain,
    deepenIfThin: true,
  });
}
