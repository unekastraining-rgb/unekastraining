/**
 * Teaching Quality Trace — diagnostic/test-only pipeline walk.
 * Does NOT expose diagnostics to learners.
 * Does NOT create a second orchestrator or retrieval system.
 */

import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import { buildSubjectAwareFallbackLesson } from "@/lib/csl/six-worked-lesson";
import {
  findInstructionalConceptById,
} from "@/lib/learning/knowledge/instructional-library";
import { understandLearningTarget } from "@/lib/learning/knowledge/retrieval/learning-target";
import {
  formatKnowledgeLibraryPromptBlock,
  lessonFromTeachingKnowledgeContext,
  resolveTeachingKnowledgeContext,
  type TeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import type {
  KnowledgeOrchestratorDecision,
} from "@/lib/learning/orchestrator/knowledge-loop/types";
import {
  createLearnerStateService,
} from "@/lib/learning/learner-state/service";
import { createMemoryLearnerStateStore } from "@/lib/learning/learner-state/store";
import type { LearningEvidence } from "@/lib/learning/learner-state/types";
import {
  buildInstructionalMoments,
  studioStageFromChunk,
} from "@/lib/learning/studio/moments";
import type { LearningStudioStage } from "@/lib/learning/studio/types";
import { detectTeachScope, type TeachScope } from "@/lib/learning/teach/scope";

export type TeachingQualityLayerFlags = {
  definition: boolean;
  plainExplanation: boolean;
  structure: boolean;
  prerequisites: boolean;
  relationships: boolean;
  examples: boolean;
  misconceptions: boolean;
  application: boolean;
  practice: boolean;
  assessment: boolean;
  curriculum: boolean;
};

export type TeachingQualityTrace = {
  request: string;
  learningTarget: {
    topic: string;
    activity: string;
    scope?: string;
    resolution: string;
  };
  teachScope: TeachScope | null;
  conceptIds: string[];
  conceptTitles: string[];
  knowledgeSource: TeachingKnowledgeContext["source"] | "none";
  knowledgeSourceKind?: string;
  resolution: TeachingKnowledgeContext["resolution"] | "none";
  learningPathId?: string;
  assembled: {
    exactConceptIds: string[];
    prerequisiteIds: string[];
    relationshipTargetIds: string[];
    misconceptionCount: number;
    exampleCount: number;
    practiceFormCount: number;
    transferPromptCount: number;
    curriculumMappingCount: number;
  } | null;
  layersInContext: TeachingQualityLayerFlags;
  layersInLesson: TeachingQualityLayerFlags;
  layersInStudio: TeachingQualityLayerFlags;
  promptBlockContainsLibrary: boolean;
  promptBlockIsHonestAboutSource: boolean;
  lesson: SixWorkedLesson | null;
  studioStages: LearningStudioStage[];
  studioMomentCount: number;
  lessonBlob: string;
  orchestrator?: {
    afterIncorrect: KnowledgeOrchestratorDecision["action"];
    afterReady: KnowledgeOrchestratorDecision["action"];
    reteachDiffers: boolean;
  };
  evidenceRecorded: boolean;
  nextConceptId?: string | null;
  limitations: string[];
};

function flagsFromConceptFields(
  conceptIds: string[],
): TeachingQualityLayerFlags {
  const flags: TeachingQualityLayerFlags = {
    definition: false,
    plainExplanation: false,
    structure: false,
    prerequisites: false,
    relationships: false,
    examples: false,
    misconceptions: false,
    application: false,
    practice: false,
    assessment: false,
    curriculum: false,
  };
  for (const id of conceptIds) {
    const hit = findInstructionalConceptById(id);
    if (!hit) continue;
    const c = hit.concept;
    if (c.definition?.trim()) flags.definition = true;
    if (c.explanation?.trim()) flags.plainExplanation = true;
    if (c.breakdown || c.vocabulary?.length || c.representation) {
      flags.structure = true;
    }
    if (c.prerequisites?.length) flags.prerequisites = true;
    if (c.relationships?.length || c.relatedConcepts?.length) {
      flags.relationships = true;
    }
    if (c.example || c.examples?.length || c.workedExamples?.length) {
      flags.examples = true;
    }
    if (
      c.misconception ||
      c.misconceptions?.length ||
      c.misconceptionDetails?.length
    ) {
      flags.misconceptions = true;
    }
    if (c.applications?.length || c.transferPrompts?.length) {
      flags.application = true;
    }
    if (c.practiceForms?.length) flags.practice = true;
    if (c.assessmentForms?.length || c.checkPrompt) flags.assessment = true;
    if (c.curriculumMappings?.length) flags.curriculum = true;
  }
  return flags;
}

function flagsFromLessonBlob(
  blob: string,
  conceptIds: string[],
): TeachingQualityLayerFlags {
  const lower = blob.toLowerCase();
  const ctxFlags = flagsFromConceptFields(conceptIds);
  // Lesson must actually contain signal, not just context having the field.
  const hasDefinition = conceptIds.some((id) => {
    const d = findInstructionalConceptById(id)?.concept.definition;
    return d && blob.includes(d.slice(0, Math.min(40, d.length)));
  });
  const hasMisconception = conceptIds.some((id) => {
    const c = findInstructionalConceptById(id)?.concept;
    const m =
      c?.misconceptionDetails?.[0]?.misconception ??
      c?.misconception ??
      c?.misconceptions?.[0];
    return m && blob.toLowerCase().includes(m.slice(0, 24).toLowerCase());
  });
  const hasExample = conceptIds.some((id) => {
    const c = findInstructionalConceptById(id)?.concept;
    const ex = c?.example ?? c?.examples?.[0];
    return ex && blob.includes(ex.slice(0, Math.min(30, ex.length)));
  });

  return {
    definition: Boolean(hasDefinition) || (ctxFlags.definition && /definition|is a |means /i.test(blob)),
    plainExplanation: blob.length > 120,
    structure: /break|component|part|vocabulary|key terms/i.test(lower),
    prerequisites: /prerequisite|depends|before|leads/i.test(lower),
    relationships: /→|connect|related|prerequisite|leads/i.test(lower),
    examples: Boolean(hasExample) || /example/i.test(lower),
    misconceptions:
      Boolean(hasMisconception) || /misconception|watch for|common mistake|contrast/i.test(lower),
    application: /apply|transfer|use /i.test(lower),
    practice: /practice|recognize|check|apply/i.test(lower),
    assessment: /check|explain|prompt|assess/i.test(lower),
    curriculum: ctxFlags.curriculum && /curriculum|unit|chapter/i.test(lower)
      ? true
      : ctxFlags.curriculum,
  };
}

function flagsFromStudio(
  lesson: SixWorkedLesson | null,
  conceptIds: string[],
): TeachingQualityLayerFlags {
  if (!lesson) {
    return {
      definition: false,
      plainExplanation: false,
      structure: false,
      prerequisites: false,
      relationships: false,
      examples: false,
      misconceptions: false,
      application: false,
      practice: false,
      assessment: false,
      curriculum: false,
    };
  }
  const blob = [
    ...lesson.chunks.map(
      (c) =>
        `${c.title} ${c.explanation} ${c.example ?? ""} ${c.misconception ?? ""} ${c.breakdown ?? ""} ${c.representation ?? ""} ${c.checkPrompt ?? ""}`,
    ),
    ...lesson.practicePrompts.map((p) => `${p.title} ${p.prompt}`),
  ].join("\n");
  const base = flagsFromLessonBlob(blob, conceptIds);
  const roles = new Set(lesson.chunks.map((c) => c.role));
  return {
    ...base,
    structure: base.structure || roles.has("breakdown"),
    relationships: base.relationships || roles.has("visualize"),
    misconceptions: base.misconceptions || roles.has("clarify"),
    application: base.application || roles.has("apply"),
    assessment: base.assessment || roles.has("check"),
    practice: base.practice || lesson.practicePrompts.length > 0,
  };
}

/**
 * Walk Request → Target → Scope → Retrieval → Teaching → Studio → Evidence → Orchestrator.
 * Deterministic KL path (no live AI). Diagnostic only.
 */
export async function runTeachingQualityTrace(
  request: string,
  options?: { userId?: string },
): Promise<TeachingQualityTrace> {
  const limitations: string[] = [];
  const understood = understandLearningTarget(request);
  if (!understood) {
    return {
      request,
      learningTarget: {
        topic: "",
        activity: "teach",
        resolution: "unresolved",
      },
      teachScope: null,
      conceptIds: [],
      conceptTitles: [],
      knowledgeSource: "none",
      resolution: "none",
      assembled: null,
      layersInContext: flagsFromConceptFields([]),
      layersInLesson: flagsFromConceptFields([]),
      layersInStudio: flagsFromConceptFields([]),
      promptBlockContainsLibrary: false,
      promptBlockIsHonestAboutSource: true,
      lesson: null,
      studioStages: [],
      studioMomentCount: 0,
      lessonBlob: "",
      evidenceRecorded: false,
      limitations: ["Could not understand learning target from request"],
    };
  }
  const teachScope = detectTeachScope(understood);

  const ctx = resolveTeachingKnowledgeContext(understood.topic, {
    scope: teachScope,
    activity: understood.activity,
  });

  let conceptIds: string[] = [];
  if (ctx) {
    conceptIds = ctx.concepts.map((c) => c.id);
    if (conceptIds.length === 0 && ctx.primaryConcept) {
      conceptIds = [ctx.primaryConcept.id];
    }
  } else {
    limitations.push("No Knowledge Library teaching context for target");
  }

  const assembled = ctx?.assembled
    ? {
        exactConceptIds: [
          ...(ctx.assembled.targetConcept
            ? [ctx.assembled.targetConcept.id]
            : []),
          ...ctx.assembled.subconcepts.map((c) => c.id),
        ],
        prerequisiteIds: ctx.assembled.prerequisites.map((c) => c.id),
        relationshipTargetIds: ctx.assembled.relationships.map(
          (r) => r.targetConceptId,
        ),
        misconceptionCount: ctx.assembled.misconceptions.length,
        exampleCount: ctx.assembled.examples.length,
        practiceFormCount: ctx.assembled.practiceForms.length,
        transferPromptCount: ctx.assembled.transferPrompts.length,
        curriculumMappingCount: ctx.assembled.curriculumMappings.length,
      }
    : null;

  const layersInContext = flagsFromConceptFields(conceptIds);

  let lesson: SixWorkedLesson | null = null;
  if (ctx) {
    lesson = lessonFromTeachingKnowledgeContext(
      "detailed-explanation",
      understood.topic,
      ctx,
      null,
      { teachScope },
    );
  } else {
    lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      understood.topic,
    );
  }

  const lessonBlob = lesson
    ? [
        ...lesson.chunks.map(
          (c) =>
            `${c.title}\n${c.explanation}\n${c.example ?? ""}\n${c.misconception ?? ""}\n${c.breakdown ?? ""}\n${c.representation ?? ""}\n${c.checkPrompt ?? ""}`,
        ),
        ...lesson.practicePrompts.map((p) => `${p.title}: ${p.prompt}`),
        lesson.learningFrame,
        lesson.cheatSheet,
      ].join("\n")
    : "";

  const layersInLesson = flagsFromLessonBlob(lessonBlob, conceptIds);
  const layersInStudio = flagsFromStudio(lesson, conceptIds);

  const promptBlock = ctx ? formatKnowledgeLibraryPromptBlock(ctx) : "";
  const promptBlockContainsLibrary = /KNOWLEDGE LIBRARY CONTEXT/i.test(
    promptBlock,
  );
  const promptBlockIsHonestAboutSource =
    !ctx ||
    ctx.source === "knowledge-library" ||
    /SOURCE-AWARE|general-ai|Primary source kind/i.test(promptBlock);

  const moments = lesson
    ? buildInstructionalMoments({
        lesson,
        conceptTitle: ctx?.primaryConcept?.title ?? understood.topic,
        topic: understood.topic,
        neighborTitles: ctx?.concepts.map((c) => c.title),
      })
    : [];
  const studioStages = lesson
    ? lesson.chunks.map((c) => studioStageFromChunk(c))
    : [];

  // Evidence + orchestrator loop (in-memory, not production DB)
  const userId = options?.userId ?? `tq-trace-${Date.now()}`;
  const store = createMemoryLearnerStateStore();
  const service = createLearnerStateService(store);
  let evidenceRecorded = false;
  let afterIncorrect: KnowledgeOrchestratorDecision["action"] = "complete";
  let afterReady: KnowledgeOrchestratorDecision["action"] = "complete";
  let reteachDiffers = false;
  let nextConceptId: string | null | undefined;

  const focusId = conceptIds[0] ?? null;
  if (focusId && ctx?.source === "knowledge-library") {
    const pathIds =
      conceptIds.length > 1
        ? conceptIds
        : assembled?.exactConceptIds?.length
          ? assembled.exactConceptIds
          : conceptIds;

    // Expand context concepts to path when only one was focused
    const pathCtx: TeachingKnowledgeContext = {
      ...ctx,
      concepts:
        pathIds
          .map((id) => findInstructionalConceptById(id)?.concept)
          .filter((c): c is NonNullable<typeof c> => Boolean(c)).length > 0
          ? pathIds
              .map((id) => findInstructionalConceptById(id)?.concept)
              .filter((c): c is NonNullable<typeof c> => Boolean(c))
          : ctx.concepts,
    };

    await service.recordLearningEvidence({
      userId,
      type: "lesson_exposure",
      conceptId: focusId,
      outcome: "completed",
      source: "teaching-quality-trace",
      eventKey: `${userId}:exposure:${focusId}`,
    });
    evidenceRecorded = true;

    await service.recordLearningEvidence({
      userId,
      type: "check_attempt",
      conceptId: focusId,
      outcome: "incorrect",
      source: "teaching-quality-trace",
      eventKey: `${userId}:incorrect:${focusId}`,
    });

    const evidence = await service.listEvidence(userId);
    const state = await service.getLearnerConceptState(userId, focusId);
    const statesMap = new Map<string, typeof state>(
      pathIds.map((id) => [id, id === focusId ? state : null]),
    );
    const incorrectDecision = decideKnowledgeLoop({
      target: understood.topic,
      knowledge: pathCtx,
      evidence,
      statesByConceptId: statesMap,
    });
    afterIncorrect = incorrectDecision.action;

    const reteachLesson = lessonFromTeachingKnowledgeContext(
      "detailed-explanation",
      understood.topic,
      {
        ...ctx,
        concepts: [ctx.primaryConcept ?? ctx.concepts[0]!].filter(Boolean),
      },
      null,
      { reteachEmphasis: true, teachScope: "focused-concept" },
    );
    const reteachBlob = reteachLesson.chunks
      .map((c) => `${c.misconception ?? ""} ${c.explanation}`)
      .join("\n");
    reteachDiffers =
      afterIncorrect === "reteach" &&
      (/misconception|watch for|contrast|common|incorrect/i.test(reteachBlob) ||
        reteachLesson.chunks.some((c) => c.role === "clarify"));

    await service.recordLearningEvidence({
      userId,
      type: "check_attempt",
      conceptId: focusId,
      outcome: "correct",
      source: "teaching-quality-trace",
      eventKey: `${userId}:correct:${focusId}`,
    });
    await service.recordLearningEvidence({
      userId,
      type: "practice_attempt",
      conceptId: focusId,
      outcome: "correct",
      source: "teaching-quality-trace",
      eventKey: `${userId}:practice:${focusId}`,
    });
    await service.recordLearningEvidence({
      userId,
      type: "recall_result",
      conceptId: focusId,
      outcome: "correct",
      source: "teaching-quality-trace",
      eventKey: `${userId}:recall:${focusId}`,
    });

    const evidence2 = await service.listEvidence(userId);
    const statesMap2 = new Map<
      string,
      Awaited<ReturnType<typeof service.getLearnerConceptState>>
    >();
    for (const id of pathIds) {
      statesMap2.set(id, await service.getLearnerConceptState(userId, id));
    }
    const readyDecision = decideKnowledgeLoop({
      target: understood.topic,
      knowledge: pathCtx,
      evidence: evidence2,
      statesByConceptId: statesMap2,
    });
    afterReady = readyDecision.action;
    nextConceptId = readyDecision.nextConceptId ?? readyDecision.conceptId;
  } else if (!focusId) {
    limitations.push("No focus concept for evidence/orchestrator loop");
  }

  return {
    request,
    learningTarget: {
      topic: understood.topic,
      activity: understood.activity,
      scope: understood.scope,
      resolution: understood.resolution,
    },
    teachScope,
    conceptIds,
    conceptTitles: conceptIds.map(
      (id) => findInstructionalConceptById(id)?.concept.title ?? id,
    ),
    knowledgeSource: ctx?.source ?? "none",
    knowledgeSourceKind: ctx?.knowledgeSourceKind,
    resolution: ctx?.resolution ?? "none",
    learningPathId: ctx?.learningPathId,
    assembled,
    layersInContext,
    layersInLesson,
    layersInStudio,
    promptBlockContainsLibrary,
    promptBlockIsHonestAboutSource,
    lesson,
    studioStages,
    studioMomentCount: moments.length,
    lessonBlob,
    orchestrator: focusId
      ? { afterIncorrect, afterReady, reteachDiffers }
      : undefined,
    evidenceRecorded,
    nextConceptId,
    limitations,
  };
}

/** Assert a lesson blob is not shallow generic filler for a domain keyword. */
export function looksLikeGenericFiller(blob: string, domainHint: string): boolean {
  const t = blob.toLowerCase().replace(/\s+/g, " ");
  const hint = domainHint.toLowerCase();
  // Extremely short or only restates the topic name
  if (t.length < 80) return true;
  const fillerPatterns = [
    new RegExp(`${hint} is important because`, "i"),
    new RegExp(`${hint} is a topic that`, "i"),
    /this concept is useful in many situations\.?$/i,
  ];
  if (fillerPatterns.some((re) => re.test(t) && t.length < 220)) return true;
  return false;
}
