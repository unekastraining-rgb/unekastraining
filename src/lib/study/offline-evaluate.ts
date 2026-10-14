/**
 * Offline cold-start blurt / teach-back score when AI keys are missing.
 * Compares student recall against LMS/syllabus topic outline tokens.
 */

export type OfflineStudyEvaluation = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "about",
  "your",
  "course",
  "topic",
  "topics",
  "primary",
  "focus",
  "chapter",
  "study",
  "cold",
  "start",
  "mode",
  "material",
  "materials",
  "description",
  "partial",
  "typical",
  "college",
  "coverage",
  "learning",
  "objectives",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP.has(token));
}

/** Pull checklist lines from a cold-start topics block. */
export function extractOutlineChecklist(sourceText: string, topicHint?: string): string[] {
  const lines = sourceText
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length >= 4 && line.length <= 120);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    if (/^(course|mode|primary focus|topic outline):/i.test(line)) continue;
    seen.add(key);
    unique.push(line);
    if (unique.length >= 16) break;
  }

  const hint = topicHint?.trim();
  if (hint && !unique.some((item) => item.toLowerCase().includes(hint.toLowerCase()))) {
    unique.unshift(hint.slice(0, 120));
  }
  return unique.slice(0, 12);
}

/**
 * Keyword-overlap scorer for blurting / teach-me when AI is unavailable.
 * Not ChatGPT-quality — keeps Core → Six → Lucky → Blurt usable without uploads or keys.
 */
export function evaluateOfflineAgainstOutline(input: {
  userResponse: string;
  sourceText: string;
  topic?: string;
  mode: "blurting" | "teach-me" | "six";
}): OfflineStudyEvaluation {
  const checklist = extractOutlineChecklist(input.sourceText, input.topic);
  const responseTokens = new Set(tokenize(input.userResponse));
  const hit: string[] = [];
  const miss: string[] = [];

  for (const item of checklist) {
    const itemTokens = tokenize(item);
    const matched =
      itemTokens.length === 0
        ? false
        : itemTokens.filter((token) => responseTokens.has(token)).length >=
          Math.max(1, Math.ceil(itemTokens.length * 0.4));
    if (matched) hit.push(item);
    else miss.push(item);
  }

  const denom = Math.max(1, checklist.length);
  const score = Math.round((hit.length / denom) * 100);
  const modeLabel =
    input.mode === "blurting"
      ? "blurt"
      : input.mode === "teach-me"
        ? "teach-back"
        : "Six step";

  return {
    score,
    summary:
      checklist.length === 0
        ? `Offline ${modeLabel}: add LMS/syllabus topics for a stronger checklist score.`
        : `Offline ${modeLabel}: covered ${hit.length}/${checklist.length} outline ideas (no AI key — tutor AI upgrades this).`,
    strengths: hit.slice(0, 5),
    gaps: miss.slice(0, 6),
    misconceptions: [],
    nextSteps:
      miss.length > 0
        ? [
            `Review: ${miss.slice(0, 3).join("; ")}`,
            "Open Lucky for a topic quiz, then blurt again.",
            "Add Gemini/Groq/OpenRouter for ChatGPT-level feedback.",
          ]
        : [
            "Nice coverage of the outline — take a Lucky quiz to lock it in.",
            "Chunk the same topic in Six for deeper structure.",
          ],
  };
}
