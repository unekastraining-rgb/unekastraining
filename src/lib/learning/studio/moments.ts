/**
 * Bundle G — Map lesson chunks → instructional moments + studio stage.
 */

import type { SixLessonChunk, SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import type { TeachingDepthSection } from "@/lib/learning/teach/depth";
import {
  resolveChunkInteraction,
} from "@/lib/learning/studio/interactions";
import type {
  InstructionalMoment,
  LearningStudioStage,
} from "@/lib/learning/studio/types";

export function studioStageFromChunk(
  chunk: SixLessonChunk,
  options?: { formativeComplete?: boolean; hasResult?: boolean; isComplete?: boolean },
): LearningStudioStage {
  if (options?.isComplete) return "complete";
  if (options?.hasResult && options.formativeComplete) {
    // stay in check/apply after feedback until advance
  }
  switch (chunk.role) {
    case "visualize":
      return "explore";
    case "worked":
    case "breakdown":
      return "explore";
    case "guided":
      return "try";
    case "check":
      return "check";
    case "apply":
      return options?.formativeComplete ? "transfer" : "apply";
    case "clarify":
      return "check";
    case "next":
      return "complete";
    default:
      return "understand";
  }
}

export function depthSectionHintFromChunk(
  chunk: SixLessonChunk,
): TeachingDepthSection | undefined {
  switch (chunk.role) {
    case "context":
    case "problem":
    case "concept":
    case "explain":
      return "foundation";
    case "breakdown":
      return "breakdown";
    case "visualize":
      return "connections";
    case "worked":
      return "example";
    case "clarify":
      return "contrast";
    case "apply":
    case "guided":
      return "application";
    case "check":
      return "understanding-check";
    default:
      if (/connect|path|relat/i.test(chunk.title)) return "connections";
      if (/watch|trap|misconception/i.test(chunk.title)) return "contrast";
      if (/apply|transfer/i.test(chunk.title)) return "application";
      if (/check|retrieve/i.test(chunk.title)) return "understanding-check";
      return undefined;
  }
}

export function buildInstructionalMoments(input: {
  lesson: SixWorkedLesson;
  conceptTitle: string;
  topic: string;
  neighborTitles?: string[];
  depthSections?: TeachingDepthSection[];
}): InstructionalMoment[] {
  const { lesson, conceptTitle, topic, neighborTitles } = input;
  return lesson.chunks.map((chunk, chunkIndex) => {
    const depthSection =
      input.depthSections?.[chunkIndex] ?? depthSectionHintFromChunk(chunk);
    const studioStage = studioStageFromChunk(chunk);
    const needsInteraction =
      Boolean(chunk.checkPrompt?.trim()) ||
      chunk.role === "check" ||
      chunk.role === "guided" ||
      chunk.role === "apply" ||
      chunk.role === "clarify" ||
      chunkIndex === lesson.chunks.length - 1;

    const momentKind =
      chunk.role === "apply"
        ? ("transfer" as const)
        : chunk.role === "check" || chunk.role === "clarify"
          ? ("recognize" as const)
          : chunk.role === "guided"
            ? ("apply" as const)
            : ("auto" as const);

    return {
      id: `moment-${chunkIndex}`,
      chunkIndex,
      depthSection,
      studioStage,
      title: chunk.title,
      interaction: needsInteraction
        ? resolveChunkInteraction({
            chunk,
            conceptTitle,
            topic,
            neighborTitles,
            lesson,
            momentKind,
          })
        : null,
    };
  });
}

export const STUDIO_STAGE_SEQUENCE: LearningStudioStage[] = [
  "understand",
  "explore",
  "try",
  "check",
  "apply",
  "transfer",
  "recall",
];

export function studioStageLabel(stage: LearningStudioStage): string {
  switch (stage) {
    case "understand":
      return "Understand";
    case "explore":
      return "Explore";
    case "try":
      return "Try";
    case "check":
      return "Check";
    case "apply":
      return "Apply";
    case "transfer":
      return "Transfer";
    case "recall":
      return "Recall";
    case "complete":
      return "Complete";
  }
}
