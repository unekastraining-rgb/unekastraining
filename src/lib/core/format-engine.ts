import type { NoteMethod } from "@/generated/prisma";

import {
  CORE_FORMAT_CATALOG,
  getFormatDefinition,
  type CoreFormatId,
} from "@/lib/core/format-catalog";
import {
  emptyConcepts,
  emptyFlow,
  emptyMindMap,
  emptyOutlineNodes,
  emptyProblemSolution,
  emptyProgressive,
  emptyTimeline,
  emptyTwoColumn,
  type FormatRecommendation,
  type NoteDocument,
} from "@/lib/core/note-types";

export interface FormatAnalysis {
  recommendations: FormatRecommendation[];
  materialType: string;
  summary: string;
  suggestedTitle?: string;
}

function scoreFormat(
  formatId: CoreFormatId,
  text: string,
  courseTitle: string,
): { score: number; reason: string } {
  const def = getFormatDefinition(formatId);
  const haystack = `${courseTitle} ${text}`.toLowerCase();
  let score = 0;
  const hits: string[] = [];

  for (const word of def.signalWords ?? []) {
    if (haystack.includes(word.toLowerCase())) {
      score += 12;
      hits.push(word);
    }
  }

  if (formatId === "PROGRESSIVE" || formatId === "PROBLEM_SOLUTION") {
    if (/\b(function|class|def |const |import |algorithm|code|debug)\b/i.test(haystack)) {
      score += 25;
    }
    if (/\b(homework|exercise|problem set|leetcode)\b/i.test(haystack)) {
      score += 18;
    }
  }

  if (formatId === "TIMELINE" || formatId === "OUTLINE") {
    if (/\b(\d{4}|century|war|revolution|dynasty|era|bce|ad)\b/i.test(haystack)) {
      score += 20;
    }
  }

  if (formatId === "MIND_MAP" || formatId === "CONCEPT_DEFINITION") {
    if (/\b(cell|organism|pathway|system|anatomy|physiology|ecosystem)\b/i.test(haystack)) {
      score += 22;
    }
    if (/\b(psychology|behavior|cognitive|disorder|therapy)\b/i.test(haystack)) {
      score += 18;
    }
  }

  if (formatId === "PROCESS_FLOW" || formatId === "FLOW") {
    if (/\b(process|cycle|reaction|mechanism|phase|step \d)\b/i.test(haystack)) {
      score += 20;
    }
  }

  if (formatId === "COMPARISON_MATRIX" || formatId === "CHARTING") {
    if (/\b(compare|contrast|versus|vs\.|similarit|differen)\b/i.test(haystack)) {
      score += 22;
    }
  }

  if (formatId === "CORNELL" || formatId === "SENTENCE") {
    if (/\b(lecture|slides|chapter \d|unit \d)\b/i.test(haystack)) {
      score += 10;
    }
  }

  const reason =
    hits.length > 0
      ? `Matches keywords: ${hits.slice(0, 3).join(", ")}`
      : score > 0
        ? `Fits the type of material in ${courseTitle || "this course"}`
        : "General-purpose format";

  return { score, reason };
}

/** Heuristic recommendations from source text — no AI required. */
export function recommendFormatsHeuristic(
  sourceText: string,
  courseTitle = "",
  limit = 4,
): FormatAnalysis {
  const text = sourceText.trim();
  const materialType = detectMaterialType(text, courseTitle);

  const scored = CORE_FORMAT_CATALOG.filter(
    (format) => !["BLANK", "DOT_GRID", "RULED"].includes(format.id),
  )
    .map((format) => {
      const { score, reason } = scoreFormat(format.id, text, courseTitle);
      return {
        formatId: format.id,
        confidence: Math.min(0.95, 0.35 + score / 100),
        reason,
        raw: score,
      };
    })
    .filter((item) => item.raw > 0)
    .sort((a, b) => b.raw - a.raw)
    .slice(0, limit);

  const recommendations: FormatRecommendation[] =
    scored.length > 0
      ? scored.map(({ formatId, confidence, reason }) => ({
          formatId,
          confidence,
          reason,
        }))
      : [
          {
            formatId: "OUTLINE",
            confidence: 0.5,
            reason: "Flexible starting point for any subject",
          },
          {
            formatId: "CORNELL",
            confidence: 0.45,
            reason: "Works well for lectures and readings",
          },
        ];

  return {
    recommendations,
    materialType,
    summary: summarizeMaterial(text, courseTitle, materialType),
  };
}

