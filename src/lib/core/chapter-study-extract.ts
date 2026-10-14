import type { CoreFormatId } from "@/lib/core/format-catalog";
import type { PackedStudySource } from "@/lib/core/pack-study-source";
import type { FlowData, NoteDocument, OutlineNode } from "@/lib/core/note-types";
import { emptyFlow } from "@/lib/core/note-types";
import { switchNotebookPage } from "@/lib/core/notebook-pages";

export interface LearningObjectiveExtract {
  code: string;
  statement: string;
  keyPoints: string[];
}

export interface FrameworkExtract {
  name: string;
  items: string[];
}

export interface ComparisonExtract {
  topic: string;
  positives: string[];
  negatives: string[];
}

export interface WorkedExampleExtract {
  title: string;
  purpose: string;
  setup: string;
  steps: string[];
  result: string;
}

export interface StudyExtractCoverage {
  sourceChars: number;
  packedChars: number;
  truncated: boolean;
  sections: PackedStudySource["sections"];
}

export interface ExtractQuizItem {
  question: string;
  answer: string;
  type?: string;
  options?: string[];
  explanation?: string;
}

export interface ChapterStudyExtract {
  title: string;
  chapterOverview: string;
  learningObjectives: LearningObjectiveExtract[];
  definitions: Array<{ term: string; definition: string }>;
  frameworks: FrameworkExtract[];
  comparisons: ComparisonExtract[];
  mustKnow: string[];
  studyToRemember: string[];
  testYourself: ExtractQuizItem[];
  processesOrSteps: Array<{ name: string; steps: string[] }>;
  /** Teaching walkthroughs (conversions, IDLE, fetch-decode-execute) — not book homework. */
  workedExamples?: WorkedExampleExtract[];
  /** Valid Core format ids the model recommends for this chapter. */
  recommendedFormats: CoreFormatId[];
  coverageNotes?: string;
  /** Computed packing stats — what the model actually saw. */
  coverage?: StudyExtractCoverage;
}

function workedExamplesOf(extract: ChapterStudyExtract): WorkedExampleExtract[] {
  return extract.workedExamples ?? [];
}

export const MAX_LEFTOVER_STUDY_PAGES = 6;

const ALLOWED_FORMATS = new Set<CoreFormatId>([
  "OUTLINE",
  "HIERARCHY",
  "CORNELL",
  "TWO_COLUMN",
  "CONCEPT_DEFINITION",
  "QA",
  "TIMELINE",
  "PROGRESSIVE",
  "PROBLEM_SOLUTION",
  "CHARTING",
  "MIND_MAP",
  "FLOW",
  "PROCESS_FLOW",
]);

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseStudyCoverage(value: unknown): StudyExtractCoverage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as {
    sourceChars?: unknown;
    packedChars?: unknown;
    truncated?: unknown;
    sections?: unknown;
  };
  const sourceChars = Number(raw.sourceChars);
  const packedChars = Number(raw.packedChars);
  if (!Number.isFinite(sourceChars) || !Number.isFinite(packedChars)) return undefined;
  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((section) => {
          const item = section as {
            heading?: unknown;
            sourceChars?: unknown;
            packedChars?: unknown;
          };
          return {
            heading: String(item.heading ?? "").trim(),
            sourceChars: Number(item.sourceChars) || 0,
            packedChars: Number(item.packedChars) || 0,
          };
        })
        .filter((section) => section.heading)
    : [];
  return {
    sourceChars,
    packedChars,
    truncated: Boolean(raw.truncated),
    sections,
  };
}

function emptySliceBase(extract: ChapterStudyExtract, title: string): ChapterStudyExtract {
  return {
    ...extract,
    title,
    chapterOverview: "",
    learningObjectives: [],
    definitions: [],
    frameworks: [],
    comparisons: [],
    mustKnow: [],
    studyToRemember: [],
    testYourself: [],
    processesOrSteps: [],
    workedExamples: [],
    recommendedFormats: [],
    coverageNotes: undefined,
  };
}

