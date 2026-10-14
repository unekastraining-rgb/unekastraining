import { NextResponse } from "next/server";

import {
  loadChapterStudySourceText,
  loadCourseSourceText,
  loadMaterialSourceText,
} from "@/lib/ai/course-source";
import { completeForUser } from "@/lib/ai/complete-for-user";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { friendlyUserFacingAiError } from "@/lib/ai/parse-json-response";
import type { AIMessage } from "@/lib/ai/types";
import { SIX_GUIDES, isSixGuideComponent } from "@/lib/csl/six-guides";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import {
  SixTutorAdapterError,
  toTutorRequestFromSixTutor,
} from "@/lib/learning/tutor/six-adapter";
import { isSixTutorUnifiedEnabled } from "@/lib/learning/tutor/six-feature-flag";
import { runTutor, TutorRequestError } from "@/lib/learning/tutor/service";
import { parseTeachingStyle } from "@/lib/learning/tutor/teaching-style";
import {
  extractTeachingStyleHintFromMessage,
  resolveTeachingStyle,
} from "@/lib/learning/tutor/teaching-style";
import { getUserAppSettings } from "@/lib/settings/app-settings";
import { getOrCreateDefaultUser } from "@/lib/user";

type SixTutorBody = {
  message?: string;
  component?: string;
  topic?: string;
  courseId?: string;
  materialId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  lessonSummary?: string;
  focusStepContext?: string;
  learnPreferences?: string[];
  /** 2P-19 — optional Teaching Style. */
  teachingStyle?: unknown;
};

function offlineReply(guideTitle: string, topic: string): string {
  return [
    `Tutor is offline until an AI key is set (Gemini, Groq, or OpenRouter).`,
    ``,
    `Meanwhile, stay inside ${guideTitle} for “${topic}”:`,
    `• Re-read the worked example map`,
    `• Cover it and try the practice prompt from memory`,
    `• Ask a more specific question once AI is available (e.g. “explain chunk 2 with a Java example”)`,
  ].join("\n");
}

