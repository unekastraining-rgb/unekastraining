/**
 * Explicit multi-concept learning paths (Phase 3B-2 + Phase 6 expansion).
 * Controlled target → concept-id mappings. Not fuzzy domain expansion.
 * Every conceptId must exist in the referenced pack.
 */

export type KnowledgeLearningPath = {
  id: string;
  /** Lowercase phrases that identify this path. */
  match: readonly string[];
  packId: string;
  conceptIds: readonly string[];
  displayTitle: string;
};

/** Canonical ordered concept ids for the Python fundamentals path. */
export const PYTHON_FUNDAMENTALS_PATH_IDS = [
  "python-variables",
  "python-conditionals",
  "python-loops",
  "python-functions",
  "python-lists",
  "python-dictionaries",
  "python-exceptions",
] as const;

/** Canonical ordered concept ids for the Java fundamentals path. */
export const JAVA_FUNDAMENTALS_PATH_IDS = [
  "java-variables",
  "java-if-else",
  "java-for",
  "java-methods",
  "java-arrays",
  "java-arraylist",
  "java-classes-basics",
  "java-inheritance",
  "java-polymorphism",
  "java-exceptions",
] as const;

export const KNOWLEDGE_LEARNING_PATHS: readonly KnowledgeLearningPath[] = [
  {
    id: "python-programming-fundamentals",
    match: [
      "python programming fundamentals",
      "python fundamentals",
      "python programming basics",
      "intro to python programming",
    ],
    packId: "python-fundamentals",
    conceptIds: PYTHON_FUNDAMENTALS_PATH_IDS,
    displayTitle: "Python Programming fundamentals",
  },
  {
    id: "java-programming-fundamentals",
    match: [
      "java programming fundamentals",
      "java fundamentals",
      "intro to java programming",
      "java programming basics",
    ],
    packId: "java-fundamentals",
    conceptIds: JAVA_FUNDAMENTALS_PATH_IDS,
    displayTitle: "Java Programming fundamentals",
  },
  {
    id: "economics-fundamentals-path",
    match: [
      "economics fundamentals",
      "intro to economics",
      "economics basics path",
    ],
    packId: "economics-fundamentals",
    conceptIds: [
      "economics-scarcity",
      "economics-opportunity-cost",
      "economics-supply-demand",
      "economics-equilibrium",
      "economics-elasticity",
    ],
    displayTitle: "Economics fundamentals",
  },
  {
    id: "business-fundamentals-path",
    match: [
      "business fundamentals",
      "intro to business",
      "business basics path",
    ],
    packId: "business-fundamentals",
    conceptIds: [
      "business-entrepreneurship",
      "business-management",
      "business-marketing",
      "business-operations",
      "business-financial-statements",
      "business-strategy",
    ],
    displayTitle: "Business fundamentals",
  },
  {
    id: "math-algebra-foundations",
    match: [
      "algebra foundations",
      "algebra fundamentals",
      "intro to algebra",
      "math fundamentals",
    ],
    packId: "math-fundamentals",
    conceptIds: [
      "math-algebra-variables",
      "math-expressions",
      "math-equations",
      "math-linear-equations",
      "math-functions",
    ],
    displayTitle: "Algebra foundations",
  },
  {
    id: "stocks-fundamentals-path",
    match: [
      "stocks fundamentals",
      "stock market basics",
      "intro to stocks",
    ],
    packId: "stocks-fundamentals",
    conceptIds: [
      "stocks-share",
      "stocks-market-cap",
      "stocks-revenue-earnings",
      "stocks-eps",
      "stocks-pe-ratio",
      "stocks-dividends",
      "stocks-valuation-risk",
    ],
    displayTitle: "Stocks fundamentals",
  },
  {
    id: "marketing-fundamentals-path",
    match: [
      "marketing fundamentals",
      "intro to marketing",
      "marketing basics path",
      "teach me marketing",
    ],
    packId: "business-fundamentals",
    conceptIds: [
      "business-marketing",
      "business-customer-value",
      "business-segmentation",
      "business-targeting",
      "business-positioning",
      "business-marketing-mix",
    ],
    displayTitle: "Marketing fundamentals",
  },
  {
    id: "psychology-fundamentals-path",
    match: [
      "psychology fundamentals",
      "intro to psychology",
      "psychology basics path",
    ],
    packId: "psychology-fundamentals",
    conceptIds: [
      "psychology-classical-conditioning",
      "psychology-operant-conditioning",
      "psychology-reinforcement",
      "psychology-memory-basics",
    ],
    displayTitle: "Psychology fundamentals",
  },
  {
    id: "sql-fundamentals-path",
    match: [
      "sql fundamentals",
      "intro to sql",
      "sql basics path",
    ],
    packId: "sql-fundamentals",
    conceptIds: [
      "sql-tables",
      "sql-keys",
      "sql-joins",
      "sql-inner-join",
      "sql-left-join",
    ],
    displayTitle: "SQL fundamentals",
  },
  {
    id: "biology-fundamentals-path",
    match: [
      "biology fundamentals",
      "intro to biology",
      "biology basics path",
    ],
    packId: "biology-fundamentals",
    conceptIds: [
      "biology-cell-structure",
      "biology-cell-membrane",
      "biology-photosynthesis",
      "biology-cellular-respiration",
    ],
    displayTitle: "Biology fundamentals",
  },
  {
    id: "academic-essay-writing-path",
    match: [
      "academic essay writing",
      "how to write an essay",
      "teach me how to write an essay",
      "essay writing path",
      "learn to write an essay",
    ],
    packId: "writing-fundamentals",
    conceptIds: [
      "writing-purpose",
      "writing-structure",
      "writing-thesis",
      "writing-introduction",
      "writing-body-paragraph",
      "writing-evidence",
      "writing-analysis",
      "writing-transitions",
      "writing-conclusion",
      "writing-revision",
    ],
    displayTitle: "Academic essay writing",
  },
  {
    id: "argumentative-writing-path",
    match: [
      "argumentative writing",
      "how to write an argumentative paper",
      "teach me argumentative writing",
      "argumentative essay path",
    ],
    packId: "writing-fundamentals",
    conceptIds: [
      "writing-argument",
      "writing-claim",
      "writing-evidence",
      "writing-reasoning",
      "writing-counterargument",
      "writing-rebuttal",
      "writing-conclusion",
    ],
    displayTitle: "Argumentative writing",
  },
  {
    id: "research-paper-writing-path",
    match: [
      "research paper writing",
      "how to write a research paper",
      "teach me research writing",
      "research writing path",
    ],
    packId: "writing-fundamentals",
    conceptIds: [
      "writing-research-question",
      "writing-source",
      "writing-thesis",
      "writing-evidence",
      "writing-paraphrase",
      "writing-synthesis",
      "writing-analysis",
      "writing-citation",
      "writing-revision",
    ],
    displayTitle: "Research paper writing",
  },
  {
    id: "writing-improvement-path",
    match: [
      "writing improvement",
      "improve my writing",
      "how to revise my paper",
      "revision and editing path",
    ],
    packId: "writing-fundamentals",
    conceptIds: [
      "writing-clarity",
      "writing-organization",
      "writing-coherence",
      "writing-evidence",
      "writing-analysis",
      "writing-revision",
      "writing-editing",
    ],
    displayTitle: "Writing improvement",
  },
];

/** Match an explicit learning path, or null. Rejects bare subject words (e.g. "python"). */
export function matchKnowledgeLearningPath(
  target: string,
): KnowledgeLearningPath | null {
  const key = target.toLowerCase().trim();
  if (!key) return null;
  for (const path of KNOWLEDGE_LEARNING_PATHS) {
    for (const phrase of path.match) {
      if (key === phrase) return path;
      if (key.length >= 12 && key.includes(phrase)) return path;
      if (phrase.length >= 12 && key.length >= 12 && phrase.includes(key)) {
        return path;
      }
    }
  }
  return null;
}
