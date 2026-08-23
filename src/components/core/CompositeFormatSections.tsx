"use client";

import { X } from "lucide-react";

import { getFormatDefinition } from "@/lib/core/format-catalog";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import type {
  ChartingData,
  CompositeSection,
  CornellContent,
  MindMapData,
  NoteDocument,
  QaData,
} from "@/lib/core/note-types";
import { emptyCharting } from "@/lib/core/note-types";
import {
  patchSectionData,
  readSectionData,
  removeCompositeSection,
} from "@/lib/core/section-format-data";
import { ConceptDefinitionEditor } from "@/components/core/ConceptDefinitionEditor";
import { OutlineEditor } from "@/components/core/OutlineEditor";
import { ProblemSolutionEditor } from "@/components/core/ProblemSolutionEditor";
import { ProgressiveEditor } from "@/components/core/ProgressiveEditor";
import { TimelineEditor } from "@/components/core/TimelineEditor";
import { TwoColumnEditor } from "@/components/core/TwoColumnEditor";
import { MindMapEditor } from "@/components/core/MindMapEditor";
import { FlowDiagramEditor } from "@/components/core/FlowDiagramEditor";
import { ChartingEditor } from "@/components/core/ChartingEditor";
import { QaEditor } from "@/components/core/QaEditor";

export function FormatBlockEditor({
  section,
  doc,
  setDoc,
}: {
  section: CompositeSection;
  doc: NoteDocument;
  setDoc: (updater: (current: NoteDocument) => NoteDocument) => void;
}) {
  return renderSection(section, doc, setDoc);
}