export function normalizeChapterStudyExtract(
  raw: Record<string, unknown>,
): ChapterStudyExtract {
  const definitions = Array.isArray(raw.definitions)
    ? (raw.definitions as Array<{ term?: string; definition?: string }>)
        .map((item) => ({
          term: String(item.term ?? "").trim(),
          definition: String(item.definition ?? "").trim(),
        }))
        .filter((item) => item.term || item.definition)
    : [];

  const learningObjectives = Array.isArray(raw.learningObjectives)
    ? (raw.learningObjectives as Array<{
        code?: string;
        statement?: string;
        keyPoints?: unknown;
      }>)
        .map((item) => ({
          code: String(item.code ?? "").trim(),
          statement: String(item.statement ?? "").trim(),
          keyPoints: asStringList(item.keyPoints),
        }))
        .filter((item) => item.code || item.statement || item.keyPoints.length > 0)
    : [];

  const frameworks = Array.isArray(raw.frameworks)
    ? (raw.frameworks as Array<{ name?: string; items?: unknown }>)
        .map((item) => ({
          name: String(item.name ?? "").trim(),
          items: asStringList(item.items),
        }))
        .filter((item) => item.name || item.items.length > 0)
    : [];

  const comparisons = Array.isArray(raw.comparisons)
    ? (raw.comparisons as Array<{
        topic?: string;
        positives?: unknown;
        negatives?: unknown;
        pros?: unknown;
        cons?: unknown;
      }>)
        .map((item) => ({
          topic: String(item.topic ?? "").trim(),
          positives: asStringList(item.positives ?? item.pros),
          negatives: asStringList(item.negatives ?? item.cons),
        }))
        .filter(
          (item) =>
            item.topic || item.positives.length > 0 || item.negatives.length > 0,
        )
    : [];

  const testYourself = Array.isArray(raw.testYourself)
    ? (raw.testYourself as Array<{
        question?: string;
        prompt?: string;
        answer?: unknown;
        correctAnswer?: unknown;
        type?: string;
        options?: unknown;
        explanation?: string;
      }>)
        .map((item) => {
          const answerValue = item.answer ?? item.correctAnswer ?? "";
          const answer =
            typeof answerValue === "boolean"
              ? answerValue
                ? "true"
                : "false"
              : Array.isArray(answerValue)
                ? answerValue.map(String).join(", ")
                : String(answerValue ?? "").trim();
          return {
            question: String(item.question ?? item.prompt ?? "").trim(),
            answer,
            type: item.type ? String(item.type).trim() : undefined,
            options: Array.isArray(item.options)
              ? item.options.map((option) => String(option).trim()).filter(Boolean)
              : undefined,
            explanation: item.explanation ? String(item.explanation).trim() : undefined,
          };
        })
        .filter((item) => item.question || item.answer)
    : [];

  const processesOrSteps = Array.isArray(raw.processesOrSteps)
    ? (raw.processesOrSteps as Array<{ name?: string; steps?: string[] }>)
        .map((item) => ({
          name: String(item.name ?? "").trim(),
          steps: Array.isArray(item.steps)
            ? item.steps.map((step) => String(step).trim()).filter(Boolean)
            : [],
        }))
        .filter((item) => item.name || item.steps.length > 0)
    : [];

  const workedExamples = Array.isArray(raw.workedExamples)
    ? (raw.workedExamples as Array<{
        title?: string;
        purpose?: string;
        setup?: string;
        steps?: unknown;
        result?: string;
      }>)
        .map((item) => ({
          title: String(item.title ?? "").trim(),
          purpose: String(item.purpose ?? "").trim(),
          setup: String(item.setup ?? "").trim(),
          steps: asStringList(item.steps),
          result: String(item.result ?? "").trim(),
        }))
        .filter(
          (item) =>
            item.title || item.setup || item.result || item.steps.length > 0,
        )
    : [];

  const recommendedFormats = (
    Array.isArray(raw.recommendedFormats) ? (raw.recommendedFormats as string[]) : []
  )
    .map((id) => id as CoreFormatId)
    .filter((id) => ALLOWED_FORMATS.has(id));

  if (learningObjectives.length > 0 && !recommendedFormats.includes("OUTLINE")) {
    recommendedFormats.unshift("OUTLINE");
  }
  if (definitions.length > 0 && !recommendedFormats.includes("CONCEPT_DEFINITION")) {
    recommendedFormats.unshift("CONCEPT_DEFINITION");
  }
  if (
    frameworks.length > 0 &&
    !recommendedFormats.includes("CHARTING") &&
    !recommendedFormats.includes("COMPARISON_MATRIX")
  ) {
    recommendedFormats.push("CHARTING");
  }
  if (
    comparisons.length > 0 &&
    !recommendedFormats.includes("TWO_COLUMN") &&
    !recommendedFormats.includes("BOXING")
  ) {
    recommendedFormats.push("TWO_COLUMN");
  }
  if (
    (Array.isArray(raw.mustKnow) && (raw.mustKnow as string[]).length > 0) &&
    !recommendedFormats.includes("OUTLINE") &&
    !recommendedFormats.includes("HIERARCHY") &&
    !recommendedFormats.includes("CORNELL")
  ) {
    recommendedFormats.push("OUTLINE");
  }
  if (
    processesOrSteps.length > 0 &&
    !recommendedFormats.includes("PROCESS_FLOW") &&
    !recommendedFormats.includes("FLOW") &&
    !recommendedFormats.includes("PROGRESSIVE")
  ) {
    recommendedFormats.push("PROCESS_FLOW");
  }
  if (
    processesOrSteps.some((p) => /evolut|histor|timeline|era|decade/i.test(p.name)) ||
    /evolution|history of/i.test(String(raw.chapterOverview ?? ""))
  ) {
    if (!recommendedFormats.includes("TIMELINE")) {
      recommendedFormats.push("TIMELINE");
    }
  }
  const withoutQa = recommendedFormats.filter((id) => id !== "QA");

  return {
    title: String(raw.title ?? "Chapter study extract").trim() || "Chapter study extract",
    chapterOverview: String(raw.chapterOverview ?? "").trim(),
    learningObjectives,
    definitions,
    frameworks,
    comparisons,
    mustKnow: asStringList(raw.mustKnow),
    studyToRemember: asStringList(raw.studyToRemember),
    testYourself,
    processesOrSteps,
    workedExamples,
    recommendedFormats: [...new Set(withoutQa)].slice(0, 6),
    coverageNotes: raw.coverageNotes ? String(raw.coverageNotes) : undefined,
    coverage: parseStudyCoverage(raw.coverage),
  };
}

