/**
 * Phase 2B — AI lesson acceptance gate.
 * Parsed JSON ≠ automatically accepted Study Haul lesson.
 */

import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import {
  assessInstructionalStructure,
  isMetaStudySkillOutlineLesson,
} from "@/lib/csl/six-worked-lesson";
import {
  inferInstructionalDomain,
  isPlaceholderScaffoldLesson,
  type InstructionalDomain,
} from "@/lib/learning/knowledge/instructional-library";
import {
  lessonContainsUnsupportedLearnerJudgment,
  lessonLeaksLearnerStateMetadata,
} from "@/lib/learning/personalized-teaching/validate-personalization";
import { validateLessonSourceIntegrity } from "@/lib/learning/knowledge/retrieval/source-integrity";

export type AiLessonValidationChecks = {
  hasEnoughChunks: boolean;
  isInstructional: boolean;
  isNotMetaStudySkill: boolean;
  isNotPlaceholder: boolean;
  targetAligned: boolean;
  notSourceHeadingDominated: boolean;
  /** Phase 8 — no fabricated citations / false web claims. */
  sourceIntegrityOk: boolean;
};

export type AiLessonValidationResult = {
  accepted: boolean;
  reasons: string[];
  checks: AiLessonValidationChecks;
};

const STOP = new Set([
  "this",
  "that",
  "with",
  "from",
  "your",
  "about",
  "into",
  "than",
  "then",
  "them",
  "they",
  "have",
  "will",
  "what",
  "when",
  "where",
  "which",
  "while",
  "their",
  "there",
  "these",
  "those",
  "using",
  "used",
  "make",
  "made",
  "also",
  "just",
  "like",
  "such",
  "only",
  "some",
  "more",
  "most",
  "other",
  "over",
  "after",
  "before",
  "between",
  "through",
  "fundamentals",
  "fundamental",
  "introduction",
  "basics",
  "basic",
  "overview",
  "learning",
  "lesson",
  "chapter",
  "module",
  "section",
  "part",
  "how",
  "does",
  "affect",
  "affects",
]);

const STUDY_ADVICE =
  /\b(take notes|review your notes|active recall|spaced repetition|flashcards?|study regularly|pomodoro|organize (your )?notes|highlight(ing)?|reread|cram(ming)?|study tips?|study strateg(y|ies)|how to study|textbook navigation|chapter organization)\b/i;

const PROGRAMMING_SUBJECT =
  /\b(python|variable|variables|data\s*types?|conditional|loop|loops|function|functions|def\s+\w+|import\s+\w+|class\s+\w+|try\s*\{|except|list|dict|string|integer|boolean|syntax|interpreter|compiler)\b/i;

const STOCKS_SUBJECT =
  /\b(stock|stocks|share|shares|equity|dividend|ticker|portfolio|broker|exchange|nasdaq|nyse|bull\s+market|bear\s+market|market\s+cap|shareholder|securities|ipo)\b/i;

const ECONOMICS_SUBJECT =
  /\b(econom(y|ics|ic)|supply|demand|market|price|pricing|profit|cost|incentive|scarcity|firm|tradeoff|gdp|inflation|resource\s+allocation|competition|consumer)\b/i;

const OOD_SUBJECT =
  /\b(class|classes|object|objects|encapsulation|polymorphism|inheritance|constructor|instance|blueprint|dealership|field|method)\b/i;

function lessonBlob(lesson: SixWorkedLesson): string {
  return [
    lesson.topic,
    lesson.learningFrame,
    lesson.cheatSheet,
    ...lesson.chunks.map(
      (c) =>
        `${c.title}\n${c.explanation}\n${c.example}\n${c.representation ?? ""}\n${c.breakdown ?? ""}`,
    ),
  ]
    .join("\n")
    .toLowerCase();
}

/** Chunk bodies only — excludes topic/frame so the target label cannot fake alignment. */
function chunkContentBlob(lesson: SixWorkedLesson): string {
  return lesson.chunks
    .map(
      (c) =>
        `${c.title}\n${c.explanation}\n${c.example}\n${c.representation ?? ""}\n${c.breakdown ?? ""}`,
    )
    .join("\n")
    .toLowerCase();
}

function significantTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOP.has(t));
}

