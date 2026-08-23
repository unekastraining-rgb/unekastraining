import type { CoreFormatId } from "@/lib/core/format-catalog";
import type { CompositeSection, NoteDocument } from "@/lib/core/note-types";
import {
  emptyCharting,
  emptyConcepts,
  emptyFlow,
  emptyMindMap,
  emptyOutlineNodes,
  emptyProblemSolution,
  emptyProgressive,
  emptyQa,
  emptyTimeline,
  emptyTwoColumn,
} from "@/lib/core/note-types";

export function createEmptySectionData(formatId: CoreFormatId): Record<string, unknown> {
  switch (formatId) {
    case "PROGRESSIVE":
      return { progressive: emptyProgressive() };
    case "PROBLEM_SOLUTION":
      return { problemSolution: emptyProblemSolution() };
    case "CONCEPT_DEFINITION":
      return { concepts: emptyConcepts() };
    case "TIMELINE":
      return { timeline: emptyTimeline() };
    case "TWO_COLUMN":
    case "BOXING":
      return { twoColumn: emptyTwoColumn() };
    case "HIERARCHY":
    case "OUTLINE":
      return { outlineNodes: emptyOutlineNodes().nodes };
    case "MIND_MAP":
      return { mindMap: emptyMindMap() };
    case "FLOW":
    case "PROCESS_FLOW":
      return { flow: emptyFlow() };
    case "CORNELL":
      return { cornell: { notes: "", cues: "", summary: "" } };
    case "CORNELL_MIND":
      return {
        cornell: { notes: "", cues: "", summary: "" },
        mindMap: emptyMindMap(),
      };
    case "QA":
      return { qa: emptyQa() };
    case "CHARTING":
    case "COMPARISON_MATRIX":
      return { charting: emptyCharting() };
    default:
      return { typed: "" };
  }
}

/** Read section payload — uses isolated section.data, with legacy fallback from page root. */
export function readSectionData(
  section: CompositeSection,
  doc: NoteDocument,
): Record<string, unknown> {
  if (section.data && Object.keys(section.data).length > 0) {
    return section.data;
  }
  return legacySectionDataFromDoc(section.formatId, doc);
}

function legacySectionDataFromDoc(
  formatId: CoreFormatId,
  doc: NoteDocument,
): Record<string, unknown> {
  switch (formatId) {
    case "PROGRESSIVE":
      return { progressive: doc.progressive ?? emptyProgressive() };
    case "PROBLEM_SOLUTION":
      return { problemSolution: doc.problemSolution ?? emptyProblemSolution() };
    case "CONCEPT_DEFINITION":
      return { concepts: doc.concepts ?? emptyConcepts() };
    case "TIMELINE":
      return { timeline: doc.timeline ?? emptyTimeline() };
    case "TWO_COLUMN":
    case "BOXING":
      return { twoColumn: doc.twoColumn ?? emptyTwoColumn() };
    case "HIERARCHY":
    case "OUTLINE":
      return { outlineNodes: doc.outlineNodes ?? emptyOutlineNodes().nodes };
    case "MIND_MAP":
      return { mindMap: doc.mindMap ?? emptyMindMap() };
    case "FLOW":
    case "PROCESS_FLOW":
      return { flow: doc.flow ?? emptyFlow() };
    case "CORNELL":
      return { cornell: doc.cornell ?? { notes: "", cues: "", summary: "" } };
    case "CORNELL_MIND":
      return {
        cornell: doc.cornell ?? { notes: "", cues: "", summary: "" },
        mindMap: doc.mindMap ?? emptyMindMap(),
      };
    case "QA":
      return { qa: doc.qa ?? emptyQa() };
    case "CHARTING":
    case "COMPARISON_MATRIX":
      return { charting: doc.charting ?? emptyCharting() };
    default:
      return { typed: doc.typed ?? "" };
  }
}

export function patchSectionData(
  doc: NoteDocument,
  sectionId: string,
  patch: Record<string, unknown>,
): NoteDocument {
  const sections = doc.metadata?.compositeSections ?? [];
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      compositeSections: sections.map((section) =>
        section.id === sectionId
          ? { ...section, data: { ...readSectionData(section, doc), ...patch } }
          : section,
      ),
    },
  };
}

export function removeCompositeSection(doc: NoteDocument, sectionId: string): NoteDocument {
  const sections = (doc.metadata?.compositeSections ?? []).filter((s) => s.id !== sectionId);
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      compositeSections: sections.length > 0 ? sections : undefined,
    },
  };
}