export function attachPackedCoverage(
  extract: ChapterStudyExtract,
  packed: PackedStudySource | undefined,
): ChapterStudyExtract {
  if (!packed) return extract;
  return {
    ...extract,
    coverage: {
      sourceChars: packed.sourceChars,
      packedChars: packed.packedChars,
      truncated: packed.truncated,
      sections: packed.sections,
    },
  };
}

export function missingCoverageHeadings(
  extract: ChapterStudyExtract,
  coverage?: StudyExtractCoverage,
): string[] {
  if (!coverage?.sections.length) return [];
  const blob = [
    extract.chapterOverview,
    ...extract.definitions.map((item) => `${item.term} ${item.definition}`),
    ...extract.comparisons.map((item) => item.topic),
    ...extract.processesOrSteps.map((item) => item.name),
    ...workedExamplesOf(extract).map((item) => item.title),
    ...extract.mustKnow,
    ...extract.learningObjectives.map((item) => `${item.code} ${item.statement}`),
  ]
    .join("\n")
    .toLowerCase();

  return coverage.sections
    .filter((section) => {
      const heading = section.heading.replace(/\s+/g, " ").trim();
      const number = heading.match(/\d+\.\d+/)?.[0];
      const words = heading.replace(/^\d+\.\d+[.:]?\s*/, "").slice(0, 18).toLowerCase();
      if (number && blob.includes(number)) return false;
      if (words.length >= 4 && blob.includes(words)) return false;
      return heading.toLowerCase() !== "opening";
    })
    .map((section) => section.heading);
}