function hasMeaningfulChunks(lesson: SixWorkedLesson): boolean {
  if (lesson.chunks.length < 3) return false;
  const solid = lesson.chunks.filter(
    (c) =>
      c.title.trim().length >= 3 &&
      c.explanation.trim().length >= 40 &&
      !/^\.{3,}$/.test(c.explanation.trim()),
  );
  return solid.length >= 3;
}

function looksLikeStudyAdviceOnly(lesson: SixWorkedLesson): boolean {
  const content = chunkContentBlob(lesson);
  const adviceHits = (content.match(STUDY_ADVICE) ?? []).length;
  const adviceTitleHits = lesson.chunks.filter((c) =>
    STUDY_ADVICE.test(c.title),
  ).length;
  const hasSubject =
    PROGRAMMING_SUBJECT.test(content) ||
    STOCKS_SUBJECT.test(content) ||
    ECONOMICS_SUBJECT.test(content) ||
    OOD_SUBJECT.test(content);
  if (adviceTitleHits >= 2 && !hasSubject) return true;
  if (adviceHits >= 3 && !hasSubject) return true;
  if (
    adviceTitleHits >= 2 &&
    adviceHits >= 2 &&
    (content.match(PROGRAMMING_SUBJECT) ?? []).length === 0 &&
    (content.match(STOCKS_SUBJECT) ?? []).length === 0 &&
    (content.match(ECONOMICS_SUBJECT) ?? []).length === 0
  ) {
    return true;
  }
  return false;
}

function looksLikeGenericShell(lesson: SixWorkedLesson): boolean {
  if (isPlaceholderScaffoldLesson(lesson)) return true;
  const blob = lessonBlob(lesson);
  if (
    /this lesson will help you understand/i.test(blob) &&
    /important concepts/i.test(blob)
  ) {
    return true;
  }
  if (
    lesson.chunks.every((c) => c.explanation.trim().length < 55) &&
    /important concepts|key ideas|overview of the topic/i.test(blob)
  ) {
    return true;
  }
  return false;
}

function subjectSignalsForTarget(
  target: string,
  courseTitle?: string | null,
): RegExp | null {
  const domain = inferInstructionalDomain(target, courseTitle);
  const key = target.toLowerCase();
  if (/stock|stocks|share|equity|dividend|portfolio/.test(key)) {
    return STOCKS_SUBJECT;
  }
  if (/python|programming|java|javascript|code|oop|ood|class/.test(key)) {
    return PROGRAMMING_SUBJECT;
  }
  if (/econom|business|market|finance|mortgage/.test(key)) {
    return ECONOMICS_SUBJECT;
  }
  if (domain === "programming") return PROGRAMMING_SUBJECT;
  if (domain === "business") return ECONOMICS_SUBJECT;
  return null;
}

function foreignSubjectDominates(
  target: string,
  blob: string,
  courseTitle?: string | null,
): boolean {
  const targetDomain = inferInstructionalDomain(target, courseTitle);
  const prog = (blob.match(PROGRAMMING_SUBJECT) ?? []).length;
  const stocks = (blob.match(STOCKS_SUBJECT) ?? []).length;
  const econ = (blob.match(ECONOMICS_SUBJECT) ?? []).length;

  // Stocks target taught as Python/programming
  if (/stock|stocks/.test(target.toLowerCase()) && prog >= 3 && stocks === 0) {
    return true;
  }
  // Python target taught as stocks/markets only
  if (
    /python|programming/.test(target.toLowerCase()) &&
    stocks + econ >= 4 &&
    prog === 0
  ) {
    return true;
  }
  // Strong domain mismatch: non-general target vs opposite lesson signals
  if (targetDomain === "programming" && prog === 0 && (stocks >= 3 || econ >= 4)) {
    return true;
  }
  if (
    targetDomain === "business" &&
    stocks + econ === 0 &&
    prog >= 4 &&
    !/class|object|ood|oop/.test(target.toLowerCase())
  ) {
    return true;
  }
  return false;
}

