import type { GeneratedQuizQuestion } from "@/lib/quizzes/types";
import { QUIZ_QUESTION_MAX } from "@/lib/quizzes/limits";

type Definition = { term: string; definition: string };

const JUNK_TERM =
  /^(sources?|references?|bibliography|contents?|table of contents|index|appendix|glossary|introduction|overview|summary|conclusion|abstract|acknowledgements?|about|part\s*\d+|chapter\s*\d+|section\s*\d+|unit\s*\d+|module\s*\d+|lesson\s*\d+|week\s*\d+|learning objectives?|key terms?|review questions?|notes?|figure\s*\d+|table\s*\d+|page\s*\d+|http|www|copyright|all rights reserved)$/i;

const JUNK_IN_TERM =
  /\b(part\s+\d+|chapter\s+\d+|section\s+\d+|sources?|references?|business trends|learning outcomes?)\b/i;

function pushUnique(
  list: GeneratedQuizQuestion[],
  seen: Set<string>,
  question: GeneratedQuizQuestion,
) {
  const key = question.prompt.toLowerCase().replace(/\s+/g, " ").trim();
  if (!key || key.length < 8 || seen.has(key)) return;
  if (isJunkPrompt(key)) return;
  seen.add(key);
  list.push(question);
}

function cleanSentence(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/^[-•*\d.)\s]+/, "");
}

/** Drop TOC / heading / metadata that should never become quiz terms. */
export function isJunkQuizTerm(term: string): boolean {
  const cleaned = cleanSentence(term);
  if (!cleaned || cleaned.length < 2 || cleaned.length > 48) return true;
  if (JUNK_TERM.test(cleaned)) return true;
  if (JUNK_IN_TERM.test(cleaned)) return true;
  if (/^(the|this|that|there|here|when|if|it|they|these|those|a|an|and|or|of|to|for|in|on)\b/i.test(cleaned)) {
    return true;
  }
  // "Part 1 Business Trends" style headings
  if (/^part\b/i.test(cleaned) || /^chapter\b/i.test(cleaned)) return true;
  if (/\d{3,}/.test(cleaned)) return true;
  // Too many capitalized words → likely a section title, not a concept
  const words = cleaned.split(/\s+/);
  if (words.length >= 4) {
    const titleish = words.filter((word) => /^[A-Z]/.test(word)).length;
    if (titleish >= words.length - 1) return true;
  }
  return false;
}

export function isJunkPrompt(prompt: string): boolean {
  const text = prompt.toLowerCase().replace(/\s+/g, " ").trim();
  if (/define:\s*(sources?|part\s+\d+|chapter\s+\d+|references?)\b/i.test(prompt)) {
    return true;
  }
  if (/\b(table of contents|bibliography|all rights reserved)\b/i.test(text)) {
    return true;
  }
  const defineMatch = prompt.match(/^define:\s*(.+)$/i);
  if (defineMatch?.[1] && isJunkQuizTerm(defineMatch[1])) return true;

  const termFromStem = (raw: string) =>
    raw.replace(/^(a|an|the)\s+/i, "").replace(/[?.!]+$/g, "").trim();

  const whatIsMatch = prompt.match(/^what is\s+(.+?)\??$/i);
  if (whatIsMatch?.[1] && isJunkQuizTerm(termFromStem(whatIsMatch[1]))) return true;

  const defineBare = prompt.match(/^define\s+(.+?)\.?$/i);
  if (defineBare?.[1] && isJunkQuizTerm(termFromStem(defineBare[1]))) return true;

  return false;
}

