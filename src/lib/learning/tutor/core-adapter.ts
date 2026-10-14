import { db } from "@/lib/db";
import type { TutorRequest } from "@/lib/learning/tutor/types";

export interface CoreAssistLegacyInput {
  learnerId: string;
  message: string;
  courseId?: string | null;
  materialId?: string | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Course/notebook title label shown in the legacy prompt. */
  courseTitle?: string | null;
  /** Raw source / notebook text (already budget-sliced by the route). */
  rawSourceBlock: string;
  /** Formatted study extract block, or empty when unused. */
  studyBlock: string;
  /** From app settings — aiSourceInstruction(...) text. */
  aiSourceInstruction: string;
  includeOpenAIPro?: boolean;
  /**
   * Confirmed Concept IDs from CORE Knowledge bridge (Phase 2E-1).
   * Only when STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE is ON and IDs are owned.
   */
  conceptIds?: string[];
  /**
   * Optional Teaching Style (2P-19/20). Presentation only — not document truth.
   */
  teachingStyle?: TutorRequest["teachingStyle"];
}

export class CoreAssistAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoreAssistAdapterError";
  }
}

export interface CoreAssistParsedReply {
  answer: string;
  citations: Array<{ label: string; excerpt: string }>;
}

/** Same JSON parse the legacy CORE chat route uses. */
export function parseCoreAssistChatResponse(content: string): CoreAssistParsedReply {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? content).trim();
  const parsed = JSON.parse(raw) as {
    answer: string;
    citations: Array<{ label: string; excerpt: string }>;
  };
  return {
    answer: parsed.answer,
    citations: parsed.citations ?? [],
  };
}

/**
 * CORE Assist system rules — source-grounded NotebookLM-style assistant.
 * Preserved verbatim from the legacy route.
 */
export function buildCoreAssistInstructionalContext(input: {
  hasStudyExtract: boolean;
}): string {
  return input.hasStudyExtract
    ? "You are a source-grounded study assistant. Prefer the STUDY EXTRACT (exam-worthy concepts) for quizzes, flashcards, explanations, and comparisons. Use RAW SOURCE only for extra context or quotes. Do not invent facts. Cite short excerpts. Respond JSON only."
    : "You are a source-grounded study assistant like NotebookLM. Answer only from the provided source. Cite short excerpts. Respond JSON only.";
}

/**
 * User payload matching the legacy CORE chat prompt shape (source + question + JSON schema).
 * History is embedded as PRIOR CHAT (last 6), same as the legacy route — not duplicated as Tutor turns.
 */
export function buildCoreAssistUserPayload(input: {
  message: string;
  courseTitle?: string | null;
  aiSourceInstruction: string;
  studyBlock: string;
  rawSourceBlock: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): string {
  const historyBlock = (input.history ?? [])
    .slice(-6)
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n");

  return `Course/source: ${input.courseTitle ?? "Notebook"}
${input.aiSourceInstruction}

${
  input.studyBlock
    ? `STUDY EXTRACT (prioritize for quiz/flashcard/testable questions):\n${input.studyBlock}\n\nRAW SOURCE (fallback context):\n${input.rawSourceBlock}`
    : `SOURCE MATERIAL:\n${input.rawSourceBlock}`
}

${historyBlock ? `PRIOR CHAT:\n${historyBlock}\n` : ""}
STUDENT QUESTION:
${input.message}

Return ONLY JSON:
{
  "answer": "clear helpful answer in markdown",
  "citations": [
    { "label": "short source label", "excerpt": "quoted phrase from source" }
  ]
}`;
}

/** Existing LearningSpace for a course only — never create. */
export async function resolveExistingCoreLearningSpaceId(input: {
  learnerId: string;
  courseId?: string | null;
}): Promise<string | null> {
  if (!input.courseId?.trim()) return null;
  try {
    const space = await db.learningSpace.findFirst({
      where: {
        userId: input.learnerId,
        courseId: input.courseId.trim(),
      },
      select: { id: true },
    });
    return space?.id ?? null;
  } catch (error) {
    console.error("CORE Assist learning-space resolve failed:", error);
    return null;
  }
}

/**
 * Convert legacy CORE Assist request into canonical TutorRequest.
 *
 * Mode TEACH_ME: CORE Assist primarily explains/answers from source material
 * (NotebookLM-style grounded Q&A), not SIX coaching, practice scoring, or exams.
 * The real CORE behavior lives in instructionalContext + user payload.
 *
 * evidenceIntent "none": ordinary source chat is not mastery evidence.
 */
export async function toTutorRequestFromCoreAssist(
  input: CoreAssistLegacyInput,
): Promise<TutorRequest> {
  const message = input.message.trim();
  if (!message) {
    throw new CoreAssistAdapterError("Message is required.");
  }
  if (!input.rawSourceBlock.trim() && !input.studyBlock.trim()) {
    throw new CoreAssistAdapterError(
      "No source text found. Paste into Core, or upload materials on Courses.",
    );
  }

  const hasStudyExtract = Boolean(input.studyBlock.trim());
  const learningSpaceId = await resolveExistingCoreLearningSpaceId({
    learnerId: input.learnerId,
    courseId: input.courseId,
  });

  const userPayload = buildCoreAssistUserPayload({
    message,
    courseTitle: input.courseTitle,
    aiSourceInstruction: input.aiSourceInstruction,
    studyBlock: input.studyBlock,
    rawSourceBlock: input.rawSourceBlock,
    history: input.history,
  });

  return {
    learnerId: input.learnerId,
    mode: "TEACH_ME",
    message: userPayload,
    // History already embedded as PRIOR CHAT in message (legacy parity); avoid double-send.
    history: undefined,
    conceptIds:
      input.conceptIds && input.conceptIds.length > 0
        ? input.conceptIds.slice(0, 5)
        : undefined,
    learningSpaceId,
    subjectDomain: null,
    activityId: input.materialId ?? input.courseId ?? null,
    signal: "core:source_chat",
    modality: "text",
    evidenceIntent: "none",
    evidenceAuthorizedByServer: false,
    instructionalContext: buildCoreAssistInstructionalContext({
      hasStudyExtract,
    }),
    temperature: 0.2,
    maxTokens: 2048,
    jsonMode: true,
    includeOpenAIPro: input.includeOpenAIPro,
    ...(input.teachingStyle ? { teachingStyle: input.teachingStyle } : {}),
  };
}
