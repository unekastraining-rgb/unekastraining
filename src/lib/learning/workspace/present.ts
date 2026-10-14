/**
 * Bundle F — Learning Workspace presentation helpers.
 * Presentation only — maps existing lesson chunks into instructional blocks.
 * Does not diagnose, decide, or write evidence.
 */

import type {
  InstructionalRole,
  SixLessonChunk,
  SixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";
import type { LearningExperienceContext } from "@/lib/learning/unified-experience";

export type LearningWorkspaceStageState =
  | "learn"
  | "think"
  | "practice"
  | "check"
  | "feedback"
  | "recall"
  | "complete";

export type InstructionalBlockKind =
  | "core-idea"
  | "why-matters"
  | "break-down"
  | "example"
  | "visual"
  | "common-trap"
  | "remember"
  | "your-turn"
  | "scenario"
  | "code"
  | "process";

export type InstructionalBlock = {
  kind: InstructionalBlockKind;
  label: string;
  title?: string;
  body: string;
  /** Visual treatment hint for the UI. */
  treatment:
    | "definition"
    | "prose"
    | "code"
    | "diagram"
    | "callout"
    | "steps"
    | "scenario";
};

export type LearningWorkspaceContext = {
  experience: LearningExperienceContext | null;
  stage: LearningWorkspaceStageState;
  pathTitle?: string;
  conceptTitle?: string;
  conceptPosition?: number;
  conceptTotal?: number;
  pathIsNotMastery: true;
  sixHowMessage?: string | null;
  sixTechnique?: string | null;
  learningObjective?: string | null;
  formativeRequired: boolean;
  formativeComplete: boolean;
};

export function roleToBlockKind(
  role: InstructionalRole | undefined,
): InstructionalBlockKind {
  switch (role) {
    case "context":
      return "why-matters";
    case "concept":
      return "core-idea";
    case "explain":
      return "core-idea";
    case "breakdown":
      return "break-down";
    case "worked":
      return "example";
    case "visualize":
      return "visual";
    case "clarify":
      return "common-trap";
    case "guided":
    case "check":
    case "apply":
      return "your-turn";
    case "problem":
      return "scenario";
    default:
      return "core-idea";
  }
}

export function blockLabel(kind: InstructionalBlockKind): string {
  switch (kind) {
    case "core-idea":
      return "Core idea";
    case "why-matters":
      return "Why this matters";
    case "break-down":
      return "Break it down";
    case "example":
      return "Example";
    case "visual":
      return "Visual";
    case "common-trap":
      return "Common trap";
    case "remember":
      return "Remember";
    case "your-turn":
      return "Your turn";
    case "scenario":
      return "Scenario";
    case "code":
      return "Code";
    case "process":
      return "Process";
  }
}

/**
 * Map one lesson chunk into distinct instructional blocks (not one wall of prose).
 */
export function instructionalBlocksFromChunk(
  chunk: SixLessonChunk,
): InstructionalBlock[] {
  const blocks: InstructionalBlock[] = [];
  const primaryKind = roleToBlockKind(chunk.role);
  const looksLikeCode =
    Boolean(chunk.example?.includes("{") || chunk.example?.includes(";")) ||
    /\b(class|public|void|SELECT|FROM|def |function )\b/.test(
      chunk.example ?? "",
    );

  if (chunk.explanation?.trim()) {
    blocks.push({
      kind: primaryKind === "your-turn" ? "core-idea" : primaryKind,
      label: blockLabel(
        primaryKind === "your-turn" ? "core-idea" : primaryKind,
      ),
      title: chunk.title,
      body: truncateInstruction(chunk.explanation, 2400),
      treatment:
        primaryKind === "why-matters"
          ? "prose"
          : primaryKind === "scenario"
            ? "scenario"
            : "definition",
    });
  }

  if (chunk.example?.trim()) {
    blocks.push({
      kind: looksLikeCode ? "code" : "example",
      label: looksLikeCode ? "Code" : "Example",
      body: chunk.example,
      treatment: looksLikeCode ? "code" : "scenario",
    });
  }

  if (chunk.representation?.trim()) {
    blocks.push({
      kind: "visual",
      label: "Visual",
      body: chunk.representation,
      treatment: "diagram",
    });
  }

  if (chunk.breakdown?.trim()) {
    blocks.push({
      kind: "break-down",
      label: "Break it down",
      body: chunk.breakdown,
      treatment: "steps",
    });
  }

  if (chunk.misconception?.trim()) {
    blocks.push({
      kind: "common-trap",
      label: "Common trap",
      body: chunk.misconception,
      treatment: "callout",
    });
  }

  if (chunk.memoryTrick?.trim()) {
    blocks.push({
      kind: "remember",
      label: "Remember",
      body: chunk.memoryTrick,
      treatment: "callout",
    });
  }

  return blocks;
}

function truncateInstruction(text: string, max: number): string {
  const t = text.trim();
  // Bundle G — prefer full instructional prose; only soft-trim extreme walls.
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastStop = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf(".\n"),
    cut.lastIndexOf("? "),
  );
  if (lastStop > max * 0.55) return cut.slice(0, lastStop + 1).trim();
  return `${cut.trim()}…`;
}