export function mergeChapterExtracts(
  base: ChapterStudyExtract,
  extra: ChapterStudyExtract,
): ChapterStudyExtract {
  const defKeys = new Set(base.definitions.map((item) => item.term.toLowerCase()));
  const compareKeys = new Set(base.comparisons.map((item) => item.topic.toLowerCase()));
  const processKeys = new Set(base.processesOrSteps.map((item) => item.name.toLowerCase()));
  const exampleKeys = new Set(workedExamplesOf(base).map((item) => item.title.toLowerCase()));
  const questionKeys = new Set(base.testYourself.map((item) => item.question.toLowerCase()));

  return {
    ...base,
    chapterOverview: base.chapterOverview || extra.chapterOverview,
    definitions: [
      ...base.definitions,
      ...extra.definitions.filter((item) => item.term && !defKeys.has(item.term.toLowerCase())),
    ],
    comparisons: [
      ...base.comparisons,
      ...extra.comparisons.filter((item) => item.topic && !compareKeys.has(item.topic.toLowerCase())),
    ],
    processesOrSteps: [
      ...base.processesOrSteps,
      ...extra.processesOrSteps.filter((item) => item.name && !processKeys.has(item.name.toLowerCase())),
    ],
    workedExamples: [
      ...workedExamplesOf(base),
      ...workedExamplesOf(extra).filter((item) => item.title && !exampleKeys.has(item.title.toLowerCase())),
    ],
    mustKnow: [...base.mustKnow, ...extra.mustKnow.filter((item) => !base.mustKnow.includes(item))],
    frameworks: [
      ...base.frameworks,
      ...extra.frameworks.filter(
        (item) =>
          !base.frameworks.some((existing) => existing.name.toLowerCase() === item.name.toLowerCase()),
      ),
    ],
    learningObjectives:
      base.learningObjectives.length > 0 ? base.learningObjectives : extra.learningObjectives,
    testYourself: [
      ...base.testYourself,
      ...extra.testYourself.filter(
        (item) => item.question && !questionKeys.has(item.question.toLowerCase()),
      ),
    ].slice(0, 30),
    coverageNotes: [base.coverageNotes, extra.coverageNotes].filter(Boolean).join(" ") || undefined,
  };
}

export function leftoverStudySlices(
  extract: ChapterStudyExtract,
): Array<{ label: string; formatId: CoreFormatId; extract: ChapterStudyExtract }> {
  const slices: Array<{ label: string; formatId: CoreFormatId; extract: ChapterStudyExtract }> =
    [];

  for (const comparison of extract.comparisons.slice(1)) {
    const title = comparison.topic || "Compare";
    slices.push({
      label: title.slice(0, 40),
      formatId: "TWO_COLUMN",
      extract: {
        ...emptySliceBase(extract, title),
        comparisons: [comparison],
        recommendedFormats: ["TWO_COLUMN"],
      },
    });
  }

  for (const process of extract.processesOrSteps.slice(1)) {
    const title = process.name || "Process";
    slices.push({
      label: title.slice(0, 40),
      formatId: "PROCESS_FLOW",
      extract: {
        ...emptySliceBase(extract, title),
        processesOrSteps: [process],
        recommendedFormats: ["PROCESS_FLOW"],
      },
    });
  }

  for (const example of workedExamplesOf(extract)) {
    const title = example.title || "Walkthrough";
    const steps = [example.setup, ...example.steps, example.result].filter(Boolean);
    if (steps.length === 0) continue;
    slices.push({
      label: title.slice(0, 40),
      formatId: "PROCESS_FLOW",
      extract: {
        ...emptySliceBase(extract, title),
        processesOrSteps: [{ name: title, steps }],
        recommendedFormats: ["PROCESS_FLOW"],
      },
    });
  }

  return slices.slice(0, MAX_LEFTOVER_STUDY_PAGES);
}

