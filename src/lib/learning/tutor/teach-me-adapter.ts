import { db } from "@/lib/db";
import type { TutorRequest } from "@/lib/learning/tutor/types";

export interface TeachMeEvaluationResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
}

export interface TeachMeLegacyInput {
  learnerId: string;
  userResponse: string;
  topic?: string | null;
  courseId?: string | null;
  materialId?: string | null;
  /** Pre-built source block from the evaluate route (may be empty). */
  sourceBlock: string;
  coldStartHint?: string;
  sourceModeInstruction: string;
  includeOpenAIPro?: boolean;
  /** 2P-20 — optional Teaching Style (feedback phrasing only). */
  teachingStyle?: TutorRequest["teachingStyle"];
}

export class TeachMeAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeachMeAdapterError";
  }
}

/** Same JSON parse the legacy evaluate route uses. */
export function parseTeachMeEvaluation(content: string): TeachMeEvaluationResult {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? content).trim();
  const parsed = JSON.parse(raw) as TeachMeEvaluationResult;
  return {
    score: parsed.score,
    summary: parsed.summary,
    strengths: parsed.strengths ?? [],
    gaps: parsed.gaps ?? [],
    misconceptions: parsed.misconceptions ?? [],
    nextSteps: parsed.nextSteps ?? [],
  };
}

/**
 * Teach Me / Feynman teach-back system rules — preserved from legacy evaluate route.
 */
export function buildTeachMeInstructionalContext(): string {
  return "You evaluate Feynman teach-back explanations. Check accuracy, completeness, misconceptions. Respond JSON only.";
}

/**
 * User payload matching the legacy teach-me evaluate prompt.
 */
export function buildTeachMeUserPayload(input: {
  topic?: string | null;
  sourceBlock: string;
  coldStartHint?: string;
  userResponse: string;
  sourceModeInstruction: string;
}): string {
  return `Topic: ${input.topic?.trim() || "General concept"}
${input.sourceBlock ? `\nREFERENCE MATERIAL:\n${input.sourceBlock}` : ""}${input.coldStartHint ?? ""}

STUDENT EXPLANATION (teaching back):
${input.userResponse}

${input.sourceModeInstruction}

Return ONLY JSON:
{
  "score": 0-100,
  "summary": "one sentence",
  "strengths": ["..."],
  "gaps": ["missing ideas"],
  "misconceptions": ["..."],
  "nextSteps": ["how to improve the explanation"]
}`;
}

/** Existing Concept linked to a matching Topic — never create. */
export async function resolveExistingTeachMeConceptIds(input: {
  learnerId: string;
  topic?: string | null;
  courseId?: string | null;
}): Promise<string[]> {
  const topicName = input.topic?.trim();
  if (!topicName || !input.courseId?.trim()) return [];

  try {
    const topic = await db.topic.findFirst({
      where: {
        courseId: input.courseId.trim(),
        name: { contains: topicName },
        course: { userId: input.learnerId },
      },
      select: { conceptId: true },
    });
    return topic?.conceptId ? [topic.conceptId] : [];
  } catch (error) {
    console.error("Teach Me concept resolve failed (continuing without):", error);
    return [];
  }
}

/** Existing LearningSpace for a course only — never create. */
export async function resolveExistingTeachMeLearningSpaceId(input: {
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
    console.error("Teach Me learning-space resolve failed:", error);
    return null;
  }
}

/**
 * Convert Teach Me evaluate request into canonical TutorRequest.
 *
 * Mode TEACH_ME: matches Feynman teach-back (explain in own words, then scored).
 *
 * evidenceIntent "none": mastery evidence remains on the existing
 * recordStudyEvaluateEvidence bridge (EXPLAIN facet) after scoring —
 * do not double-write via Tutor evidence in this phase.
 */
export async function toTutorRequestFromTeachMe(
  input: TeachMeLegacyInput,
): Promise<TutorRequest> {
  const userResponse = input.userResponse.trim();
  if (!userResponse) {
    throw new TeachMeAdapterError("userResponse is required.");
  }

  const [conceptIds, learningSpaceId] = await Promise.all([
    resolveExistingTeachMeConceptIds({
      learnerId: input.learnerId,
      topic: input.topic,
      courseId: input.courseId,
    }),
    resolveExistingTeachMeLearningSpaceId({
      learnerId: input.learnerId,
      courseId: input.courseId,
    }),
  ]);

  const userPayload = buildTeachMeUserPayload({
    topic: input.topic,
    sourceBlock: input.sourceBlock,
    coldStartHint: input.coldStartHint,
    userResponse,
    sourceModeInstruction: input.sourceModeInstruction,
  });

  return {
    learnerId: input.learnerId,
    mode: "TEACH_ME",
    message: userPayload,
    // Demonstration is embedded in message (legacy prompt parity).
    // Do not also set learnerDemonstration — runTutor would append it twice.
    conceptIds: conceptIds.length ? conceptIds : undefined,
    learningSpaceId,
    subjectDomain: null,
    activityId: input.materialId ?? null,
    signal: "teach_me:evaluate",
    modality: "text",
    history: undefined,
    evidenceIntent: "none",
    evidenceAuthorizedByServer: false,
    instructionalContext: buildTeachMeInstructionalContext(),
    temperature: 0.2,
    maxTokens: 2048,
    jsonMode: true,
    includeOpenAIPro: input.includeOpenAIPro,
    ...(input.teachingStyle ? { teachingStyle: input.teachingStyle } : {}),
  };
}
