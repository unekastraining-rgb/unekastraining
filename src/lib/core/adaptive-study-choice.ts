import type { CoreFormatId } from "@/lib/core/format-catalog";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { recommendFormatsHeuristic } from "@/lib/core/format-engine";
import type { FormatRecommendation } from "@/lib/core/note-types";

const SKIP_FORMATS = new Set<CoreFormatId>([
  "QA",
  "SKETCH",
  "SKETCHNOTES",
  "WHITEBOARD",
  "BLANK",
  "DOT_GRID",
  "RULED",
  "SENTENCE",
]);

export const STUDY_WIDE_FORMATS = new Set<CoreFormatId>([
  "CORNELL",
  "CORNELL_MIND",
  "FLOW",
  "PROCESS_FLOW",
  "TIMELINE",
  "MIND_MAP",
  "PROGRESSIVE",
]);

const MAX_STUDY_FORMATS = 4;
const CHRONO_RE = /evolut|histor|timeline|era|decade|period/i;

export function sourceTextFromExtract(extract: ChapterStudyExtract): string {
  const parts: string[] = [extract.title, extract.chapterOverview];
  for (const lo of extract.learningObjectives) {
    parts.push(lo.code, lo.statement, ...lo.keyPoints);
  }
  for (const item of extract.definitions) {
    parts.push(item.term, item.definition);
  }
  for (const framework of extract.frameworks) {
    parts.push(framework.name, ...framework.items);
  }
  for (const comparison of extract.comparisons) {
    parts.push(comparison.topic, "compare versus contrast", ...comparison.positives, ...comparison.negatives);
  }
  for (const process of extract.processesOrSteps) {
    parts.push(
      process.name,
      CHRONO_RE.test(process.name) ? "history era timeline" : "process steps",
      ...process.steps,
    );
  }
  for (const example of extract.workedExamples ?? []) {
    parts.push(example.title, example.setup, ...example.steps, example.result);
  }
  parts.push(...extract.mustKnow, ...extract.studyToRemember);
  return parts.filter(Boolean).join("\n");
}

export function extractSupportedFormats(extract: ChapterStudyExtract): Set<CoreFormatId> {
  const supported = new Set<CoreFormatId>();
  if (extract.definitions.length > 0) supported.add("CONCEPT_DEFINITION");
  if (extract.comparisons.length > 0) {
    supported.add("TWO_COLUMN");
  }
  if (extract.frameworks.length > 0) {
    supported.add("CHARTING");
  }
  if (extract.learningObjectives.length > 0) {
    supported.add("OUTLINE");
    supported.add("PROBLEM_SOLUTION");
  }
  if (extract.learningObjectives.length >= 2 || extract.definitions.length >= 4) {
    supported.add("MIND_MAP");
  }
  if (extract.processesOrSteps.length > 0) {
    const chronological = extract.processesOrSteps.some((process) => CHRONO_RE.test(process.name));
    if (chronological) supported.add("TIMELINE");
    else {
      supported.add("PROCESS_FLOW");
    }
  }
  return supported;
}

const FORMAT_ALIASES: Partial<Record<CoreFormatId, CoreFormatId>> = {
  COMPARISON_MATRIX: "CHARTING",
  BOXING: "TWO_COLUMN",
  FLOW: "PROCESS_FLOW",
  HIERARCHY: "OUTLINE",
  CORNELL_MIND: "CORNELL",
};

function canonicalFormat(id: CoreFormatId): CoreFormatId {
  return FORMAT_ALIASES[id] ?? id;
}

function asFormatIds(
  adaptive?: Array<FormatRecommendation | CoreFormatId>,
): CoreFormatId[] {
  if (!adaptive || adaptive.length === 0) return [];
  const ids: CoreFormatId[] = [];
  for (const item of adaptive) {
    const id = typeof item === "string" ? item : item.formatId;
    if (!id || SKIP_FORMATS.has(id) || ids.includes(id)) continue;
    ids.push(id);
  }
  return ids;
}

/**
 * Adaptive chooses which existing Core formats to use (2–4).
 * Extract support vetoes empty widgets unless Adaptive named them explicitly
 * and nothing supported remains.
 */