function looksLikeRealDefinition(definition: string): boolean {
  const text = cleanSentence(definition);
  if (text.length < 18 || text.length > 220) return false;
  if (JUNK_TERM.test(text)) return false;
  if (/^(http|www\.|see also|ibid)/i.test(text)) return false;
  // Prefer definition-like wording
  if (
    /\b(any|activity|amount|people|company|process|chance|organization|goods|services|money|product|concept|practice)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  // At least a few ordinary words, not another heading
  const words = text.split(/\s+/);
  if (words.length < 4) return false;
  const titleish = words.filter((word) => /^[A-Z][a-z]+$/.test(word) || /^[A-Z]+$/.test(word)).length;
  return titleish < words.length * 0.75;
}

function looksLikeTerm(term: string): boolean {
  if (isJunkQuizTerm(term)) return false;
  const words = term.trim().split(/\s+/);
  // Concept terms are usually 1–3 words (profit, stakeholders, standard of living)
  if (words.length > 4) return false;
  return true;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(((i + 1) * 17 + copy.length * 3) % (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Strip TOC / sources lines so they don't become fake "definitions". */
function scrubStructuralNoise(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^(sources?|references?|bibliography|table of contents)\b.*$/gim, "")
    .replace(/^(part\s+\d+\b.*|chapter\s+\d+\b.*):\s*.*$/gim, "")
    .replace(/\bhttps?:\/\/\S+/gi, " ");
}

function extractDefinitions(text: string): Definition[] {
  const found: Definition[] = [];
  const seen = new Set<string>();
  const body = scrubStructuralNoise(text);

  const patterns: RegExp[] = [
    // Term: definition / Term — definition (single-line concept glosses)
    /^([A-Za-z][A-Za-z0-9 &'/-]{1,40})\s*[:—–-]\s+(.{18,220})$/gm,
    // A business is any/a/an/the ... / Profit is the amount ...
    /\b([A-Za-z][A-Za-z0-9 &'/-]{1,40})\s+is\s+(?:a|an|the|any)\s+(.{18,200}?)(?:\.|$)/gi,
    // Loss occurs when ...
    /\b([A-Za-z][A-Za-z0-9 &'/-]{1,40})\s+occurs?\s+when\s+(.{18,200}?)(?:\.|$)/gi,
    // Standard of living refers to ...
    /\b([A-Za-z][A-Za-z ]{2,40}?)\s+refers?\s+to\s+(.{18,200}?)(?:\.|$)/gi,
    // Outsourcing involves / means ...
    /\b([A-Za-z][A-Za-z0-9 &'/-]{1,40})\s+(?:involves?|means)\s+(.{18,200}?)(?:\.|$)/gi,
    // Stakeholders are ...
    /\b([A-Za-z][A-Za-z0-9 &'/-]{1,40})\s+are\s+(.{18,200}?)(?:\.|$)/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(body)) !== null) {
      const term = cleanSentence(match[1] ?? "");
      const definition = cleanSentence(match[2] ?? "");
      if (!looksLikeTerm(term) || !looksLikeRealDefinition(definition)) continue;
      const key = term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ term, definition });
      if (found.length >= 40) return found;
    }
  }

  return found;
}

function mcFromDefinition(
  def: Definition,
  pool: Definition[],
): GeneratedQuizQuestion | null {
  const distractors = shuffle(
    pool
      .filter((item) => item.term.toLowerCase() !== def.term.toLowerCase())
      .map((item) => item.definition),
  )
    .slice(0, 3)
    .map((text) => text.slice(0, 120));

  if (distractors.length < 2) return null;

  const correct = def.definition.slice(0, 120);
  const options = shuffle([correct, ...distractors]).slice(0, 4);
  if (!options.includes(correct)) options[0] = correct;

  return {
    type: "MULTIPLE_CHOICE",
    prompt: `What is ${def.term}?`,
    options,
    correctAnswer: correct,
    explanation: `This matches the chapter's definition of ${def.term}.`,
  };
}

function termFromDefinitionMc(
  def: Definition,
  pool: Definition[],
): GeneratedQuizQuestion | null {
  const distractors = shuffle(
    pool
      .filter((item) => item.term.toLowerCase() !== def.term.toLowerCase())
      .map((item) => item.term),
  ).slice(0, 3);

  if (distractors.length < 2) return null;

  const options = shuffle([def.term, ...distractors]).slice(0, 4);
  if (!options.includes(def.term)) options[0] = def.term;

  return {
    type: "MULTIPLE_CHOICE",
    prompt: `Which term refers to: ${def.definition.slice(0, 140)}${
      def.definition.length > 140 ? "…" : ""
    }?`,
    options,
    correctAnswer: def.term,
    explanation: `This matches the chapter's definition of ${def.term}.`,
  };
}

/**
 * Build quiz items directly from reading text (notebook / material).
 * Mix: mostly multiple choice, some write-ins — never TOC/header junk.
 */
export function quizQuestionsFromSourceText(
  raw: string,
  maxQuestions = QUIZ_QUESTION_MAX,
): GeneratedQuizQuestion[] {
  const text = raw.replace(/\r/g, "\n").trim();
  if (text.length < 12) return [];

  const questions: GeneratedQuizQuestion[] = [];
  const seen = new Set<string>();
  const definitions = extractDefinitions(text);

  // Code / Java helpers (keep for CS materials)
  const classMatch = text.match(/\b(?:public\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
  if (classMatch?.[1]) {
    pushUnique(questions, seen, {
      type: "SHORT_ANSWER",
      prompt: "What is the name of the Java class in this material?",
      correctAnswer: classMatch[1],
      explanation: `The class is declared as class ${classMatch[1]}.`,
    });
  }

  if (/\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w*\s*\)/.test(text)) {
    pushUnique(questions, seen, {
      type: "MULTIPLE_CHOICE",
      prompt: "Which method starts a Java application?",
      options: ["main", "start", "run", "init"],
      correctAnswer: "main",
      explanation: "The JVM looks for public static void main(String[] args).",
    });
  }

  if (/\bSystem\.out\.println\b/.test(text)) {
    const printed = text.match(/System\.out\.println\s*\(\s*"([^"]+)"\s*\)/);
    pushUnique(questions, seen, {
      type: "SHORT_ANSWER",
      prompt: "What does System.out.println do?",
      correctAnswer: "Prints a line of text to the console",
    });
    if (printed?.[1]) {
      pushUnique(questions, seen, {
        type: "FILL_IN_BLANK",
        prompt: 'System.out.println("____");',
        correctAnswer: printed[1],
      });
    }
  }

  // Pass 1: multiple choice from solid definitions
  for (const def of definitions) {
    if (questions.length >= maxQuestions) break;
    const mc = mcFromDefinition(def, definitions);
    if (mc) pushUnique(questions, seen, mc);
  }

  for (const def of definitions) {
    if (questions.length >= maxQuestions) break;
    const termMc = termFromDefinitionMc(def, definitions);
    if (termMc) pushUnique(questions, seen, termMc);
  }

  // Pass 2: write-ins for a subset (~30%), not every junk heading
  const writeInBudget = Math.max(3, Math.round(maxQuestions * 0.3));
  let writeIns = 0;
  for (const def of definitions) {
    if (questions.length >= maxQuestions || writeIns >= writeInBudget) break;
    pushUnique(questions, seen, {
      type: "SHORT_ANSWER",
      prompt: `Define ${def.term}.`,
      correctAnswer: def.definition,
      explanation: `This matches the chapter's definition of ${def.term}.`,
    });
    writeIns += 1;

    if (questions.length >= maxQuestions || writeIns >= writeInBudget) break;
    pushUnique(questions, seen, {
      type: "FILL_IN_BLANK",
      prompt: `${def.term} is ____.`,
      correctAnswer: def.definition.split(/[.!?]/)[0]?.trim() || def.definition,
      explanation: `From the chapter definition of ${def.term}.`,
    });
    writeIns += 1;
  }

  // Learning objectives only when they look like real objectives (verb + content)
  const lines = text
    .split(/\n+/)
    .map(cleanSentence)
    .filter((line) => line.length >= 24 && line.length <= 180);

  for (const line of lines) {
    if (questions.length >= maxQuestions) break;
    if (!/^(LO\s*[\d.-]+|Objective)\b/i.test(line)) continue;
    const topic = line.replace(/^(LO\s*[\d.-]+:?\s*|Objective:?\s*)/i, "");
    if (isJunkQuizTerm(topic) || topic.split(/\s+/).length < 4) continue;
    if (!/\b(describe|explain|identify|compare|define|list|analyze|apply|evaluate)\b/i.test(topic)) {
      continue;
    }
    pushUnique(questions, seen, {
      type: "SHORT_ANSWER",
      prompt: `In your own words: ${topic}`,
      correctAnswer: topic,
    });
  }

  if (questions.length === 0 && text.length >= 12) {
    pushUnique(questions, seen, {
      type: "SHORT_ANSWER",
      prompt: "Summarize the main idea of this reading in one sentence.",
      correctAnswer: text.slice(0, 200).replace(/\s+/g, " ").trim(),
    });
  }

  return questions.slice(0, maxQuestions);
}
