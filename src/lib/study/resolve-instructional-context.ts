/**
 * Universal instructional-context resolver.
 *
 * Distinguishes LMS organizational metadata (week labels, date ranges, modules)
 * from the instructional title and concepts derived from associated source text.
 *
 * Not subject-specific. Does not invent unsupported titles.
 */

import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";

export type InstructionalTitleSource =
  | "material_heading"
  | "material_title"
  | "stripped_label"
  | "topic"
  | "concept";

export type ResolvedInstructionalContext = {
  /** Original learner/LMS selection (may be a week label). */
  selectedTopic: string;
  /** LMS/org label when selectedTopic is organizational; otherwise null. */
  organizationalLabel: string | null;
  /** What Learn/Practice/Tutor should teach. */
  teachingTopic: string;
  /** Learner-facing learning targets from source (not part-N slices). */
  concepts: string[];
  titleSource: InstructionalTitleSource;
};

const MONTH =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const DATE_RANGE_SUFFIX = new RegExp(
  `\\s*[-–—:]?\\s*${MONTH}\\.?\\s+\\d{1,2}(?:\\s*[-–—to]+\\s*(?:${MONTH}\\.?\\s+)?\\d{1,2}(?:,?\\s*\\d{2,4})?)?\\s*$`,
  "i",
);

const DATE_RANGE_INLINE = new RegExp(
  `\\b${MONTH}\\.?\\s+\\d{1,2}\\s*[-–—]\\s*(?:${MONTH}\\.?\\s+)?\\d{1,2}\\b`,
  "i",
);

const SLASH_DATE_RANGE =
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s*[-–—]\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/;

/**
 * True when the label is organizational LMS/schedule metadata rather than a
 * teachable subject by itself.
 */
export function isOrganizationalLmsLabel(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  if (isMetaSyllabusTopic(n)) return true;
  if (/^week\s+\d+(\b|$)/i.test(n)) return true;
  if (/^module\s+\d+(\b|$)/i.test(n)) return true;
  if (/^unit\s+\d+(\b|$)/i.test(n) && n.length < 40) return true;
  if (DATE_RANGE_INLINE.test(n) || SLASH_DATE_RANGE.test(n)) return true;
  if (DATE_RANGE_SUFFIX.test(n) && DATE_RANGE_INLINE.test(n)) return true;
  // "Something Sept 28 - Oct 04" — subject + schedule trailer
  if (DATE_RANGE_SUFFIX.test(n) && stripOrganizationalSuffix(n).length >= 3) {
    return true;
  }
  return false;
}

