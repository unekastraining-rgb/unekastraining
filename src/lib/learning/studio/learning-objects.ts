/**
 * Bundle G UX — Learning object presentation model.
 * Maps existing lesson chunks / interactions into stage-dominant objects.
 * Presentation only — no intelligence decisions.
 */

import type { SixLessonChunk } from "@/lib/csl/six-worked-lesson";
import type {
  LearningInteraction,
  LearningStudioStage,
} from "@/lib/learning/studio/types";

/** Dominant visual/interactive object for the Learning Stage. */
export type LearningObjectKind =
  | "explanation"
  | "visual-model"
  | "comparison"
  | "scenario"
  | "prediction"
  | "classification"
  | "ordering"
  | "inspect"
  | "code"
  | "equation"
  | "timeline"
  | "example"
  | "practice"
  | "apply"
  | "explain"
  | "recall"
  | "assessment"
  | "feedback";

export type LearningObject = {
  kind: LearningObjectKind;
  /** Short label for “what am I looking at?” */
  objectLabel: string;
  title: string;
  /** Concise lead — not a wall of text. Prefer ≤ 2 short sentences. */
  lead?: string;
  /** Primary visual / structural body (diagram, code, scenario stem). */
  primary?: string;
  /** Secondary supporting lines (steps, comparison columns, etc.). */
  secondary?: string;
  /** Optional trap / contrast callout. */
  contrast?: string;
  /** Treatment hint for rendering. */
  treatment:
    | "prose"
    | "diagram"
    | "code"
    | "scenario"
    | "comparison"
    | "steps"
    | "callout"
    | "assessment";
  interaction?: LearningInteraction | null;
  studioStage: LearningStudioStage;
};

function firstSentences(text: string, max = 2): string {
  const t = text.trim();
  if (!t) return "";
  const parts = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length <= max) {
    // Soft cap long single blobs without inventing filler
    if (t.length > 320) return `${t.slice(0, 300).trim()}…`;
    return t;
  }
  return parts.slice(0, max).join(" ");
}

function looksLikeCode(text: string | undefined): boolean {
  if (!text) return false;
  return (
    /[{;}]/.test(text) ||
    /\b(class|public|void|SELECT|FROM|def |function |extends )\b/.test(text)
  );
}

function looksLikeEquation(text: string | undefined): boolean {
  if (!text) return false;
  return /[=∑∫√]/.test(text) || /\b(x\s*=|y\s*=|\d+x)\b/.test(text);
}

function parseComparison(text: string): { left: string; right: string } | null {
  // Arrow chains are relationship maps, not two-column comparisons.
  if (/\s*→\s*/.test(text) && (text.match(/→/g)?.length ?? 0) >= 2) {
    return null;
  }
  if (/\bvs\.?\b|versus|↔/i.test(text)) {
    const lines = text
      .split(/\n|↔|vs\.?|versus/i)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length >= 2) {
      return { left: lines[0]!, right: lines[1]! };
    }
  }
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 2 && text.length < 220) {
    return { left: lines[0]!, right: lines[1]! };
  }
  return null;
}

/**
 * Build the dominant learning object for the current moment from existing chunk fields.
 * Does not invent filler paragraphs when content is thin.
 */