export function formatExtractCoverageLines(extract: ChapterStudyExtract): string[] {
  const lines: string[] = [];
  const packed = extract.coverage;
  if (packed) {
    lines.push(
      `Source ${packed.sourceChars} chars → packed ${packed.packedChars}` +
        (packed.truncated ? " (balanced across sections)" : ""),
    );
    if (packed.sections.length > 0) {
      lines.push(
        `Sections: ${packed.sections
          .map((section) => section.heading.replace(/\s+/g, " ").slice(0, 36))
          .join(" · ")}`,
      );
      const thin = packed.sections.filter(
        (section) =>
          section.sourceChars > 1200 && section.packedChars / section.sourceChars < 0.45,
      );
      if (thin.length > 0) {
        lines.push(
          `Thinned: ${thin
            .map((section) => section.heading.replace(/\s+/g, " ").slice(0, 32))
            .join(", ")}`,
        );
      }
    }
  }
  const examples = workedExamplesOf(extract);
  lines.push(
    `${extract.comparisons.length} comparisons · ${extract.processesOrSteps.length} processes · ${examples.length} walkthroughs · ${extract.testYourself.length} quiz items`,
  );
  const extraBits = [
    extract.comparisons.length > 1
      ? `${extract.comparisons.length - 1} more comparison${extract.comparisons.length > 2 ? "s" : ""}`
      : null,
    extract.processesOrSteps.length > 1
      ? `${extract.processesOrSteps.length - 1} more process${extract.processesOrSteps.length > 2 ? "es" : ""}`
      : null,
    examples.length > 0
      ? `${examples.length} walkthrough${examples.length > 1 ? "s" : ""}`
      : null,
  ].filter(Boolean);
  if (extraBits.length > 0) {
    lines.push(`Extra workspace pages: ${extraBits.join(" · ")}`);
  }
  if (extract.coverageNotes) lines.push(extract.coverageNotes);
  return lines;
}

/** Short overview for the page typed area — not the full extract dump. */
export function formatChapterStudyOverview(extract: ChapterStudyExtract): string {
  const parts = [`# ${extract.title}`];
  if (extract.chapterOverview) {
    parts.push("", extract.chapterOverview);
  }
  if (extract.learningObjectives.length > 0) {
    const codes = extract.learningObjectives
      .map((lo) => lo.code || lo.statement.slice(0, 48))
      .filter(Boolean);
    parts.push("", `Learning objectives: ${codes.join(" · ")}`);
  }
  if (extract.coverageNotes) {
    parts.push("", `_${extract.coverageNotes}_`);
  }
  return parts.join("\n").trim();
}

export function formatChapterStudyAsNote(extract: ChapterStudyExtract): string {
  const parts: string[] = [formatChapterStudyOverview(extract)];

  if (extract.learningObjectives.length > 0) {
    parts.push("", "## Master each learning objective", "");
    for (const lo of extract.learningObjectives) {
      const heading = [lo.code, lo.statement].filter(Boolean).join(" — ");
      parts.push(`### ${heading}`);
      for (const point of lo.keyPoints) parts.push(`- ${point}`);
      parts.push("");
    }
  }

  if (extract.definitions.length > 0) {
    parts.push("", "## Definitions", "");
    for (const item of extract.definitions) {
      parts.push(`- **${item.term}**: ${item.definition}`);
    }
  }

  if (extract.frameworks.length > 0) {
    parts.push("", "## Named lists & frameworks", "");
    for (const framework of extract.frameworks) {
      parts.push(`### ${framework.name}`);
      framework.items.forEach((item, index) => parts.push(`${index + 1}. ${item}`));
      parts.push("");
    }
  }

  if (extract.comparisons.length > 0) {
    parts.push("", "## Comparisons", "");
    for (const comparison of extract.comparisons) {
      parts.push(`### ${comparison.topic}`);
      if (comparison.positives.length > 0) {
        parts.push("**Positives / advantages**");
        for (const item of comparison.positives) parts.push(`- ${item}`);
      }
      if (comparison.negatives.length > 0) {
        parts.push("**Negatives / disadvantages**");
        for (const item of comparison.negatives) parts.push(`- ${item}`);
      }
      parts.push("");
    }
  }

  if (extract.mustKnow.length > 0) {
    parts.push("", "## Must know", "");
    for (const item of extract.mustKnow) parts.push(`- ${item}`);
  }

  if (extract.studyToRemember.length > 0) {
    parts.push("", "## Study to remember", "");
    for (const item of extract.studyToRemember) parts.push(`- ${item}`);
  }

  if (extract.processesOrSteps.length > 0) {
    parts.push("", "## Processes & steps", "");
    for (const process of extract.processesOrSteps) {
      parts.push(`### ${process.name}`);
      process.steps.forEach((step, index) => parts.push(`${index + 1}. ${step}`));
      parts.push("");
    }
  }

  const examples = workedExamplesOf(extract);
  if (examples.length > 0) {
    parts.push("", "## Walkthroughs", "");
    for (const example of examples) {
      parts.push(`### ${example.title || "Walkthrough"}`);
      if (example.purpose) parts.push(example.purpose);
      if (example.setup) parts.push(`Setup: ${example.setup}`);
      example.steps.forEach((step, index) => parts.push(`${index + 1}. ${step}`));
      if (example.result) parts.push(`Result: ${example.result}`);
      parts.push("");
    }
  }

  if (extract.testYourself.length > 0) {
    parts.push("", "## Quiz bank", "");
    for (const item of extract.testYourself.slice(0, 30)) {
      parts.push(`- ${item.type ? `[${item.type}] ` : ""}${item.question}`);
    }
  }

  return parts.join("\n").trim();
}

