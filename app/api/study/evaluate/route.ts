import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { aiService, isAIConfigured } from "@/lib/ai";
import {
  loadChapterStudySourceText,
  loadCourseSourceText,
  loadMaterialSourceText,
} from "@/lib/ai/course-source";
import { createStudySession } from "@/lib/csl/study-sessions";
import { recordStudyEvaluateEvidence } from "@/lib/learning/assessment/evaluate-bridge";
import { buildIdempotentEvaluateEvidenceKey } from "@/lib/learning/activity/framework/evaluate-evidence-key";
import { recordEvaluateKnowledgeEvidence } from "@/lib/learning/learner-state/adapters";
import { ensureLearnerStatePersistence } from "@/lib/learning/learner-state/ensure-persistence";
import {
  TeachMeAdapterError,
  buildTeachMeInstructionalContext,
  buildTeachMeUserPayload,
  parseTeachMeEvaluation,
  toTutorRequestFromTeachMe,
  type TeachMeEvaluationResult,
} from "@/lib/learning/tutor/teach-me-adapter";
import { isTeachMeUnifiedEnabled } from "@/lib/learning/tutor/teach-me-feature-flag";
import { runTutor, TutorRequestError } from "@/lib/learning/tutor/service";
import { parseTeachingStyle } from "@/lib/learning/tutor/teaching-style";
import { updateTopicMastery } from "@/lib/quizzes/mastery";
import { db } from "@/lib/db";
import {
  aiSourceInstruction,
  defaultCourseMaterialsOnly,
  getUserAppSettings,
} from "@/lib/settings/app-settings";
import { evaluateOfflineAgainstOutline } from "@/lib/study/offline-evaluate";
import { getOrCreateDefaultTopic } from "@/lib/topics";
import { getOrCreateDefaultUser } from "@/lib/user";

async function resolveTopicId(courseId: string | undefined, topicName: string | undefined) {
  if (!courseId) return null;

  const trimmed = topicName?.trim();
  if (trimmed) {
    const topic = await db.topic.findFirst({
      where: {
        courseId,
        name: { contains: trimmed },
      },
    });
    if (topic) return topic.id;
  }

  return (await getOrCreateDefaultTopic(courseId)).id;
}

function parseEvaluation(content: string): TeachMeEvaluationResult {
  return parseTeachMeEvaluation(content);
}