/** Remove week/module prefixes and trailing date ranges when present. */
export function stripOrganizationalSuffix(name: string): string {
  return name
    .replace(/^week\s+\d+\s*[:.\-–—]\s*/i, "")
    .replace(/^module\s+\d+\s*[:.\-–—]\s*/i, "")
    .replace(/^unit\s+\d+\s*[:.\-–—]\s*/i, "")
    .replace(DATE_RANGE_SUFFIX, "")
    .replace(SLASH_DATE_RANGE, "")
    .replace(/\s*[-–—:]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanConceptLabel(raw: string): string | null {
  let s = raw.replace(/\s+/g, " ").trim();
  if (!s) return null;
  s = s.replace(
    /^(lo|learning\s*objective|objective)\s*[\d\-–.]+\s*[:.\-–—]?\s*/i,
    "",
  );
  s = s.replace(
    /^(describe|explain|identify|define|compare|analyze|understand|discuss|list|apply|evaluate|create|demonstrate|calculate|summarize)\s+/i,
    "",
  );
  s = s.replace(/^(the|a|an)\s+/i, "");
  s = s.replace(/[.!?]+$/, "").trim();
  if (s.length < 3 || s.length > 90) return null;
  if (isMetaSyllabusTopic(s) || isOrganizationalLmsLabel(s)) return null;
  if (/^part\s+\d+$/i.test(s)) return null;
  return s;
}

/**
 * Pull chapter / section headings from source text (evidence-based only).
 */
export function extractInstructionalTitleFromSource(
  sourceText: string | null | undefined,
): string | null {
  const raw = sourceText?.trim();
  if (!raw) return null;

  const patterns = [
    /(?:^|\n)\s*Chapter\s+\d+\s*[-–—:]\s*(.+?)(?:\n|$)/i,
    /(?:^|\n)\s*Unit\s+\d+\s*[-–—:]\s*(.+?)(?:\n|$)/i,
    /(?:^|\n)\s*##\s+(?!module\s+outline|learning\s+outcomes?|course\s+)(.+?)(?:\n|$)/i,
    /(?:^|\n)\s*Chapter\s+\d+\s+(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    const title = match?.[1]?.replace(/\s+/g, " ").trim();
    if (!title || title.length < 3 || title.length > 100) continue;
    if (isMetaSyllabusTopic(title) || isOrganizationalLmsLabel(title)) continue;
    return title;
  }

  return null;
}

/**
 * Concept candidates from learning objectives and section headings.
 * Never invents concepts; never uses "topic — part N".
 */
export function extractConceptCandidatesFromSource(
  sourceText: string | null | undefined,
  options?: { limit?: number },
): string[] {
  const raw = sourceText?.trim();
  if (!raw) return [];
  const limit = options?.limit ?? 12;
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (label: string | null) => {
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(label);
  };

  // Learning objectives: LO 1-1 … / Learning Objective …
  const loPattern =
    /(?:^|\n)\s*(?:LO|Learning\s*Objective|Objective)\s*[\d\-–.]+\s*[:.\-–—]?\s*(.+?)(?=\n|$)/gi;
  let loMatch: RegExpExecArray | null;
  while ((loMatch = loPattern.exec(raw)) !== null && out.length < limit) {
    push(cleanConceptLabel(loMatch[1] ?? ""));
  }

  // Markdown / plain section headings
  const headingPattern =
    /(?:^|\n)\s*(?:#{1,3}\s+|Chapter\s+\d+\s*[-–—:]\s*)(.+?)(?=\n|$)/gi;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = headingPattern.exec(raw)) !== null && out.length < limit) {
    push(cleanConceptLabel(hMatch[1] ?? ""));
  }

  // Numbered content sections that look like real topics (not "1. Week …")
  const numbered = raw.match(/(?:^|\n)\s*\d+\.\s+([A-Z][^\n]{4,80})/g) ?? [];
  for (const line of numbered) {
    if (out.length >= limit) break;
    const title = line.replace(/^\s*\d+\.\s+/, "").trim();
    if (isOrganizationalLmsLabel(title)) continue;
    push(cleanConceptLabel(title));
  }

  return out.slice(0, limit);
}

/**
 * Resolve what to teach from a selected topic + optional source.
 *
 * Priority (learner intent first):
 * 1. Explicit non-organizational learner/LMS topic
 * 2. Stripped instructional label when the selection is organizational
 * 3. Source chapter/material heading ONLY when no usable learner label exists
 *
 * Source headings may appear in `concepts` as grounding — they must not
 * silently replace an explicit learner target.
 */
export function resolveInstructionalContext(input: {
  topic: string;
  sourceText?: string | null;
  courseTitle?: string | null;
  materialTitle?: string | null;
}): ResolvedInstructionalContext {
  const selectedTopic = input.topic.trim() || "this topic";
  const organizational = isOrganizationalLmsLabel(selectedTopic);
  const organizationalLabel = organizational ? selectedTopic : null;

  const fromHeading = extractInstructionalTitleFromSource(input.sourceText);
  const fromMaterial =
    input.materialTitle?.trim() &&
    !isMetaSyllabusTopic(input.materialTitle) &&
    !isOrganizationalLmsLabel(input.materialTitle)
      ? input.materialTitle.trim()
      : null;
  const stripped = stripOrganizationalSuffix(selectedTopic);
  const strippedUsable =
    stripped &&
    stripped.length >= 3 &&
    !isMetaSyllabusTopic(stripped)
      ? stripped
      : null;

  let teachingTopic = selectedTopic;
  let titleSource: InstructionalTitleSource = "topic";

  if (!organizational) {
    // Explicit learner target wins — never replace with OCR/chapter banners.
    teachingTopic = selectedTopic;
    titleSource = "topic";
  } else if (strippedUsable) {
    teachingTopic = strippedUsable;
    titleSource = "stripped_label";
  } else if (fromHeading) {
    // Pure org shell (e.g. "Week 3") with no usable strip — source may suggest a title.
    teachingTopic = fromHeading;
    titleSource = "material_heading";
  } else if (fromMaterial) {
    teachingTopic = fromMaterial;
    titleSource = "material_title";
  } else {
    teachingTopic = selectedTopic;
    titleSource = "topic";
  }

  let concepts = extractConceptCandidatesFromSource(input.sourceText);

  // Source headings remain available as concept grounding when distinct.
  if (
    fromHeading &&
    !concepts.some((c) => c.toLowerCase() === fromHeading.toLowerCase())
  ) {
    concepts = [fromHeading, ...concepts].slice(0, 12);
  }

  // Prefer teachingTopic as first concept when concepts are empty
  if (
    teachingTopic &&
    !concepts.some((c) => c.toLowerCase() === teachingTopic.toLowerCase())
  ) {
    if (concepts.length === 0) {
      concepts = [teachingTopic];
    } else {
      concepts = [teachingTopic, ...concepts].slice(0, 12);
    }
  }

  // Drop concepts that are still organizational shells
  concepts = concepts.filter(
    (c) => !isOrganizationalLmsLabel(c) && !/^part\s+\d+$/i.test(c),
  );
  if (concepts.length === 0 && teachingTopic) {
    concepts = [teachingTopic];
  }

  return {
    selectedTopic,
    organizationalLabel,
    teachingTopic,
    concepts,
    titleSource,
  };
}

/** True when a chunk title is the banned pagination fallback. */
export function isPartNChunkTitle(title: string): boolean {
  return /\s—\s*part\s+\d+\s*$/i.test(title.trim()) || /\spart\s+\d+\s*$/i.test(title.trim());
}
