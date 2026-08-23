"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { InfiniteCanvas } from "@/components/core/InfiniteCanvas";
import { AudioRecorderPanel } from "@/components/core/AudioRecorderPanel";
import { CollabWhiteboardPanel } from "@/components/core/CollabWhiteboardPanel";
import { CoreSidePanel, type CorePanelTab } from "@/components/core/CoreSidePanel";
import { ConceptDefinitionEditor } from "@/components/core/ConceptDefinitionEditor";
import { NotebookSetupWizard, type NotebookSetupConfig } from "@/components/core/NotebookSetupWizard";
import { OutlineEditor } from "@/components/core/OutlineEditor";
import { ProblemSolutionEditor } from "@/components/core/ProblemSolutionEditor";
import { ProgressiveEditor } from "@/components/core/ProgressiveEditor";
import { TimelineEditor } from "@/components/core/TimelineEditor";
import { TwoColumnEditor } from "@/components/core/TwoColumnEditor";
import { SketchLayer } from "@/components/core/SketchLayer";
import { CoreToolbar } from "@/components/core/CoreToolbar";
import { defaultCoreToolbarState, penModeToInkSize, penModeToInkTool } from "@/lib/core/core-toolbar-defaults";
import type { CoreToolbarState } from "@/lib/core/core-toolbar-types";
import { MindMapEditor } from "@/components/core/MindMapEditor";
import { FlowDiagramEditor } from "@/components/core/FlowDiagramEditor";
import { ChartingEditor } from "@/components/core/ChartingEditor";
import { QaEditor } from "@/components/core/QaEditor";
import { PdfInkViewer } from "@/components/core/PdfInkViewer";
import {
  emptyDocument,
  parseNoteDocument,
  type FormatRecommendation,
  type NoteDocument,
  type NoteTool,
} from "@/lib/core/note-types";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import {
  convertDocument,
  resolveActiveFormat,
} from "@/lib/core/format-engine";
import { confirmDelete } from "@/lib/confirm-delete";
import type { CoreStudioType } from "@/lib/core/studio-types";
import type { InkTool, ShapeKind } from "@/lib/core/ink-engine";
import { PAGE_TEMPLATES, PEN_PRESETS, type PageTemplateId } from "@/lib/core/page-templates";
import { buildWhiteboardStarter, canvasToDecorations, mergeCanvasData, mergeWhiteboardStarters } from "@/lib/core/whiteboard-starters";
import { formatIdsFromStarters, layoutIdsFromStarters } from "@/lib/core/canvas-starters";
import type { NoteMethod } from "@/generated/prisma";
import { NotebookPageFrame } from "@/components/core/NotebookPageFrame";
import { createTextBox } from "@/components/core/PageTextBoxes";
import {
  applyGroupId,
  clearGroupId,
  clipboardToDocumentItems,
  newGroupId,
  resolveSelectionItems,
  type CanvasClipboardItem,
} from "@/lib/core/canvas-clipboard";
import { PageFormatBlocksLayer } from "@/components/core/PageFormatBlocksLayer";
import { pageCanvasMinHeight } from "@/lib/core/block-layout";
import { NotebookPageRail } from "@/components/core/NotebookPageRail";
import { InteractiveCanvasElements } from "@/components/core/canvas/InteractiveCanvasElements";
import { CanvasElementInspector } from "@/components/core/canvas/CanvasElementInspector";
import { ShapeDrawOverlay } from "@/components/core/canvas/ShapeDrawOverlay";
import { insertElementDefinition } from "@/lib/core/elements/insert";
import {
  CANVAS_ELEMENT_BASE_Z,
  nextCanvasElementZIndex,
  takeNextCanvasZIndexes,
} from "@/lib/core/canvas-layer";
import { recordRecentElement } from "@/lib/core/elements/storage";
import type { ElementDefinition } from "@/lib/core/elements/catalog";
import type { PageDecoration } from "@/lib/core/note-types";
import {
  addNotebookPage,
  appendCompositeSections,
  applyPageData,
  createDecoration,
  createPageImage,
  deleteNotebookPage,
  duplicateNotebookPage,
  ensureNotebookPages,
  extractPageData,
  getNotebookPages,
  renameNotebookPage,
  switchNotebookPage,
  syncCurrentPage,
} from "@/lib/core/notebook-pages";
import { DEFAULT_NOTEBOOK_COVER_COLOR } from "@/lib/customization/study-haul-defaults";
import { openMaterialInCore } from "@/lib/materials/client";
import { useInkHistory } from "@/hooks/useInkHistory";

const CORE_FORMAT_BY_METHOD: Partial<Record<NoteMethod, CoreFormatId>> = {
  OUTLINE: "OUTLINE",
  CORNELL: "CORNELL",
  FLOW: "FLOW",
  CHARTING: "CHARTING",
  QA: "QA",
  MIND_MAP: "MIND_MAP",
  SKETCH: "SKETCH",
  WHITEBOARD: "WHITEBOARD",
  BLANK: "BLANK",
  DOT_GRID: "DOT_GRID",
  RULED: "RULED",
};

interface NoteRecord {
  id: string;
  title: string | null;
  method: NoteMethod;
  contentJson: string | null;
  content: string;
  course: { id: string; title: string; color: string | null } | null;
  material: { id: string; title: string; type: string } | null;
}

interface CourseOption {
  id: string;
  title: string;
}

interface MaterialOption {
  id: string;
  title: string;
  type: string;
  extractedText: string | null;
  filePath?: string | null;
}

