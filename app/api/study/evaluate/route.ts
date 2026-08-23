import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { aiService } from "@/lib/ai";
import { loadCourseSourceText } from "@/lib/ai/course-source";
import { createStudySession } from "@/lib/csl/study-sessions";
import { updateTopicMastery } from "@/lib/quizzes/mastery";
import { db } from "@/lib/db";
import {
  aiSourceInstruction,
  defaultCourseMaterialsOnly,
  getUserAppSettings,
} from "@/lib/settings/app-settings";
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

function parseEvaluation(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? content).trim();
  return JSON.parse(raw) as {
    score: number;
    summary: string;
    strengths: string[];
    gaps: string[];
    misconceptions: string[];
    nextSteps: string[];
  };
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const {
      mode,
      courseId,
      topic,
      userResponse,
      useCourseMaterialsOnly,
      component,
      stepIndex,
      stepTitle,
      stepPrompt,
      durationSeconds,
    } = body;

    if (!mode || !userResponse?.trim()) {
      return NextResponse.json(
        { success: false, error: "mode and userResponse are required." },
        { status: 400 },
      );
    }

    const appSettings = await getUserAppSettings(user.id);
    const courseOnly =
      useCourseMaterialsOnly ?? defaultCourseMaterialsOnly(appSettings.aiSourceMode);

    const source = courseId
      ? await loadCourseSourceText(user.id, courseId, 9000)
      : null;

    const sourceBlock = source
      ? `Course: ${source.courseTitle}\nMaterial:\n${source.text}`
      : "";

    const systemPrompt =
      mode === "six"
        ? `You are an expert study coach for the Six understanding technique (${component}). Coach the student on one step at a time. Be encouraging but specific. Respond JSON only.`
        : mode === "blurting"
          ? "You evaluate blurting study sessions. Compare what the student recalled vs source material. Respond JSON only."
          : "You evaluate Feynman teach-back explanations. Check accuracy, completeness, misconceptions. Respond JSON only.";

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
${sourceBlock ? `\nSOURCE MATERIAL:\n${sourceBlock}` : ""}

STUDENT RESPONSE:
${userResponse}

${courseOnly ? aiSourceInstruction("course_only") : aiSourceInstruction("course_plus_general")}

Score how well they completed this Six step (structure, accuracy, depth). Return ONLY JSON:
${jsonShape}`
        : mode === "blurting"
        ? `Topic: ${topic || "General course material"}
${sourceBlock ? `\nSOURCE MATERIAL:\n${sourceBlock}` : ""}

STUDENT BLURT (recalled without notes):
${userResponse}

${courseOnly ? aiSourceInstruction("course_only") : aiSourceInstruction("course_plus_general")}

Return ONLY JSON:
{
  "score": 0-100,
  "summary": "one sentence",
  "strengths": ["..."],
  "gaps": ["concepts they missed"],
  "misconceptions": ["..."],
  "nextSteps": ["what to review next"]
}`
        : `Topic: ${topic || "General concept"}
${sourceBlock ? `\nREFERENCE MATERIAL:\n${sourceBlock}` : ""}

STUDENT EXPLANATION (teaching back):
${userResponse}

${courseOnly ? aiSourceInstruction("course_only") : aiSourceInstruction("course_plus_general")}

Return ONLY JSON:
{
  "score": 0-100,
  "summary": "one sentence",
  "strengths": ["..."],
  "gaps": ["missing ideas"],
  "misconceptions": ["..."],
  "nextSteps": ["how to improve the explanation"]
}`;

    const result = await aiService.complete(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 2048 },
    );

    const evaluation = parseEvaluation(result.content);
    const topicId = await resolveTopicId(courseId, topic);
    const scoreRatio = Math.min(1, Math.max(0, evaluation.score / 100));

    await updateTopicMastery(
      user.id,
      topicId,
      scoreRatio,
      mode === "blurting" ? "recall" : mode === "six" ? "understanding" : "understanding",
    );

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

    return NextResponse.json({ success: true, data: evaluation });
  } catch (error) {
    console.error("Failed to evaluate study response:", error);
    const message =
      error instanceof Error ? error.message : "Failed to evaluate response.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
