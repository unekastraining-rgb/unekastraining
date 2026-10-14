/**
 * Learner "how I learn best" preferences — soft teaching bias for Learn/Tutor.
 * Stored on LearnerProfile.modalityPreferencesJson. Not a second engine.
 * Preferences are a starting point; evidence/Adaptive still govern mastery.
 */

export const LEARN_PREFERENCE_KEYS = [
  "examples",
  "step_by_step",
  "visuals",
  "hands_on",
  "practice_questions",
  "talking_through",
  "writing_explain",
  "real_world",
  "repetition_recall",
  "not_sure",
] as const;

export type LearnPreferenceKey = (typeof LEARN_PREFERENCE_KEYS)[number];

export const LEARN_PREFERENCE_LABELS: Record<LearnPreferenceKey, string> = {
  examples: "Learn through examples",
  step_by_step: "Learn through explanation",
  visuals: "Learn by seeing it",
  hands_on: "Learn by doing",
  practice_questions: "Learn through practice",
  talking_through: "Learn by talking it through",
  writing_explain: "Learn by explaining it yourself",
  real_world: "Learn with real-world cases",
  repetition_recall: "Learn through repetition",
  not_sure: "I'm not sure yet",
};

const KEY_SET = new Set<string>(LEARN_PREFERENCE_KEYS);

/** Session-held material difficulty (1–5). Separate from Teaching Style (HOW). */
export const CONTENT_DIFFICULTY_SESSION_KEY = "studyhaul.contentDifficulty";

export type ContentDifficultyChoice = 1 | 2 | 3 | 4 | 5;

export function parseContentDifficultyChoice(
  value: unknown,
): ContentDifficultyChoice | null {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return null;
}

export function contentDifficultyLabel(
  level: ContentDifficultyChoice | null | undefined,
): string {
  switch (level) {
    case 1:
      return "Beginner";
    case 2:
      return "Developing";
    case 3:
      return "Intermediate";
    case 4:
      return "Advanced";
    case 5:
      return "Challenging";
    default:
      return "Adaptive";
  }
}

/**
 * Parse modalityPreferencesJson into known learn-preference keys that are truthy.
 */
export function parseLearnPreferenceKeys(
  modalityPreferencesJson: string | null | undefined,
): LearnPreferenceKey[] {
  if (!modalityPreferencesJson?.trim()) return [];
  try {
    const parsed = JSON.parse(modalityPreferencesJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }
    const row = parsed as Record<string, unknown>;
    return LEARN_PREFERENCE_KEYS.filter((key) => {
      const v = row[key];
      return v === true || v === 1 || v === "true" || v === "1";
    });
  } catch {
    return [];
  }
}

/** Serialize selected keys into modalityPreferencesJson (boolean map). */
export function serializeLearnPreferences(
  keys: readonly LearnPreferenceKey[],
): string {
  const unique = [...new Set(keys.filter((k) => KEY_SET.has(k)))];
  // "not_sure" alone clears other biases; with others, drop not_sure.
  const cleaned =
    unique.includes("not_sure") && unique.length > 1
      ? unique.filter((k) => k !== "not_sure")
      : unique;
  const obj: Record<string, boolean> = {};
  for (const key of cleaned) obj[key] = true;
  return JSON.stringify(obj);
}

/**
 * Soft instructional bias for lesson prompts — never forces a single modality.
 */
export function buildLearnPreferencePromptBias(
  keys: readonly LearnPreferenceKey[],
): string {
  if (keys.length === 0 || (keys.length === 1 && keys[0] === "not_sure")) {
    return `LEARNER PREFERENCES: unknown / not sure. Use a balanced teaching sequence and adapt from checks. Still include explanation, example, representation, breakdown, and a check.`;
  }

  const lines: string[] = [
    "LEARNER PREFERENCES (starting point — still use multiple modalities; do not only use one):",
  ];

  if (keys.includes("examples") || keys.includes("real_world")) {
    lines.push(
      "- Prefer early worked/real-world examples; show before abstract definitions when possible.",
    );
  }
  if (keys.includes("visuals")) {
    lines.push(
      "- Emphasize representation/diagram fields; put a visualize beat early after context.",
    );
  }
  if (keys.includes("step_by_step")) {
    lines.push(
      "- Prefer smaller chunks and explicit breakdown roles; number steps clearly.",
    );
  }
  if (keys.includes("hands_on") || keys.includes("practice_questions")) {
    lines.push(
      "- Include guided/apply beats and practicePrompts that make the learner DO something soon after the worked example.",
    );
  }
  if (keys.includes("talking_through") || keys.includes("writing_explain")) {
    lines.push(
      "- Include checkPrompt / explain-back moments (Feynman-style) after key concepts.",
    );
  }
  if (keys.includes("repetition_recall")) {
    lines.push(
      "- Add short active-recall checks; revisit key terms after examples.",
    );
  }

  lines.push(
    "Quietly use SIX techniques as machinery (chunking, visualization, hands-on, active recall, Feynman) — do NOT name the product architecture to the learner.",
  );

  return lines.join("\n");
}

/**
 * Material difficulty scaffolding — separate from Teaching Style phrasing.
 */
export function buildContentDifficultyPromptBias(
  level: ContentDifficultyChoice | null | undefined,
): string {
  if (!level) {
    return "MATERIAL DIFFICULTY: adaptive / unspecified. Match depth to the concept; do not dumb down or inflate artificially.";
  }
  switch (level) {
    case 1:
      return "MATERIAL DIFFICULTY: Beginner. Fewer moving parts; more scaffolding; simpler practice; keep terminology correct.";
    case 2:
      return "MATERIAL DIFFICULTY: Developing. Moderate scaffolding; standard examples; light challenge at the end.";
    case 3:
      return "MATERIAL DIFFICULTY: Intermediate. Normal college depth; balanced scaffolding.";
    case 4:
      return "MATERIAL DIFFICULTY: Advanced. More edge cases, transfer, and leaner scaffolding.";
    case 5:
      return "MATERIAL DIFFICULTY: Challenging. Harder problems, less hand-holding, still accurate.";
    default:
      return "";
  }
}

/** Detect when coding activity is the right practice representation. */
export function topicSuggestsCodingActivity(
  topic: string,
  courseTitle?: string | null,
): boolean {
  const hay = `${topic} ${courseTitle ?? ""}`.toLowerCase();
  return /java|python|javascript|typescript|c\+\+|c#|ruby|golang|\bgo\b|swift|kotlin|rust|php|sql|programming|coding|oop|object[-\s]?oriented|classes?\s*&\s*objects|methods?|functions?|loop|array|algorithm|compile|debug/.test(
    hay,
  );
}

export function topicSuggestsSqlActivity(
  topic: string,
  courseTitle?: string | null,
): boolean {
  const hay = `${topic} ${courseTitle ?? ""}`.toLowerCase();
  return /\bsql\b|database|query|select\s|join|schema|relational/.test(hay);
}