export function chooseStudyFormats(
  extract: ChapterStudyExtract,
  adaptive?: Array<FormatRecommendation | CoreFormatId>,
): CoreFormatId[] {
  const supported = extractSupportedFormats(extract);
  const explicit = asFormatIds(adaptive).map(canonicalFormat);

  if (explicit.length > 0) {
    const uniqueExplicit = [...new Set(explicit)];
    const usable = uniqueExplicit.filter((id) => supported.size === 0 || supported.has(id));
    return (usable.length > 0 ? usable : uniqueExplicit).slice(0, MAX_STUDY_FORMATS);
  }

  const heuristic = recommendFormatsHeuristic(sourceTextFromExtract(extract), extract.title, 8);
  const scores = new Map<CoreFormatId, number>();
  for (const rec of heuristic.recommendations) {
    const id = canonicalFormat(rec.formatId);
    if (SKIP_FORMATS.has(id) || !supported.has(id)) continue;
    scores.set(id, Math.max(scores.get(id) ?? 0, rec.confidence * 100));
  }
  for (const id of new Set([...supported].map(canonicalFormat))) {
    scores.set(id, (scores.get(id) ?? 0) + 24);
  }
  if (extract.definitions.length > 0) {
    scores.set("CONCEPT_DEFINITION", (scores.get("CONCEPT_DEFINITION") ?? 0) + 10);
  }
  if (extract.comparisons.length > 0) {
    scores.set("TWO_COLUMN", (scores.get("TWO_COLUMN") ?? 0) + 10);
  }
  if (extract.frameworks.length > 0) {
    scores.set("CHARTING", (scores.get("CHARTING") ?? 0) + 6);
  }
  if (supported.has("TIMELINE")) {
    scores.set("TIMELINE", (scores.get("TIMELINE") ?? 0) + 12);
  }
  if (supported.has("PROCESS_FLOW")) {
    scores.set("PROCESS_FLOW", (scores.get("PROCESS_FLOW") ?? 0) + 12);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, MAX_STUDY_FORMATS);
}

function expandCoveredFormats(ids: CoreFormatId[]): Set<CoreFormatId> {
  const covered = new Set(ids.map(canonicalFormat));
  if (covered.has("CORNELL") || covered.has("CORNELL_MIND")) {
    covered.add("CORNELL");
    covered.add("CORNELL_MIND");
    covered.add("CONCEPT_DEFINITION");
  }
  if (covered.has("TWO_COLUMN") || covered.has("BOXING")) {
    covered.add("TWO_COLUMN");
    covered.add("BOXING");
  }
  if (covered.has("CHARTING") || covered.has("COMPARISON_MATRIX")) {
    covered.add("CHARTING");
    covered.add("COMPARISON_MATRIX");
  }
  if (covered.has("FLOW") || covered.has("PROCESS_FLOW") || covered.has("TIMELINE")) {
    covered.add("FLOW");
    covered.add("PROCESS_FLOW");
    covered.add("TIMELINE");
  }
  if (covered.has("OUTLINE") || covered.has("HIERARCHY")) {
    covered.add("OUTLINE");
    covered.add("HIERARCHY");
  }
  return covered;
}

/**
 * Formats that still belong in this study set after the template pages are applied.
 * These become extra notebook pages — not more widgets on page 1.
 */
export function extraStudyFormats(
  extract: ChapterStudyExtract,
  covered: CoreFormatId[],
  adaptive?: Array<FormatRecommendation | CoreFormatId>,
): CoreFormatId[] {
  const coveredSet = expandCoveredFormats(covered);
  const supported = extractSupportedFormats(extract);
  const extras: CoreFormatId[] = [];
  for (const id of [...asFormatIds(adaptive), ...extract.recommendedFormats]) {
    const canon = canonicalFormat(id);
    if (!canon || SKIP_FORMATS.has(canon) || canon === "QA") continue;
    if (coveredSet.has(canon) || extras.includes(canon)) continue;
    if (supported.size > 0 && !supported.has(canon) && !supported.has(id)) continue;
    if (canon === "FLOW" || canon === "PROCESS_FLOW" || canon === "TIMELINE") {
      const sequence: CoreFormatId = extract.processesOrSteps.some((process) =>
        CHRONO_RE.test(process.name),
      )
        ? "TIMELINE"
        : "PROCESS_FLOW";
      if (!coveredSet.has(sequence) && !extras.includes(sequence)) extras.push(sequence);
      coveredSet.add("FLOW");
      coveredSet.add("PROCESS_FLOW");
      coveredSet.add("TIMELINE");
      continue;
    }
    extras.push(canon);
  }
  return extras;
}

export { selectStudyTemplate } from "@/lib/core/study-templates";

export async function fetchAdaptiveStudyRecommendations(input: {
  courseId?: string | null;
  materialId?: string | null;
  extract: ChapterStudyExtract;
}): Promise<FormatRecommendation[] | undefined> {
  try {
    const response = await fetch("/api/core/adaptive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "analyze",
        courseId: input.courseId || undefined,
        materialId: input.materialId || undefined,
        sourceText: sourceTextFromExtract(input.extract),
        useAi: true,
      }),
      signal: AbortSignal.timeout(12000),
    });
    const data = (await response.json()) as {
      success?: boolean;
      recommendations?: FormatRecommendation[];
    };
    if (data.success && data.recommendations && data.recommendations.length > 0) {
      return data.recommendations;
    }
  } catch {
    // Planner falls back to Adaptive's local heuristic.
  }
  return undefined;
}