function detectMaterialType(text: string, courseTitle: string): string {
  const haystack = `${courseTitle} ${text}`.toLowerCase();
  if (/\b(function|class |algorithm|programming|code)\b/.test(haystack)) return "programming";
  if (/\b(theorem|equation|integral|derivative|proof)\b/.test(haystack)) return "mathematics";
  if (/\b(war|century|revolution|dynasty|treaty)\b/.test(haystack)) return "history";
  if (/\b(cell|organism|dna|protein|anatomy|physiology)\b/.test(haystack)) return "biology";
  if (/\b(psychology|behavior|cognitive|disorder)\b/.test(haystack)) return "psychology";
  if (/\b(theorem|complexity|graph theory|data structure)\b/.test(haystack)) return "cs_theory";
  if (text.length < 200) return "general";
  return "lecture_notes";
}

function summarizeMaterial(text: string, courseTitle: string, materialType: string): string {
  const preview = text.replace(/\s+/g, " ").trim().slice(0, 180);
  const subject = courseTitle || materialType.replace(/_/g, " ");
  return preview
    ? `${subject}: ${preview}${text.length > 180 ? "…" : ""}`
    : `Start capturing knowledge for ${subject}.`;
}

export function resolveActiveFormat(doc: NoteDocument, method: NoteMethod): CoreFormatId {
  if (doc.metadata?.activeFormat) return doc.metadata.activeFormat;
  const match = CORE_FORMAT_CATALOG.find((format) => format.noteMethod === method);
  return match?.id ?? "BLANK";
}

export function applyFormatToDocument(
  doc: NoteDocument,
  formatId: CoreFormatId,
  options?: { preserveContent?: boolean },
): { doc: NoteDocument; method: NoteMethod } {
  const def = getFormatDefinition(formatId);
  const preserve = options?.preserveContent !== false;
  const next: NoteDocument = preserve
    ? { ...doc }
  : { ...emptyDocumentFrom(doc) };

  next.metadata = {
    ...next.metadata,
    activeFormat: formatId,
    appliedFormats: [...new Set([...(next.metadata?.appliedFormats ?? []), formatId])],
  };

  if (!preserve || isDocumentMostlyEmpty(next)) {
    seedFormatStructure(next, formatId);
  }

  return { doc: next, method: def.noteMethod };
}

function emptyDocumentFrom(doc: NoteDocument): NoteDocument {
  return {
    ...doc,
    typed: "",
    metadata: { ...doc.metadata, activeFormat: doc.metadata?.activeFormat },
  };
}

function isDocumentMostlyEmpty(doc: NoteDocument): boolean {
  return (
    !doc.typed.trim() &&
    !doc.cornell?.notes?.trim() &&
    (doc.qa?.pairs.every((p) => !p.question && !p.answer) ?? true) &&
    (doc.timeline?.events.every((e) => !e.title) ?? true)
  );
}

function seedFormatStructure(doc: NoteDocument, formatId: CoreFormatId): void {
  switch (formatId) {
    case "PROGRESSIVE":
      doc.progressive = emptyProgressive();
      break;
    case "PROBLEM_SOLUTION":
      doc.problemSolution = emptyProblemSolution();
      break;
    case "CONCEPT_DEFINITION":
      doc.concepts = emptyConcepts();
      break;
    case "TIMELINE":
      doc.timeline = emptyTimeline();
      break;
    case "TWO_COLUMN":
    case "BOXING":
      doc.twoColumn = emptyTwoColumn();
      break;
    case "HIERARCHY":
    case "OUTLINE":
      doc.outlineNodes = emptyOutlineNodes().nodes;
      break;
    case "MIND_MAP":
      doc.mindMap = emptyMindMap();
      break;
    case "FLOW":
    case "PROCESS_FLOW":
      doc.flow = emptyFlow();
      break;
    case "CORNELL_MIND":
      doc.cornell = { notes: "", cues: "", summary: "" };
      doc.mindMap = emptyMindMap();
      break;
    default:
      break;
  }
}

export interface ConversionResult {
  doc: NoteDocument;
  method: NoteMethod;
  formatId: CoreFormatId;
  preserved: boolean;
  message: string;
}

/** Convert between formats without deleting original fields. */
export function convertDocument(
  doc: NoteDocument,
  targetFormatId: CoreFormatId,
  currentMethod: NoteMethod,
): ConversionResult {
  const fromFormat = resolveActiveFormat(doc, currentMethod);
  if (fromFormat === targetFormatId) {
    const def = getFormatDefinition(targetFormatId);
    return {
      doc,
      method: def.noteMethod,
      formatId: targetFormatId,
      preserved: true,
      message: "Already using this format.",
    };
  }

  const merged = structuredClone(doc) as NoteDocument;
  migrateContent(merged, fromFormat, targetFormatId);
  const applied = applyFormatToDocument(merged, targetFormatId, { preserveContent: true });

  return {
    ...applied,
    formatId: targetFormatId,
    preserved: true,
    message: `Converted from ${getFormatDefinition(fromFormat).label} to ${getFormatDefinition(targetFormatId).label}. Original data kept in other views.`,
  };
}