/** Legacy teach-me AI evaluation — used when flag is OFF or adapter fails pre-AI. */
async function runLegacyTeachMeAiEvaluation(input: {
  sourceBlock: string;
  coldStartHint: string;
  topic: string | undefined;
  userResponse: string;
  sourceModeInstruction: string;
  includeOpenAIPro: boolean;
}): Promise<TeachMeEvaluationResult> {
  const systemPrompt = buildTeachMeInstructionalContext();
  const userPrompt = buildTeachMeUserPayload({
    topic: input.topic,
    sourceBlock: input.sourceBlock,
    coldStartHint: input.coldStartHint,
    userResponse: input.userResponse,
    sourceModeInstruction: input.sourceModeInstruction,
  });

  const result = await aiService.complete(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      temperature: 0.2,
      maxTokens: 2048,
      jsonMode: true,
      includeOpenAIPro: input.includeOpenAIPro,
    },
  );
  return parseEvaluation(result.content);
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const {
      mode,
      courseId,
      materialId,
      topic,
      userResponse,
      useCourseMaterialsOnly,
      component,
      stepIndex,
      stepTitle,
      stepPrompt,
      durationSeconds,
      teachingStyle: teachingStyleRaw,
    } = body;

    if (!mode || !userResponse?.trim()) {
      return NextResponse.json(
        { success: false, error: "mode and userResponse are required." },
        { status: 400 },
      );
    }

    const parsedTeachMeStyle = parseTeachingStyle(teachingStyleRaw);
    if (parsedTeachMeStyle === null) {
      return NextResponse.json(
        { success: false, error: "Unsupported teaching style." },
        { status: 400 },
      );
    }

    const appSettings = await getUserAppSettings(user.id);
    const courseOnly =
      useCourseMaterialsOnly ?? defaultCourseMaterialsOnly(appSettings.aiSourceMode);

    // Prefer the Core-selected chapter/material when looping Core → Six / Blurt.
    const materialSource =
      typeof materialId === "string" && materialId.trim()
        ? (await loadChapterStudySourceText(user.id, materialId.trim(), 9000)) ??
          (await loadMaterialSourceText(user.id, materialId.trim(), 9000))
        : null;
    const source =
      materialSource ??
      (courseId ? await loadCourseSourceText(user.id, courseId, 9000) : null);

    const coldStart = Boolean(source && "coldStart" in source && source.coldStart);
    // Topics-only cold start: allow tutor-level general knowledge for the named topic.
    const effectiveCourseOnly =
      coldStart && (mode === "blurting" || mode === "teach-me")
        ? false
        : courseOnly;

    const sourceBlock = source
      ? `Course: ${source.courseTitle}${coldStart ? " (cold start · LMS/syllabus topics)" : ""}\nMaterial:\n${source.text}`
      : "";

    const coldStartHint = coldStart
      ? "\nCold start: the student may not have uploaded a chapter. Score against the topic outline and standard college coverage for the focus topic — do not invent unrelated units."
      : "";

    const sourceModeInstruction = effectiveCourseOnly
      ? aiSourceInstruction("course_only")
      : aiSourceInstruction("course_plus_general");

    const systemPrompt =
      mode === "six"
        ? `You are an expert study coach for the Six understanding technique (${component}). Coach the student on one step at a time. Be encouraging but specific. Respond JSON only.`
        : mode === "blurting"
          ? "You evaluate blurting study sessions. Compare what the student recalled vs source material. Respond JSON only."
          : buildTeachMeInstructionalContext();

    const jsonShape = `{
  "score": 0-100,
  "summary": "one sentence",
  "strengths": ["..."],
  "gaps": ["..."],
  "misconceptions": ["..."],
  "nextSteps": ["..."]
}`;

    const userPrompt =
      mode === "six"
        ? `Technique: ${component}
Step ${Number(stepIndex) + 1}: ${stepTitle}
Step instructions: ${stepPrompt}
Topic: ${topic || "General course material"}
${sourceBlock ? `\nSOURCE MATERIAL:\n${sourceBlock}` : ""}${coldStartHint}

STUDENT RESPONSE:
${userResponse}

${sourceModeInstruction}

Score how well they completed this Six step (structure, accuracy, depth). Return ONLY JSON:
${jsonShape}`
        : mode === "blurting"
        ? `Topic: ${topic || "General course material"}
${sourceBlock ? `\nSOURCE MATERIAL:\n${sourceBlock}` : ""}${coldStartHint}

STUDENT BLURT (recalled without notes):
${userResponse}

${sourceModeInstruction}

Return ONLY JSON:
{
  "score": 0-100,
  "summary": "one sentence",
  "strengths": ["..."],
  "gaps": ["concepts they missed"],
  "misconceptions": ["..."],
  "nextSteps": ["what to review next"]
}`
        : buildTeachMeUserPayload({
            topic: typeof topic === "string" ? topic : undefined,
            sourceBlock,
            coldStartHint,
            userResponse: String(userResponse),
            sourceModeInstruction,
          });

    const evalMode =
      mode === "blurting" || mode === "teach-me" || mode === "six"
        ? (mode as "blurting" | "teach-me" | "six")
        : "blurting";

    let evaluation: TeachMeEvaluationResult;

    if (!isAIConfigured()) {
      evaluation = evaluateOfflineAgainstOutline({
        userResponse: String(userResponse),
        sourceText: source?.text ?? String(topic ?? ""),
        topic: typeof topic === "string" ? topic : undefined,
        mode: evalMode,
      });
    } else if (mode === "teach-me" && isTeachMeUnifiedEnabled()) {
      // Phase 2D-4: Teach Me AI via Unified Tutor; post-score bridges unchanged.
      try {
        const tutorRequest = await toTutorRequestFromTeachMe({
          learnerId: user.id,
          userResponse: String(userResponse),
          topic: typeof topic === "string" ? topic : undefined,
          courseId: typeof courseId === "string" ? courseId : undefined,
          materialId: typeof materialId === "string" ? materialId : undefined,
          sourceBlock,
          coldStartHint,
          sourceModeInstruction,
          includeOpenAIPro: appSettings.aiUseOpenAIPro,
          ...(parsedTeachMeStyle ? { teachingStyle: parsedTeachMeStyle } : {}),
        });
        const tutorResponse = await runTutor(tutorRequest);
        evaluation = parseTeachMeEvaluation(tutorResponse.text);
      } catch (unifiedError) {
        if (
          unifiedError instanceof TeachMeAdapterError ||
          unifiedError instanceof TutorRequestError
        ) {
          console.error(
            "Teach Me→Unified Tutor adapter failed; falling back to legacy Teach Me AI:",
            unifiedError,
          );
          try {
            evaluation = await runLegacyTeachMeAiEvaluation({
              sourceBlock,
              coldStartHint,
              topic: typeof topic === "string" ? topic : undefined,
              userResponse: String(userResponse),
              sourceModeInstruction,
              includeOpenAIPro: appSettings.aiUseOpenAIPro,
            });
          } catch (aiError) {
            console.error("AI evaluate failed; using offline outline scorer.", aiError);
            evaluation = evaluateOfflineAgainstOutline({
              userResponse: String(userResponse),
              sourceText: source?.text ?? String(topic ?? ""),
              topic: typeof topic === "string" ? topic : undefined,
              mode: evalMode,
            });
          }
        } else {
          // Unified AI already attempted — do not re-call legacy AI (duplicate providers).
          // Match existing evaluate behavior: fall back to offline outline scorer.
          console.error(
            "Teach Me Unified Tutor AI failed; using offline outline scorer (no legacy AI retry):",
            unifiedError,
          );
          evaluation = evaluateOfflineAgainstOutline({
            userResponse: String(userResponse),
            sourceText: source?.text ?? String(topic ?? ""),
            topic: typeof topic === "string" ? topic : undefined,
            mode: evalMode,
          });
        }
      }
    } else {
      try {
        const result = await aiService.complete(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          {
            temperature: 0.2,
            maxTokens: 2048,
            jsonMode: true,
            includeOpenAIPro: appSettings.aiUseOpenAIPro,
          },
        );
        evaluation = parseEvaluation(result.content);
      } catch (aiError) {
        console.error("AI evaluate failed; using offline outline scorer.", aiError);
        evaluation = evaluateOfflineAgainstOutline({
          userResponse: String(userResponse),
          sourceText: source?.text ?? String(topic ?? ""),
          topic: typeof topic === "string" ? topic : undefined,
          mode: evalMode,
        });
      }
    }

    const topicId = await resolveTopicId(courseId, topic);
    const scoreRatio = Math.min(1, Math.max(0, evaluation.score / 100));

    await updateTopicMastery(
      user.id,
      topicId,
      scoreRatio,
      mode === "blurting" ? "recall" : mode === "six" ? "understanding" : "understanding",
    );

    // Universal Learning Engine (Phase 2B-1): evaluate → LO → Evidence → ConceptMastery.
    // Only when topicId is reliable. Failures must not break evaluate UX/scoring.
    // Teach Me evidence stays here (EXPLAIN) — Tutor path uses evidenceIntent "none".
    let adaptivePayload:
      | {
          runId: string;
          outcome: string;
          reason?: string;
          code?: string;
        }
      | undefined;

    if (mode === "blurting" || mode === "teach-me" || mode === "six") {
      try {
        const evidence = await recordStudyEvaluateEvidence({
          userId: user.id,
          mode,
          topicId,
          scoreRatio,
          sixComponent: typeof component === "string" ? component : null,
          stepIndex: typeof stepIndex === "number" ? stepIndex : null,
          stepTitle: typeof stepTitle === "string" ? stepTitle : null,
          misconceptions: evaluation.misconceptions,
          gaps: evaluation.gaps,
        });

        // Phase 2G-10 — optional Adaptive Sequence bind (SIX only).
        // Uses the Attempt created above; does not create a second Attempt.
        if (mode === "six") {
          const {
            bindSixEvaluateAttemptToAdaptiveSequence,
            adaptiveEvaluateResponsePayload,
          } = await import("@/lib/learning/sequence/six-evaluate-bind");
          // Phase 2G-12 — bind only when SIX activity completion gate passes
          // (final guided stage + pass score). Intermediate Attempts still record.
          const bind = await bindSixEvaluateAttemptToAdaptiveSequence({
            userId: user.id,
            adaptiveRunId: body.adaptiveRunId,
            adaptiveStep: body.adaptiveStep,
            attemptId: evidence.attemptId,
            sixComponent: component,
            stepIndex,
            evaluationScore: evaluation.score,
            sixStageCount: body.sixStageCount,
          });
          adaptivePayload = adaptiveEvaluateResponsePayload(bind);
          if (bind.kind === "error") {
            console.error(
              "ULE adaptive sequence SIX bind failed (evaluate still saved):",
              bind.code,
              bind.message,
            );
          }
        }
      } catch (engineError) {
        console.error(
          "ULE study-evaluate evidence bridge failed (evaluate still saved):",
          engineError,
        );
      }

      // Phase 4A/5 — Knowledge Library learner evidence (additive; never blocks evaluate).
      try {
        await ensureLearnerStatePersistence();
        const submissionFingerprint =
          typeof body.submissionFingerprint === "string"
            ? body.submissionFingerprint
            : typeof userResponse === "string"
              ? userResponse
              : JSON.stringify(body.submission ?? body.answers ?? "");
        const eventKey =
          typeof body.evidenceEventKey === "string" &&
          body.evidenceEventKey.trim()
            ? body.evidenceEventKey.trim()
            : buildIdempotentEvaluateEvidenceKey({
                userId: user.id,
                mode: String(mode),
                topic: typeof topic === "string" ? topic : null,
                conceptId:
                  typeof body.conceptId === "string" ? body.conceptId : null,
                activityId:
                  typeof body.activityId === "string"
                    ? body.activityId
                    : typeof body.challengeId === "string"
                      ? body.challengeId
                      : null,
                attemptId:
                  typeof body.attemptId === "string"
                    ? body.attemptId
                    : typeof body.evidenceAttemptId === "string"
                      ? body.evidenceAttemptId
                      : null,
                outcome:
                  typeof scoreRatio === "number"
                    ? scoreRatio >= 0.8
                      ? "correct"
                      : scoreRatio >= 0.4
                        ? "partial"
                        : "incorrect"
                    : null,
                submissionFingerprint,
              });
        await recordEvaluateKnowledgeEvidence({
          userId: user.id,
          topic: typeof topic === "string" ? topic : null,
          mode,
          sixComponent: typeof component === "string" ? component : null,
          scoreRatio,
          eventKey,
        });
      } catch (klError) {
        console.error(
          "Phase 4A Knowledge Library evidence failed (evaluate still saved):",
          klError,
        );
      }
    }

    const activityType =
      mode === "blurting"
        ? StudyActivityType.BLURTING
        : mode === "teach-me"
          ? StudyActivityType.TEACH_BACK
          : mode === "six"
            ? StudyActivityType.SIX
            : null;

    if (activityType) {
      const duration = Math.max(
        60,
        Number(durationSeconds) ||
          Math.min(3600, Math.round((userResponse.trim().split(/\s+/).length || 1) * 3)),
      );
      await createStudySession({
        userId: user.id,
        activityType,
        courseId: courseId ?? null,
        topicId,
        durationSeconds: duration,
        notesCreated: mode === "six" ? 1 : 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
      ...(adaptivePayload ? { adaptive: adaptivePayload } : {}),
    });
  } catch (error) {
    console.error("Failed to evaluate study response:", error);
    const message =
      error instanceof Error ? error.message : "Failed to evaluate response.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