function isTargetAligned(
  lesson: SixWorkedLesson,
  canonicalTarget: string,
  courseTitle?: string | null,
  concepts?: string[],
): boolean {
  const content = chunkContentBlob(lesson);
  if (looksLikeStudyAdviceOnly(lesson)) return false;
  if (foreignSubjectDominates(canonicalTarget, content, courseTitle)) {
    return false;
  }

  const targetTokens = significantTokens(canonicalTarget);
  const conceptTokens = (concepts ?? []).flatMap((c) => significantTokens(c));
  const tokenHits = [...new Set([...targetTokens, ...conceptTokens])].filter(
    (t) => content.includes(t),
  ).length;

  const subjectRe = subjectSignalsForTarget(canonicalTarget, courseTitle);
  const subjectHits = subjectRe ? (content.match(subjectRe) ?? []).length : 0;

  // Soft pass: target/concept tokens OR domain subject vocabulary in chunk bodies.
  if (tokenHits >= 1 || subjectHits >= 2) return true;

  const targetPhrase = canonicalTarget.toLowerCase().trim();
  if (targetPhrase.length >= 4 && content.includes(targetPhrase)) return true;

  if (
    /class|object|ood|oop/.test(canonicalTarget.toLowerCase()) &&
    OOD_SUBJECT.test(content)
  ) {
    return true;
  }

  return false;
}