function migrateContent(
  doc: NoteDocument,
  from: CoreFormatId,
  to: CoreFormatId,
): void {
  const plainText = extractPlainText(doc);

  if (to === "MIND_MAP" && plainText) {
    doc.mindMap = textToMindMap(plainText, doc.mindMap);
  }

  if (to === "OUTLINE" || to === "HIERARCHY") {
    doc.outlineNodes = textToOutlineNodes(plainText, doc.outlineNodes);
    doc.typed = plainText || doc.typed;
  }

  if (to === "TIMELINE" && plainText) {
    doc.timeline = textToTimeline(plainText, doc.timeline);
  }

  if (to === "CONCEPT_DEFINITION" && (doc.qa?.pairs.length || plainText)) {
    doc.concepts = qaOrTextToConcepts(doc.qa, plainText);
  }

  if (to === "QA" && doc.concepts?.items.length) {
    doc.qa = {
      pairs: doc.concepts.items.map((item) => ({
        question: item.term ? `What is ${item.term}?` : "",
        answer: [item.definition, item.example].filter(Boolean).join("\n\n"),
      })),
    };
  }

  if (to === "PROBLEM_SOLUTION" && plainText) {
    doc.problemSolution = {
      items: [
        {
          problem: plainText.split("\n")[0] ?? "",
          approach: "",
          solution: plainText.split("\n").slice(1).join("\n"),
          notes: "",
        },
        ...(doc.problemSolution?.items ?? []).slice(1),
      ],
    };
  }

  if ((to === "TWO_COLUMN" || to === "COMPARISON_MATRIX" || to === "CHARTING") && plainText) {
    doc.twoColumn = textToTwoColumn(plainText, doc.twoColumn);
    if (to === "CHARTING" || to === "COMPARISON_MATRIX") {
      doc.charting = twoColumnToCharting(doc.twoColumn);
    }
  }

  if (to === "CORNELL" && plainText) {
    doc.cornell = {
      notes: plainText,
      cues: doc.cornell?.cues ?? "",
      summary: doc.cornell?.summary ?? "",
    };
  }

  if (to === "FLOW" || to === "PROCESS_FLOW") {
    if (doc.timeline?.events.some((e) => e.title)) {
      doc.flow = timelineToFlow(doc.timeline.events);
    } else if (plainText) {
      doc.flow = textToFlow(plainText, doc.flow);
    }
  }

  if (from === "OUTLINE" && to === "CORNELL" && doc.outlineNodes?.length) {
    doc.cornell = {
      notes: doc.outlineNodes.map((n) => `${"  ".repeat(n.level)}${n.text}`).join("\n"),
      cues: doc.cornell?.cues ?? "",
      summary: doc.cornell?.summary ?? "",
    };
  }

  void from;
}

export function extractPlainText(doc: NoteDocument): string {
  const parts: string[] = [];
  if (doc.typed.trim()) parts.push(doc.typed.trim());
  if (doc.cornell?.notes.trim()) parts.push(doc.cornell.notes.trim());
  if (doc.outlineNodes?.length) {
    parts.push(doc.outlineNodes.map((n) => `${"  ".repeat(n.level)}${n.text}`).join("\n"));
  }
  if (doc.qa?.pairs.length) {
    parts.push(
      doc.qa.pairs
        .map((p) => `${p.question}\n${p.answer}`)
        .filter(Boolean)
        .join("\n\n"),
    );
  }
  if (doc.timeline?.events.length) {
    parts.push(
      doc.timeline.events
        .map((e) => `${e.date} — ${e.title}: ${e.description}`)
        .join("\n"),
    );
  }
  if (doc.concepts?.items.length) {
    parts.push(
      doc.concepts.items
        .map((c) => `${c.term}: ${c.definition}`)
        .join("\n"),
    );
  }
  return parts.join("\n\n");
}

