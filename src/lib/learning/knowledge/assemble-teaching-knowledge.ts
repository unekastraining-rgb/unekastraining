/**
 * Layered Knowledge Library retrieval assembly (architecture Phase B).
 *
 * Builds teaching knowledge from canonical concepts:
 * exact → structure → prerequisites → relationships → teaching resources
 * → curriculum stubs → (caller adds personal/external/general).
 *
 * Does not invent concept IDs. Does not replace Universal Retrieval providers.
 */

import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";
import {
  findInstructionalConceptById,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import type {
  CurriculumMappingStub,
  InstructionalMisconception,
  InstructionalRelationship,
} from "@/lib/learning/knowledge/concept-profile";
import { isConceptTeachable } from "@/lib/learning/knowledge/coverage";
import type { TeachScope } from "@/lib/learning/teach/scope";

export type AssembledTeachingSlice = {
  /** Layer 1 — exact / primary concept */
  targetConcept: InstructionalConceptKnowledge | null;
  /** Layer 2 — structure */
  subconcepts: InstructionalConceptKnowledge[];
  vocabulary: string[];
  breakdown?: string;
  representation?: string;
  /** Layer 3 — prerequisites */
  prerequisites: InstructionalConceptKnowledge[];
  /** Layer 4 — relationships */
  relationships: InstructionalRelationship[];
  relatedConcepts: InstructionalConceptKnowledge[];
  /** Layer 5 — teaching resources */
  definitions: string[];
  explanations: string[];
  examples: string[];
  nonExamples: string[];
  misconceptions: InstructionalMisconception[];
  visualModels: string[];
  procedures: string[];
  scenarios: string[];
  applications: string[];
  transferPrompts: string[];
  workedExamples: string[];
  practiceForms: string[];
  assessmentForms: string[];
  /** Layer 6 — curriculum stubs */
  curriculumMappings: CurriculumMappingStub[];
  /** Emphasis driven by activity / scope (not a second router) */
  emphasis: AssembledEmphasis;
  /** Honest Library health for the primary concept */
  targetTeachable: boolean;
  layersUsed: AssembledLayer[];
};

export type AssembledLayer =
  | "exact"
  | "structure"
  | "prerequisites"
  | "relationships"
  | "teaching-resources"
  | "curriculum";

export type AssembledEmphasis =
  | "overview"
  | "explanation"
  | "practice"
  | "misconception-repair"
  | "assessment"
  | "prerequisites-first";

export type AssembleTeachingKnowledgeInput = {
  target: string;
  scope?: TeachScope;
  activity?: string | null;
  /** Soft signal from "I don't understand …" style requests */
  struggling?: boolean;
  maxRelated?: number;
  maxPrerequisites?: number;
};

function resolveConcept(
  target: string,
): InstructionalConceptKnowledge | null {
  const resolved = resolveInstructionalKnowledge(target);
  if (!resolved) return null;
  if (resolved.matchedConcept) return resolved.matchedConcept;
  // Pack-level match: prefer first concept only when target clearly names pack path
  return resolved.pack.concepts[0] ?? null;
}

function lookupMany(ids: string[]): InstructionalConceptKnowledge[] {
  const out: InstructionalConceptKnowledge[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    const hit = findInstructionalConceptById(id);
    if (!hit) continue;
    seen.add(id);
    out.push(hit.concept);
  }
  return out;
}

function collectPrerequisiteIds(
  concept: InstructionalConceptKnowledge,
): string[] {
  const fromField = concept.prerequisites ?? [];
  const fromRels = (concept.relationships ?? [])
    .filter((r) => r.kind === "prerequisite" || r.kind === "depends_on")
    .map((r) => r.targetConceptId);
  return [...new Set([...fromField, ...fromRels])];
}

function collectRelatedIds(concept: InstructionalConceptKnowledge): string[] {
  const fromField = [
    ...(concept.relatedConcepts ?? []),
    ...(concept.related ?? []),
    ...(concept.childConceptIds ?? []),
  ];
  const fromRels = (concept.relationships ?? [])
    .filter(
      (r) =>
        r.kind === "related_to" ||
        r.kind === "leads_to" ||
        r.kind === "used_with" ||
        r.kind === "contains" ||
        r.kind === "part_of" ||
        r.kind === "commonly_confused_with" ||
        r.kind === "contrasts_with",
    )
    .map((r) => r.targetConceptId);
  return [...new Set([...fromField, ...fromRels])];
}

function normalizeMisconceptions(
  concept: InstructionalConceptKnowledge,
): InstructionalMisconception[] {
  if (concept.misconceptionDetails?.length) {
    return concept.misconceptionDetails;
  }
  const strings = [
    ...(concept.misconception ? [concept.misconception] : []),
    ...(concept.misconceptions ?? []),
  ];
  return strings.filter(Boolean).map((misconception) => ({ misconception }));
}

export function deriveAssembledEmphasis(input: {
  activity?: string | null;
  scope?: TeachScope;
  struggling?: boolean;
}): AssembledEmphasis {
  const activity = (input.activity ?? "").toLowerCase();
  if (input.struggling || /don'?t understand|confused|stuck/.test(activity)) {
    return "misconception-repair";
  }
  if (activity === "practice" || activity === "apply") return "practice";
  if (activity === "recall" || activity === "check" || activity === "assess") {
    return "assessment";
  }
  if (activity === "reteach") return "prerequisites-first";
  if (input.scope === "broad-subject" || input.scope === "concept-family") {
    return "overview";
  }
  if (activity === "explain" || activity === "teach" || !activity) {
    return "explanation";
  }
  return "explanation";
}

/**
 * Assemble layered teaching knowledge for a target from the Knowledge Library.
 * Returns null when there is no canonical match (caller should use general/retrieval).
 */
export function assembleTeachingKnowledge(
  input: AssembleTeachingKnowledgeInput,
): AssembledTeachingSlice | null {
  const targetConcept = resolveConcept(input.target);
  if (!targetConcept) return null;

  const emphasis = deriveAssembledEmphasis(input);
  const maxRelated = input.maxRelated ?? 8;
  const maxPrereq = input.maxPrerequisites ?? 6;

  const layersUsed: AssembledLayer[] = ["exact"];

  const childIds = targetConcept.childConceptIds ?? [];
  const subconcepts = lookupMany(childIds);
  const vocabulary = [...(targetConcept.vocabulary ?? [])];
  if (
    subconcepts.length > 0 ||
    vocabulary.length > 0 ||
    targetConcept.breakdown ||
    targetConcept.representation
  ) {
    layersUsed.push("structure");
  }

  let prereqIds = collectPrerequisiteIds(targetConcept);
  if (emphasis === "prerequisites-first" || emphasis === "misconception-repair") {
    // Prefer prerequisites early for repair / reteach
    prereqIds = [...prereqIds];
  }
  const prerequisites = lookupMany(prereqIds).slice(0, maxPrereq);
  if (prerequisites.length > 0) layersUsed.push("prerequisites");

  const relationships = [...(targetConcept.relationships ?? [])];
  const relatedConcepts = lookupMany(collectRelatedIds(targetConcept))
    .filter((c) => c.id !== targetConcept.id)
    .slice(0, maxRelated);
  if (relationships.length > 0 || relatedConcepts.length > 0) {
    layersUsed.push("relationships");
  }

  const examples = [
    ...(targetConcept.example ? [targetConcept.example] : []),
    ...(targetConcept.examples ?? []),
  ];
  const nonExamples = [
    ...(targetConcept.nonExample ? [targetConcept.nonExample] : []),
    ...(targetConcept.nonExamples ?? []),
  ];
  const misconceptions = normalizeMisconceptions(targetConcept);
  const visualModels = [
    ...(targetConcept.representation ? [targetConcept.representation] : []),
    ...(targetConcept.visualModels ?? []),
  ];
  const procedures = [...(targetConcept.procedures ?? [])];
  const scenarios = [...(targetConcept.scenarios ?? [])];
  const applications = [
    ...(targetConcept.purpose ? [targetConcept.purpose] : []),
    ...(targetConcept.applications ?? []),
  ];
  const transferPrompts = [...(targetConcept.transferPrompts ?? [])];
  const workedExamples = [...(targetConcept.workedExamples ?? [])];
  const practiceForms = [...(targetConcept.practiceForms ?? [])];
  const assessmentForms = [
    ...(targetConcept.assessmentForms ?? []),
    ...(targetConcept.checkPrompt ? [targetConcept.checkPrompt] : []),
  ];

  layersUsed.push("teaching-resources");

  const curriculumMappings = [...(targetConcept.curriculumMappings ?? [])];
  if (curriculumMappings.length > 0) layersUsed.push("curriculum");

  // Scope: for broad/family, fold related into subconcepts view when children empty
  let scopedSub = subconcepts;
  if (
    scopedSub.length === 0 &&
    (input.scope === "concept-family" || input.scope === "broad-subject")
  ) {
    scopedSub = relatedConcepts.slice(0, maxRelated);
  }

  return {
    targetConcept,
    subconcepts: scopedSub,
    vocabulary,
    breakdown: targetConcept.breakdown,
    representation: targetConcept.representation,
    prerequisites,
    relationships,
    relatedConcepts,
    definitions: [
      ...(targetConcept.definition ? [targetConcept.definition] : []),
    ],
    explanations: [targetConcept.explanation],
    examples,
    nonExamples,
    misconceptions,
    visualModels,
    procedures,
    scenarios,
    applications,
    transferPrompts,
    workedExamples,
    practiceForms,
    assessmentForms,
    curriculumMappings,
    emphasis,
    targetTeachable: isConceptTeachable(targetConcept),
    layersUsed,
  };
}

/** Ordered concept list for teaching path: prereqs → target → related children. */
export function orderedConceptsFromAssembly(
  assembly: AssembledTeachingSlice,
): InstructionalConceptKnowledge[] {
  const out: InstructionalConceptKnowledge[] = [];
  const seen = new Set<string>();
  const push = (c: InstructionalConceptKnowledge | null | undefined) => {
    if (!c || seen.has(c.id)) return;
    seen.add(c.id);
    out.push(c);
  };
  if (
    assembly.emphasis === "prerequisites-first" ||
    assembly.emphasis === "misconception-repair"
  ) {
    for (const p of assembly.prerequisites) push(p);
  }
  push(assembly.targetConcept);
  for (const s of assembly.subconcepts) push(s);
  if (assembly.emphasis === "overview") {
    for (const r of assembly.relatedConcepts) push(r);
  }
  if (
    assembly.emphasis !== "prerequisites-first" &&
    assembly.emphasis !== "misconception-repair"
  ) {
    for (const p of assembly.prerequisites) push(p);
  }
  return out;
}