function outlineFromExtract(extract: ChapterStudyExtract): OutlineNode[] {
  if (extract.learningObjectives.length > 0) {
    const nodes: OutlineNode[] = [];
    extract.learningObjectives.forEach((lo, loIndex) => {
      const heading = [lo.code, lo.statement].filter(Boolean).join(": ");
      nodes.push({
        id: rid(`outline_lo_${loIndex}`),
        text: heading || `Learning objective ${loIndex + 1}`,
        level: 0,
      });
      lo.keyPoints.forEach((point, pointIndex) => {
        nodes.push({
          id: rid(`outline_lo_${loIndex}_${pointIndex}`),
          text: point,
          level: 1,
        });
      });
    });
    if (extract.frameworks.length > 0) {
      nodes.push({
        id: rid("outline_fw"),
        text: "Named lists & frameworks",
        level: 0,
      });
      for (const framework of extract.frameworks) {
        nodes.push({
          id: rid("outline_fw_name"),
          text: framework.name,
          level: 1,
        });
        framework.items.forEach((item, index) => {
          nodes.push({
            id: rid(`outline_fw_${index}`),
            text: item,
            level: 2,
          });
        });
      }
    }
    return nodes;
  }

  // Fallback: must-know only (never dump study tips into the outline — that creates fluff).
  const lines = extract.mustKnow.map((text) => ({ text, level: 1 as const }));
  if (lines.length === 0) return [];
  return lines.map((line, index) => ({
    id: rid(`outline_${index}`),
    text: line.text,
    level: line.level,
  }));
}

function flowFromExtract(extract: ChapterStudyExtract): FlowData {
  const process = extract.processesOrSteps[0];
  if (!process || process.steps.length === 0) {
    return emptyFlow();
  }
  const nodes = process.steps.map((step, index) => ({
    id: rid(`flow_${index}`),
    label: step,
    x: 80 + index * 180,
    y: 160,
  }));
  const edges = nodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: nodes[index + 1]!.id,
  }));
  return { nodes, edges };
}