function normalizeHeading(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSourceHeadings(grounding?: string | null): string[] {
  const raw = grounding?.trim();
  if (!raw || raw.length < 40) return [];
  const out: string[] = [];
  const push = (label: string) => {
    const n = normalizeHeading(label);
    if (n.length < 8 || n.length > 90) return;
    if (!out.includes(n)) out.push(n);
  };

  for (const line of raw.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    const chapter = t.match(
      /^chapter\s+\d+\s*[-–—:]?\s*(.+)$/i,
    );
    if (chapter?.[1]) {
      push(chapter[1]);
      push(t);
      continue;
    }
    if (/^#{1,3}\s+/.test(t)) {
      push(t.replace(/^#{1,3}\s+/, ""));
      continue;
    }
    // ALL-CAPS banner headings (OCR chapter titles)
    if (
      t.length >= 12 &&
      t.length <= 100 &&
      /[A-Z]/.test(t) &&
      t === t.toUpperCase() &&
      /[A-Z]{4,}/.test(t)
    ) {
      push(t);
    }
  }
  return out.slice(0, 20);
}

function isSourceHeadingDominated(
  lesson: SixWorkedLesson,
  grounding?: string | null,
): boolean {
  const headings = extractSourceHeadings(grounding);
  if (headings.length === 0 || lesson.chunks.length < 3) return false;

  let headingTitleMatches = 0;
  let thinExplanations = 0;
  for (const chunk of lesson.chunks) {
    const title = normalizeHeading(chunk.title);
    const matched = headings.some(
      (h) =>
        title === h ||
        title.includes(h) ||
        h.includes(title) ||
        (title.length >= 10 && h.includes(title.slice(0, Math.min(40, title.length)))),
    );
    if (matched) headingTitleMatches += 1;
    // Thin / near-copy explanations
    if (chunk.explanation.trim().length < 100) thinExplanations += 1;
    else if (
      grounding &&
      normalizeHeading(chunk.explanation).includes(title) &&
      chunk.explanation.trim().length < 180
    ) {
      thinExplanations += 1;
    }
  }

  const ratio = headingTitleMatches / lesson.chunks.length;
  // Dominated: most titles are source headings AND teaching is thin
  return ratio >= 0.6 && thinExplanations >= Math.ceil(lesson.chunks.length * 0.5);
}

/**
 * Validate an AI-parsed SIX lesson before accepting it as Learn success.
 * Does not fact-check; checks structure, non-meta, non-placeholder, target alignment,
 * and source-heading domination.
 */
export function validateAiLesson(input: {
  lesson: SixWorkedLesson;
  canonicalTarget: string;
  grounding?: string | null;
  courseTitle?: string | null;
  concepts?: string[];
  /**
   * Phase 4B — when LEARNER CONTEXT was supplied to the AI,
   * reject unsupported mastery/weakness claims and metadata leaks.
   * Does not weaken existing Phase 2B checks.
   */
  learnerContextSupplied?: boolean;
  /**
   * Phase 8 — source integrity. When general-ai-only (no retrieved-web),
   * reject fabricated URLs / false web-research claims.
   */
  sourceIntegrity?: {
    allowedReferences?: string[];
    hasRetrievedWebSources?: boolean;
    isGeneralAiOnly?: boolean;
  };
}): AiLessonValidationResult {
  const { lesson, canonicalTarget, grounding, courseTitle, concepts } = input;
  const reasons: string[] = [];

  const hasEnoughChunks = hasMeaningfulChunks(lesson);
  if (!hasEnoughChunks) {
    reasons.push("Lesson needs at least 3 meaningful instructional chunks.");
  }

  const structure = assessInstructionalStructure(lesson);
  // Reuse existing structure evidence; allow a slightly softer AI bar than
  // full "sufficient" when core teaching signals are present.
  const isInstructional =
    structure.sufficient ||
    (structure.hasConceptExplanation &&
      structure.hasExample &&
      structure.hasContextOrProblem &&
      lesson.chunks.length >= 3);
  if (!isInstructional) {
    reasons.push("Lesson is not sufficiently instructional.");
  }

  const isNotMetaStudySkill =
    !isMetaStudySkillOutlineLesson(lesson) && !looksLikeStudyAdviceOnly(lesson);
  if (!isNotMetaStudySkill) {
    reasons.push("Lesson looks like study advice instead of subject teaching.");
  }

  const isNotPlaceholder = !looksLikeGenericShell(lesson);
  if (!isNotPlaceholder) {
    reasons.push("Lesson looks like placeholder or generic scaffold content.");
  }

  const targetAligned = isTargetAligned(
    lesson,
    canonicalTarget,
    courseTitle,
    concepts,
  );
  if (!targetAligned) {
    reasons.push("Lesson is not aligned with the canonical learning target.");
  }

  const notSourceHeadingDominated = !isSourceHeadingDominated(lesson, grounding);
  if (!notSourceHeadingDominated) {
    reasons.push(
      "Lesson appears dominated by source/OCR headings rather than teaching the target.",
    );
  }

  const lessonText = [
    lesson.learningFrame,
    lesson.cheatSheet,
    ...lesson.chunks.flatMap((c) => [
      c.title,
      c.explanation,
      c.example,
      c.misconception ?? "",
    ]),
  ].join("\n");

  // Phase 8 — only enforce when caller supplies sourceIntegrity context.
  // Existing Phase 2B callers remain unchanged (sourceIntegrityOk defaults true).
  const integrity = input.sourceIntegrity
    ? validateLessonSourceIntegrity({
        lessonText,
        allowedReferences: input.sourceIntegrity.allowedReferences,
        hasRetrievedWebSources: input.sourceIntegrity.hasRetrievedWebSources,
        isGeneralAiOnly: input.sourceIntegrity.isGeneralAiOnly,
      })
    : { ok: true, reasons: [] as string[] };
  const sourceIntegrityOk = integrity.ok;
  if (!sourceIntegrityOk) {
    reasons.push(
      `Lesson has unsupported source attribution (${integrity.reasons.join(", ")}).`,
    );
  }

  let personalizationContractOk = true;
  if (input.learnerContextSupplied) {
    if (lessonContainsUnsupportedLearnerJudgment(lesson)) {
      personalizationContractOk = false;
      reasons.push(
        "Lesson makes unsupported learner judgments (mastery/weakness) from personalization.",
      );
    }
    if (lessonLeaksLearnerStateMetadata(lesson)) {
      personalizationContractOk = false;
      reasons.push(
        "Lesson exposes internal learner-state metadata to the learner.",
      );
    }
  }

  const checks: AiLessonValidationChecks = {
    hasEnoughChunks,
    isInstructional,
    isNotMetaStudySkill,
    isNotPlaceholder,
    targetAligned,
    notSourceHeadingDominated,
    sourceIntegrityOk,
  };

  const accepted =
    Object.values(checks).every(Boolean) && personalizationContractOk;

  return { accepted, reasons, checks };
}

/** Domains exposed for tests / diagnostics. */
export function inferredDomainForTarget(
  target: string,
  courseTitle?: string | null,
): InstructionalDomain {
  return inferInstructionalDomain(target, courseTitle);
}