export function CoreNotesWorkspace({
  initialCourses,
}: {
  initialCourses: CourseOption[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pendingNoteId = searchParams.get("noteId");
  const pendingMaterialId = searchParams.get("materialId");
  const pendingCourseId = searchParams.get("courseId");
  const [courses] = useState(initialCourses);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [doc, setDoc] = useState<NoteDocument>(emptyDocument());
  const [title, setTitle] = useState("Untitled note");
  const [method, setMethod] = useState<NoteMethod>("BLANK");
  const [tool, setTool] = useState<NoteTool>("type");
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [studioTopic, setStudioTopic] = useState("");
  const [inkTool, setInkTool] = useState<InkTool>("pen");
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [inkColor, setInkColor] = useState("#44403c");
  const [inkSize, setInkSize] = useState(4);
  const [pencilOnly, setPencilOnly] = useState(true);
  const [activeFormat, setActiveFormat] = useState<CoreFormatId>("BLANK");
  const [recommendations, setRecommendations] = useState<FormatRecommendation[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [sidePanel, setSidePanel] = useState<CorePanelTab | null>(null);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);

  useEffect(() => {
    if (!sidePanel && !mobileNotesOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("[data-core-side-panel]")) return;
      if (target.closest("[data-core-notes-drawer]")) return;
      if (target.closest("[data-core-header]")) return;
      setSidePanel(null);
      setMobileNotesOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [sidePanel, mobileNotesOpen]);
  const [toolbarState, setToolbarState] = useState<CoreToolbarState>(() => defaultCoreToolbarState());
  const [selectedCanvasElementIds, setSelectedCanvasElementIds] = useState<string[]>([]);
  const canvasClipboardRef = useRef<CanvasClipboardItem[]>([]);
  const pageCanvasRef = useRef<HTMLDivElement>(null);
  const autoSaveSkipRef = useRef(true);
  const workbookBootstrapRef = useRef(false);
  const sketchInk = useInkHistory([]);

  const refreshNotes = useCallback(async (options?: { quiet?: boolean }) => {
    if (!options?.quiet) setLoading(true);
    const response = await fetch(
      courseId ? `/api/notes?courseId=${courseId}` : "/api/notes",
    );
    const data = await response.json();
    if (data.success) {
      setNotes(data.data);
    }
    if (!options?.quiet) setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void refreshNotes();
  }, [refreshNotes]);

  useEffect(() => {
    if (pendingCourseId) {
      setCourseId(pendingCourseId);
    }
  }, [pendingCourseId]);

  useEffect(() => {
    async function loadMaterials() {
      if (!courseId) {
        setMaterials([]);
        return;
      }
      const response = await fetch(`/api/courses`);
      const data = await response.json();
      const course = data.courses?.find((item: { id: string }) => item.id === courseId);
      setMaterials(course?.materials ?? []);
    }
    void loadMaterials();
  }, [courseId]);

  useEffect(() => {
    if (!pendingMaterialId || pendingNoteId || workbookBootstrapRef.current) return;
    workbookBootstrapRef.current = true;

    void openMaterialInCore(pendingMaterialId)
      .then(({ coreHref, noteId }) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("materialId");
        params.set("noteId", noteId);
        if (pendingCourseId) params.set("courseId", pendingCourseId);
        const nextHref = `/core?${params.toString()}`;
        if (nextHref !== `/core?${searchParams.toString()}`) {
          router.replace(nextHref);
        } else {
          router.replace(coreHref);
        }
      })
      .catch(() => {
        workbookBootstrapRef.current = false;
      });
  }, [pendingMaterialId, pendingNoteId, pendingCourseId, router, searchParams]);

  useEffect(() => {
    if (!pendingMaterialId || selectedMaterialId === pendingMaterialId) return;
    const material = materials.find((item) => item.id === pendingMaterialId);
    if (!material) return;
    setSelectedMaterialId(material.id);
    if (material.filePath) setTool("annotate");
  }, [pendingMaterialId, materials, selectedMaterialId]);

  useEffect(() => {
    if (!pendingNoteId || activeId === pendingNoteId) return;

    const existing = notes.find((note) => note.id === pendingNoteId);
    if (existing) {
      selectNote(existing);
      return;
    }

    void fetch(`/api/notes/${pendingNoteId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) return;
        const note = data.data as NoteRecord;
        if (note.course?.id) setCourseId(note.course.id);
        setNotes((current) => {
          if (current.some((item) => item.id === note.id)) return current;
          return [note, ...current];
        });
        selectNote(note);
      })
      .catch(() => {});
  }, [pendingNoteId, notes, activeId]);

  function selectNote(note: NoteRecord) {
    autoSaveSkipRef.current = true;
    setActiveId(note.id);
    setTitle(note.title ?? "Untitled note");
    setMethod(note.method);
    const parsed = parseNoteDocument(note.contentJson);
    if (!parsed.notebook?.pageTemplateId && !parsed.notebook?.customBackgroundAssetId) {
      parsed.notebook = {
        coverId: "classic_orange",
        customCoverColor: DEFAULT_NOTEBOOK_COVER_COLOR,
        showCover: true,
        pageTemplateId: note.title?.toLowerCase().includes("planner")
          ? "planner_week"
          : "blank",
        penPresetId: "ballpoint",
        ...parsed.notebook,
      };
    }
    if (!parsed.pageTextBoxes) parsed.pageTextBoxes = [];
    if (!parsed.pageImages) parsed.pageImages = [];
    if (!parsed.decorations) parsed.decorations = [];
    const withPages = ensureNotebookPages(parsed);
    setDoc(withPages);
    setActiveFormat(resolveActiveFormat(parsed, note.method));
    setRecommendations(parsed.metadata?.recommendedFormats ?? []);
    setToolbarState(parsed.metadata?.coreToolbar ?? defaultCoreToolbarState());
    setTool(parsed.tool);
    setSelectedMaterialId(note.material?.id ?? null);
    setSelectedCanvasElementIds([]);
    sketchInk.replaceStrokes(parsed.strokes);
  }

  function pageHasFormatBlocks(current = doc) {
    return (current.metadata?.compositeSections?.length ?? 0) > 0;
  }

  function clearCurrentPage() {
    if (!confirm("Clear everything on this page? This cannot be undone.")) return;
    sketchInk.replaceStrokes([]);
    setSelectedCanvasElementIds([]);
    setDoc((current) => ({
      ...current,
      typed: "",
      strokes: [],
      annotations: [],
      decorations: [],
      pageImages: [],
      pageTextBoxes: [],
      canvas: undefined,
      metadata: {
        ...current.metadata,
        compositeSections: undefined,
      },
    }));
    void saveNote();
  }

  function patchToolbar(patch: Partial<CoreToolbarState>) {
    if (patch.shapeKind) setShapeKind(patch.shapeKind);
    if (patch.inkTool) setInkTool(patch.inkTool);
    setToolbarState((current) => {
      const next = { ...current, ...patch };
      setDoc((docCurrent) => ({
        ...docCurrent,
        metadata: { ...docCurrent.metadata, coreToolbar: next },
      }));
      return next;
    });
  }

  function activateSketchTool(ink: InkTool = toolbarState.inkTool) {
    setTool("sketch");
    setInkTool(ink);
    patchToolbar({ inkTool: ink });
  }

  function addFormatsToPage(formatIds: CoreFormatId[], skipExisting = false) {
    if (formatIds.length === 0) return;
    let addedIds: string[] = [];
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const pageData = extractPageData(synced);
      const existingIds = new Set(pageData.compositeSections?.map((section) => section.id) ?? []);
      const nextData = appendCompositeSections(pageData, formatIds, { skipExisting });
      let z = nextCanvasElementZIndex(synced);
      const compositeSections = nextData.compositeSections?.map((section) => {
        if (existingIds.has(section.id) && section.zIndex != null) return section;
        if (existingIds.has(section.id)) {
          return { ...section, zIndex: section.zIndex ?? CANVAS_ELEMENT_BASE_Z };
        }
        const withZ = { ...section, zIndex: z++ };
        addedIds.push(withZ.id);
        return withZ;
      });
      const next = applyPageData(synced, { ...nextData, compositeSections });
      return {
        ...next,
        metadata: {
          ...next.metadata,
          activeFormat: "BLANK",
          recommendedFormats: recommendations,
          appliedFormats: [
            ...new Set([...(next.metadata?.appliedFormats ?? []), ...formatIds]),
          ],
        },
      };
    });
    setActiveFormat("BLANK");
    setMethod("BLANK");
    setTool("type");
    if (addedIds.length > 0) setSelectedCanvasElementIds(addedIds);
    void saveNote({ refresh: false });
  }

  function applyFormat(formatId: CoreFormatId, combos?: CoreFormatId[]) {
    const formatIds = [formatId, ...(combos ?? [])];
    addFormatsToPage(formatIds);
  }

  function applyAllRecommendations() {
    if (recommendations.length === 0) return;
    addFormatsToPage(
      recommendations.map((item) => item.formatId),
      true,
    );
  }

  function startBlankPage() {
    const result = convertDocument(doc, "BLANK", method);
    setDoc({
      ...result.doc,
      metadata: {
        ...result.doc.metadata,
        activeFormat: "BLANK",
        recommendedFormats: recommendations,
        compositeSections: undefined,
        appliedFormats: ["BLANK"],
      },
    });
    setMethod(result.method);
    setActiveFormat("BLANK");
    setTool("type");
  }

  function shouldShowSketchOverlay() {
    if (pageHasFormatBlocks()) return true;
    if (tool === "annotate" && selectedMaterial?.filePath) return false;
    if (
      activeFormat === "WHITEBOARD" ||
      activeFormat === "SKETCHNOTES" ||
      activeFormat === "SKETCH" ||
      method === "WHITEBOARD"
    ) {
      return false;
    }
    const visualOnly = ["MIND_MAP", "FLOW", "CHARTING", "QA"].includes(method);
    if (visualOnly) {
      return false;
    }
    return method !== "MIND_MAP";
  }

  function renderFormatCanvas() {
    if (pageHasFormatBlocks()) {
      return null;
    }

    if (tool === "annotate" && selectedMaterialId && selectedMaterial?.filePath) {
      return (
        <PdfInkViewer
          materialId={selectedMaterialId}
          active={tool === "annotate"}
          inkTool={inkTool}
          onInkToolChange={setInkTool}
          color={inkColor}
          onColorChange={setInkColor}
          lineWidth={inkSize}
          onLineWidthChange={setInkSize}
          pencilOnly={pencilOnly}
          onPencilOnlyChange={setPencilOnly}
        />
      );
    }

    if (
      activeFormat === "WHITEBOARD" ||
      activeFormat === "SKETCHNOTES" ||
      activeFormat === "SKETCH" ||
      method === "WHITEBOARD" ||
      (activeFormat === "BOXING" && tool === "sketch")
    ) {
      const canvas = doc.canvas ?? { viewport: { x: 0, y: 0, scale: 1 }, strokes: [], stickies: [], shapes: [] };
      return (
        <InfiniteCanvas
          data={canvas}
          onChange={(next) => setDoc((current) => ({ ...current, canvas: next }))}
          active={tool === "sketch" || activeFormat === "WHITEBOARD"}
          inkTool={inkTool}
          color={inkColor}
          lineWidth={inkSize}
          pencilOnly={pencilOnly}
          shapeKind={shapeKind}
        />
      );
    }

    if (activeFormat === "CORNELL_MIND") {
      return (
        <div className="space-y-4 p-4">
          <p className="text-xs font-bold text-teal-700">Cornell notes — switch to Mind map for relationships</p>
          {renderCornellLayout()}
          <div className="rounded-xl border border-orange-100">
            <MindMapEditor
              data={doc.mindMap ?? { nodes: [], edges: [] }}
              onChange={(mindMap) => setDoc((current) => ({ ...current, mindMap }))}
            />
          </div>
        </div>
      );
    }

    if (activeFormat === "PROGRESSIVE") {
      return (
        <ProgressiveEditor
          steps={doc.progressive?.steps ?? []}
          onChange={(steps) => setDoc((current) => ({ ...current, progressive: { steps } }))}
        />
      );
    }

    if (activeFormat === "PROBLEM_SOLUTION") {
      return (
        <ProblemSolutionEditor
          items={doc.problemSolution?.items ?? []}
          onChange={(items) => setDoc((current) => ({ ...current, problemSolution: { items } }))}
        />
      );
    }

    if (activeFormat === "CONCEPT_DEFINITION") {
      return (
        <ConceptDefinitionEditor
          items={doc.concepts?.items ?? []}
          onChange={(items) => setDoc((current) => ({ ...current, concepts: { items } }))}
        />
      );
    }

    if (activeFormat === "TIMELINE") {
      return (
        <TimelineEditor
          events={doc.timeline?.events ?? []}
          onChange={(events) => setDoc((current) => ({ ...current, timeline: { events } }))}
        />
      );
    }

    if (activeFormat === "TWO_COLUMN" || activeFormat === "BOXING") {
      const twoColumn = doc.twoColumn ?? {
        leftHeader: "Idea",
        rightHeader: "Detail",
        rows: [{ left: "", right: "" }],
      };
      return (
        <TwoColumnEditor
          leftHeader={twoColumn.leftHeader}
          rightHeader={twoColumn.rightHeader}
          rows={twoColumn.rows}
          onChange={(data) => setDoc((current) => ({ ...current, twoColumn: data }))}
        />
      );
    }

    if (activeFormat === "HIERARCHY" || (activeFormat === "OUTLINE" && doc.outlineNodes?.length)) {
      return (
        <OutlineEditor
          nodes={doc.outlineNodes ?? []}
          onChange={(nodes) => setDoc((current) => ({ ...current, outlineNodes: nodes }))}
        />
      );
    }

    if (method === "MIND_MAP" || activeFormat === "MIND_MAP") {
      return (
        <MindMapEditor
          data={doc.mindMap ?? { nodes: [], edges: [] }}
          onChange={(mindMap) => setDoc((current) => ({ ...current, mindMap }))}
        />
      );
    }

    if (method === "FLOW" || activeFormat === "FLOW" || activeFormat === "PROCESS_FLOW") {
      return (
        <FlowDiagramEditor
          data={doc.flow ?? { nodes: [], edges: [] }}
          onChange={(flow) => setDoc((current) => ({ ...current, flow }))}
        />
      );
    }

    if (
      method === "CHARTING" ||
      activeFormat === "CHARTING" ||
      activeFormat === "COMPARISON_MATRIX"
    ) {
      return (
        <ChartingEditor
          data={doc.charting ?? { columns: ["Topic"], rows: [[""]] }}
          onChange={(charting) => setDoc((current) => ({ ...current, charting }))}
        />
      );
    }

    if (method === "QA") {
      return (
        <QaEditor
          data={doc.qa ?? { pairs: [{ question: "", answer: "" }] }}
          onChange={(qa) => setDoc((current) => ({ ...current, qa }))}
        />
      );
    }

    if (method === "CORNELL" || activeFormat === "CORNELL") {
      return renderCornellLayout();
    }

    return (
      <textarea
        value={doc.typed}
        onChange={(event) => setDoc((current) => ({ ...current, typed: event.target.value }))}
        placeholder={
          activeFormat === "SENTENCE"
            ? "One fact per line — reorganize later"
            : method === "OUTLINE"
              ? "I. Main topic\n  A. Subtopic\n  B. Subtopic"
              : "Start typing, sketching, or speaking..."
        }
        className="min-h-[24rem] w-full resize-none bg-transparent p-6 text-sm leading-relaxed outline-none"
        style={{
          fontSize: doc.metadata?.fontSize ?? 15,
          fontFamily: doc.metadata?.fontFamily ?? "inherit",
        }}
        readOnly={
          toolbarState.readOnly ||
          tool === "sketch" ||
          tool === "annotate" ||
          tool === "textbox"
        }
      />
    );
  }

  function renderCornellLayout() {
    return (
      <div className="grid h-full min-h-[24rem] grid-cols-[1fr_12rem] grid-rows-[1fr_auto]">
        <textarea
          value={doc.cornell?.notes ?? ""}
          onChange={(event) =>
            setDoc((current) => ({
              ...current,
              cornell: { ...current.cornell!, notes: event.target.value },
            }))
          }
          placeholder="Main notes..."
          className="min-h-full resize-none bg-transparent p-6 text-sm leading-relaxed outline-none"
        />
        <textarea
          value={doc.cornell?.cues ?? ""}
          onChange={(event) =>
            setDoc((current) => ({
              ...current,
              cornell: { ...current.cornell!, cues: event.target.value },
            }))
          }
          placeholder="Cues / questions"
          className="resize-none border-l border-orange-100 bg-orange-50/30 p-4 text-xs outline-none"
        />
        <textarea
          value={doc.cornell?.summary ?? ""}
          onChange={(event) =>
            setDoc((current) => ({
              ...current,
              cornell: { ...current.cornell!, summary: event.target.value },
            }))
          }
          placeholder="Summary"
          className="col-span-2 resize-none border-t border-orange-100 bg-teal-50/30 p-4 text-sm outline-none"
          rows={3}
        />
      </div>
    );
  }

  async function handleMethodChange(nextMethod: NoteMethod) {
    const nextFormat = CORE_FORMAT_BY_METHOD[nextMethod] ?? resolveActiveFormat(doc, nextMethod);

    if (method !== nextMethod && doc.typed.trim()) {
      const shouldConvert = window.confirm(
        `Switch to ${nextMethod.replace(/_/g, " ").toLowerCase()}? Your content will be converted where possible — nothing is deleted.`,
      );
      if (!shouldConvert) return;
      applyFormat(nextFormat);
      return;
    }

    setMethod(nextMethod);
    setActiveFormat(nextFormat);
    setDoc((current) => ({
      ...current,
      metadata: { ...current.metadata, activeFormat: nextFormat },
    }));
    if (!activeId) void createNote(nextMethod);
  }

  async function createNoteWithSetup(config: NotebookSetupConfig) {
    const initialDoc: NoteDocument = {
      ...emptyDocument(config.mode === "whiteboard" ? "sketch" : "type"),
      notebook: {
        coverId: config.coverId,
        customCoverColor: config.customCoverColor ?? DEFAULT_NOTEBOOK_COVER_COLOR,
        showCover: config.showCover !== false,
        pageTemplateId: config.pageTemplateId,
        customBackgroundAssetId: config.customBackgroundAssetId,
        penPresetId: config.penPresetId,
      },
      pageTextBoxes: [],
      pageImages: [],
      canvas:
        config.mode === "whiteboard"
          ? buildWhiteboardStarter(config.whiteboardStarterId)
          : emptyDocument().canvas,
      metadata: {
        activeFormat: config.mode === "whiteboard" ? "WHITEBOARD" : "BLANK",
      },
    };

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: config.title,
        courseId: courseId || undefined,
        method: config.method,
        contentJson: JSON.stringify(initialDoc),
      }),
    });
    const data = await response.json();
    if (data.success) {
      setSetupOpen(false);
      await refreshNotes();
      selectNote(data.data);
      if (config.mode === "whiteboard") {
        setTool("sketch");
        setMethod("WHITEBOARD");
        setActiveFormat("WHITEBOARD");
      }
      const preset = PEN_PRESETS.find((item) => item.id === config.penPresetId);
      if (preset) {
        setInkSize(preset.width);
        if (preset.id === "highlighter") setInkTool("highlighter");
      }
    }
  }

  function applyLayoutStarters(starterIds: string[]) {
    if (starterIds.length === 0) return;
    const incoming = mergeWhiteboardStarters(starterIds);
    const rawDecorations = canvasToDecorations(incoming);
    let newIds: string[] = [];

    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const pageData = extractPageData(synced);
      const zIndexes = takeNextCanvasZIndexes(synced, rawDecorations.length);
      const newDecorations = rawDecorations.map((item, index) => ({
        ...item,
        zIndex: zIndexes[index],
      }));
      newIds = newDecorations.map((item) => item.id);
      return applyPageData(synced, {
        ...pageData,
        decorations: [...pageData.decorations, ...newDecorations],
      });
    });
    setSelectedCanvasElementIds(newIds);
    setTool("type");
    void saveNote();
  }

  function applyCanvasStarters(starterIds: string[]) {
    if (starterIds.length === 0) return;
    const formatIds = formatIdsFromStarters(starterIds);
    const layoutIds = layoutIdsFromStarters(starterIds);
    if (formatIds.length > 0) addFormatsToPage(formatIds);
    if (layoutIds.length > 0) applyLayoutStarters(layoutIds);
  }

  function applyNotebookPalette(colors: string[]) {
    setDoc((current) => ({
      ...current,
      notebook: {
        ...current.notebook,
        appliedPaletteColors: colors,
        customCoverColor: colors[0] ?? current.notebook?.customCoverColor,
        pageBackgroundColor: colors[1] ?? colors[0],
        edgeColor: colors[2] ?? colors[0],
        colorScheme: "ombre",
      },
    }));
    void saveNote();
  }

  async function createNote(selectedMethod: NoteMethod = "BLANK") {
    setSetupOpen(true);
    void selectedMethod;
  }

  async function saveNote(options?: { refresh?: boolean }) {
    if (!activeId) return;
    setSaving(true);
    const synced = syncCurrentPage(doc);
    const payload = {
      title,
      method,
      content: synced.typed,
      contentJson: JSON.stringify({
        ...synced,
        tool,
        pdfMaterialId: selectedMaterialId,
        metadata: {
          ...synced.metadata,
          activeFormat,
          recommendedFormats: recommendations,
        },
      }),
      materialId: selectedMaterialId,
    };
    await fetch(`/api/notes/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (options?.refresh !== false) {
      await refreshNotes({ quiet: notes.length > 0 });
    }
  }

  async function deleteNote(note: NoteRecord) {
    if (!confirmDelete(note.title ?? "note")) return;
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (activeId === note.id) setActiveId(null);
    await refreshNotes();
  }

  function startDictation() {
    const win = window as Window & {
      webkitSpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        onresult: ((event: { results: Iterable<{ 0: { transcript: string } }> }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
      SpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        onresult: ((event: { results: Iterable<{ 0: { transcript: string } }> }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    };
    const SpeechRecognition = win.webkitSpeechRecognition || win.SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    setListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");
      setDoc((current) => ({ ...current, typed: `${current.typed} ${transcript}`.trim() }));
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  const pageTemplate =
    PAGE_TEMPLATES.find((item) => item.id === doc.notebook?.pageTemplateId) ??
    PAGE_TEMPLATES[0];
  const paperClass = pageTemplate.paperClass;
  const customBackgroundUrl = doc.notebook?.customBackgroundAssetId
    ? `/api/customization/templates/${doc.notebook.customBackgroundAssetId}`
    : null;

  function addTextBox() {
    const box = createTextBox();
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      box.zIndex = nextCanvasElementZIndex(synced);
      const pageData = extractPageData(synced);
      return applyPageData(synced, {
        ...pageData,
        pageTextBoxes: [...pageData.pageTextBoxes, box],
      });
    });
    setSelectedCanvasElementIds([box.id]);
    setTool("type");
  }

  function applyBuiltinTemplate(pageTemplateId: PageTemplateId) {
    const template = PAGE_TEMPLATES.find((item) => item.id === pageTemplateId);
    setDoc((current) => ({
      ...current,
      notebook: {
        ...current.notebook,
        pageTemplateId,
        customBackgroundAssetId: null,
      },
    }));
    if (template?.noteMethod) {
      void handleMethodChange(template.noteMethod as NoteMethod);
    }
    void saveNote();
  }

  function applyImportedTemplate(customBackgroundAssetId: string | null) {
    setDoc((current) => ({
      ...current,
      notebook: { ...current.notebook, customBackgroundAssetId },
    }));
    void saveNote();
  }

  function insertPageImage(assetId: string) {
    const image = createPageImage(assetId);
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      image.zIndex = nextCanvasElementZIndex(synced);
      const pageData = extractPageData(synced);
      return applyPageData(synced, {
        ...pageData,
        pageImages: [...pageData.pageImages, image],
      });
    });
    setSelectedCanvasElementIds([image.id]);
    setTool("type");
  }

  function insertElement(element: ElementDefinition) {
    recordRecentElement(element.id);
    let insertedId = "";
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const result = insertElementDefinition(synced, element);
      insertedId = result.insertedId;
      return applyPageData(synced, extractPageData(result.doc));
    });
    setSelectedCanvasElementIds([insertedId]);
    setTool("type");
  }

  function addDecoration(kind: Parameters<typeof createDecoration>[0]) {
    const decoration = createDecoration(kind, 80, 120, inkColor);
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      decoration.zIndex = nextCanvasElementZIndex(synced);
      const pageData = extractPageData(synced);
      return applyPageData(synced, {
        ...pageData,
        decorations: [...pageData.decorations, decoration],
      });
    });
    setSelectedCanvasElementIds([decoration.id]);
    setTool("type");
  }

  function addShapeDecoration(partial: Omit<PageDecoration, "id">) {
    const decoration = createDecoration(partial.kind, partial.x, partial.y, partial.color, {
      w: partial.w,
      h: partial.h,
    });
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      decoration.zIndex = nextCanvasElementZIndex(synced);
      const pageData = extractPageData(synced);
      return applyPageData(synced, {
        ...pageData,
        decorations: [...pageData.decorations, decoration],
      });
    });
    setSelectedCanvasElementIds([decoration.id]);
    setTool("type");
  }

  const sketchDrawingActive =
    !toolbarState.readOnly &&
    (tool === "sketch" || tool === "annotate") &&
    (inkTool === "pen" || inkTool === "highlighter" || inkTool === "eraser");

  const shapeDrawActive =
    !toolbarState.readOnly && tool === "sketch" && inkTool === "shape";

  function shouldRenderSketchLayer() {
    if (!shouldShowSketchOverlay()) return false;
    const strokes =
      tool === "annotate" ? doc.annotations ?? [] : doc.strokes ?? [];
    if (strokes.length > 0) return true;
    if (sketchDrawingActive || shapeDrawActive) return true;
    return tool === "sketch" || tool === "annotate";
  }

  const selectedCanvasElementId =
    selectedCanvasElementIds[selectedCanvasElementIds.length - 1] ?? null;

  const selectedDecoration =
    doc.decorations?.find((item) => item.id === selectedCanvasElementId) ?? null;
  const selectedImage =
    doc.pageImages?.find((item) => item.id === selectedCanvasElementId) ?? null;
  const selectedTextBox =
    doc.pageTextBoxes?.find((item) => item.id === selectedCanvasElementId) ?? null;

  const hasGroupedSelection = selectedCanvasElementIds.some((id) => {
    return (
      doc.decorations?.find((item) => item.id === id)?.groupId ??
      doc.pageImages?.find((item) => item.id === id)?.groupId ??
      doc.pageTextBoxes?.find((item) => item.id === id)?.groupId
    );
  });

  function handleCanvasCopy() {
    if (selectedCanvasElementIds.length === 0) return;
    canvasClipboardRef.current = resolveSelectionItems(selectedCanvasElementIds, doc);
  }

  function handleCanvasPaste() {
    const items = canvasClipboardRef.current;
    if (items.length === 0) return;
    const pasted = clipboardToDocumentItems(items);
    let pastedIds: string[] = [];
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const pageData = extractPageData(synced);
      const total =
        pasted.decorations.length + pasted.images.length + pasted.textBoxes.length;
      const zIndexes = takeNextCanvasZIndexes(synced, total);
      let zCursor = 0;
      const decorations = pasted.decorations.map((item) => ({
        ...item,
        zIndex: zIndexes[zCursor++],
      }));
      const images = pasted.images.map((item) => ({
        ...item,
        zIndex: zIndexes[zCursor++],
      }));
      const textBoxes = pasted.textBoxes.map((item) => ({
        ...item,
        zIndex: zIndexes[zCursor++],
      }));
      pastedIds = [
        ...decorations.map((item) => item.id),
        ...images.map((item) => item.id),
        ...textBoxes.map((item) => item.id),
      ];
      return applyPageData(synced, {
        ...pageData,
        decorations: [...pageData.decorations, ...decorations],
        pageImages: [...pageData.pageImages, ...images],
        pageTextBoxes: [...pageData.pageTextBoxes, ...textBoxes],
      });
    });
    setSelectedCanvasElementIds(pastedIds);
    setTool("type");
  }

  function handleCanvasDuplicate() {
    if (selectedCanvasElementIds.length === 0) return;
    const items = resolveSelectionItems(selectedCanvasElementIds, doc);
    const pasted = clipboardToDocumentItems(items, 24);
    let pastedIds: string[] = [];
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const pageData = extractPageData(synced);
      const total =
        pasted.decorations.length + pasted.images.length + pasted.textBoxes.length;
      const zIndexes = takeNextCanvasZIndexes(synced, total);
      let zCursor = 0;
      const decorations = pasted.decorations.map((item) => ({
        ...item,
        zIndex: zIndexes[zCursor++],
      }));
      const images = pasted.images.map((item) => ({
        ...item,
        zIndex: zIndexes[zCursor++],
      }));
      const textBoxes = pasted.textBoxes.map((item) => ({
        ...item,
        zIndex: zIndexes[zCursor++],
      }));
      pastedIds = [
        ...decorations.map((item) => item.id),
        ...images.map((item) => item.id),
        ...textBoxes.map((item) => item.id),
      ];
      return applyPageData(synced, {
        ...pageData,
        decorations: [...pageData.decorations, ...decorations],
        pageImages: [...pageData.pageImages, ...images],
        pageTextBoxes: [...pageData.pageTextBoxes, ...textBoxes],
      });
    });
    setSelectedCanvasElementIds(pastedIds);
    setTool("type");
  }

  function handleCanvasGroup() {
    if (selectedCanvasElementIds.length < 2) return;
    const grouped = applyGroupId(selectedCanvasElementIds, newGroupId(), doc);
    setDoc((current) => ({
      ...current,
      decorations: grouped.decorations,
      pageImages: grouped.pageImages,
      pageTextBoxes: grouped.pageTextBoxes,
    }));
  }

  function handleCanvasUngroup() {
    if (selectedCanvasElementIds.length === 0) return;
    const ungrouped = clearGroupId(selectedCanvasElementIds, doc);
    setDoc((current) => ({
      ...current,
      decorations: ungrouped.decorations,
      pageImages: ungrouped.pageImages,
      pageTextBoxes: ungrouped.pageTextBoxes,
    }));
  }

  function handleCanvasDelete() {
    if (selectedCanvasElementIds.length === 0 || toolbarState.readOnly) return;
    const idSet = new Set(selectedCanvasElementIds);
    setDoc((current) => ({
      ...current,
      decorations: current.decorations?.filter((item) => !idSet.has(item.id)) ?? [],
      pageImages: current.pageImages?.filter((item) => !idSet.has(item.id)) ?? [],
      pageTextBoxes: current.pageTextBoxes?.filter((item) => !idSet.has(item.id)) ?? [],
      metadata: {
        ...current.metadata,
        compositeSections: current.metadata?.compositeSections?.filter(
          (section) => !idSet.has(section.id),
        ),
      },
    }));
    setSelectedCanvasElementIds([]);
  }

  useEffect(() => {
    if (autoSaveSkipRef.current) {
      autoSaveSkipRef.current = false;
      return;
    }
    if (!activeId) return;

    const timer = window.setTimeout(() => {
      void saveNote({ refresh: false });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [doc, activeId, title, method, tool, selectedMaterialId, activeFormat]);

  function patchSelectedDecoration(patch: Partial<import("@/lib/core/note-types").PageDecoration>) {
    if (!selectedCanvasElementId) return;
    setDoc((current) => ({
      ...current,
      decorations:
        current.decorations?.map((item) =>
          item.id === selectedCanvasElementId ? { ...item, ...patch } : item,
        ) ?? [],
    }));
  }

  function patchSelectedImage(patch: Partial<import("@/lib/core/note-types").PageImage>) {
    if (!selectedCanvasElementId) return;
    setDoc((current) => ({
      ...current,
      pageImages:
        current.pageImages?.map((item) =>
          item.id === selectedCanvasElementId ? { ...item, ...patch } : item,
        ) ?? [],
    }));
  }

  function patchSelectedTextBox(patch: Partial<import("@/lib/core/note-types").PageTextBox>) {
    if (!selectedCanvasElementId) return;
    setDoc((current) => ({
      ...current,
      pageTextBoxes:
        current.pageTextBoxes?.map((item) =>
          item.id === selectedCanvasElementId ? { ...item, ...patch } : item,
        ) ?? [],
    }));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!activeId || toolbarState.readOnly) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "c") {
        event.preventDefault();
        handleCanvasCopy();
      }
      if (mod && event.key.toLowerCase() === "v") {
        event.preventDefault();
        handleCanvasPaste();
      }
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        handleCanvasDuplicate();
      }
      if (mod && event.key.toLowerCase() === "g") {
        event.preventDefault();
        if (event.shiftKey) handleCanvasUngroup();
        else handleCanvasGroup();
      }
      if (event.key === "Delete") {
        event.preventDefault();
        handleCanvasDelete();
      }
      if (event.key === "Backspace" && selectedCanvasElementIds.length > 0) {
        event.preventDefault();
        handleCanvasDelete();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId, toolbarState.readOnly, selectedCanvasElementIds, doc]);

  const notebookPages = getNotebookPages(doc);
  const activePageRecord =
    notebookPages.pages.find((p) => p.id === notebookPages.activePageId) ??
    notebookPages.pages[0];
  const pageNumber = activePageRecord?.pageNumber ?? 1;

  const selectedMaterial = materials.find((item) => item.id === selectedMaterialId);

  useEffect(() => {
    if (tool !== "sketch") return;
    setDoc((current) => ({ ...current, strokes: sketchInk.strokes }));
  }, [sketchInk.strokes, tool]);

  function applyStudioOutput(payload: {
    title: string;
    text: string;
    type: CoreStudioType;
    structured?: Record<string, unknown>;
  }) {
    setTitle(payload.title);
    if (payload.type === "faq") {
      setMethod("QA");
      setActiveFormat("QA");
      const pairs = payload.text
        .split("\n\n---\n\n")
        .map((block) => {
          const q = block.match(/\*\*Q:\*\*\s*([\s\S]*?)\n\n\*\*A:\*\*/);
          const a = block.match(/\*\*A:\*\*\s*([\s\S]*)/);
          return { question: q?.[1]?.trim() ?? "", answer: a?.[1]?.trim() ?? "" };
        })
        .filter((pair) => pair.question || pair.answer);
      setDoc((current) => ({
        ...current,
        qa: { pairs: pairs.length > 0 ? pairs : [{ question: "", answer: "" }] },
        typed: payload.text,
      }));
    } else if (payload.type === "timeline") {
      setMethod("OUTLINE");
      setActiveFormat("TIMELINE");
      const events = payload.text
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const match = line.match(/^[-*]?\s*\*?\*?(.+?)\*?\*?\s*[-—]\s*(.+)/);
          return match
            ? { date: match[1].trim(), title: match[2].trim(), description: "" }
            : { date: "", title: line.replace(/^[-*]\s*/, "").trim(), description: "" };
        });
      setDoc((current) => ({
        ...current,
        typed: payload.text,
        timeline: { events: events.length ? events : current.timeline?.events ?? [] },
        metadata: { ...current.metadata, activeFormat: "TIMELINE" as const },
      }));
    } else if (payload.type === "study-guide") {
      setMethod("OUTLINE");
      setActiveFormat("HIERARCHY");
      setDoc((current) => ({
        ...current,
        typed: payload.text,
        metadata: { ...current.metadata, activeFormat: "HIERARCHY" as const },
      }));
    } else {
      setMethod("BLANK");
      setActiveFormat("BLANK");
      setDoc((current) => ({ ...current, typed: payload.text }));
    }
    setTool("type");
  }

  return (
    <div className="relative flex h-[calc(100dvh-7.5rem)] max-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden page-canvas md:h-[calc(100vh-4rem)] md:max-h-none">
      <header data-core-header className="relative z-30 flex shrink-0 flex-col gap-2 border-b border-brand bg-white px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand sm:text-xs">
              Core notebook
            </p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full bg-transparent text-base font-bold text-stone-900 outline-none sm:text-lg"
              placeholder="Note title"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileNotesOpen((open) => !open)}
            className="shrink-0 rounded-xl border border-brand px-2.5 py-2 text-xs font-semibold text-stone-700 md:hidden"
          >
            Pages
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="input-brand min-w-0 flex-1 px-3 py-2 text-sm sm:flex-none"
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <div className="flex w-full gap-1 overflow-x-auto sm:w-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSidePanel((current) => (current === "tools" ? null : "tools"))}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${
                sidePanel === "tools"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-brand text-stone-700"
              }`}
            >
              Tools
            </button>
            <button
              type="button"
              onClick={() => setSidePanel((current) => (current === "sources" ? null : "sources"))}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${
                sidePanel === "sources"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-brand text-stone-700"
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setSidePanel((current) => (current === "assist" ? null : "assist"))}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${
                sidePanel === "assist"
                  ? "btn-ai border-transparent px-3 py-2"
                  : "border-brand bg-brand-soft text-brand"
              }`}
            >
              Assist
            </button>
            <button
              type="button"
              onClick={() => void saveNote()}
              disabled={!activeId || saving}
              className="btn-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
      </header>

      {mobileNotesOpen ? (
          <aside
            data-core-notes-drawer
            className="fixed inset-y-0 left-0 z-[70] flex w-[min(100vw,18rem)] flex-col border-r border-brand bg-white/95 shadow-xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-brand/30 px-3 py-3">
              <p className="text-sm font-bold text-stone-800">Notebooks</p>
              <button
                type="button"
                onClick={() => {
                  setMobileNotesOpen(false);
                  setSetupOpen(true);
                }}
                className="rounded-lg bg-brand-soft p-1.5 text-brand hover:brightness-95"
                aria-label="New notebook"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <p className="px-2 py-4 text-xs text-stone-500">Loading...</p>
              ) : notes.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileNotesOpen(false);
                    setSetupOpen(true);
                  }}
                  className="w-full rounded-xl border border-dashed border-brand/40 px-3 py-6 text-xs text-stone-500 hover:bg-brand-soft/40"
                >
                  + New notebook
                </button>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className={`mb-1 flex items-center gap-1 rounded-xl px-2 py-2 ${
                      activeId === note.id ? "bg-brand-soft" : "hover:bg-brand-soft/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        selectNote(note);
                        setMobileNotesOpen(false);
                      }}
                      className="min-w-0 flex-1 text-left text-sm font-medium text-stone-800"
                    >
                      {note.title ?? "Untitled"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteNote(note)}
                      className="rounded p-1 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-brand bg-white/90 md:flex">
          <div className="flex items-center justify-between border-b border-brand/30 px-3 py-3">
            <p className="text-sm font-bold text-stone-800">Pages</p>
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="rounded-lg bg-brand-soft p-1.5 text-brand hover:brightness-95"
              aria-label="New notebook"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="px-2 py-4 text-xs text-stone-500">Loading...</p>
            ) : notes.length === 0 ? (
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className="w-full rounded-xl border border-dashed border-brand/40 px-3 py-6 text-xs text-stone-500 hover:bg-brand-soft/40"
              >
                + New notebook
              </button>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`mb-1 flex items-center gap-1 rounded-xl px-2 py-2 ${
                    activeId === note.id ? "bg-brand-soft" : "hover:bg-brand-soft/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectNote(note)}
                    className="min-w-0 flex-1 text-left text-sm font-medium text-stone-800"
                  >
                    {note.title ?? "Untitled"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteNote(note)}
                    className="rounded p-1 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="relative z-20 shrink-0">
          <CoreToolbar
            state={toolbarState}
            onChange={patchToolbar}
            inkColor={inkColor}
            onInkColorChange={setInkColor}
            courseId={courseId}
            materialId={selectedMaterialId}
            onInsertPageAsset={insertPageImage}
            onInsertElement={insertElement}
            listening={listening}
            selectActive={tool === "type"}
            pageTemplateId={doc.notebook?.pageTemplateId}
            customBackgroundAssetId={doc.notebook?.customBackgroundAssetId}
            onSelectBuiltinTemplate={applyBuiltinTemplate}
            onSelectImportedTemplate={applyImportedTemplate}
            actions={{
              onOpenChat: () => setSidePanel("assist"),
              onOpenAssist: () => {
                setSidePanel("assist");
              },
              onToggleReadOnly: () => {
                patchToolbar({ readOnly: !toolbarState.readOnly });
              },
              onSelectPenMode: (mode) => {
                activateSketchTool(penModeToInkTool(mode));
                const size = penModeToInkSize(mode, { ...toolbarState, activePenMode: mode });
                setInkSize(size);
                if (mode === "highlighter") setInkTool("highlighter");
                if (mode === "shape") setInkTool("shape");
              },
              onSetInkTool: (ink) => {
                activateSketchTool(ink);
              },
              onSetShapeKind: setShapeKind,
              onAddTextBox: () => {
                if (!toolbarState.readOnly) addTextBox();
              },
              onAddSticky: () => {
                if (!toolbarState.readOnly) addDecoration("sticky");
              },
              onSelectTool: () => {
                setTool("type");
              },
              onGroup: handleCanvasGroup,
              onUngroup: handleCanvasUngroup,
              onCopy: handleCanvasCopy,
              onPaste: handleCanvasPaste,
              onInsertImage: () => {},
              onInsertElements: () => {},
              onStartRecord: () => {
                setSidePanel("tools");
                startDictation();
              },
              onShowRecordings: () => {
                setSidePanel("tools");
              },
              onClearPage: clearCurrentPage,
              onUndo: sketchInk.undo,
              onRedo: sketchInk.redo,
              canUndo: sketchInk.canUndo,
              canRedo: sketchInk.canRedo,
            }}
          />
          </div>

          <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2 sm:p-3">
              {!activeId ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center">
                  <p className="text-lg font-bold text-stone-900">Start a notebook</p>
                  <p className="mt-2 max-w-md text-sm text-stone-500">
                    Choose a cover and paper first — like Goodnotes — then write, sketch, or
                    whiteboard in a full-page workspace.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSetupOpen(true)}
                    className="mt-5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    New notebook
                  </button>
                </div>
              ) : (
                <NotebookPageFrame
                  notebook={doc.notebook}
                  title={title}
                  pageNumber={pageNumber}
                  paperClass={paperClass}
                  customBackgroundUrl={customBackgroundUrl}
                >
                  <div
                    ref={pageCanvasRef}
                    data-page-canvas
                    className="relative z-[2] min-h-[24rem]"
                    style={
                      pageHasFormatBlocks()
                        ? {
                            minHeight: pageCanvasMinHeight(doc.metadata?.compositeSections ?? []),
                          }
                        : undefined
                    }
                    onPointerDown={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("[data-format-block], [data-canvas-element], [data-canvas-inspector]")) return;
                      setSelectedCanvasElementIds([]);
                    }}
                  >
                    {renderFormatCanvas()}
                    {shouldRenderSketchLayer() ? (
                      <SketchLayer
                        strokes={tool === "annotate" ? doc.annotations ?? [] : doc.strokes}
                        onChange={(strokes) => {
                          if (tool === "sketch") {
                            sketchInk.setStrokes(strokes);
                          }
                          setDoc((current) =>
                            tool === "annotate"
                              ? { ...current, annotations: strokes }
                              : { ...current, strokes },
                          );
                        }}
                        active={sketchDrawingActive}
                        color={inkColor}
                        lineWidth={inkSize}
                        inkTool={inkTool}
                        pencilOnly={pencilOnly}
                        className={`absolute inset-0 ${sketchDrawingActive ? "z-[30]" : "z-[6]"}`}
                      />
                    ) : null}
                    {pageHasFormatBlocks() ? (
                      <PageFormatBlocksLayer
                        sections={doc.metadata?.compositeSections ?? []}
                        doc={doc}
                        setDoc={setDoc}
                        selectedIds={selectedCanvasElementIds}
                        onSelect={setSelectedCanvasElementIds}
                        editable={!toolbarState.readOnly}
                      />
                    ) : null}
                    <InteractiveCanvasElements
                      images={doc.pageImages ?? []}
                      decorations={doc.decorations ?? []}
                      textBoxes={doc.pageTextBoxes ?? []}
                      selectedIds={selectedCanvasElementIds}
                      editable={!toolbarState.readOnly}
                      onSelect={setSelectedCanvasElementIds}
                      onImagesChange={(pageImages) =>
                        setDoc((current) => ({ ...current, pageImages }))
                      }
                      onDecorationsChange={(decorations) =>
                        setDoc((current) => ({ ...current, decorations }))
                      }
                      onTextBoxesChange={(pageTextBoxes) =>
                        setDoc((current) => ({ ...current, pageTextBoxes }))
                      }
                      onDecorationTextChange={(id, text) =>
                        setDoc((current) => ({
                          ...current,
                          decorations:
                            current.decorations?.map((item) =>
                              item.id === id ? { ...item, text } : item,
                            ) ?? [],
                        }))
                      }
                      resolveNextZIndex={() => nextCanvasElementZIndex(doc)}
                    />
                    {!toolbarState.readOnly && selectedCanvasElementIds.length > 0 ? (
                      <CanvasElementInspector
                        decoration={selectedDecoration}
                        image={selectedImage}
                        textBox={selectedTextBox}
                        selectedCount={selectedCanvasElementIds.length}
                        onDecorationChange={patchSelectedDecoration}
                        onImageChange={patchSelectedImage}
                        onTextBoxChange={patchSelectedTextBox}
                        onGroup={handleCanvasGroup}
                        onUngroup={handleCanvasUngroup}
                        canGroup={selectedCanvasElementIds.length >= 2}
                        canUngroup={Boolean(hasGroupedSelection)}
                        onClose={() => setSelectedCanvasElementIds([])}
                      />
                    ) : null}
                    {shapeDrawActive ? (
                      <ShapeDrawOverlay
                        active
                        shapeKind={shapeKind}
                        color={inkColor}
                        onCreate={addShapeDecoration}
                      />
                    ) : null}
                  </div>
                </NotebookPageFrame>
              )}
            </div>

            {sidePanel ? (
                <aside
                  data-core-side-panel
                  className="fixed inset-y-0 right-0 z-[70] flex w-[min(100vw,20rem)] shrink-0 flex-col border-l border-brand bg-white/95 shadow-xl md:static md:z-auto md:w-80 md:shadow-none"
                >
                <div className="flex border-b border-brand/30">
                  {(
                    [
                      { id: "tools", label: "Tools" },
                      { id: "sources", label: "Open" },
                      { id: "assist", label: "Assist" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSidePanel(item.id)}
                      className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                        sidePanel === item.id
                          ? "border-b-2 border-brand text-brand"
                          : "text-stone-500"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <CoreSidePanel
                    tab={sidePanel}
                    materials={materials}
                    selectedMaterialId={selectedMaterialId}
                    onSelectMaterial={setSelectedMaterialId}
                    onAnnotate={(materialId) => {
                      setSelectedMaterialId(materialId);
                      setTool("annotate");
                    }}
                    studioTopic={studioTopic}
                    onStudioTopicChange={setStudioTopic}
                    courseId={courseId}
                    activeFormat={activeFormat}
                    recommendations={recommendations}
                    onRecommendations={setRecommendations}
                    onApplyFormat={applyFormat}
                    onAddFormats={addFormatsToPage}
                    onApplyAllRecommendations={applyAllRecommendations}
                    onStartBlank={startBlankPage}
                    activeSections={
                      doc.metadata?.compositeSections?.map((section) => section.formatId) ?? []
                    }
                    coverId={doc.notebook?.coverId}
                    customCoverColor={doc.notebook?.customCoverColor}
                    pageTemplateId={doc.notebook?.pageTemplateId}
                    customBackgroundAssetId={doc.notebook?.customBackgroundAssetId}
                    penPresetId={doc.notebook?.penPresetId}
                    showCover={doc.notebook?.showCover !== false}
                    notebook={doc.notebook}
                    onShowCoverChange={(showCover) =>
                      setDoc((current) => ({
                        ...current,
                        notebook: { ...current.notebook, showCover },
                      }))
                    }
                    onPageBackgroundChange={(pageBackgroundColor) => {
                      setDoc((current) => ({
                        ...current,
                        notebook: { ...current.notebook, pageBackgroundColor },
                      }));
                      void saveNote();
                    }}
                    onColorSchemeChange={(colorScheme) => {
                      setDoc((current) => ({
                        ...current,
                        notebook: { ...current.notebook, colorScheme },
                      }));
                      void saveNote();
                    }}
                    onApplyPalette={applyNotebookPalette}
                    onApplyCoverPalette={(colors) => {
                      setDoc((current) => ({
                        ...current,
                        notebook: {
                          ...current.notebook,
                          appliedPaletteColors: colors,
                          customCoverColor: colors[0] ?? current.notebook?.customCoverColor,
                          colorScheme: "ombre",
                        },
                      }));
                      void saveNote();
                    }}
                    onApplyPagePalette={(colors) => {
                      setDoc((current) => ({
                        ...current,
                        notebook: {
                          ...current.notebook,
                          appliedPaletteColors: colors,
                          pageBackgroundColor: colors[1] ?? colors[0],
                          edgeColor: colors[2] ?? colors[1] ?? colors[0],
                          colorScheme: "ombre",
                        },
                      }));
                      void saveNote();
                    }}
                    onInsertImage={insertPageImage}
                    onInsertElement={insertElement}
                    onInsertSticker={insertPageImage}
                    inkColor={inkColor}
                    onCoverChange={(coverId) =>
                      setDoc((current) => ({
                        ...current,
                        notebook: { ...current.notebook, coverId: coverId as never },
                      }))
                    }
                    onCustomCoverColorChange={(customCoverColor) => {
                      setDoc((current) => ({
                        ...current,
                        notebook: { ...current.notebook, customCoverColor },
                      }));
                      void saveNote();
                    }}
                    onTemplateChange={(pageTemplateId) => {
                      applyBuiltinTemplate(pageTemplateId as PageTemplateId);
                    }}
                    onCustomBackgroundChange={(customBackgroundAssetId) => {
                      applyImportedTemplate(customBackgroundAssetId);
                    }}
                    onPenPresetChange={(penPresetId) => {
                      const preset = PEN_PRESETS.find((item) => item.id === penPresetId);
                      if (preset) {
                        setInkSize(preset.width);
                        if (preset.id === "highlighter") setInkTool("highlighter");
                      }
                      setDoc((current) => ({
                        ...current,
                        notebook: { ...current.notebook, penPresetId: penPresetId as never },
                      }));
                    }}
                    onInkColorChange={setInkColor}
                    onCanvasStarters={applyCanvasStarters}
                    onMethodChange={(nextMethod) => void handleMethodChange(nextMethod)}
                    method={method}
                    onStudioInsert={applyStudioOutput}
                    activeId={activeId}
                  />
                  {sidePanel === "tools" ? (
                    <div className="space-y-3 border-t border-brand/20 p-4">
                      <AudioRecorderPanel
                        noteId={activeId}
                        clips={doc.audioClips ?? []}
                        onChange={(audioClips) =>
                          setDoc((current) => ({ ...current, audioClips }))
                        }
                        onInsertTranscript={(text, aiGenerated) => {
                          const prefix = aiGenerated ? "\n\n[AI transcript]\n" : "\n\n";
                          setDoc((current) => ({
                            ...current,
                            typed: `${current.typed}${prefix}${text}`.trim(),
                          }));
                        }}
                      />
                      {activeFormat === "WHITEBOARD" || method === "WHITEBOARD" ? (
                        <CollabWhiteboardPanel
                          noteId={activeId}
                          canvasData={doc.canvas}
                          onCanvasSync={(canvas) =>
                            setDoc((current) => ({ ...current, canvas }))
                          }
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>

          {activeId ? (
            <NotebookPageRail
              pages={notebookPages.pages}
              activePageId={notebookPages.activePageId}
              onSelect={(pageId) => {
                autoSaveSkipRef.current = true;
                setSelectedCanvasElementIds([]);
                setDoc((current) => switchNotebookPage(current, pageId));
                void saveNote({ refresh: false });
              }}
              onAdd={() => {
                setDoc((current) => addNotebookPage(current));
                void saveNote();
              }}
              onDuplicate={(pageId) => {
                setDoc((current) => duplicateNotebookPage(current, pageId));
                void saveNote();
              }}
              onRename={(pageId, label) => {
                setDoc((current) => renameNotebookPage(current, pageId, label));
                void saveNote();
              }}
              onDelete={(pageId) => {
                setDoc((current) => deleteNotebookPage(current, pageId));
                void saveNote();
              }}
            />
          ) : null}
        </div>
      </div>

      <NotebookSetupWizard
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onComplete={(config) => void createNoteWithSetup(config)}
      />
    </div>
  );
}
