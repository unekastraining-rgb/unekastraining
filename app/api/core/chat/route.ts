import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { loadCourseSourceText, loadMaterialSourceText } from "@/lib/ai/course-source";
import type { AIMessage } from "@/lib/ai/types";
import {
  formatStudyExtractContext,
  loadPersistedStudyExtract,
  readStudyExtractFromUnknown,
} from "@/lib/core/study-extract-store";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import {
  CoreAssistAdapterError,
  buildCoreAssistInstructionalContext,
  buildCoreAssistUserPayload,
  parseCoreAssistChatResponse,
  toTutorRequestFromCoreAssist,
} from "@/lib/learning/tutor/core-adapter";
import { isCoreAssistUnifiedEnabled } from "@/lib/learning/tutor/core-feature-flag";
import { loadLinkedConceptIdsForCoreContext } from "@/lib/learning/knowledge/core-bridge";
import { isCoreKnowledgeBridgeEnabled } from "@/lib/learning/knowledge/core-bridge-flag";
import { runTutor, TutorRequestError } from "@/lib/learning/tutor/service";
import {
  extractTeachingStyleHintFromMessage,
  parseTeachingStyle,
  resolveTeachingStyle,
} from "@/lib/learning/tutor/teaching-style";
import { aiSourceInstruction, getUserAppSettings } from "@/lib/settings/app-settings";
import { requireUser } from "@/lib/user";

type CoreChatBody = {
  message?: string;
  courseId?: string;
  materialId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  studyExtract?: unknown;
  sourceText?: string;
  /** 2P-20 — optional Teaching Style. */
  teachingStyle?: unknown;
};

/** Legacy CORE Assist AI path — unchanged when feature flag is OFF. */
async function runLegacyCoreAssistCompletion(input: {
  studyBlock: string;
  userPayload: string;
  includeOpenAIPro: boolean;
}): Promise<{ answer: string; citations: Array<{ label: string; excerpt: string }> }> {
  const system = buildCoreAssistInstructionalContext({
    hasStudyExtract: Boolean(input.studyBlock.trim()),
  });
  const messages: AIMessage[] = [
    { role: "system", content: system },
    { role: "user", content: input.userPayload },
  ];

  const result = await aiService.complete(messages, {
    temperature: 0.2,
    maxTokens: 2048,
    includeOpenAIPro: input.includeOpenAIPro,
  });

  return parseCoreAssistChatResponse(result.content);
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as CoreChatBody;
    const {
      message,
      courseId,
      materialId,
      history = [],
      studyExtract: clientExtract,
      sourceText: pastedSource,
    } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 },
      );
    }

    const notebookText = typeof pastedSource === "string" ? pastedSource.trim() : "";

    if (!courseId && !materialId && !notebookText && !clientExtract) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select a course or material first, or paste source into the notebook.",
        },
        { status: 400 },
      );
    }

    const loaded = materialId
      ? await loadMaterialSourceText(user.id, materialId)
      : courseId
        ? await loadCourseSourceText(user.id, courseId, 14000)
        : null;

    const source = loaded?.text?.trim()
      ? loaded
      : notebookText
        ? { text: notebookText.slice(0, 14000), courseTitle: "Notebook page" }
        : loaded;

    if (!source?.text?.trim() && !clientExtract) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No source text found. Paste into Core, or upload materials on Courses.",
        },
        { status: 400 },
      );
    }

    const fromClient = readStudyExtractFromUnknown(clientExtract);
    const fromNotes =
      fromClient ??
      (await loadPersistedStudyExtract({
        userId: user.id,
        materialId,
        courseId,
      }));

    const studyBlock = fromNotes
      ? formatStudyExtractContext(fromNotes as ChapterStudyExtract, {
          maxChars: 12000,
        })
      : "";

    const rawBudget = studyBlock ? 6000 : 14000;
    const rawBlock = (source?.text ?? notebookText).slice(0, rawBudget);

    const appSettings = await getUserAppSettings(user.id);
    const sourceModeInstruction = aiSourceInstruction(appSettings.aiSourceMode);
    const chatHistory = Array.isArray(history) ? history : [];

    const userPayload = buildCoreAssistUserPayload({
      message: message.trim(),
      courseTitle: source?.courseTitle ?? "Notebook",
      aiSourceInstruction: sourceModeInstruction,
      studyBlock,
      rawSourceBlock: rawBlock,
      history: chatHistory,
    });

    const legacyArgs = {
      studyBlock,
      userPayload,
      includeOpenAIPro: appSettings.aiUseOpenAIPro,
    };

    if (isCoreAssistUnifiedEnabled()) {
      try {
        const parsedStyle = parseTeachingStyle(body.teachingStyle);
        if (parsedStyle === null) {
          return NextResponse.json(
            { success: false, error: "Unsupported teaching style." },
            { status: 400 },
          );
        }
        const resolvedStyle = resolveTeachingStyle({
          explicit: parsedStyle,
          messageHint: extractTeachingStyleHintFromMessage(message.trim()),
        }).style;

        const conceptIds =
          isCoreKnowledgeBridgeEnabled()
            ? await loadLinkedConceptIdsForCoreContext({
                userId: user.id,
                courseId,
                materialId,
              })
            : [];

        const tutorRequest = await toTutorRequestFromCoreAssist({
          learnerId: user.id,
          message: message.trim(),
          courseId,
          materialId,
          history: chatHistory,
          courseTitle: source?.courseTitle ?? "Notebook",
          rawSourceBlock: rawBlock,
          studyBlock,
          aiSourceInstruction: sourceModeInstruction,
          includeOpenAIPro: appSettings.aiUseOpenAIPro,
          conceptIds,
          ...(resolvedStyle ? { teachingStyle: resolvedStyle } : {}),
        });
        const tutorResponse = await runTutor(tutorRequest);
        const parsed = parseCoreAssistChatResponse(tutorResponse.text);
        return NextResponse.json({
          success: true,
          data: {
            answer: parsed.answer,
            citations: parsed.citations,
            usedStudyExtract: Boolean(studyBlock),
          },
        });
      } catch (unifiedError) {
        if (
          unifiedError instanceof CoreAssistAdapterError ||
          unifiedError instanceof TutorRequestError
        ) {
          console.error(
            "CORE→Unified Tutor adapter failed; falling back to legacy CORE Assist path:",
            unifiedError,
          );
          const parsed = await runLegacyCoreAssistCompletion(legacyArgs);
          return NextResponse.json({
            success: true,
            data: {
              answer: parsed.answer,
              citations: parsed.citations,
              usedStudyExtract: Boolean(studyBlock),
            },
          });
        }
        // AI / parse failures: do not retry legacy (would duplicate provider calls).
        console.error("CORE Unified Tutor path failed:", unifiedError);
        const errMessage =
          unifiedError instanceof Error ? unifiedError.message : "Chat failed.";
        return NextResponse.json(
          { success: false, error: errMessage },
          { status: 500 },
        );
      }
    }

    const parsed = await runLegacyCoreAssistCompletion(legacyArgs);
    return NextResponse.json({
      success: true,
      data: {
        answer: parsed.answer,
        citations: parsed.citations,
        usedStudyExtract: Boolean(studyBlock),
      },
    });
  } catch (error) {
    console.error("Core source chat failed:", error);
    const message = error instanceof Error ? error.message : "Chat failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