/** Legacy SIX Tutor AI path — unchanged when feature flag is OFF. */
async function runLegacySixTutorCompletion(input: {
  userId: string;
  message: string;
  component: string;
  topic: string;
  courseTitle?: string;
  lessonSummary: string;
  focusStepContext?: string;
  sourceText: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  const guide = SIX_GUIDES[input.component as keyof typeof SIX_GUIDES];
  const system = `You are Study Haul's Six Tutor — a live coach inside the ${guide.title} technique.

Hard rules:
1. Teach the TOPIC using ${guide.title} (${guide.whatItMeans}). Do not abandon the technique for a generic ChatGPT dump.
2. Stay concrete: examples, analogies, short steps. Prefer the student's course modules when context is given.
3. Never invent syllabus admin as content (instructor info, grading policy, important dates).
4. Keep replies concise (usually under 180 words) unless they ask to go deeper.
5. End with one short follow-up question or try-this prompt that uses ${guide.title}.`;

  const contextBlock = [
    `Technique: ${guide.title} (${input.component})`,
    `Topic: ${input.topic}`,
    input.courseTitle ? `Course: ${input.courseTitle}` : null,
    input.focusStepContext
      ? `CURRENT LESSON STEP (answer about this unless they ask otherwise):\n${input.focusStepContext}`
      : null,
    input.lessonSummary
      ? `Worked example already shown to the student:\n${input.lessonSummary}`
      : null,
    input.sourceText
      ? `Course / material context:\n${input.sourceText}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: AIMessage[] = [
    {
      role: "system",
      content: `${system}\n\nSession context:\n${contextBlock}`,
    },
    ...input.history
      .filter(
        (item) =>
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim(),
      )
      .map((item) => ({
        role: item.role as "user" | "assistant",
        content: item.content.trim().slice(0, 2000),
      })),
    { role: "user", content: input.message },
  ];

  const result = await completeForUser(input.userId, messages, {
    temperature: 0.4,
    maxTokens: 1200,
  });
  return result.content.trim();
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as SixTutorBody;

    const message = body.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json(
        { success: false, error: "Ask the Tutor a question." },
        { status: 400 },
      );
    }

    const component = body.component?.trim() ?? "";
    if (!isSixGuideComponent(component)) {
      return NextResponse.json(
        { success: false, error: "Unknown Six technique." },
        { status: 400 },
      );
    }

    const topic = body.topic?.trim() || "this topic";
    const guide = SIX_GUIDES[component];
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    let courseTitle: string | undefined;
    if (body.courseId?.trim()) {
      const course = await db.course.findFirst({
        where: { id: body.courseId.trim(), userId: user.id },
        select: { title: true, code: true },
      });
      if (course) {
        courseTitle = readableCourseTitle(course.title, course.code);
      }
    }

    const materialId = body.materialId?.trim();
    const materialSource = materialId
      ? (await loadChapterStudySourceText(user.id, materialId, 5000)) ??
        (await loadMaterialSourceText(user.id, materialId, 5000))
      : null;
    const courseSource =
      !materialSource && body.courseId?.trim()
        ? await loadCourseSourceText(user.id, body.courseId.trim(), 5000)
        : null;
    const sourceText = (materialSource?.text ?? courseSource?.text ?? "").slice(
      0,
      4500,
    );
    const lessonSummary = body.lessonSummary?.trim().slice(0, 2500) ?? "";
    const focusStepContext =
      body.focusStepContext?.trim().slice(0, 2000) ?? "";
    const learnPreferences = Array.isArray(body.learnPreferences)
      ? body.learnPreferences.filter((k) => typeof k === "string").slice(0, 12)
      : [];

    const parsedStyle = parseTeachingStyle(body.teachingStyle);
    if (parsedStyle === null) {
      return NextResponse.json(
        { success: false, error: "Unsupported teaching style." },
        { status: 400 },
      );
    }
    const resolvedStyle = resolveTeachingStyle({
      explicit: parsedStyle,
      messageHint: extractTeachingStyleHintFromMessage(message),
    }).style;

    if (!isAIConfigured()) {
      return NextResponse.json({
        success: true,
        offline: true,
        reply: offlineReply(guide.title, topic),
      });
    }

    const legacyInput = {
      userId: user.id,
      message,
      component,
      topic,
      courseTitle,
      lessonSummary,
      focusStepContext,
      sourceText,
      history,
    };

    if (isSixTutorUnifiedEnabled()) {
      try {
        const appSettings = await getUserAppSettings(user.id);
        const tutorRequest = await toTutorRequestFromSixTutor({
          learnerId: user.id,
          message,
          component,
          topic,
          courseId: body.courseId,
          materialId,
          history,
          lessonSummary,
          focusStepContext: focusStepContext || null,
          learnPreferences,
          courseTitle,
          sourceText,
          includeOpenAIPro: appSettings.aiUseOpenAIPro,
          ...(resolvedStyle ? { teachingStyle: resolvedStyle } : {}),
        });
        const tutorResponse = await runTutor(tutorRequest);
        return NextResponse.json({
          success: true,
          reply: tutorResponse.text.trim(),
        });
      } catch (unifiedError) {
        // Adapter / request-shape failures: safe to use legacy without a prior AI call.
        if (
          unifiedError instanceof SixTutorAdapterError ||
          unifiedError instanceof TutorRequestError
        ) {
          console.error(
            "SIX→Unified Tutor adapter failed; falling back to legacy SIX path:",
            unifiedError,
          );
          const reply = await runLegacySixTutorCompletion(legacyInput);
          return NextResponse.json({ success: true, reply });
        }
        // AI / runtime failures: do not retry legacy (would duplicate provider calls).
        console.error("SIX Unified Tutor path failed:", unifiedError);
        return NextResponse.json(
          {
            success: false,
            error: friendlyUserFacingAiError(unifiedError),
          },
          { status: 500 },
        );
      }
    }

    const reply = await runLegacySixTutorCompletion(legacyInput);
    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Six tutor failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: friendlyUserFacingAiError(error),
      },
      { status: 500 },
    );
  }
}
