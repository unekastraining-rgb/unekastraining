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
import { RichTextEditor } from "@/components/core/RichTextEditor";

export function FormatBlockEditor({
  section,
  doc,
  setDoc,
  bare = false,
  selected = false,
}: {
  section: CompositeSection;
  doc: NoteDocument;
  setDoc: (updater: (current: NoteDocument) => NoteDocument) => void;
  /** Canvas mode: no card chrome, fits quiet text-like blocks */
  bare?: boolean;
  selected?: boolean;
}) {
  return renderSection(section, doc, setDoc, bare, selected);
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
  bare = false,
  selected = false,
) {
  const data = readSectionData(section, doc);
  const formatId = section.formatId;

  switch (formatId) {
    case "PROGRESSIVE":
      return (
        <ProgressiveEditor
          bare={bare}
          steps={(data.progressive as { steps: [] })?.steps ?? []}
          onChange={(steps) => updateSection(section, doc, setDoc, { progressive: { steps } })}
        />
      );
    case "PROBLEM_SOLUTION":
      return (
        <ProblemSolutionEditor
          bare={bare}
          items={(data.problemSolution as { items: [] })?.items ?? []}
          onChange={(items) => updateSection(section, doc, setDoc, { problemSolution: { items } })}
        />
      );
    case "CONCEPT_DEFINITION":
      return (
        <ConceptDefinitionEditor
          bare={bare}
          items={(data.concepts as { items: [] })?.items ?? []}
          onChange={(items) => updateSection(section, doc, setDoc, { concepts: { items } })}
        />
      );
    case "TIMELINE":
      return (
        <TimelineEditor
          bare={bare}
          events={(data.timeline as { events: [] })?.events ?? []}
          onChange={(events) => updateSection(section, doc, setDoc, { timeline: { events } })}
        />
      );
    case "TWO_COLUMN":
    case "BOXING":
      return (
        <TwoColumnEditor
          bare={bare}
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
          bare={bare}
          nodes={(data.outlineNodes as []) ?? []}
          onChange={(nodes) => updateSection(section, doc, setDoc, { outlineNodes: nodes })}
        />
      );
    case "MIND_MAP":
      return (
        <MindMapEditor
          bare={bare}
          data={(data.mindMap as MindMapData) ?? { nodes: [], edges: [] }}
          onChange={(mindMap) => updateSection(section, doc, setDoc, { mindMap })}
        />
      );
    case "FLOW":
    case "PROCESS_FLOW":
      return (
        <FlowDiagramEditor
          bare={bare}
          data={(data.flow as { nodes: []; edges: [] }) ?? { nodes: [], edges: [] }}
          onChange={(flow) => updateSection(section, doc, setDoc, { flow })}
        />
      );
    case "CHARTING":
    case "COMPARISON_MATRIX":
      return (
        <ChartingEditor
          bare={bare}
          data={(data.charting as ChartingData) ?? emptyCharting()}
          onChange={(charting) => updateSection(section, doc, setDoc, { charting })}
        />
      );
    case "QA":
      return (
        <QaEditor
          bare={bare}
          data={(data.qa as QaData) ?? { pairs: [{ question: "", answer: "" }] }}
          onChange={(qa) => updateSection(section, doc, setDoc, { qa })}
        />
      );
    case "CORNELL":
    case "CORNELL_MIND":
      return (
        <CornellSection
          bare={bare}
          formatId={formatId}
          cornell={(data.cornell as CornellContent) ?? { notes: "", cues: "", summary: "" }}
          mindMap={(data.mindMap as MindMapData) ?? { nodes: [], edges: [] }}
          onCornellChange={(cornell) => updateSection(section, doc, setDoc, { cornell })}
          onMindMapChange={(mindMap) => updateSection(section, doc, setDoc, { mindMap })}
        />
      );
    default:
      return (
        <RichTextEditor
          bare={bare}
          id={`section-${section.id}-typed`}
          text={(data.typed as string) ?? ""}
          html={(data.typedHtml as string) ?? undefined}
          placeholder="Notes for this section…"
          className={bare ? "min-h-[1.5rem] w-full min-w-0" : "min-h-[10rem] w-full"}
          selected={selected}
          onChange={({ text, html }) =>
            updateSection(section, doc, setDoc, { typed: text, typedHtml: html })
          }
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
  bare = false,
}: {
  formatId: CoreFormatId;
  cornell: CornellContent;
  mindMap: MindMapData;
  onCornellChange: (cornell: CornellContent) => void;
  onMindMapChange: (mindMap: MindMapData) => void;
  bare?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        className={
          bare
            ? "grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,9rem)] grid-rows-[1fr_auto] gap-1"
            : "grid min-h-[12rem] grid-cols-[1fr_12rem] grid-rows-[1fr_auto] gap-px bg-stone-100"
        }
      >
        <RichTextEditor
          bare={bare}
          id="block-cornell-notes"
          text={cornell.notes}
          html={cornell.notesHtml}
          placeholder="Notes…"
          className={bare ? "min-h-[3rem] min-w-0" : "min-h-[10rem] bg-white"}
          onChange={({ text, html }) =>
            onCornellChange({ ...cornell, notes: text, notesHtml: html })
          }
        />
        <RichTextEditor
          bare={bare}
          id="block-cornell-cues"
          text={cornell.cues}
          html={cornell.cuesHtml}
          placeholder="Cues"
          className={bare ? "min-w-0" : "bg-orange-50/50"}
          style={{ fontSize: 12 }}
          onChange={({ text, html }) =>
            onCornellChange({ ...cornell, cues: text, cuesHtml: html })
          }
        />
        <RichTextEditor
          bare={bare}
          id="block-cornell-summary"
          text={cornell.summary}
          html={cornell.summaryHtml}
          placeholder="Summary"
          className={bare ? "col-span-2 min-w-0" : "col-span-2 bg-teal-50/40"}
          onChange={({ text, html }) =>
            onCornellChange({ ...cornell, summary: text, summaryHtml: html })
          }
        />
      </div>
      {formatId === "CORNELL_MIND" ? (
        <MindMapEditor bare={bare} data={mindMap} onChange={onMindMapChange} />
      ) : null}
    </div>
  );
}
