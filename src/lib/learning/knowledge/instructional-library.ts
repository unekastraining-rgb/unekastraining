/**
 * Instructional Knowledge Library — subject knowledge used to TEACH.
 *
 * Distinct from:
 * - Course organization (syllabus / LMS week labels)
 * - Course material (slides, textbook excerpts) — optional grounding
 * - ULE Concept rows (mastery graph) — complementary IDs, not lesson prose
 *
 * Extends the existing six-worked-lesson teaching contract; does not create
 * a second teaching engine.
 */

import type {
  InstructionalRole,
  SixLessonChunk,
  SixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";
import type { SixComponent } from "@/lib/csl/six";
import { looksLikeStudyTopicProfileSource } from "@/lib/study-topic/types";
import { matchKnowledgeLearningPath } from "@/lib/learning/knowledge/learning-paths";
import type {
  CurriculumMappingStub,
  InstructionalCompletenessState,
  InstructionalMisconception,
  InstructionalRelationship,
} from "@/lib/learning/knowledge/concept-profile";

export { looksLikeStudyTopicProfileSource } from "@/lib/study-topic/types";
export {
  KNOWLEDGE_LEARNING_PATHS,
  matchKnowledgeLearningPath,
} from "@/lib/learning/knowledge/learning-paths";
export type {
  CurriculumMappingStub,
  InstructionalCompletenessState,
  InstructionalMisconception,
  InstructionalRelationship,
  InstructionalRelationshipKind,
} from "@/lib/learning/knowledge/concept-profile";

export type InstructionalDomain =
  | "programming"
  | "math"
  | "science"
  | "business"
  | "finance"
  | "writing"
  | "language"
  | "history"
  | "general";

/**
 * One teachable knowledge concept (library unit — not a lesson).
 * Singular fields preserved for existing packs; plural/aliases support richer packs.
 * Phase A extensions (relationships, misconceptionDetails, completeness) are additive.
 */
export type InstructionalConceptKnowledge = {
  id: string;
  title: string;
  definition?: string;
  /** Required for existing packs; prefer this as primary instructional prose. */
  explanation: string;
  purpose?: string;
  example?: string;
  /** Preferred plural form when multiple examples exist. */
  examples?: string[];
  nonExample?: string;
  nonExamples?: string[];
  representation?: string;
  breakdown?: string;
  misconception?: string;
  misconceptions?: string[];
  /** Structured misconceptions (§31) — prefer when authoring new packs. */
  misconceptionDetails?: InstructionalMisconception[];
  checkPrompt?: string;
  role?: InstructionalRole;
  prerequisites?: string[];
  /** Legacy alias — prefer relatedConcepts when authoring new packs. */
  related?: string[];
  relatedConcepts?: string[];
  /** Typed relationship edges (§7–8). Legacy string arrays remain valid. */
  relationships?: InstructionalRelationship[];
  /** Canonical hierarchy parent (not a curriculum chapter). */
  parentConceptId?: string;
  childConceptIds?: string[];
  vocabulary?: string[];
  workedExamples?: string[];
  visualModels?: string[];
  procedures?: string[];
  scenarios?: string[];
  applications?: string[];
  transferPrompts?: string[];
  practiceForms?: string[];
  assessmentForms?: string[];
  masteryCriteria?: string[];
  difficulty?: 1 | 2 | 3 | 4 | 5;
  /**
   * Library completeness state — not learner mastery (§19).
   * Prefer deriving via coverage reporter when unset.
   */
  completeness?: InstructionalCompletenessState;
  /** Curriculum mapping stubs (§9) — separate from canonical meaning. */
  curriculumMappings?: CurriculumMappingStub[];
  /**
   * Extra phrasings that resolve to this concept (e.g. "Java ArrayList").
   * Prefer specific aliases — avoid bare words that cross subjects ("variables").
   */
  aliases?: readonly string[];
};

/**
 * A grouped collection of related knowledge concepts.
 * Knowledge packs store knowledge; lesson builders turn them into lessons.
 */
export type InstructionalKnowledgePack = {
  id: string;
  /** Match topics (lowercase substrings / keywords). Pack-level resolution only. */
  match: readonly string[];
  /** Broad instructional domain (metadata — never used alone to invent a match). */
  domain: InstructionalDomain;
  /**
   * Subject within the domain (e.g. java, finance).
   * Metadata for taxonomy; not a similarity engine across subjects.
   */
  subject?: string;
  displayTitle: string;
  learningFrame: string;
  cheatSheet: string;
  concepts: InstructionalConceptKnowledge[];
  practicePrompts?: Array<{ title: string; prompt: string; tip: string }>;
};

/**
 * Structured knowledge resolution result.
 * Answers: "Do we have registered knowledge for this target?"
 * Does not generate a lesson.
 */
export type ResolvedInstructionalKnowledge = {
  pack: InstructionalKnowledgePack;
  matchScore: number;
  source: "pack" | "concept";
  domain: InstructionalDomain;
  subject: string | null;
  matchedConcept: InstructionalConceptKnowledge | null;
  /** 0–1 confidence from match strength (not semantic similarity across subjects). */
  confidence: number;
};

/** Syllabus / org prose must never become instructional explanation. */
export function looksLikeSyllabusProse(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || t.length < 20) return true;

  // Broken OCR / truncated syllabus fragments
  if (/^[a-z]{1,3}\s+(modifier|module|week|co\s*\d)/i.test(t)) return true;
  if (/\b(CO|LO)\s*[\d\-–.]+\s*[,:]/i.test(t) && t.length < 220) return true;
  if (/module\s+\d+\s*[:.\-–]/i.test(t) && /syllabus|learning\s+objective/i.test(t)) {
    return true;
  }

  const orgHits = [
    /course\s+syllabus/i,
    /learning\s+objectives?/i,
    /required\s+(textbooks?|materials?)/i,
    /grading\s+(policy|scale|rubric)/i,
    /office\s+hours/i,
    /important\s+dates/i,
    /academic\s+integrity/i,
    /week\s+of\s+\d/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+\d{1,2}\b/i,
    /instructor\s*&?\s*course\s+information/i,
    /attendance\s+policy/i,
    /disability\s+accommodation/i,
    /##\s*COURSE\s+SYLLABUS/i,
  ].filter((re) => re.test(t)).length;

  if (orgHits >= 2) return true;
  if (orgHits >= 1 && t.length < 400) return true;
  if (/^##\s*COURSE\s+SYLLABUS/im.test(text)) return true;

  return false;
}

/** Strip syllabus blocks from packed study source before using as teaching prose. */
export function stripSyllabusBlocksFromSource(sourceText: string): string {
  const raw = sourceText.trim();
  if (!raw) return "";
  // Remove explicit syllabus sections inserted by course-source packers.
  const withoutBlocks = raw
    .replace(
      /##\s*COURSE\s+SYLLABUS[\s\S]*?(?=##\s+PRIMARY\s+READING|##\s+RELATED|$)/gi,
      "",
    )
    .replace(
      /##\s*COURSE\s+DESCRIPTION[\s\S]*?(?=##\s+PRIMARY\s+READING|##\s+RELATED|$)/gi,
      "",
    )
    .trim();
  return withoutBlocks;
}

/**
 * Remove StudyTopicProfile JSON (and packed PRIMARY READING sections that embed it).
 * Organizational planning must not become instructional grounding.
 */
export function stripStudyTopicProfileFromSource(sourceText: string): string {
  const raw = sourceText.trim();
  if (!raw) return "";

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { kind?: string }).kind === "study_topic"
    ) {
      return "";
    }
  } catch {
    /* packed / mixed text */
  }

  const parts = raw.split(/(?=^##\s+)/m);
  const kept = parts.filter((part) => {
    const body = part.trim();
    if (!body) return false;
    if (looksLikeStudyTopicProfileSource(body)) return false;
    if (
      /^##\s*PRIMARY\s+READING/i.test(body) &&
      /"kind"\s*:\s*"study_topic"/.test(body)
    ) {
      return false;
    }
    return true;
  });

  return kept
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Prefer instructional material; drop syllabus / StudyTopicProfile residue. */
export function instructionalSourceForTeaching(
  sourceText?: string | null,
): string | null {
  if (!sourceText?.trim()) return null;
  const withoutProfile = stripStudyTopicProfileFromSource(sourceText);
  if (!withoutProfile || withoutProfile.length < 80) return null;
  if (looksLikeStudyTopicProfileSource(withoutProfile)) return null;
  const stripped = stripSyllabusBlocksFromSource(withoutProfile);
  if (!stripped || stripped.length < 80) return null;
  if (looksLikeSyllabusProse(stripped)) return null;
  // If primary body is still mostly org noise, reject.
  const sample = stripped.slice(0, 800);
  if (looksLikeSyllabusProse(sample) && stripped.length < 2000) return null;
  return stripped;
}

export function inferInstructionalDomain(
  topic: string,
  courseTitle?: string | null,
): InstructionalDomain {
  const hay = `${topic} ${courseTitle ?? ""}`.toLowerCase();
  if (
    /java|python|javascript|typescript|code|program|software|oop|ood|exception|class(es)?|object|sql|algorithm|data\s*struct/.test(
      hay,
    )
  ) {
    return "programming";
  }
  if (/math|algebra|calculus|geometry|equation|statistic|quadratic|trig/.test(hay)) {
    return "math";
  }
  if (/bio|chem|physics|anatomy|cell|organism|science/.test(hay)) {
    return "science";
  }
  // Finance / markets before broader business (stocks ≠ generic business pack).
  if (
    /\bstocks?\b|shareholder|dividend|portfolio|brokerage|equity\s+market|market\s+cap|p\/e\s*ratio|price[\s-]to[\s-]earnings/.test(
      hay,
    )
  ) {
    return "finance";
  }
  if (
    /business|finance|mortgage|market|accounting|management|econom|invest|risk\s+and\s+return/.test(
      hay,
    )
  ) {
    return "business";
  }
  if (/writ|essay|rhetoric|composition|literature|grammar/.test(hay)) {
    return "writing";
  }
  if (/spanish|french|german|language|vocab|conjugat/.test(hay)) {
    return "language";
  }
  if (/history|civil\s*war|revolution|ancient|medieval/.test(hay)) {
    return "history";
  }
  return "general";
}

function scorePack(pack: InstructionalKnowledgePack, topic: string): number {
  const key = topic.toLowerCase();
  let score = 0;
  for (const m of pack.match) {
    if (key.includes(m.toLowerCase())) score += m.length;
  }
  return score;
}

/**
 * Concept-level score: only when the target names a registered concept.
 * Never scores by domain/subject alone (Stocks ≠ mortgages).
 */
function scoreConcept(
  concept: InstructionalConceptKnowledge,
  topic: string,
): number {
  const key = topic.toLowerCase().trim();
  if (!key) return 0;
  // Phase 6 — never resolve bare ambiguous tokens via reverse alias match.
  if (isAmbiguousBareTerm(key)) return 0;

  const title = concept.title.toLowerCase().trim();
  const idKey = concept.id.toLowerCase().replace(/-/g, " ");
  let score = 0;

  const consider = (phrase: string, exactBonus = 0) => {
    const p = phrase.toLowerCase().trim();
    if (!p || p.length < 4) return;
    if (key === p) {
      score = Math.max(score, p.length + 8 + exactBonus);
    } else if (key.includes(p) && p.length >= 4) {
      score = Math.max(score, p.length + exactBonus);
    } else if (
      // Reverse match only for distinctive, long targets (avoid "conditionals" → first match).
      p.length >= 12 &&
      key.length >= 12 &&
      p.includes(key)
    ) {
      score = Math.max(score, key.length);
    }
  };

  consider(title, 2);
  consider(idKey);
  consider(concept.id.replace(/-/g, " "));
  for (const alias of concept.aliases ?? []) {
    consider(alias, 4);
  }

  return score;
}

/**
 * Single-token terms that appear across subjects — require qualification
 * (e.g. "Java variables", "Python functions") before resolving.
 */
const AMBIGUOUS_BARE_TERMS = new Set([
  "variables",
  "variable",
  "functions",
  "function",
  "loops",
  "loop",
  "arrays",
  "array",
  "classes",
  "class",
  "objects",
  "object",
  "methods",
  "method",
  "strings",
  "string",
  "exceptions",
  "exception",
  "lists",
  "list",
  "sets",
  "set",
  "dictionaries",
  "dictionary",
  "conditionals",
  "conditional",
  "operators",
  "operator",
  "expressions",
  "expression",
  "interfaces",
  "interface",
  "inheritance",
  "polymorphism",
]);

function isAmbiguousBareTerm(key: string): boolean {
  return AMBIGUOUS_BARE_TERMS.has(key.trim().toLowerCase());
}

function confidenceFromScore(score: number): number {
  // Keyword scores are typically 4–40+; clamp to 0–1 without inventing matches.
  return Math.max(0, Math.min(1, score / 24));
}

/** Registry of instructional packs — extend by adding packs, not by new engines. */
const PACKS: InstructionalKnowledgePack[] = [];

/** O(1) concept-id → pack/concept index (rebuilt on register). */
const CONCEPT_BY_ID = new Map<
  string,
  { pack: InstructionalKnowledgePack; concept: InstructionalConceptKnowledge }
>();

function rebuildConceptIndex(): void {
  CONCEPT_BY_ID.clear();
  for (const pack of PACKS) {
    for (const concept of pack.concepts) {
      CONCEPT_BY_ID.set(concept.id, { pack, concept });
    }
  }
}

export function registerInstructionalPack(pack: InstructionalKnowledgePack): void {
  const idx = PACKS.findIndex((p) => p.id === pack.id);
  if (idx >= 0) PACKS[idx] = pack;
  else PACKS.push(pack);
  rebuildConceptIndex();
}

export function listInstructionalPacks(): readonly InstructionalKnowledgePack[] {
  return PACKS;
}

export function getInstructionalPackById(
  packId: string,
): InstructionalKnowledgePack | null {
  return PACKS.find((p) => p.id === packId) ?? null;
}

export function getInstructionalConcept(
  packId: string,
  conceptId: string,
): InstructionalConceptKnowledge | null {
  const pack = getInstructionalPackById(packId);
  if (!pack) return null;
  return pack.concepts.find((c) => c.id === conceptId) ?? null;
}

/** Indexed lookup by stable concept id (any pack). */
export function findInstructionalConceptById(
  conceptId: string,
): {
  pack: InstructionalKnowledgePack;
  concept: InstructionalConceptKnowledge;
} | null {
  return CONCEPT_BY_ID.get(conceptId.trim()) ?? null;
}

/**
 * Resolve structured knowledge for a learning target.
 * Returns null when no registered pack/concept/path matches — never fabricates knowledge
 * from domain proximity (e.g. Stocks does not resolve to mortgages).
 *
 * Phase 6: bare ambiguous terms ("variables", "functions", …) stay unresolved
 * unless qualified by subject/language context in the target string.
 */
export function resolveInstructionalKnowledge(
  topic: string,
): ResolvedInstructionalKnowledge | null {
  const clean = topic.trim();
  if (!clean) return null;

  const key = clean.toLowerCase();
  if (isAmbiguousBareTerm(key)) {
    return null;
  }

  // Exact concept id (e.g. "java-arraylist") — indexed, never fabricated.
  const byId = CONCEPT_BY_ID.get(clean) ?? CONCEPT_BY_ID.get(key);
  if (byId) {
    return {
      pack: byId.pack,
      matchScore: 50,
      source: "concept",
      domain: byId.pack.domain,
      subject: byId.pack.subject?.trim() || null,
      matchedConcept: byId.concept,
      confidence: 1,
    };
  }

  // Explicit multi-concept learning paths (controlled — not fuzzy expansion).
  const path = matchKnowledgeLearningPath(clean);
  if (path) {
    const pack = getInstructionalPackById(path.packId);
    if (pack) {
      const concepts = path.conceptIds
        .map((id) => pack.concepts.find((c) => c.id === id))
        .filter((c): c is InstructionalConceptKnowledge => Boolean(c));
      if (concepts.length > 0) {
        const scoped: InstructionalKnowledgePack = {
          ...pack,
          concepts,
          displayTitle: path.displayTitle,
          learningFrame: `You're learning ${path.displayTitle} through ${concepts.map((c) => c.title).join(" → ")}.`,
          cheatSheet: concepts.map((c) => c.title).join(" → "),
        };
        return {
          pack: scoped,
          matchScore: 40,
          source: "pack",
          domain: pack.domain,
          subject: pack.subject?.trim() || null,
          matchedConcept: concepts[0] ?? null,
          confidence: 1,
        };
      }
    }
  }

  let bestPack: InstructionalKnowledgePack | null = null;
  let bestScore = 0;
  let bestConcept: InstructionalConceptKnowledge | null = null;
  let bestSource: "pack" | "concept" = "pack";

  for (const pack of PACKS) {
    const packScore = scorePack(pack, clean);
    if (packScore > bestScore) {
      bestPack = pack;
      bestScore = packScore;
      bestConcept = null;
      bestSource = "pack";
    }

    for (const concept of pack.concepts) {
      const conceptScore = scoreConcept(concept, clean);
      if (conceptScore > bestScore) {
        bestPack = pack;
        bestScore = conceptScore;
        bestConcept = concept;
        bestSource = "concept";
      }
    }
  }

  if (!bestPack || bestScore < 4) return null;

  return {
    pack: bestPack,
    matchScore: bestScore,
    source: bestSource,
    domain: bestPack.domain,
    subject: bestPack.subject?.trim() || null,
    matchedConcept: bestConcept,
    confidence: confidenceFromScore(bestScore),
  };
}

function conceptToChunk(
  concept: InstructionalConceptKnowledge,
  index: number,
  total: number,
): SixLessonChunk {
  const example =
    concept.example ??
    concept.examples?.[0] ??
    concept.workedExamples?.[0] ??
    concept.definition ??
    `Example involving ${concept.title}.`;
  const misconception =
    concept.misconception ??
    concept.misconceptions?.[0] ??
    concept.nonExample ??
    concept.nonExamples?.[0];

  const purpose = concept.purpose?.trim();
  const definition = concept.definition?.trim();
  const vocab =
    concept.vocabulary && concept.vocabulary.length > 0
      ? `Key terms: ${concept.vocabulary.slice(0, 6).join(", ")}`
      : null;
  const explanationParts = [
    definition && definition !== concept.explanation.trim() ? definition : null,
    concept.explanation,
    purpose ? `Why it matters: ${purpose}` : null,
    vocab,
  ].filter(Boolean);

  const relatedIds = concept.relatedConcepts ?? concept.related ?? [];
  const relationVisual =
    concept.representation?.trim() ||
    (relatedIds.length > 0
      ? `${concept.title} ↔ ${relatedIds
          .slice(0, 4)
          .map((id) => id.replace(/^.*:/, "").replace(/-/g, " "))
          .join(" · ")}`
      : concept.prerequisites && concept.prerequisites.length > 0
        ? `${concept.prerequisites.join(" → ")} → ${concept.title}`
        : undefined);

  return {
    title: concept.title,
    role:
      concept.role ??
      (index === 0
        ? "context"
        : index === 1
          ? "problem"
          : index === total - 1
            ? "apply"
            : "explain"),
    explanation: explanationParts.join("\n\n"),
    example,
    representation: relationVisual,
    breakdown: concept.breakdown,
    misconception,
    checkPrompt:
      concept.checkPrompt ??
      `In one sentence, what should you remember about ${concept.title}?`,
    memoryTrick: purpose
      ? `Why it exists: ${purpose.slice(0, 120)}`
      : undefined,
  };
}

/**
 * Teaching-engine adapter: turn a knowledge pack into a SixWorkedLesson.
 * Knowledge resolution stays in resolveInstructionalKnowledge — this only maps
 * already-resolved knowledge into the lesson shape.
 */
export function lessonFromInstructionalPack(
  component: SixComponent,
  topic: string,
  pack: InstructionalKnowledgePack,
): SixWorkedLesson {
  const chunks = pack.concepts.map((c, i) =>
    conceptToChunk(c, i, pack.concepts.length),
  );
  const cleanTopic = topic.trim() || pack.displayTitle;
  let practicePrompts =
    pack.practicePrompts ??
    chunks.slice(0, 3).map((c) => ({
      title: `Practice · ${c.title}`,
      prompt: `Explain ${c.title} in your own words, then invent one new example.`,
      tip: "Cover the lesson first.",
    }));
  // Phase 3C: single-concept lessons must still satisfy consumer shape (≥2 prompts).
  if (practicePrompts.length < 2) {
    const focus = chunks[0]?.title ?? cleanTopic;
    practicePrompts = [
      practicePrompts[0] ?? {
        title: `Practice · ${focus}`,
        prompt: `Explain ${focus} in your own words, then invent one new example.`,
        tip: "Cover the lesson first.",
      },
      {
        title: `Check · ${cleanTopic}`,
        prompt: `Without notes, state the core idea of ${cleanTopic} and give one concrete example.`,
        tip: "If stuck, reopen one chunk — then retry.",
      },
    ];
  }
  // Bundle G — ensure transfer practice exists when pack did not author one.
  if (!practicePrompts.some((p) => /transfer/i.test(`${p.title} ${p.prompt}`))) {
    const last = chunks[chunks.length - 1]?.title ?? cleanTopic;
    practicePrompts = [
      ...practicePrompts.slice(0, 3),
      {
        title: "Transfer",
        prompt: `New situation (concept not named): decide which idea from this lesson applies and how you would use “${last}” without restating a definition.`,
        tip: "Transfer means recognizing the idea in a new framing.",
      },
    ];
  }
  return {
    component,
    topic: cleanTopic,
    learningFrame: pack.learningFrame,
    roadmap: chunks.map((c) => c.title),
    chunks,
    cheatSheet: pack.cheatSheet,
    practicePrompts: practicePrompts.slice(0, 4),
  };
}

/**
 * When no pack matches, synthesize a coherent subject lesson — never syllabus prose.
 * Domain-aware scaffolding; content is about the TOPIC itself.
 */
export function synthesizeInstructionalLesson(
  component: SixComponent,
  topic: string,
  courseTitle?: string | null,
): SixWorkedLesson {
  const clean = topic.trim() || "this topic";
  const domain = inferInstructionalDomain(clean, courseTitle);
  const chunks = synthesizeChunks(clean, domain);
  return {
    component,
    topic: clean,
    learningFrame: `You're learning ${clean} — a real subject lesson built from instructional knowledge, not from a syllabus schedule.`,
    roadmap: chunks.map((c) => c.title),
    chunks,
    cheatSheet: chunks.map((c) => c.title).join(" → "),
    practicePrompts: [
      {
        title: "Explain it",
        prompt: `Explain ${clean} to a classmate in plain language.`,
        tip: "Start with why it exists.",
      },
      {
        title: "Apply it",
        prompt: `Invent one concrete situation where ${clean} matters and walk through it.`,
        tip: "Name the steps you used.",
      },
      {
        title: "Check yourself",
        prompt: `What is the most common mistake people make with ${clean}?`,
        tip: "Contrast with the correct idea.",
      },
    ],
  };
}

function synthesizeChunks(
  topic: string,
  domain: InstructionalDomain,
): SixLessonChunk[] {
  switch (domain) {
    case "programming":
      return [
        {
          title: `Why ${topic} exists`,
          role: "context",
          explanation: `Programs fail, input is messy, and data lives outside memory. ${topic} exists so your code can respond deliberately when the unexpected happens or when you need to move information in and out of your program — instead of crashing or losing work.`,
          example: `Think of a file that is missing, a user typing \"abc\" into a number field, or a network call that times out — ${topic} is how Java (or similar languages) gives you tools to handle those moments.`,
          checkPrompt: `In one sentence: what problem does ${topic} solve for a programmer?`,
        },
        {
          title: "The core idea",
          role: "concept",
          explanation: `${topic} is not a schedule heading — it is a set of language mechanisms and patterns. You will learn what each piece is for, how the pieces connect, and how to use them in a small working example.`,
          example: `Map the topic name to mechanisms: exceptions (signals), handlers (try/catch), cleanup (finally), and I/O streams/readers that move bytes or text.`,
          misconception:
            "Seeing the topic on a syllabus does not teach it. Knowing the mechanisms and practicing them does.",
        },
        {
          title: "How it works",
          role: "explain",
          explanation: `Break ${topic} into a short chain: something goes wrong or you open a resource → the language raises or returns a signal → your code catches it or propagates it → you clean up and continue or exit safely. File I/O follows open → read/write → close (often with try-with-resources).`,
          example: `Risky call → signal → handle or propagate → cleanup for ${topic}.`,
          representation:
            "trigger → signal/exception or stream\n   → handle (catch) or propagate (throws)\n   → cleanup (finally / auto-close)",
          breakdown:
            "1) Identify the risky operation\n2) Choose handle vs rethrow\n3) Keep cleanup reliable\n4) Give the caller a clear outcome",
        },
        {
          title: "Worked example",
          role: "worked",
          explanation: `Walk a tiny concrete scenario for ${topic}: name the risky call, the exception or I/O type, the handler, and what the user should see if it fails.`,
          example: `try {\n  // risky work for ${topic}\n} catch (Exception e) {\n  // recover or report\n} finally {\n  // cleanup if needed\n}`,
          breakdown:
            "try → the risky work\ncatch → what to do when it fails\nfinally → always runs for cleanup when used",
          checkPrompt: "Which block runs if no exception is thrown? Which still runs for cleanup?",
        },
        {
          title: "Common mistakes",
          role: "clarify",
          explanation: `Learners often swallow exceptions silently, catch Exception too broadly, forget to close files, or confuse checked vs unchecked exceptions. Name the mistake, then the fix.`,
          misconception:
            "Catching Exception and doing nothing is not handling — it hides bugs.",
          example: `Bad: catch (Exception e) {}\nBetter: catch a specific type, log or rethrow with context, and close resources.`,
        },
        {
          title: "Apply it",
          role: "apply",
          explanation: `Invent a small task that needs ${topic}: open a text file, read lines, handle FileNotFoundException, and print a friendly message. Say what you would test.`,
          example: `Task: read \"notes.txt\". If missing → tell the user. If present → print the first line.`,
          checkPrompt: `What would you check to know your ${topic} solution is correct?`,
        },
      ];
    case "business":
    case "finance":
      return [
        {
          title: `Why ${topic} matters`,
          role: "context",
          explanation: `${topic} shows up when people make money decisions under uncertainty — buying a home, pricing risk, allocating capital. Understanding it means you can explain the tradeoffs, not just memorize a definition.`,
          example: `A family comparing a 15-year vs 30-year loan, or a manager choosing between two projects with different risk profiles.`,
        },
        {
          title: "Key terms",
          role: "concept",
          explanation: `List the 3–5 terms you must know for ${topic}, each with a plain-language meaning and why it affects a decision.`,
          example: `Term → meaning → why it changes the decision.`,
        },
        {
          title: "How the model works",
          role: "explain",
          explanation: `Describe the process or calculation behind ${topic} step by step. What inputs go in? What comes out? What assumptions matter?`,
          example: `Inputs for ${topic} → process → metric → decision.`,
          representation: "Inputs → process/model → decision metric → action",
          breakdown: "1) Gather inputs\n2) Apply the relationship\n3) Interpret the result\n4) Decide",
        },
        {
          title: "Worked scenario",
          role: "worked",
          explanation: `Walk one numeric or decision scenario for ${topic} with realistic numbers.`,
          example: `Given … compute … conclude …`,
        },
        {
          title: "Misconceptions",
          role: "clarify",
          explanation: `Name a common wrong intuition about ${topic} and replace it with the correct framing.`,
          example: `Wrong: treat ${topic} as one number. Right: treat it as a relationship.`,
          misconception: `A frequent mistake is treating ${topic} as a single number instead of a relationship among variables.`,
        },
        {
          title: "Apply",
          role: "apply",
          explanation: `Create a new mini-case and solve it using the same steps.`,
          example: `New mini-case using ${topic}: change one input and recompute.`,
          checkPrompt: `What would change your recommendation in this case?`,
        },
      ];
    case "math":
      return [
        {
          title: `The problem ${topic} solves`,
          role: "context",
          explanation: `Start from a concrete question that ${topic} answers — not from a formula name.`,
          example: `A situation where you need ${topic} to find an unknown or describe a relationship.`,
        },
        {
          title: "Definition in context",
          role: "concept",
          explanation: `State what ${topic} is, then immediately connect it to the quantities in the problem.`,
          example: `Symbol/definition ↔ meaning in the story.`,
        },
        {
          title: "Worked solution",
          role: "worked",
          explanation: `Solve one complete example slowly. Narrate each transformation.`,
          example: `Given … → step → step → result.`,
          breakdown: "Write the knowns · choose the relationship · solve · check",
          representation: "equation / graph sketch for this example",
        },
        {
          title: "Your turn",
          role: "guided",
          explanation: `Change one number and solve again without peeking.`,
          example: `Same ${topic} setup with one changed value — solve end to end.`,
          checkPrompt: `What check confirms the answer is reasonable?`,
        },
        {
          title: "Common errors",
          role: "clarify",
          explanation: `List two mistakes students make on ${topic} and how to catch them.`,
          example: `Catch sign errors or dropped terms by substituting the answer back.`,
          misconception: `Sign errors, dropped terms, or mixing up inverse operations.`,
        },
      ];
    default:
      return [
        {
          title: `Why learn ${topic}?`,
          role: "context",
          explanation: `${topic} is worth learning because it lets you explain, predict, or decide something you could not do with a vague impression. This lesson builds that understanding from the ground up.`,
          example: `A real situation where knowing ${topic} changes what you say or do.`,
        },
        {
          title: `What ${topic} is`,
          role: "concept",
          explanation: `Define ${topic} in plain language, then add the precise term experts use. Say what it is not.`,
          example: `${topic} means ___ so that ___. It is not ___.`,
          misconception: `Do not confuse the name of a course module with understanding ${topic}.`,
        },
        {
          title: "How it works",
          role: "explain",
          explanation: `Explain the main parts or steps of ${topic} and how they connect.`,
          example: `Part A of ${topic} leads to Part B, which produces the outcome.`,
          representation: "Part A → Part B → outcome",
          breakdown: "1) …\n2) …\n3) …",
        },
        {
          title: "Example",
          role: "worked",
          explanation: `Walk one concrete example of ${topic} end to end.`,
          example: `Scenario → apply the idea → result.`,
        },
        {
          title: "Check",
          role: "check",
          explanation: `Retrieve the core idea without notes.`,
          example: `${topic} in two sentences, plus one concrete example.`,
          checkPrompt: `Explain ${topic} in two sentences, then give one example.`,
        },
        {
          title: "Apply",
          role: "apply",
          explanation: `Transfer ${topic} to a new situation you invent.`,
          example: `New scenario: …`,
        },
      ];
  }
}

/**
 * Primary knowledge → lesson path for Learn fallbacks.
 * Resolves knowledge first; generates a lesson only when knowledge exists.
 * Single-concept matches teach that concept; pack/path matches use scoped concepts.
 * Never returns generic scaffold templates as a successful lesson.
 */
export function buildLessonFromKnowledgeLibrary(
  component: SixComponent,
  topic: string,
  options?: { courseTitle?: string | null },
): SixWorkedLesson | null {
  void options;
  const resolved = resolveInstructionalKnowledge(topic);
  if (!resolved) return null;

  // Single-concept: teach only the matched concept, not the entire pack.
  if (resolved.source === "concept" && resolved.matchedConcept) {
    const scoped: InstructionalKnowledgePack = {
      ...resolved.pack,
      concepts: [resolved.matchedConcept],
      cheatSheet: resolved.matchedConcept.title,
      learningFrame: `You're learning ${resolved.matchedConcept.title}${
        resolved.subject ? ` (${resolved.subject})` : ""
      }.`,
    };
    return lessonFromInstructionalPack(component, topic, scoped);
  }

  return lessonFromInstructionalPack(component, topic, resolved.pack);
}

/**
 * True when a lesson is generic synthesizer scaffolding — not real subject teaching.
 * Used to reject placeholder lessons from being served as successful Learn content.
 */
export function isPlaceholderScaffoldLesson(lesson: {
  chunks: Array<{ title?: string; explanation?: string; example?: string }>;
}): boolean {
  const blob = lesson.chunks
    .map(
      (c) =>
        `${c.title ?? ""}\n${c.explanation ?? ""}\n${c.example ?? ""}`,
    )
    .join("\n");
  // Default-domain synthesizer fingerprints
  if (/Why learn .+\?/i.test(blob) && /vague impression/i.test(blob)) {
    return true;
  }
  if (
    /A real situation where knowing .+ changes what you say or do/i.test(blob)
  ) {
    return true;
  }
  if (
    /is worth learning because it lets you explain, predict, or decide/i.test(
      blob,
    )
  ) {
    return true;
  }
  // Programming-domain synthesizer fingerprints (exception/I/O-shaped shell)
  if (
    /Programs fail, input is messy/i.test(blob) &&
    /file that is missing/i.test(blob)
  ) {
    return true;
  }
  // Business-domain synthesizer fingerprints
  if (
    /shows up when people make money decisions under uncertainty/i.test(blob) &&
    /Term → meaning → why it changes the decision/i.test(blob)
  ) {
    return true;
  }
  if (
    /List the 3–5 terms you must know for .+, each with a plain-language meaning/i.test(
      blob,
    )
  ) {
    return true;
  }
  return false;
}
