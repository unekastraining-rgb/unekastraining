/**
 * Phase 7 — Target normalization for Universal Knowledge Retrieval.
 * Distinguishes "teach me X" phrasing from bare titles; never invents levels.
 */

import type { InstructionalDomain } from "@/lib/learning/knowledge/instructional-library";
import type { NormalizedLearningTarget } from "@/lib/learning/knowledge/retrieval/types";

const TEACH_PREFIX =
  /^(?:please\s+)?(?:teach\s+me|help\s+me\s+(?:understand|learn)|explain(?:\s+to\s+me)?|i\s+want\s+to\s+learn)\s+/i;

const LEVEL_HINT =
  /\b(intro(?:ductory)?|beginner|advanced|intermediate|college|high[- ]school)\b/i;

/**
 * Topics owned by specialized Study Haul paths (OOD dealership, etc.).
 * Universal retrieval must not intercept these.
 */
export function isProtectedSpecializedTopic(topic: string): boolean {
  const t = topic.trim().toLowerCase();
  if (!t) return false;
  if (/classes?\s*&\s*objects/.test(t)) return true;
  if (/object[- ]oriented\s+design/.test(t) && /classes?|objects?|dealership/.test(t)) {
    return true;
  }
  // Bare OOD dealership teaching sequence titles used in specializedChunkingLesson.
  if (/^classes?\s*&\s*objects$/.test(t)) return true;
  return false;
}

/** Strip teach-me framing; keep the subject phrase. */
export function stripTeachFraming(raw: string): string {
  let t = raw.trim().replace(/\s+/g, " ");
  t = t.replace(TEACH_PREFIX, "");
  t = t.replace(/[.?!]+$/g, "").trim();
  return t || raw.trim();
}

/** Stable slug for general: identities — lowercase kebab. */
export function slugifyLearningTarget(title: string): string {
  const base = stripTeachFraming(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "topic";
}

function inferDomain(title: string): InstructionalDomain | undefined {
  const t = title.toLowerCase();
  if (/\b(java|python|programming|code|algorithm)\b/.test(t)) return "programming";
  if (/\b(algebra|geometry|trigonometry|calculus|math|sine|cosine)\b/.test(t)) {
    return "math";
  }
  if (/\b(biology|anatomy|physics|chemistry|psychology|science)\b/.test(t)) {
    return "science";
  }
  if (/\b(economics|business|accounting|marketing|finance|stock)\b/.test(t)) {
    return "business";
  }
  if (/\b(history|war|revolution|literature|writing)\b/.test(t)) return "history";
  if (/\b(french|spanish|language|grammar)\b/.test(t)) return "language";
  return undefined;
}

function inferSubject(title: string, domain?: InstructionalDomain): string | undefined {
  const t = title.toLowerCase();
  if (/\bjava\b/.test(t)) return "java";
  if (/\bpython\b/.test(t)) return "python";
  if (/\bpsychology\b/.test(t)) return "psychology";
  if (/\banatomy\b/.test(t)) return "anatomy";
  if (/\baccounting\b/.test(t)) return "accounting";
  if (/\btrigonometr/.test(t)) return "trigonometry";
  if (/\bworld war\b|\bwwii\b|\bww2\b/.test(t)) return "history";
  if (domain === "math") return "math";
  return undefined;
}

/**
 * Normalize a free-form learning request into a structured target.
 * Does not invent learner levels or change subject meaning.
 */
export function normalizeLearningTarget(raw: string): NormalizedLearningTarget | null {
  const original = raw.trim();
  if (!original) return null;

  const normalizedTitle = stripTeachFraming(original);
  if (!normalizedTitle || normalizedTitle.length < 2) return null;

  const slug = slugifyLearningTarget(normalizedTitle);
  const levelMatch = normalizedTitle.match(LEVEL_HINT);
  const domain = inferDomain(normalizedTitle);
  const subject = inferSubject(normalizedTitle, domain);

  return {
    original,
    normalizedTitle,
    slug,
    subject,
    domain,
    requestedLevel: levelMatch?.[1]?.toLowerCase(),
    learningGoal: TEACH_PREFIX.test(original) ? "learn" : undefined,
  };
}