function textToMindMap(text: string, existing?: NoteDocument["mindMap"]) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const base = existing ?? emptyMindMap();
  const root = base.nodes[0] ?? { id: "root", label: "Central idea", x: 280, y: 180 };
  const nodes = [root];
  const edges: Array<{ from: string; to: string }> = [];
  lines.slice(0, 8).forEach((line, index) => {
    const id = `n${index}`;
    const label = line.replace(/^[-*#\d.]+\s*/, "").slice(0, 60);
    nodes.push({
      id,
      label: label || `Idea ${index + 1}`,
      x: 120 + (index % 4) * 140,
      y: 80 + Math.floor(index / 4) * 100,
    });
    edges.push({ from: root.id, to: id });
  });
  return { nodes, edges };
}

function textToOutlineNodes(text: string, existing?: NoteDocument["outlineNodes"]) {
  if (existing?.some((n) => n.text.trim())) return existing;
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return emptyOutlineNodes().nodes;
  return lines.slice(0, 20).map((line, index) => {
    const level = line.match(/^(\s*)/)?.[1].length
      ? Math.min(3, Math.floor((line.match(/^(\s*)/)?.[1].length ?? 0) / 2))
      : line.match(/^[IVX]+\.|^\d+\./)
        ? 0
        : 1;
    return {
      id: `o${index}`,
      text: line.replace(/^[\s\-*#\d.IVX]+/, "").trim(),
      level,
    };
  });
}

function textToTimeline(text: string, existing?: NoteDocument["timeline"]) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return existing ?? emptyTimeline();
  return {
    events: lines.slice(0, 12).map((line) => {
      const dateMatch = line.match(/^(\d{4}[^—\-:]*)[—\-:]\s*(.*)/);
      if (dateMatch) {
        return { date: dateMatch[1].trim(), title: dateMatch[2].trim(), description: "" };
      }
      return { date: "", title: line.trim(), description: "" };
    }),
  };
}

function qaOrTextToConcepts(qa: NoteDocument["qa"], text: string) {
  if (qa?.pairs.some((p) => p.question || p.answer)) {
    return {
      items: qa.pairs.map((pair) => ({
        term: pair.question.replace(/^what is\s+/i, "").replace(/\?$/, ""),
        definition: pair.answer,
        example: "",
        application: "",
      })),
    };
  }
  const terms = text.split("\n").filter((l) => l.includes(":"));
  if (terms.length) {
    return {
      items: terms.map((line) => {
        const [term, ...rest] = line.split(":");
        return {
          term: term.trim(),
          definition: rest.join(":").trim(),
          example: "",
          application: "",
        };
      }),
    };
  }
  return emptyConcepts();
}

function textToTwoColumn(text: string, existing?: NoteDocument["twoColumn"]) {
  const base = existing ?? emptyTwoColumn();
  const lines = text.split("\n").filter((l) => l.trim());
  const rows = lines.slice(0, 12).map((line) => {
    if (line.includes("|")) {
      const [left, right] = line.split("|");
      return { left: left.trim(), right: (right ?? "").trim() };
    }
    if (line.includes(":")) {
      const [left, ...rest] = line.split(":");
      return { left: left.trim(), right: rest.join(":").trim() };
    }
    return { left: line.trim(), right: "" };
  });
  return { ...base, rows: rows.length ? rows : base.rows };
}

function twoColumnToCharting(twoColumn: NoteDocument["twoColumn"]) {
  if (!twoColumn) return { columns: ["A", "B"], rows: [[""]] };
  return {
    columns: [twoColumn.leftHeader, twoColumn.rightHeader],
    rows: twoColumn.rows.map((row) => [row.left, row.right]),
  };
}

function timelineToFlow(events: NoteDocument["timeline"] extends infer T
  ? T extends { events: infer E }
    ? E
    : never
  : never) {
  const flow = emptyFlow();
  const nodes = events.map((event, index) => ({
    id: `t${index}`,
    label: event.title || event.date || `Step ${index + 1}`,
    x: 80 + index * 160,
    y: 160,
  }));
  const edges = nodes.slice(1).map((node, index) => ({
    from: nodes[index].id,
    to: node.id,
  }));
  return { nodes, edges };
}

function textToFlow(text: string, existing?: NoteDocument["flow"]) {
  const lines = text.split("\n").filter((l) => l.trim()).slice(0, 6);
  if (lines.length < 2) return existing ?? emptyFlow();
  const nodes = lines.map((line, index) => ({
    id: `f${index}`,
    label: line.replace(/^[-*\d.]+\s*/, "").slice(0, 40),
    x: 80 + index * 160,
    y: 160,
  }));
  const edges = nodes.slice(1).map((node, index) => ({
    from: nodes[index].id,
    to: node.id,
  }));
  return { nodes, edges };
}

export function mergeAiRecommendations(
  heuristic: FormatRecommendation[],
  aiFormats: Array<{ formatId: CoreFormatId; reason: string; confidence?: number }>,
): FormatRecommendation[] {
  const map = new Map<string, FormatRecommendation>();
  for (const item of heuristic) {
    map.set(item.formatId, item);
  }
  for (const item of aiFormats) {
    const existing = map.get(item.formatId);
    map.set(item.formatId, {
      formatId: item.formatId,
      confidence: Math.max(existing?.confidence ?? 0, item.confidence ?? 0.75),
      reason: item.reason,
      aiSuggested: true,
    });
  }
  return [...map.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
