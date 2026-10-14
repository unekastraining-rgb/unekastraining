import { NextResponse } from "next/server";

import {
  loadChapterStudySourceText,
  loadCourseSourceText,
  loadMaterialSourceText,
} from "@/lib/ai/course-source";
import { completeForUser } from "@/lib/ai/complete-for-user";
import { friendlyUserFacingAiError } from "@/lib/ai/parse-json-response";
import { isSixGuideComponent } from "@/lib/csl/six-guides";
import {
  buildDeterministicSixLesson,
  buildSixLessonSystemPrompt,
  buildSixLessonUserPrompt,
  buildSubjectAwareFallbackLesson,
  isMetaStudySkillOutlineLesson,
  parseSixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";
import { validateAiLesson } from "@/lib/csl/validate-ai-lesson";
import { tutorPersonalizationBlock } from "@/lib/learning/habits/engine";
import { loadLearningHabits } from "@/lib/learning/habits/persistence";
import {
  instructionalSourceForTeaching,
  isPlaceholderScaffoldLesson,
  looksLikeStudyTopicProfileSource,
} from "@/lib/learning/knowledge/instructional-library";
import {
  formatKnowledgeLibraryPromptBlock,
  lessonFromTeachingKnowledgeContext,
  resolveTeachingKnowledgeContext,
  type TeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  learningPathFromTeachingContext,
  loadPersonalGroundingForLearn,
  resolveTeachingKnowledgeForLearn,
  understandLearningTarget,
} from "@/lib/learning/knowledge/retrieval";
import {
  detectTeachScope,
  decomposeTeachConcepts,
  focusTeachingContextForLesson,
  buildTeachingProgressionView,
  teachingDepthBlockFromProgression,
  resolveTeachFocusConceptId,
} from "@/lib/learning/teach";
import {
  buildAdaptiveTeachingEmphasis,
  formatAdaptiveEmphasisPromptBlock,
} from "@/lib/learning/teach/adaptive-emphasis";
import {
  buildReteachVariationPlan,
} from "@/lib/learning/teach/reteach-variation";
import { getLearnerConceptState } from "@/lib/learning/learner-state";
import {
  allowedSourceReferences,
  knowledgeSourceApiView,
} from "@/lib/learning/knowledge/retrieval/provenance";
import { createAiGeneralKnowledgeProvider } from "@/lib/learning/knowledge/retrieval/providers/general-ai";
import { isProtectedSpecializedTopic } from "@/lib/learning/knowledge/retrieval/normalize-target";
import { recordLessonExposuresFromTeachingContext } from "@/lib/learning/learner-state/adapters";
import { ensureLearnerStatePersistence } from "@/lib/learning/learner-state/ensure-persistence";
import {
  formatLearnerContextPromptBlock,
  resolvePersonalizedTeachingContext,
  type PersonalizedTeachingContext,
} from "@/lib/learning/personalized-teaching";
import { resolveKnowledgeLoopOrchestration } from "@/lib/learning/orchestrator/knowledge-loop";
import type { KnowledgeOrchestrationApiView } from "@/lib/learning/orchestrator/knowledge-loop";
import { enrichLessonForStudio } from "@/lib/learning/studio/enrich-lesson";
import { db } from "@/lib/db";
import { getOrCreateLearnerProfile } from "@/lib/learning/learner-profile";
import {
  buildContentDifficultyPromptBias,
  buildLearnPreferencePromptBias,
  parseContentDifficultyChoice,
  parseLearnPreferenceKeys,
  type LearnPreferenceKey,
} from "@/lib/learning/learner-preferences";
import {
  getTeachingStylePolicy,
  parseTeachingStyle,
} from "@/lib/learning/tutor/teaching-style";
import { resolveInstructionalContext } from "@/lib/study/resolve-instructional-context";
import { getOrCreateDefaultUser } from "@/lib/user";

/** Phase 4A — observe lesson success; never block the Learn response. */
async function observeLessonExposure(
  userId: string,
  teachingKnowledge: TeachingKnowledgeContext | null,
) {
  if (!teachingKnowledge) return;
  try {
    await ensureLearnerStatePersistence();
    await recordLessonExposuresFromTeachingContext({
      userId,
      teachingKnowledge,
      source: "six-lesson",
    });
  } catch (err) {
    console.error("Phase 4A lesson exposure recording failed:", err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as {
      component?: string;
      topic?: string;
      courseId?: string;
      materialId?: string;
      teachingStyle?: string;
      /** Material difficulty 1–5 — separate from teachingStyle. */
      contentDifficulty?: unknown;
      /** Optional client override of preference keys. */
      learnPreferences?: unknown;
    };

    const component = body.component?.trim() ?? "";
    if (!isSixGuideComponent(component)) {
      return NextResponse.json(
        { success: false, error: "Unknown Six technique." },
        { status: 400 },
      );
    }

    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: "Pick a real study topic first (e.g. Object-Oriented Design), not a blank field.",
        },
        { status: 400 },
      );
    }

    // Phase 10 — understand activity / ambiguity (does not redesign UI).
    // Ambiguity is represented in metadata; we do not silently invent meaning,
    // but also do not trap the learner behind a hard stop.
    const understood = understandLearningTarget(topic);

    const teachingStyle = parseTeachingStyle(body.teachingStyle) ?? undefined;
    const teachingStylePolicy = teachingStyle
      ? getTeachingStylePolicy(teachingStyle).presentationPolicy
      : undefined;

    const profile = await getOrCreateLearnerProfile(user.id);
    const fromProfile = parseLearnPreferenceKeys(profile.modalityPreferencesJson);
    const fromBody = Array.isArray(body.learnPreferences)
      ? (body.learnPreferences.filter(
          (k): k is LearnPreferenceKey => typeof k === "string",
        ) as LearnPreferenceKey[])
      : null;
    const preferenceKeys = fromBody && fromBody.length > 0 ? fromBody : fromProfile;
    let habitsBias = "";
    try {
      const habits = await loadLearningHabits(user.id);
      habitsBias = tutorPersonalizationBlock(habits.doc);
    } catch {
      habitsBias = "";
    }
    const preferenceBias = [buildLearnPreferencePromptBias(preferenceKeys), habitsBias]
      .filter(Boolean)
      .join("\n\n");
    const contentDifficulty = parseContentDifficultyChoice(body.contentDifficulty);
    const difficultyBias = buildContentDifficultyPromptBias(contentDifficulty);

    let courseTitle: string | undefined;
    if (body.courseId?.trim()) {
      const course = await db.course.findFirst({
        where: { id: body.courseId.trim(), userId: user.id },
        select: { title: true },
      });
      courseTitle = course?.title;
    }

    const materialId = body.materialId?.trim();
    let materialTitle: string | undefined;
    if (materialId) {
      const material = await db.courseMaterial.findFirst({
        where: { id: materialId, course: { userId: user.id } },
        select: { title: true },
      });
      materialTitle = material?.title ?? undefined;
    }

    const materialSource = materialId
      ? (await loadChapterStudySourceText(user.id, materialId, 9000)) ??
        (await loadMaterialSourceText(user.id, materialId, 9000))
      : null;
    const courseSource =
      !materialSource && body.courseId?.trim()
        ? await loadCourseSourceText(user.id, body.courseId.trim(), 9000)
        : null;
    const rawLoadedSource =
      materialSource?.text ?? courseSource?.text ?? undefined;
    // StudyTopicProfile JSON is organizational planning — never use it as
    // instructional grounding, concept extraction, or AI course-material body.
    let groundingSource =
      instructionalSourceForTeaching(rawLoadedSource) ?? undefined;

    // Phase 9 — auto-search owned materials/notes when not already loaded.
    let personalNoteText: string | null = null;
    let personalNoteTitle: string | null = null;
    let personalNoteId: string | null = null;
    try {
      const personal = await loadPersonalGroundingForLearn({
        userId: user.id,
        topic: understood?.topic ?? topic,
        courseId: body.courseId?.trim() || null,
        materialId: materialId || null,
      });
      if (!groundingSource && personal.groundingText) {
        groundingSource =
          instructionalSourceForTeaching(personal.groundingText) ??
          personal.groundingText;
        if (!materialTitle && personal.materialTitle) {
          materialTitle = personal.materialTitle;
        }
        if (!courseTitle && personal.courseTitle) {
          courseTitle = personal.courseTitle;
        }
      }
      personalNoteText = personal.noteText ?? null;
      personalNoteTitle = personal.noteTitle ?? null;
      personalNoteId = personal.noteId ?? null;
    } catch (err) {
      console.warn("Phase 9 personal grounding search failed:", err);
    }

    const sourceTextForPrompt =
      groundingSource ??
      (rawLoadedSource && !looksLikeStudyTopicProfileSource(rawLoadedSource)
        ? rawLoadedSource
        : undefined);

    const instructional = resolveInstructionalContext({
      topic,
      // Concepts/headings only from real instructional grounding — not study-plan JSON.
      sourceText: groundingSource,
      courseTitle,
      materialTitle,
    });
    const teachingTopic = instructional.teachingTopic;
    const concepts = instructional.concepts;

    // Phase 3B-2 + Phase 7/9: Library first; Universal Retrieval when needed.
    // When personal grounding/notes exist, ForLearn attaches them without replacing KL.
    let teachingKnowledge =
      groundingSource || personalNoteText
        ? await resolveTeachingKnowledgeForLearn({
            target: teachingTopic,
            userId: user.id,
            groundingText: groundingSource,
            courseId: body.courseId?.trim() || null,
            materialId: materialId || null,
            courseTitle: courseTitle ?? null,
            materialTitle: materialTitle ?? null,
            noteText: personalNoteText,
            noteTitle: personalNoteTitle,
            noteId: personalNoteId,
          })
        : (resolveTeachingKnowledgeContext(teachingTopic) ??
          (await resolveTeachingKnowledgeForLearn({
            target: teachingTopic,
            userId: user.id,
            groundingText: groundingSource,
            courseId: body.courseId?.trim() || null,
            materialId: materialId || null,
            courseTitle: courseTitle ?? null,
            materialTitle: materialTitle ?? null,
            noteText: personalNoteText,
            noteTitle: personalNoteTitle,
            noteId: personalNoteId,
          })));

    // Bundle D — Teach Intelligence: expand topic → concept family when Teach scope requires it.
    const teachScope = understood
      ? detectTeachScope(understood)
      : "focused-concept";
    if (teachingKnowledge && understood?.activity === "teach") {
      try {
        const decomposed = await decomposeTeachConcepts({
          context: teachingKnowledge,
          understood,
          generalProvider: createAiGeneralKnowledgeProvider(user.id),
          retrievalInput: {
            userId: user.id,
            groundingText: groundingSource,
            courseId: body.courseId?.trim() || null,
            materialId: materialId || null,
          },
        });
        teachingKnowledge = decomposed.context;
      } catch (err) {
        console.warn("Bundle D teach decomposition failed:", err);
      }
    }

    // Phase 11 — session path from teaching context (canonical KL preferred).
    const learningPath = teachingKnowledge
      ? learningPathFromTeachingContext(teachingKnowledge)
      : null;

    // Phase 4B: Learner State → Personalized Teaching Context (presentation only).
    let personalizedTeaching: PersonalizedTeachingContext | null = null;
    let learnerContextBlock: string | null = null;
    // Phase 4C/5: deterministic next-action (read-only; does not replace lesson generation).
    let orchestrationView: KnowledgeOrchestrationApiView | null = null;
    let reteachEmphasis = false;
    let orchDecision: {
      action?: string | null;
      conceptId?: string | null;
      nextConceptId?: string | null;
    } | null = null;
    if (teachingKnowledge) {
      try {
        await ensureLearnerStatePersistence();
        personalizedTeaching = await resolvePersonalizedTeachingContext({
          userId: user.id,
          knowledge: teachingKnowledge,
        });
        if (personalizedTeaching) {
          learnerContextBlock = formatLearnerContextPromptBlock(
            personalizedTeaching,
          );
        }
        const orch = await resolveKnowledgeLoopOrchestration({
          userId: user.id,
          target: teachingTopic,
          knowledge: teachingKnowledge,
          roomContext: {
            courseId: body.courseId?.trim() || null,
            topic: teachingTopic,
            materialId: materialId || null,
            courseTitle: courseTitle ?? null,
          },
        });
        orchestrationView = orch.apiView;
        orchDecision = orch.decision;
        reteachEmphasis =
          orch.decision.action === "reteach" ||
          orch.decision.reasonCode === "recent-incorrect";
        if (reteachEmphasis && learnerContextBlock) {
          learnerContextBlock = `${learnerContextBlock}\n\nPresentation focus: clarify misconceptions with contrasting examples. Do not claim the learner is weak or mastered.`;
        }

        // Bundle H — adaptive emphasis + authored reteach variation (additive).
        const focusForEmphasis =
          orch.decision.conceptId ??
          teachingKnowledge?.primaryConcept?.id ??
          teachingKnowledge?.concepts[0]?.id ??
          null;
        if (focusForEmphasis && teachingKnowledge) {
          const pathIds = teachingKnowledge.concepts.map((c) => c.id);
          const statesMap = new Map<
            string,
            Awaited<ReturnType<typeof getLearnerConceptState>>
          >();
          for (const id of pathIds) {
            statesMap.set(id, await getLearnerConceptState(user.id, id));
          }
          const emphasis = buildAdaptiveTeachingEmphasis({
            focusConceptId: focusForEmphasis,
            statesByConceptId: statesMap,
            pathConceptIds: pathIds,
          });
          const emphasisBlock = formatAdaptiveEmphasisPromptBlock(emphasis);
          if (emphasisBlock) {
            learnerContextBlock = learnerContextBlock
              ? `${learnerContextBlock}\n\n${emphasisBlock}`
              : emphasisBlock;
          }
          if (reteachEmphasis) {
            const reteachPlan = buildReteachVariationPlan(focusForEmphasis);
            if (reteachPlan?.reteachGuidance) {
              learnerContextBlock = learnerContextBlock
                ? `${learnerContextBlock}\n\n${reteachPlan.reteachGuidance}`
                : reteachPlan.reteachGuidance;
            }
          }
        }
      } catch (err) {
        console.error("Phase 4B/4C learner context / orchestration failed:", err);
        personalizedTeaching = null;
        learnerContextBlock = null;
        orchestrationView = null;
        reteachEmphasis = false;
        orchDecision = null;
      }
    }

    // Bundle D — teach current path concept only (not the entire path as one lesson).
    const focusConceptId = teachingKnowledge
      ? resolveTeachFocusConceptId({
          pathContext: teachingKnowledge,
          action: orchDecision?.action,
          conceptId: orchDecision?.conceptId,
          nextConceptId: orchDecision?.nextConceptId,
        })
      : null;
    const lessonKnowledge = teachingKnowledge
      ? focusTeachingContextForLesson(teachingKnowledge, focusConceptId)
      : null;
    const teachingProgression =
      teachingKnowledge && learningPath
        ? buildTeachingProgressionView({
            path: learningPathFromTeachingContext(teachingKnowledge, {
              currentConceptId: focusConceptId,
            }),
            pathContext: teachingKnowledge,
            scope: teachScope,
            focusConceptId,
            nextConceptId: orchDecision?.nextConceptId ?? null,
          })
        : teachingKnowledge
          ? buildTeachingProgressionView({
              path: null,
              pathContext: teachingKnowledge,
              scope: teachScope,
              focusConceptId,
              nextConceptId: orchDecision?.nextConceptId ?? null,
            })
          : null;

    const depthBlock = teachingProgression
      ? teachingDepthBlockFromProgression(teachingProgression, {
          reteach: reteachEmphasis,
        })
      : null;

    const knowledgeLibraryBlock = lessonKnowledge
      ? [
          formatKnowledgeLibraryPromptBlock(lessonKnowledge),
          depthBlock,
          teachingProgression && teachingProgression.total > 1
            ? `## TEACHING PATH PROGRESSION\n${teachingProgression.pathTitle}\n${teachingProgression.currentIndex + 1} of ${teachingProgression.total}\nCurrent: ${teachingProgression.currentConceptTitle ?? "—"}\nUpcoming: ${teachingProgression.conceptTitles
                .slice(teachingProgression.currentIndex + 1, teachingProgression.currentIndex + 4)
                .join(" → ") || "(end of path)"}`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n")
      : null;
    const knowledgeSourceMeta = teachingKnowledge
      ? knowledgeSourceApiView({
          sourceKind:
            teachingKnowledge.knowledgeSourceKind ??
            (teachingKnowledge.source === "knowledge-library"
              ? "knowledge-library"
              : teachingKnowledge.source === "user-note"
                ? "user-note"
                : teachingKnowledge.source === "retrieved-web"
                  ? "retrieved-web"
                  : teachingKnowledge.source === "course-material"
                    ? "course-material"
                    : teachingKnowledge.source === "combined"
                      ? "combined"
                      : teachingKnowledge.source === "general-ai"
                        ? "general-ai"
                        : "knowledge-library"),
          confidence: teachingKnowledge.confidence ?? "high",
          sources: teachingKnowledge.sources,
          groundingContext: teachingKnowledge.groundingContext,
          sourceSummary: teachingKnowledge.sourceSummary,
          limitations: teachingKnowledge.limitations,
        })
      : null;

    /** Bundle A/D — additive metadata; never replaces lesson/orchestration. */
    const learningTargetMeta = understood
      ? {
          resolution: understood.resolution,
          topic: understood.topic,
          activity: understood.activity,
          scope: understood.scope ?? teachScope,
          sourcePreference: understood.sourcePreference ?? null,
          clarificationPrompt: understood.clarificationPrompt ?? null,
        }
      : null;
    const learningPathMeta = learningPath
      ? {
          id: learningPath.id,
          title: learningPath.title,
          source: learningPath.source,
          canonical: learningPath.canonical,
          currentIndex:
            teachingProgression?.currentIndex ?? learningPath.currentIndex,
          conceptIds: learningPath.concepts.map((c) => c.conceptId),
          /** Bundle D additive progression fields. */
          conceptTitles: learningPath.concepts.map((c) => c.title),
          currentConceptId: teachingProgression?.currentConceptId ?? null,
          currentConceptTitle:
            teachingProgression?.currentConceptTitle ?? null,
          total: teachingProgression?.total ?? learningPath.concepts.length,
          scope: teachScope,
        }
      : null;
    const teachingProgressionMeta = teachingProgression
      ? {
          pathId: teachingProgression.pathId,
          pathTitle: teachingProgression.pathTitle,
          scope: teachingProgression.scope,
          currentIndex: teachingProgression.currentIndex,
          total: teachingProgression.total,
          currentConceptId: teachingProgression.currentConceptId,
          currentConceptTitle: teachingProgression.currentConceptTitle,
          nextConceptId: teachingProgression.nextConceptId,
          nextConceptTitle: teachingProgression.nextConceptTitle,
          conceptTitles: teachingProgression.conceptTitles,
          depthSections: teachingProgression.depthSections,
        }
      : null;

    try {
      const result = await completeForUser(
        user.id,
        [
          {
            role: "system",
            content: buildSixLessonSystemPrompt(component, {
              teachingStylePolicy,
              preferenceBias,
              difficultyBias,
            }),
          },
          {
            role: "user",
            content: buildSixLessonUserPrompt({
              component,
              topic: teachingTopic,
              courseTitle,
              sourceText: sourceTextForPrompt,
              teachingStyle: teachingStyle ?? undefined,
              teachingStylePolicy,
              preferenceBias,
              difficultyBias,
              organizationalLabel: instructional.organizationalLabel,
              concepts,
              knowledgeLibraryBlock,
              learnerContextBlock,
            }),
          },
        ],
        { temperature: 0.35, maxTokens: 8192, jsonMode: true },
      );

      const lesson = parseSixWorkedLesson(result.content, {
        component,
        topic: teachingTopic,
      });
      // Phase 2B: parsed AI JSON is not automatically a valid Learn lesson.
      if (component === "detailed-explanation") {
        const validation = validateAiLesson({
          lesson,
          canonicalTarget: teachingTopic,
          grounding: groundingSource,
          courseTitle,
          concepts,
          learnerContextSupplied: Boolean(learnerContextBlock),
          sourceIntegrity: teachingKnowledge
            ? {
                allowedReferences: allowedSourceReferences({
                  sources: teachingKnowledge.sources,
                  groundingContext: teachingKnowledge.groundingContext,
                  externalSnippets: teachingKnowledge.externalSnippets,
                }),
                hasRetrievedWebSources: Boolean(
                  teachingKnowledge.groundingContext?.retrievedExternal
                    ?.length || teachingKnowledge.externalSnippets?.length,
                ),
                isGeneralAiOnly:
                  (teachingKnowledge.knowledgeSourceKind ??
                    teachingKnowledge.source) === "general-ai",
              }
            : undefined,
        });
        if (!validation.accepted) {
          throw new Error(
            validation.reasons[0] ??
              "Lesson did not meet teaching quality checks for this target.",
          );
        }
      } else if (isMetaStudySkillOutlineLesson(lesson)) {
        // Guard: never serve meta study-skill outlines as successful teaching.
        throw new Error("Lesson looked like study tips instead of subject teaching.");
      }
      // Bundle D — record exposure for the focus concept only (path progression).
      await observeLessonExposure(user.id, lessonKnowledge);

      // Bundle G — enrich AI lesson: transfer prompts, relationship visual, deepen if thin.
      const studioLesson = enrichLessonForStudio({
        lesson,
        scope: teachScope,
        focusConcept: lessonKnowledge?.concepts[0] ?? null,
        pathTitles: teachingProgression?.conceptTitles,
        pathIndex: teachingProgression?.currentIndex ?? 0,
        domain: lessonKnowledge?.domain,
        deepenIfThin: true,
      });

      return NextResponse.json({
        success: true,
        lesson: studioLesson,
        source: groundingSource ? "course" : "general",
        teachingStyle: teachingStyle ?? null,
        contentDifficulty: contentDifficulty ?? null,
        learnPreferences: preferenceKeys,
        instructionalContext: instructional,
        /** Phase 4C — additive next-action hint; does not replace lesson. */
        orchestration: orchestrationView,
        /** Phase 7 — additive knowledge provenance; optional for clients. */
        knowledgeSource: knowledgeSourceMeta,
        /** Phase 10 — target understanding (additive). */
        learningTarget: learningTargetMeta,
        /** Phase 11 — canonical or session path (additive). */
        learningPath: learningPathMeta,
        /** Bundle D — teach progression (additive). */
        teachingProgression: teachingProgressionMeta,
      });
    } catch (error) {
      console.warn("Six worked lesson AI failed:", error);

      // Phase 7 — deterministic lesson from retrieved teaching knowledge (KL or general).
      if (
        lessonKnowledge &&
        lessonKnowledge.concepts.length > 0 &&
        !isProtectedSpecializedTopic(teachingTopic)
      ) {
        try {
          const libraryLesson = lessonFromTeachingKnowledgeContext(
            component,
            teachingTopic,
            lessonKnowledge,
            personalizedTeaching,
            {
              reteachEmphasis,
              pathTitles: teachingProgression?.conceptTitles,
              pathIndex: teachingProgression?.currentIndex ?? 0,
              teachScope,
            },
          );
          if (
            libraryLesson &&
            !isPlaceholderScaffoldLesson(libraryLesson) &&
            !isMetaStudySkillOutlineLesson(libraryLesson)
          ) {
            await observeLessonExposure(user.id, lessonKnowledge);
            return NextResponse.json({
              success: true,
              lesson: libraryLesson,
              source: groundingSource ? "course" : "knowledge-library",
              teachingStyle: teachingStyle ?? null,
              contentDifficulty: contentDifficulty ?? null,
              learnPreferences: preferenceKeys,
              instructionalContext: instructional,
              orchestration: orchestrationView,
              knowledgeSource: knowledgeSourceMeta,
              learningTarget: learningTargetMeta,
              learningPath: learningPathMeta,
              teachingProgression: teachingProgressionMeta,
              warning:
                error instanceof Error
                  ? friendlyUserFacingAiError(error.message)
                  : "AI lesson unavailable — using Knowledge Library lesson.",
            });
          }
        } catch (libraryErr) {
          console.warn("Knowledge Library lesson fallback failed:", libraryErr);
        }
      }

      const subjectFallback = buildSubjectAwareFallbackLesson(
        component,
        teachingTopic,
        {
          sourceText: groundingSource,
          concepts,
          courseTitle,
          personalizedTeaching,
          reteachEmphasis,
        },
      );
      if (
        subjectFallback &&
        !isMetaStudySkillOutlineLesson(subjectFallback) &&
        !isPlaceholderScaffoldLesson(subjectFallback)
      ) {
        await observeLessonExposure(user.id, lessonKnowledge);
        return NextResponse.json({
          success: true,
          lesson: subjectFallback,
          source: "fallback-subject",
          teachingStyle: teachingStyle ?? null,
          contentDifficulty: contentDifficulty ?? null,
          learnPreferences: preferenceKeys,
          instructionalContext: instructional,
          orchestration: orchestrationView,
          knowledgeSource: knowledgeSourceMeta,
          learningTarget: learningTargetMeta,
          learningPath: learningPathMeta,
          teachingProgression: teachingProgressionMeta,
          warning: friendlyUserFacingAiError(
            error,
            "Showing a subject lesson from Study Haul's instructional knowledge. Tap Rebuild for a fuller AI lesson when available.",
          ),
        });
      }

      // Teach Me: do not invent placeholder lessons when knowledge/material miss.
      if (component === "detailed-explanation") {
        return NextResponse.json({
          success: false,
          error: friendlyUserFacingAiError(
            error,
            "Could not finish generating this lesson. Please try again.",
          ),
          teachingStyle: teachingStyle ?? null,
          instructionalContext: instructional,
          orchestration: orchestrationView,
          knowledgeSource: knowledgeSourceMeta,
          learningTarget: learningTargetMeta,
          learningPath: learningPathMeta,
          teachingProgression: teachingProgressionMeta,
        });
      }

      // Other SIX techniques: keep prior soft deterministic fallback.
      await observeLessonExposure(user.id, lessonKnowledge);
      return NextResponse.json({
        success: true,
        lesson: buildDeterministicSixLesson(component, teachingTopic, {
          sourceText: groundingSource,
          personalizedTeaching,
          reteachEmphasis,
        }),
        source: "fallback",
        teachingStyle: teachingStyle ?? null,
        contentDifficulty: contentDifficulty ?? null,
        learnPreferences: preferenceKeys,
        instructionalContext: instructional,
        orchestration: orchestrationView,
        knowledgeSource: knowledgeSourceMeta,
        learningTarget: learningTargetMeta,
        learningPath: learningPathMeta,
        teachingProgression: teachingProgressionMeta,
        warning: friendlyUserFacingAiError(error),
      });
    }
  } catch (error) {
    console.error("Six lesson failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: friendlyUserFacingAiError(error) || "Could not build a Six lesson.",
      },
      { status: 500 },
    );
  }
}