/** Build filled composite-section payload for a format from chapter extract. */
export function filledSectionDataFromExtract(
  formatId: CoreFormatId,
  extract: ChapterStudyExtract,
): Record<string, unknown> {
  switch (formatId) {
    case "CONCEPT_DEFINITION":
      return {
        concepts: {
          items:
            extract.definitions.length > 0
              ? extract.definitions.map((item) => ({
                  term: item.term,
                  definition: item.definition,
                  example: "",
                  application: "",
                }))
              : [{ term: "", definition: "", example: "", application: "" }],
        },
      };
    case "OUTLINE":
    case "HIERARCHY": {
      const nodes = outlineFromExtract(extract);
      return {
        outlineNodes:
          nodes.length > 0
            ? nodes
            : [{ id: rid("outline"), text: extract.title, level: 1 }],
      };
    }
    case "QA":
      return {
        qa: {
          pairs:
            extract.testYourself.length > 0
              ? extract.testYourself.map((item) => ({
                  question: item.question,
                  answer: item.answer,
                }))
              : extract.definitions.map((item) => ({
                  question: item.term,
                  answer: item.definition,
                })),
        },
      };
    case "CORNELL":
    case "CORNELL_MIND": {
      const cornell = {
        cues: [
          ...extract.learningObjectives.map((lo) => lo.code || lo.statement).filter(Boolean),
          ...extract.definitions.map((item) => item.term).filter(Boolean),
          ...extract.comparisons.map((item) => item.topic).filter(Boolean),
        ].join("\n"),
        notes: [
          ...extract.definitions.map((item) => `${item.term}: ${item.definition}`),
          ...extract.learningObjectives.flatMap((lo) =>
            [lo.statement, ...lo.keyPoints].filter(Boolean),
          ),
          ...extract.comparisons.flatMap((item) => [
            item.topic,
            ...item.positives.map((line) => `+ ${line}`),
            ...item.negatives.map((line) => `- ${line}`),
          ]),
          ...extract.processesOrSteps.flatMap((process) => [
            process.name,
            ...process.steps.map((step, index) => `${index + 1}. ${step}`),
          ]),
          ...extract.mustKnow,
          ...extract.frameworks.flatMap((fw) => [`${fw.name}:`, ...fw.items]),
        ]
          .filter(Boolean)
          .join("\n"),
        summary: extract.chapterOverview,
      };
      if (formatId === "CORNELL") return { cornell };
      const mind = filledSectionDataFromExtract("MIND_MAP", extract);
      return { cornell, mindMap: mind.mindMap };
    }
    case "TWO_COLUMN":
    case "BOXING": {
      if (extract.comparisons.length > 0) {
        const comparison = extract.comparisons[0]!;
        const rows = Array.from(
          {
            length: Math.max(
              comparison.positives.length,
              comparison.negatives.length,
              1,
            ),
          },
          (_, index) => ({
            left: comparison.positives[index] ?? "",
            right: comparison.negatives[index] ?? "",
          }),
        );
        return {
          twoColumn: {
            leftHeader: `${comparison.topic} — positives`,
            rightHeader: "Negatives",
            rows,
          },
        };
      }
      const left = extract.mustKnow;
      const right = extract.studyToRemember;
      const rows = Array.from(
        { length: Math.max(left.length, right.length, 1) },
        (_, index) => ({
          left: left[index] ?? "",
          right: right[index] ?? "",
        }),
      );
      return { twoColumn: { leftHeader: "Must know", rightHeader: "Remember", rows } };
    }
    case "PROGRESSIVE": {
      const process = extract.processesOrSteps[0];
      const steps =
        process?.steps.map((step, index) => ({
          title: `${process.name || "Step"} ${index + 1}`,
          content: step,
          code: "",
          output: "",
        })) ?? [];
      return {
        progressive: {
          steps:
            steps.length > 0
              ? steps
              : extract.mustKnow.map((item, index) => ({
                  title: `Point ${index + 1}`,
                  content: item,
                  code: "",
                  output: "",
                })),
        },
      };
    }
    case "FLOW":
    case "PROCESS_FLOW":
      return { flow: flowFromExtract(extract) };
    case "TIMELINE": {
      const process =
        extract.processesOrSteps.find((item) =>
          /evolut|histor|timeline|era|decade|period/i.test(item.name),
        ) ?? extract.processesOrSteps[0];
      return {
        timeline: {
          events:
            process?.steps.map((step, index) => ({
              date: `${index + 1}`,
              title: step.slice(0, 80),
              description: step,
            })) ?? [{ date: "", title: "", description: "" }],
        },
      };
    }
    case "MIND_MAP": {
      const rootId = "root";
      const fromLos = extract.learningObjectives.slice(0, 8).map((lo, index) => ({
        id: rid(`mm_${index}`),
        label: (lo.code || lo.statement).slice(0, 48),
        x: 120 + (index % 4) * 140,
        y: 80 + Math.floor(index / 4) * 120,
      }));
      const children =
        fromLos.length > 0
          ? fromLos
          : extract.mustKnow.slice(0, 8).map((text, index) => ({
              id: rid(`mm_${index}`),
              label: text.slice(0, 48),
              x: 120 + (index % 4) * 140,
              y: 80 + Math.floor(index / 4) * 120,
            }));
      return {
        mindMap: {
          nodes: [
            { id: rootId, label: extract.title.slice(0, 48), x: 280, y: 180 },
            ...children,
          ],
          edges: children.map((child) => ({ from: rootId, to: child.id })),
        },
      };
    }
    case "PROBLEM_SOLUTION": {
      const examples = workedExamplesOf(extract);
      return {
        problemSolution: {
          items:
            examples.length > 0
              ? examples.map((example) => ({
                  problem: [example.title, example.setup].filter(Boolean).join(": "),
                  approach: example.steps.join(" → "),
                  solution: example.result,
                  notes: example.purpose,
                }))
              : extract.learningObjectives.length > 0
                ? extract.learningObjectives.map((lo) => ({
                    problem: [lo.code, lo.statement].filter(Boolean).join(": "),
                    approach: "Explain using chapter frameworks and examples",
                    solution: lo.keyPoints.join(" · "),
                    notes: "",
                  }))
                : extract.mustKnow.length > 0
                  ? extract.mustKnow.map((item) => ({
                      problem: item,
                      approach: "",
                      solution: extract.studyToRemember[0] ?? "",
                      notes: "",
                    }))
                  : [{ problem: "", approach: "", solution: "", notes: "" }],
        },
      };
    }
    case "CHARTING":
    case "COMPARISON_MATRIX": {
      if (extract.frameworks.length > 0) {
        const maxItems = Math.max(...extract.frameworks.map((fw) => fw.items.length), 1);
        return {
          charting: {
            columns: extract.frameworks.map((fw) => fw.name),
            rows: Array.from({ length: maxItems }, (_, rowIndex) =>
              extract.frameworks.map((fw) => fw.items[rowIndex] ?? ""),
            ),
          },
        };
      }
      return {
        charting: {
          columns: ["Idea", "Detail"],
          rows:
            extract.definitions.length > 0
              ? extract.definitions.map((item) => [item.term, item.definition])
              : extract.mustKnow.map((item) => [item, ""]),
        },
      };
    }
    default:
      return {
        typed: formatChapterStudyOverview(extract),
      };
  }
}