/** @deprecated Use PageFormatBlocksLayer for freeform canvas pages */
export function CompositeFormatSections({
  sections,
  doc,
  setDoc,
}: {
  sections: CompositeSection[];
  doc: NoteDocument;
  setDoc: (updater: (current: NoteDocument) => NoteDocument) => void;
}) {
  return (
    <div className="space-y-8 pb-32">
      {sections.map((section, index) => (
        <section
          key={section.id}
          className="rounded-2xl border border-stone-200/80 bg-white/70 shadow-sm"
        >
          <header className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-700">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-stone-900">
                {getFormatDefinition(section.formatId).emoji}{" "}
                {section.title || getFormatDefinition(section.formatId).label}
              </p>
              <p className="text-[10px] text-stone-500">
                {getFormatDefinition(section.formatId).description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDoc((current) => removeCompositeSection(current, section.id))}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Remove ${section.title}`}
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="min-h-[12rem] p-4">
            {renderSection(section, doc, setDoc)}
          </div>
        </section>
      ))}
    </div>
  );
}

function updateSection(
  section: CompositeSection,
  doc: NoteDocument,
  setDoc: (updater: (current: NoteDocument) => NoteDocument) => void,
  patch: Record<string, unknown>,
) {
  setDoc((current) => patchSectionData(current, section.id, patch));
}

function renderSection(
  section: CompositeSection,
  doc: NoteDocument,
  setDoc: (updater: (current: NoteDocument) => NoteDocument) => void,
) {
  const data = readSectionData(section, doc);
  const formatId = section.formatId;

  switch (formatId) {
    case "PROGRESSIVE":
      return (
        <ProgressiveEditor
          steps={(data.progressive as { steps: [] })?.steps ?? []}
          onChange={(steps) => updateSection(section, doc, setDoc, { progressive: { steps } })}
        />
      );
    case "PROBLEM_SOLUTION":
      return (
        <ProblemSolutionEditor
          items={(data.problemSolution as { items: [] })?.items ?? []}
          onChange={(items) => updateSection(section, doc, setDoc, { problemSolution: { items } })}
        />
      );
    case "CONCEPT_DEFINITION":
      return (
        <ConceptDefinitionEditor
          items={(data.concepts as { items: [] })?.items ?? []}
          onChange={(items) => updateSection(section, doc, setDoc, { concepts: { items } })}
        />
      );
    case "TIMELINE":
      return (
        <TimelineEditor
          events={(data.timeline as { events: [] })?.events ?? []}
          onChange={(events) => updateSection(section, doc, setDoc, { timeline: { events } })}
        />
      );
    case "TWO_COLUMN":
    case "BOXING":
      return (
        <TwoColumnEditor
          leftHeader={(data.twoColumn as { leftHeader?: string })?.leftHeader ?? "Idea"}
          rightHeader={(data.twoColumn as { rightHeader?: string })?.rightHeader ?? "Detail"}
          rows={
            (data.twoColumn as { rows?: { left: string; right: string }[] })?.rows ?? [
              { left: "", right: "" },
            ]
          }
          onChange={(twoColumn) => updateSection(section, doc, setDoc, { twoColumn })}
        />
      );
    case "HIERARCHY":
    case "OUTLINE":
      return (
        <OutlineEditor
          nodes={(data.outlineNodes as []) ?? []}
          onChange={(nodes) => updateSection(section, doc, setDoc, { outlineNodes: nodes })}
        />
      );
    case "MIND_MAP":
      return (
        <MindMapEditor
          data={(data.mindMap as MindMapData) ?? { nodes: [], edges: [] }}
          onChange={(mindMap) => updateSection(section, doc, setDoc, { mindMap })}
        />
      );
    case "FLOW":
    case "PROCESS_FLOW":
      return (
        <FlowDiagramEditor
          data={(data.flow as { nodes: []; edges: [] }) ?? { nodes: [], edges: [] }}
          onChange={(flow) => updateSection(section, doc, setDoc, { flow })}
        />
      );
    case "CHARTING":
    case "COMPARISON_MATRIX":
      return (
        <ChartingEditor
          data={(data.charting as ChartingData) ?? emptyCharting()}
          onChange={(charting) => updateSection(section, doc, setDoc, { charting })}
        />
      );
    case "QA":
      return (
        <QaEditor
          data={(data.qa as QaData) ?? { pairs: [{ question: "", answer: "" }] }}
          onChange={(qa) => updateSection(section, doc, setDoc, { qa })}
        />
      );
    case "CORNELL":
    case "CORNELL_MIND":
      return (
        <CornellSection
          formatId={formatId}
          cornell={(data.cornell as CornellContent) ?? { notes: "", cues: "", summary: "" }}
          mindMap={(data.mindMap as MindMapData) ?? { nodes: [], edges: [] }}
          onCornellChange={(cornell) => updateSection(section, doc, setDoc, { cornell })}
          onMindMapChange={(mindMap) => updateSection(section, doc, setDoc, { mindMap })}
        />
      );
    default:
      return (
        <textarea
          value={(data.typed as string) ?? ""}
          onChange={(e) => updateSection(section, doc, setDoc, { typed: e.target.value })}
          placeholder="Notes for this section…"
          className="min-h-[10rem] w-full resize-none bg-transparent text-sm outline-none"
        />
      );
  }
}

function CornellSection({
  formatId,
  cornell,
  mindMap,
  onCornellChange,
  onMindMapChange,
}: {
  formatId: CoreFormatId;
  cornell: CornellContent;
  mindMap: MindMapData;
  onCornellChange: (cornell: CornellContent) => void;
  onMindMapChange: (mindMap: MindMapData) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid min-h-[12rem] grid-cols-[1fr_12rem] grid-rows-[1fr_auto] gap-px bg-stone-100">
        <textarea
          value={cornell.notes}
          onChange={(e) => onCornellChange({ ...cornell, notes: e.target.value })}
          placeholder="Notes…"
          className="min-h-[10rem] resize-none bg-white p-4 text-sm outline-none"
        />
        <textarea
          value={cornell.cues}
          onChange={(e) => onCornellChange({ ...cornell, cues: e.target.value })}
          placeholder="Cues"
          className="resize-none bg-orange-50/50 p-3 text-xs outline-none"
        />
        <textarea
          value={cornell.summary}
          onChange={(e) => onCornellChange({ ...cornell, summary: e.target.value })}
          placeholder="Summary"
          className="col-span-2 resize-none bg-teal-50/40 p-3 text-sm outline-none"
          rows={2}
        />
      </div>
      {formatId === "CORNELL_MIND" ? (
        <MindMapEditor data={mindMap} onChange={onMindMapChange} />
      ) : null}
    </div>
  );
}