export function learningObjectFromChunk(input: {
  chunk: SixLessonChunk;
  studioStage: LearningStudioStage;
  interaction?: LearningInteraction | null;
  stageMode?: "teach" | "interact" | "feedback" | "assess";
  feedbackSummary?: string | null;
}): LearningObject {
  const { chunk, studioStage, interaction } = input;
  const stageMode = input.stageMode ?? "teach";

  if (stageMode === "feedback") {
    return {
      kind: "feedback",
      objectLabel: "Feedback",
      title: "How you did",
      lead: input.feedbackSummary?.trim() || "Review the distinction, then continue.",
      treatment: "callout",
      studioStage,
      interaction: null,
    };
  }

  if (stageMode === "assess" || studioStage === "check") {
    return {
      kind: "assessment",
      objectLabel: "Check your understanding",
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: interaction?.prompt ?? chunk.checkPrompt,
      treatment: "assessment",
      studioStage: "check",
      interaction: interaction ?? null,
    };
  }

  if (
    stageMode === "interact" &&
    interaction &&
    (studioStage === "try" ||
      studioStage === "apply" ||
      studioStage === "transfer" ||
      interaction.kind === "select" ||
      interaction.kind === "transfer" ||
      interaction.kind === "apply")
  ) {
    const kind: LearningObjectKind =
      interaction.kind === "transfer"
        ? "apply"
        : interaction.kind === "select"
          ? "prediction"
          : interaction.kind === "explain"
            ? "explain"
            : "practice";
    return {
      kind,
      objectLabel:
        interaction.label ??
        (kind === "apply"
          ? "Apply"
          : kind === "prediction"
            ? "Your turn"
            : "Practice"),
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: interaction.prompt,
      secondary: chunk.example?.trim() || undefined,
      treatment: "assessment",
      studioStage,
      interaction,
    };
  }

  // Visual / relationship dominant
  if (
    chunk.role === "visualize" ||
    (chunk.representation?.trim() &&
      (studioStage === "explore" || chunk.role === "concept"))
  ) {
    if (chunk.representation?.trim()) {
      const cmp = parseComparison(chunk.representation);
      const isRelationshipMap =
        !cmp &&
        (/\s*→\s*/.test(chunk.representation) ||
          /prerequisite|related|relationship/i.test(
            `${chunk.title}\n${chunk.representation}`,
          ));
      return {
        kind: cmp ? "comparison" : "visual-model",
        objectLabel: cmp
          ? "Comparison"
          : isRelationshipMap
            ? "Concept relationships"
            : "Visual model",
        title: chunk.title,
        lead: firstSentences(chunk.explanation, 1) || undefined,
        primary: chunk.representation.trim(),
        secondary: chunk.example?.trim() || undefined,
        treatment: cmp ? "comparison" : "diagram",
        studioStage,
        interaction: null,
      };
    }
  }

  if (chunk.role === "clarify" && chunk.misconception?.trim()) {
    return {
      kind: "comparison",
      objectLabel: "Watch for",
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: chunk.misconception.trim(),
      secondary: chunk.example?.trim() || undefined,
      contrast: chunk.misconception.trim(),
      treatment: "comparison",
      studioStage,
      interaction: interaction ?? null,
    };
  }

  if (looksLikeCode(chunk.example) || looksLikeCode(chunk.breakdown)) {
    return {
      kind: "code",
      objectLabel: "Code",
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: chunk.example?.trim() || chunk.breakdown?.trim(),
      secondary: chunk.breakdown?.trim(),
      treatment: "code",
      studioStage,
      interaction: null,
    };
  }

  if (looksLikeEquation(chunk.example) || looksLikeEquation(chunk.breakdown)) {
    return {
      kind: "equation",
      objectLabel: "Equation",
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: chunk.example?.trim() || chunk.breakdown?.trim(),
      secondary: chunk.breakdown?.trim(),
      treatment: "steps",
      studioStage,
      interaction: null,
    };
  }

  if (chunk.role === "worked" || chunk.role === "problem") {
    return {
      kind: chunk.role === "problem" ? "scenario" : "example",
      objectLabel: chunk.role === "problem" ? "Scenario" : "Example",
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: chunk.example?.trim() || firstSentences(chunk.explanation, 2),
      secondary: chunk.breakdown?.trim(),
      treatment: "scenario",
      studioStage,
      interaction: null,
    };
  }

  if (chunk.breakdown?.trim() && chunk.role === "breakdown") {
    return {
      kind: "inspect",
      objectLabel: "Break it down",
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: chunk.breakdown.trim(),
      secondary: chunk.example?.trim(),
      treatment: "steps",
      studioStage,
      interaction: null,
    };
  }

  if (chunk.role === "apply") {
    return {
      kind: "apply",
      objectLabel: "Apply",
      title: chunk.title,
      lead: firstSentences(chunk.explanation, 1) || undefined,
      primary: interaction?.prompt ?? chunk.checkPrompt ?? chunk.example,
      secondary: chunk.example?.trim(),
      treatment: "assessment",
      studioStage,
      interaction: interaction ?? null,
    };
  }

  // Default: concise explanation — not a multi-paragraph article
  return {
    kind: "explanation",
    objectLabel: "Concept",
    title: chunk.title,
    lead: firstSentences(chunk.explanation, 2),
    primary: chunk.representation?.trim() || chunk.example?.trim() || undefined,
    secondary: chunk.example?.trim() && chunk.representation?.trim()
      ? chunk.example.trim()
      : chunk.breakdown?.trim() || undefined,
    contrast: chunk.misconception?.trim() || undefined,
    treatment: chunk.representation?.trim()
      ? "diagram"
      : chunk.example?.trim()
        ? "scenario"
        : "prose",
    studioStage,
    interaction: null,
  };
}

/**
 * Resolve whether the stage should show teach content, in-stage interaction, or assessment.
 */
export function resolveStageMode(input: {
  studioStage: LearningStudioStage;
  hasInteraction: boolean;
  formativeRequired: boolean;
  hasResult: boolean;
}): "teach" | "interact" | "feedback" | "assess" {
  if (input.hasResult) return "feedback";
  if (input.studioStage === "check" && input.hasInteraction) return "assess";
  if (
    input.formativeRequired &&
    input.hasInteraction &&
    (input.studioStage === "try" ||
      input.studioStage === "apply" ||
      input.studioStage === "transfer" ||
      input.studioStage === "check")
  ) {
    return input.studioStage === "check" ? "assess" : "interact";
  }
  return "teach";
}
