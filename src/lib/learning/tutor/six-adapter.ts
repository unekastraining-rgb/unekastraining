import type { SixComponent } from "@/lib/csl/six";
import { SIX_GUIDES, isSixGuideComponent } from "@/lib/csl/six-guides";
import { db } from "@/lib/db";
import {
  instructionalSourceForTeaching,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import "@/lib/learning/knowledge/packs";
import type { TutorRequest } from "@/lib/learning/tutor/types";

export interface SixTutorLegacyInput {
  learnerId: string;
  message: string;
  component: string;
  topic: string;
  courseId?: string | null;
  materialId?: string | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  lessonSummary?: string | null;
  /** Current instructional step the learner is looking at (chunk/code). */
  focusStepContext?: string | null;
  courseTitle?: string | null;
  sourceText?: string | null;
  includeOpenAIPro?: boolean;
  /** 2P-19 — optional Teaching Style (presentation only). */
  teachingStyle?: TutorRequest["teachingStyle"];
  /** Soft learn-preference keys for contextual coaching. */
  learnPreferences?: string[] | null;
}

export class SixTutorAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SixTutorAdapterError";
  }
}

/** Same SIX coaching rules the legacy route embeds in its system prompt. */
export function buildSixTutorInstructionalContext(input: {
  component: SixComponent;
  topic: string;
}): string {
  const guide = SIX_GUIDES[input.component];
  return `You are Study Haul's Six Tutor — a live coach inside the ${guide.title} technique.

Hard rules:
1. Teach the TOPIC using ${guide.title} (${guide.whatItMeans}). Do not abandon the technique for a generic ChatGPT dump.
2. Stay concrete: examples, analogies, short steps. Prefer the student's course modules when context is given.
3. Never invent syllabus admin as content (instructor info, grading policy, important dates).
4. Keep replies concise (usually under 180 words) unless they ask to go deeper.
5. End with one short follow-up question or try-this prompt that uses ${guide.title}.

Technique: ${guide.title} (${input.component})
Topic: ${input.topic}`;
}

/**
 * Look up an existing Concept linked to a matching Topic — never create.
 */
export async function resolveExistingSixConceptIds(input: {
  learnerId: string;
  topic: string;
  courseId?: string | null;
}): Promise<string[]> {
  const topicName = input.topic.trim();
  if (!topicName || topicName === "this topic") return [];

  try {
    if (input.courseId?.trim()) {
      const topic = await db.topic.findFirst({
        where: {
          courseId: input.courseId.trim(),
          name: topicName,
          course: { userId: input.learnerId },
        },
        select: { conceptId: true },
      });
      if (topic?.conceptId) return [topic.conceptId];
      return [];
    }

    const concept = await db.concept.findFirst({
      where: {
        userId: input.learnerId,
        title: topicName,
      },
      select: { id: true },
    });
    return concept ? [concept.id] : [];
  } catch (error) {
    console.error("SIX Tutor concept resolve failed (continuing without):", error);
    return [];
  }
}

/**
 * Existing LearningSpace for a course only — never create.
 */
export async function resolveExistingSixLearningSpaceId(input: {
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
    console.error("SIX Tutor learning-space resolve failed:", error);
    return null;
  }
}

/**
 * Convert legacy SIX Tutor request into canonical TutorRequest.
 * Mode GUIDED matches live technique coaching; SIX rules stay in instructionalContext.
 * Ordinary chat → evidenceIntent "none" (legacy SIX Tutor does not emit mastery evidence).
 */
export async function toTutorRequestFromSixTutor(
  input: SixTutorLegacyInput,
): Promise<TutorRequest> {
  const message = input.message.trim();
  if (!message) {
    throw new SixTutorAdapterError("message is required");
  }
  if (!isSixGuideComponent(input.component)) {
    throw new SixTutorAdapterError("Unknown Six technique.");
  }

  const topic = input.topic.trim() || "this topic";
  const history = (input.history ?? [])
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim(),
    )
    .map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content.trim().slice(0, 2000),
    }))
    .slice(-8);

  const [conceptIds, learningSpaceId] = await Promise.all([
    resolveExistingSixConceptIds({
      learnerId: input.learnerId,
      topic,
      courseId: input.courseId,
    }),
    resolveExistingSixLearningSpaceId({
      learnerId: input.learnerId,
      courseId: input.courseId,
    }),
  ]);

  const knowledge = resolveInstructionalKnowledge(topic);
  const knowledgeBrief = knowledge
    ? `INSTRUCTIONAL KNOWLEDGE (same library Learn uses — teach from this, not from syllabus text):\n${knowledge.pack.concepts
        .slice(0, 6)
        .map(
          (c) =>
            `- ${c.title}: ${(c.definition ?? c.explanation).slice(0, 220)}`,
        )
        .join("\n")}`
    : null;

  const usableSource = instructionalSourceForTeaching(input.sourceText);

  const sessionBits = [
    input.courseTitle ? `Course: ${input.courseTitle}` : null,
    input.focusStepContext?.trim()
      ? `CURRENT LESSON STEP (learner is looking at this right now — answer about THIS unless they ask about something else):\n${input.focusStepContext.trim().slice(0, 2000)}`
      : null,
    input.lessonSummary?.trim()
      ? `Worked example / lesson already shown to the student:\n${input.lessonSummary.trim().slice(0, 2500)}`
      : null,
    knowledgeBrief,
    input.learnPreferences && input.learnPreferences.length > 0
      ? `Learner preference signals (soft): ${input.learnPreferences.join(", ")}`
      : null,
    usableSource
      ? `Course material (instructional grounding only):\n${usableSource.slice(0, 4500)}`
      : null,
  ].filter(Boolean);

  const instructionalContext = [
    buildSixTutorInstructionalContext({
      component: input.component,
      topic,
    }),
    sessionBits.length ? `\n${sessionBits.join("\n\n")}` : "",
  ].join("");

  return {
    learnerId: input.learnerId,
    mode: "GUIDED",
    message,
    conceptIds: conceptIds.length ? conceptIds : undefined,
    learningSpaceId,
    subjectDomain: null,
    activityId: input.component,
    signal: `six:${input.component}`,
    modality: "text",
    history,
    evidenceIntent: "none",
    evidenceAuthorizedByServer: false,
    instructionalContext,
    // Match legacy SIX Tutor completion options.
    temperature: 0.4,
    maxTokens: 1200,
    includeOpenAIPro: input.includeOpenAIPro,
    ...(input.teachingStyle ? { teachingStyle: input.teachingStyle } : {}),
  };
}

/** Exported for tests — confirms technique title is preserved in context. */
export function sixTechniqueTitle(component: string): string | null {
  if (!isSixGuideComponent(component)) return null;
  return SIX_GUIDES[component].title;
}
