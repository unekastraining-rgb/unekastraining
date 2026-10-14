/**
 * Haul writing AI action helpers (prompt construction).
 * Uses existing AI chain via API — not a second provider system.
 */

import type { HaulWritingTool } from "@/lib/haul/writing/types";

export type HaulWritingAiAction =
  | "paraphrase"
  | "rewrite"
  | "expand"
  | "shorten"
  | "simplify"
  | "clarify"
  | "more-academic"
  | "more-natural"
  | "more-concise"
  | "write-for-me"
  | "continue"
  | "outline"
  | "brainstorm"
  | "generate-thesis"
  | "examples"
  | "explain-section"
  | "help-build"
  | "feedback"
  | "improve-clarity";

export type HaulWritingAiRequest = {
  action: HaulWritingAiAction;
  writingTypeId: string;
  writingTypeTitle: string;
  sectionId?: string;
  sectionTitle?: string;
  sectionPurpose?: string;
  sectionPrompt?: string;
  /** Existing learner text in the active section (may be empty). */
  currentText?: string;
  /** Selected text for paraphrase/rewrite. */
  selectedText?: string;
  documentTitle?: string;
  assignmentPrompt?: string;
  paraphraseStyle?:
    | "keep-meaning"
    | "simplify"
    | "more-academic"
    | "more-concise"
    | "more-natural"
    | "change-wording";
  /** Optional Knowledge Library grounding block (server-injected). */
  knowledgeBlock?: string;
};

export type HaulWritingAiResponse = {
  success: boolean;
  proposal?: string;
  explanation?: string;
  action: HaulWritingAiAction;
  error?: string;
  aiAvailable?: boolean;
};

export function toolToAction(tool: HaulWritingTool): HaulWritingAiAction {
  switch (tool) {
    case "paraphrase":
      return "paraphrase";
    case "rewrite":
      return "rewrite";
    case "expand":
      return "expand";
    case "shorten":
      return "shorten";
    case "simplify":
      return "simplify";
    case "clarify":
      return "clarify";
    case "write-for-me":
      return "write-for-me";
    case "continue":
      return "continue";
    case "outline":
      return "outline";
    case "brainstorm":
      return "brainstorm";
    case "thesis":
      return "generate-thesis";
    case "examples":
      return "examples";
    case "explain":
      return "explain-section";
    case "feedback":
      return "feedback";
    default:
      return "clarify";
  }
}

export function buildHaulWritingAiMessages(req: HaulWritingAiRequest): {
  system: string;
  user: string;
} {
  const system = `You are Study Haul's writing assistant inside The Haul writing workspace.
Help the learner write, revise, or understand writing — do not take ownership of their work as if it were graded evidence.
Stay scoped to the writing type and section. Prefer concise, usable text.
Never invent fake citations, URLs, or sources.
Return plain text only (no markdown fences unless outlining).`;

  const context = [
    `Writing type: ${req.writingTypeTitle} (${req.writingTypeId})`,
    req.documentTitle ? `Document title: ${req.documentTitle}` : "",
    req.assignmentPrompt ? `Assignment: ${req.assignmentPrompt}` : "",
    req.sectionTitle ? `Section: ${req.sectionTitle}` : "",
    req.sectionPurpose ? `Section purpose: ${req.sectionPurpose}` : "",
    req.sectionPrompt ? `Section prompt: ${req.sectionPrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const selected = req.selectedText?.trim() || "";
  const current = req.currentText?.trim() || "";

  let task = "";
  switch (req.action) {
    case "paraphrase":
      task = `Paraphrase the selected text (${req.paraphraseStyle ?? "keep-meaning"}). Preserve meaning. Return only the paraphrase.`;
      break;
    case "rewrite":
      task = "Rewrite the selected/current text more clearly. Return only the rewrite.";
      break;
    case "expand":
      task = "Expand the text with more development while staying on topic. Return only the expanded text.";
      break;
    case "shorten":
    case "more-concise":
      task = "Make the text more concise without losing the core meaning. Return only the shortened text.";
      break;
    case "simplify":
      task = "Simplify the wording for clarity. Return only the simplified text.";
      break;
    case "clarify":
    case "improve-clarity":
      task = "Improve clarity and flow. Return only the improved text.";
      break;
    case "more-academic":
      task = "Rewrite in a more academic tone. Return only the rewrite.";
      break;
    case "more-natural":
      task = "Rewrite in a more natural, readable voice. Return only the rewrite.";
      break;
    case "write-for-me":
      task =
        "Draft content ONLY for the current section (not a full paper). Return only the draft for this section.";
      break;
    case "continue":
      task = "Continue the current text naturally. Return only the continuation (not a full restart).";
      break;
    case "outline":
      task = "Create a brief outline for this writing type / section focus. Return a short outline.";
      break;
    case "brainstorm":
      task = "Brainstorm 5–8 concise ideas relevant to this section. Return a bullet list.";
      break;
    case "generate-thesis":
      task =
        "Generate 2–3 strong thesis options for this essay/paper. Return only the thesis options, numbered.";
      break;
    case "examples":
      task = "Give 1–2 short examples of strong writing for this section. Label them Example 1/2.";
      break;
    case "explain-section":
      task =
        "Explain what belongs in this section and how to write it well. Keep under 120 words. Be instructional, not a draft of the learner's paper.";
      break;
    case "help-build":
      task =
        "Help the learner build this section step by step: ask/answer as short guided scaffolding, then offer one draft option labeled Draft.";
      break;
    case "feedback":
      task =
        "Give actionable feedback on the current section (clarity, structure, evidence/analysis as relevant). Do not invent a score. End with one concrete try-next suggestion.";
      break;
    default:
      task = "Help improve this section. Return useful text.";
  }

  const user = [
    context,
    req.knowledgeBlock ? `\n${req.knowledgeBlock}` : "",
    "",
    `Action: ${req.action}`,
    task,
    selected ? `\nSelected text:\n${selected}` : "",
    !selected && current ? `\nCurrent section text:\n${current}` : "",
    !selected && !current ? "\n(No learner text yet — draft appropriately for the section.)" : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