/** Whether this chunk should require a formative response before advancing. */
export function chunkRequiresFormativeAction(
  chunk: SixLessonChunk | null,
  options?: { isLastChunk?: boolean },
): boolean {
  if (!chunk) return Boolean(options?.isLastChunk);
  if (chunk.checkPrompt?.trim()) return true;
  if (
    chunk.role === "check" ||
    chunk.role === "guided" ||
    chunk.role === "apply"
  ) {
    return true;
  }
  return Boolean(options?.isLastChunk);
}

export function resolveWorkspaceStage(input: {
  hasLesson: boolean;
  formativeRequired: boolean;
  formativeComplete: boolean;
  hasResult: boolean;
  orchestratorAction?: string | null;
  isComplete?: boolean;
}): LearningWorkspaceStageState {
  if (input.isComplete || input.orchestratorAction === "complete") {
    return "complete";
  }
  if (input.orchestratorAction === "recall") return "recall";
  if (input.orchestratorAction === "practice") return "practice";
  if (input.hasResult) return "feedback";
  if (input.formativeRequired && !input.formativeComplete) return "think";
  if (input.hasLesson) return "learn";
  return "learn";
}

export function buildLearningWorkspaceContext(input: {
  experience: LearningExperienceContext | null;
  lesson: SixWorkedLesson | null;
  activeChunk: SixLessonChunk | null;
  formativeComplete: boolean;
  hasResult: boolean;
  stageOverride?: LearningWorkspaceStageState;
}): LearningWorkspaceContext {
  const isLast =
    Boolean(input.lesson) &&
    input.lesson!.chunks.length > 0 &&
    input.activeChunk ===
      input.lesson!.chunks[input.lesson!.chunks.length - 1];
  const formativeRequired = chunkRequiresFormativeAction(input.activeChunk, {
    isLastChunk: isLast,
  });
  const stage =
    input.stageOverride ??
    resolveWorkspaceStage({
      hasLesson: Boolean(input.lesson),
      formativeRequired,
      formativeComplete: input.formativeComplete,
      hasResult: input.hasResult,
      orchestratorAction: input.experience?.orchestratorDecision?.action,
      isComplete: input.experience?.isComplete,
    });

  const path = input.experience?.path;
  const concept = input.experience?.currentConcept;

  return {
    experience: input.experience,
    stage,
    pathTitle: path?.title ?? input.experience?.target.topic,
    conceptTitle:
      concept?.title ??
      input.activeChunk?.title ??
      input.experience?.target.topic,
    conceptPosition: concept?.position ?? (path ? path.currentIndex + 1 : undefined),
    conceptTotal: concept?.total ?? path?.total,
    pathIsNotMastery: true,
    sixHowMessage: input.experience?.sixHowMessage,
    sixTechnique: input.experience?.sixRecommendation?.technique ?? null,
    learningObjective:
      input.lesson?.learningFrame?.trim() ||
      input.activeChunk?.title ||
      null,
    formativeRequired,
    formativeComplete: input.formativeComplete,
  };
}

export function sixApproachTitle(technique?: string | null): string | null {
  if (!technique) return null;
  const t = technique.toLowerCase();
  if (t.includes("feynman")) return "Teach it back";
  if (t.includes("visual")) return "See the connection";
  if (t.includes("hands") || t.includes("practice")) return "Apply it";
  if (t.includes("recall") || t.includes("active")) return "No looking";
  if (t.includes("chunk")) return "Break it down";
  if (t.includes("detailed") || t.includes("explanation")) {
    return "Understand the idea";
  }
  return "How you'll learn this";
}

export function actionDeckPromptFromChunk(
  chunk: SixLessonChunk | null,
  topic: string,
): string {
  if (chunk?.checkPrompt?.trim()) return chunk.checkPrompt.trim();
  if (chunk?.title) {
    return `In your own words, explain ${chunk.title} and give one concrete example.`;
  }
  return `Explain ${topic} in your own words and give one concrete example.`;
}