/** Study sequence laid out as a Progressive Core block from the same extract. */
export function learningPlanFromExtract(extract: ChapterStudyExtract): {
  progressive: { steps: Array<{ title: string; content: string; code: string; output: string }> };
} {
  const steps: Array<{ title: string; content: string; code: string; output: string }> = [
    {
      title: "Keep the source",
      content: `Re-read “${extract.title}” on the Source page. This plan is a structured layer — it does not replace the original material.`,
      code: "",
      output: "",
    },
  ];

  extract.learningObjectives.forEach((lo, index) => {
    steps.push({
      title: lo.code || `Objective ${index + 1}`,
      content: [lo.statement, ...lo.keyPoints].filter(Boolean).join("\n"),
      code: "",
      output: "",
    });
  });

  if (extract.definitions.length > 0) {
    steps.push({
      title: "Key terms",
      content: extract.definitions
        .map((item) => `${item.term}: ${item.definition}`)
        .join("\n"),
      code: "",
      output: "",
    });
  }

  for (const process of extract.processesOrSteps.slice(0, 2)) {
    steps.push({
      title: process.name || "Process",
      content: process.steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
      code: "",
      output: "",
    });
  }

  if (extract.testYourself.length > 0) {
    steps.push({
      title: "Practice",
      content: extract.testYourself
        .map((item) => `Q: ${item.question}`)
        .join("\n"),
      code: "",
      output: "",
    });
  }

  if (extract.mustKnow.length > 0) {
    steps.push({
      title: "Self-check",
      content: extract.mustKnow.join("\n"),
      code: "",
      output: "",
    });
  }

  return { progressive: { steps } };
}

/** Merge chapter extract fields into a note document (optionally after switching page). */
export function applyChapterStudyToDocument(
  doc: NoteDocument,
  extract: ChapterStudyExtract,
  options?: { pageId?: string },
): NoteDocument {
  let next = doc;
  if (options?.pageId) {
    next = switchNotebookPage(next, options.pageId);
  }

  return {
    ...next,
    typed: formatChapterStudyOverview(extract),
    typedHtml: undefined,
    metadata: {
      ...next.metadata,
      activeFormat: "BLANK",
      chapterStudyExtract: extract,
      recommendedFormats: extract.recommendedFormats.map((formatId) => ({
        formatId,
        confidence: 0.9,
        reason: "Suggested for this chapter extract",
        aiSuggested: true,
      })),
    },
  };
}
