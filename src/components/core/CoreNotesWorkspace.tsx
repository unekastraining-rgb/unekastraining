"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Columns2,
  Loader2,
  Moon,
  Plus,
  Save,
  Sun,
  Trash2,
} from "lucide-react";

import { InfiniteCanvas } from "@/components/core/InfiniteCanvas";
import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { CoreChromeLink } from "@/components/core/CoreChromeLink";
import {
  coreGoPath,
  inkActionToPenMode,
  isCoreGoBucketAction,
  isCoreGoFmtAction,
  isCoreGoInkAction,
  isCoreGoInsertAction,
  isCoreGoPanelAction,
  isCoreGoSurfaceAction,
  type CoreGoAction,
  type CoreGoBucketAction,
} from "@/lib/core/core-go-actions";
import { isTouchChrome } from "@/lib/core/touch-chrome";
import {
  artifactSaveStatusLabel,
  clearLocalArtifactDraft,
  parseMultiFileProjectMeta,
  resolveArtifactSaveStatus,
  writeLocalArtifactDraft,
} from "@/lib/learning/artifact-persistence";
import { ProjectFileNavigator } from "@/components/core/ProjectFileNavigator";
import { AudioRecorderPanel } from "@/components/core/AudioRecorderPanel";
import { CollabWhiteboardPanel } from "@/components/core/CollabWhiteboardPanel";
import { CoreCourseActionBar } from "@/components/core/CoreCourseActionBar";
import { CoreLoopOutcomeStrip } from "@/components/core/CoreLoopOutcomeStrip";
import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { useTapHandler } from "@/hooks/useTapHandler";
import { ClientIcon } from "@/components/ui/ClientIcon";
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
import {
  defaultCoreToolbarState,
  normalizeToolbarVisibleItems,
  penModeToInkSize,
  penModeToInkTool,
  penModeToInkMedium,
} from "@/lib/core/core-toolbar-defaults";
import type { CoreToolbarState } from "@/lib/core/core-toolbar-types";
import type { PaperSurfaceId } from "@/components/core/toolbar/CoreToolbarPaperPanel";
import { CHALKBOARD_BACKGROUND } from "@/lib/core/ink-engine";
import { MindMapEditor } from "@/components/core/MindMapEditor";
import { FlowDiagramEditor } from "@/components/core/FlowDiagramEditor";
import { ChartingEditor } from "@/components/core/ChartingEditor";
import { QaEditor } from "@/components/core/QaEditor";
import { PdfInkViewer } from "@/components/core/PdfInkViewer";
import { CoreStudySplit } from "@/components/core/CoreStudySplit";
import { CoreFlashcardSplit } from "@/components/core/CoreFlashcardSplit";
import type { CoreInitialNote } from "@/lib/core/core-initial-note";
import {
  emptyDocument,
  parseNoteDocument,
  type FormatRecommendation,
  type NoteDocument,
  type NoteTool,
} from "@/lib/core/note-types";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import { getFormatDefinition } from "@/lib/core/format-catalog";
import {
  convertDocument,
  resolveActiveFormat,
} from "@/lib/core/format-engine";
import { confirmDelete } from "@/lib/confirm-delete";
import { readableCourseTitle } from "@/lib/courses/display-name";
import type { CoreStudioType } from "@/lib/core/studio-types";
import { normalizeChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { readStudyExtractFromUnknown } from "@/lib/core/study-extract-store";
import { launchStudyNowSession } from "@/lib/study/client-launch";
import { blurtingHref, coreStudyPackHref, luckyQuizHref, sixChunkingHref } from "@/lib/study/loop-hrefs";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveCoreCourseId } from "@/lib/core/resolve-core-course-id";
import type { StudyMinutes } from "@/lib/csl/study-now";
import {
  applyExplanationsToDocument,
  applyFilledFormatsToDocument,
  applyLearningPlanToDocument,
  applyPracticeQuestionsToDocument,
  applyStudioStructuredToDocument,
  ALL_SHEETS_TARGET,
  readAllNotebookSheetsText,
  readNotebookPageSourceText,
  readNotebookSourceText,
} from "@/lib/core/apply-studio-to-canvas";
import { fetchAdaptiveStudyRecommendations } from "@/lib/core/adaptive-study-choice";
import {
  deskFromDocument,
  pinDeskItemToPage,
  withNotebookDesk,
} from "@/lib/core/notebook-desk";
import { displayFormatFromStudyDoc, isStudyTemplateId } from "@/lib/core/study-templates";
import {
  applyAiExtractToDocument,
  fetchChapterStudyExtract,
  importExtractQaToFlashcards,
  importExtractQuiz,
  saveGeneratedToLocker,
  seedRawMaterialDocument,
} from "@/lib/materials/apply-material-import";
import {
  friendlyAiImportError,
  suggestNotebookSetupFromExtract,
  suggestNotebookSetupFromMaterial,
  type SuggestedNotebookSetup,
} from "@/lib/materials/suggest-notebook-setup";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import {
  MaterialImportWizard,
  type MaterialImportChoice,
} from "@/components/materials/MaterialImportWizard";
import {
  fetchMaterialPreview,
  type MaterialPreviewPayload,
} from "@/lib/materials/client";
import type { InkFillPattern, InkTool, ShapeKind } from "@/lib/core/ink-engine";
import {
  elementIntersectsLasso,
  selectStrokesInLasso,
} from "@/lib/core/ink-engine";
import { PAGE_TEMPLATES, PEN_PRESETS, type PageTemplateId } from "@/lib/core/page-templates";
import { buildWhiteboardStarter, canvasToDecorations, mergeCanvasData, mergeWhiteboardStarters } from "@/lib/core/whiteboard-starters";
import { formatIdsFromStarters, layoutIdsFromStarters } from "@/lib/core/canvas-starters";
import type { NoteMethod } from "@/generated/prisma";
import { NotebookContinuousDesk } from "@/components/core/NotebookContinuousDesk";
import type { PageGrowDirection } from "@/lib/core/notebook-page-layout";
import { NotebookCoverSheet } from "@/components/core/NotebookCoverSheet";
import { PageTemplateOverlay } from "@/components/core/PageTemplateOverlay";
import { createTextBox } from "@/components/core/PageTextBoxes";
import {
  applyGroupId,
  clearGroupId,
  clipboardToDocumentItems,
  newGroupId,
  rebaseClipboardItemsToPoint,
  resolveSelectionItems,
  selectionSourceText,
  selectionStudyTopic,
  type CanvasClipboardItem,
} from "@/lib/core/canvas-clipboard";
import { pointerToLocal } from "@/lib/core/canvas-transform";
import { ocrPageInkText } from "@/lib/core/capture-page-ink";
import { PageFormatBlocksLayer } from "@/components/core/PageFormatBlocksLayer";
import { NotebookPageRail } from "@/components/core/NotebookPageRail";
import { InteractiveCanvasElements } from "@/components/core/canvas/InteractiveCanvasElements";
import { LaserPointerOverlay } from "@/components/core/canvas/LaserPointerOverlay";
import { CanvasElementInspector } from "@/components/core/canvas/CanvasElementInspector";
import { RichTextEditor } from "@/components/core/RichTextEditor";
import { ShapeDrawOverlay } from "@/components/core/canvas/ShapeDrawOverlay";
import { insertElementDefinition } from "@/lib/core/elements/insert";
import {
  CANVAS_ELEMENT_BASE_Z,
  maxCanvasElementZIndex,
  nextCanvasElementZIndex,
  takeNextCanvasZIndexes,
} from "@/lib/core/canvas-layer";
import { recordRecentElement } from "@/lib/core/elements/storage";
import type { ElementDefinition } from "@/lib/core/elements/catalog";
import type { PageDecoration } from "@/lib/core/note-types";
import {
  addNotebookPage,
  addNotebookPageInDirection,
  applyPageData,
  createDecoration,
  createPageImage,
  deleteNotebookPage,
  duplicateNotebookPage,
  ensureNotebookPages,
  extractPageData,
  getNotebookPages,
  prepareNoteDocumentForSave,
  renameNotebookPage,
  switchNotebookPage,
  syncCurrentPage,
} from "@/lib/core/notebook-pages";
import { shouldApplySaveResult } from "@/lib/core/canvas-buffer-size";
import { DEFAULT_NOTEBOOK_COVER_COLOR } from "@/lib/customization/study-haul-defaults";
import { useInkHistory } from "@/hooks/useInkHistory";
import { useDocumentHistory } from "@/hooks/useDocumentHistory";
import { useIsClientMounted } from "@/hooks/useClientSnapshot";
import { CanvasContextMenu, type CanvasContextMenuState } from "@/components/core/canvas/CanvasContextMenu";
import type { SketchPoint } from "@/lib/core/note-types";

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

function methodForStudyFormat(formatId: CoreFormatId): NoteMethod {
  return getFormatDefinition(formatId).noteMethod;
}

/**
 * Growing sideways means the student wants facing pages (book); growing down
 * means one continuous scroll. The direction they choose picks the layout.
 */
function withPageLayoutMode(
  doc: NoteDocument,
  direction: PageGrowDirection,
): NoteDocument {
  const pageLayoutMode = direction === "beside" ? "book" : "scroll";
  if (doc.notebook?.pageLayoutMode === pageLayoutMode) return doc;
  return {
    ...doc,
    notebook: { ...doc.notebook, pageLayoutMode },
  };
}

const AUTO_SESSION_MINUTES = [5, 10, 20, 30, 45, 60] as const;

function parseAutoSessionMinutes(raw: string | null): StudyMinutes | null {
  if (!raw?.trim()) return null;
  const parsed = Number(raw);
  if (AUTO_SESSION_MINUTES.includes(parsed as StudyMinutes)) {
    return parsed as StudyMinutes;
  }
  return 20;
}

interface NoteRecord {
  id: string;
  title: string | null;
  method: NoteMethod;
  contentJson: string | null;
  content: string;
  /** Server clock — used for optional optimistic concurrency on save. */
  updatedAt?: string | Date | null;
  course: { id: string; title: string; color: string | null } | null;
  material: { id: string; title: string; type: string } | null;
}

interface CourseOption {
  id: string;
  title: string;
  focusTopic?: string | null;
  topics?: string[];
}

interface MaterialOption {
  id: string;
  title: string;
  type: string;
  extractedText: string | null;
  filePath?: string | null;
  url?: string | null;
}

function noteRecordFromInitial(note: CoreInitialNote): NoteRecord {
  return {
    id: note.id,
    title: note.title,
    method: note.method as NoteMethod,
    contentJson: note.contentJson,
    content: note.content,
    course: note.course,
    material: note.material,
  };
}

function documentFromInitialNote(note: CoreInitialNote): NoteDocument {
  const parsed = parseNoteDocument(note.contentJson);
  if (!parsed.notebook?.pageTemplateId && !parsed.notebook?.customBackgroundAssetId) {
    parsed.notebook = {
      coverId: "classic_orange",
      customCoverColor: null,
      showCover: false,
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
  return ensureNotebookPages(parsed);
}

export function CoreNotesWorkspace({
  initialCourses,
  launchAction,
  hideHubChrome = false,
  initialNote = null,
}: {
  initialCourses: CourseOption[];
  /** From /core/go/[action] — SSR-safe panel/bucket open (Shelf-style paths). */
  launchAction?: CoreGoAction;
  /** Unused legacy flag — hub always renders in-workspace. Kept for call-site compat. */
  hideHubChrome?: boolean;
  /** Server-loaded note when URL has ?noteId= — opens without waiting on client fetch. */
  initialNote?: CoreInitialNote | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pendingNoteId = searchParams.get("noteId") ?? initialNote?.id ?? null;
  const pendingMaterialId = searchParams.get("materialId");
  const pendingCourseId = searchParams.get("courseId");
  const pendingImport = searchParams.get("import") === "1";
  const pendingAutoSessionMinutes = parseAutoSessionMinutes(searchParams.get("session"));
  const pendingOpenAssist = searchParams.get("assist") === "1";
  const pendingStudio = searchParams.get("studio")?.trim() || null;
  const pendingStudyPack = searchParams.get("pack") === "1";
  const pendingTopicParam = searchParams.get("topic") ?? "";
  const [courses] = useState(initialCourses);
  const [notes, setNotes] = useState<NoteRecord[]>(() =>
    initialNote ? [noteRecordFromInitial(initialNote)] : [],
  );
  const [activeId, setActiveId] = useState<string | null>(() => initialNote?.id ?? null);
  const {
    doc,
    setDoc,
    replaceDoc,
    undo: undoDoc,
    redo: redoDoc,
    canUndo: canUndoDoc,
    canRedo: canRedoDoc,
  } = useDocumentHistory<NoteDocument>(
    initialNote ? documentFromInitialNote(initialNote) : emptyDocument(),
  );
  const [title, setTitle] = useState(() => initialNote?.title ?? "Untitled note");
  const [method, setMethod] = useState<NoteMethod>(
    () => (initialNote?.method as NoteMethod) ?? "BLANK",
  );
  const [tool, setTool] = useState<NoteTool>(() => {
    if (!initialNote) return "type";
    const opened = documentFromInitialNote(initialNote);
    // Keep ink visible/editable when the note was last used with a pen tool.
    return opened.tool === "annotate" ? "annotate" : opened.tool ?? "type";
  });
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [materialsReady, setMaterialsReady] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState(() =>
    resolveCoreCourseId(
      pendingCourseId ?? initialNote?.course?.id ?? null,
      initialCourses.map((course) => course.id),
    ),
  );
  const deskLoopTopic = useMemo(() => {
    const urlTopic = pendingTopicParam.trim();
    if (!courseId && !urlTopic) return null;
    return (
      resolveLoopFocusTopic(
        urlTopic || null,
        courses.find((course) => course.id === courseId)?.topics ?? [],
      ) ||
      title?.trim() ||
      null
    );
  }, [courseId, courses, title, pendingTopicParam]);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [noteDirty, setNoteDirty] = useState(false);
  const [saveConflict, setSaveConflict] = useState(false);
  const [loading, setLoading] = useState(() => !initialNote);
  const [listening, setListening] = useState(false);
  const [studioTopic, setStudioTopic] = useState("");
  const [inkTool, setInkTool] = useState<InkTool>("pen");
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [inkColor, setInkColor] = useState("#44403c");
  const [inkSize, setInkSize] = useState(4);
  const [inkFillPattern, setInkFillPattern] = useState<InkFillPattern>("solid");
  // Default Pencil-only on touch phones so fingers scroll/tap; stylus still draws.
  // Desktop keeps finger/mouse write unless the user opts in.
  const [pencilOnly, setPencilOnly] = useState(false);
  const compactNav = useCompactHubNav();
  const [activeFormat, setActiveFormat] = useState<CoreFormatId>(() =>
    initialNote
      ? resolveActiveFormat(documentFromInitialNote(initialNote), initialNote.method as NoteMethod)
      : "BLANK",
  );
  const [recommendations, setRecommendations] = useState<FormatRecommendation[]>(() =>
    initialNote
      ? documentFromInitialNote(initialNote).metadata?.recommendedFormats ?? []
      : [],
  );
  const [setupOpen, setSetupOpen] = useState(
    () => launchAction === "new" || launchAction === "newWhiteboard",
  );
  const [viewingCover, setViewingCover] = useState(false);
  const [scrollToPageId, setScrollToPageId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<MaterialPreviewPayload | null>(null);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFlashcardCount, setImportFlashcardCount] = useState<number | null>(null);
  const [importQuizId, setImportQuizId] = useState<string | null>(null);
  const [importTargetNotes, setImportTargetNotes] = useState<
    Array<{ id: string; title: string | null; courseTitle?: string | null }>
  >([]);
  const pendingImportChoiceRef = useRef<MaterialImportChoice | null>(null);
  const pendingExtractRef = useRef<ChapterStudyExtract | null>(null);
  const [setupDefaults, setSetupDefaults] = useState<Partial<NotebookSetupConfig> | undefined>(
    () =>
      launchAction === "newWhiteboard"
        ? {
            mode: "whiteboard",
            pageTemplateId: "blank",
            title: "Untitled whiteboard",
          }
        : undefined,
  );
  const [setupSuggestionsSummary, setSetupSuggestionsSummary] = useState<string | undefined>();
  const [setupVariant, setSetupVariant] = useState<"full" | "cover-only">("full");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [sidePanel, setSidePanel] = useState<CorePanelTab | null>(() => {
    if (pendingStudio === "study-guide") return "assist";
    if (pendingOpenAssist) return "sources";
    if (launchAction && isCoreGoPanelAction(launchAction)) return launchAction;
    return null;
  });
  const [studySplit, setStudySplit] = useState(launchAction === "split");
  const [flashcardSplit, setFlashcardSplit] = useState<{
    title: string;
    cards: Array<{ front: string; back: string }>;
  } | null>(null);
  const [coreDark, setCoreDark] = useState(launchAction === "dark");
  const [mobileNotesOpen, setMobileNotesOpen] = useState(launchAction === "pages");
  const [notesRailOpen, setNotesRailOpen] = useState(launchAction === "rail");
  const launchBucket: CoreGoBucketAction | null =
    launchAction && isCoreGoBucketAction(launchAction) ? launchAction : null;
  const notesRailMounted = useIsClientMounted();
  const [overlayPortalReady, setOverlayPortalReady] = useState(false);
  // Show rail whenever open — don't wait for mount (iPad hydration stall hid Pages forever).
  const notesRailVisible = notesRailOpen;
  // Apply dark immediately from launchAction — don't wait for mount gate.
  const coreDarkVisible = coreDark;
  const [toolbarBucketOpen, setToolbarBucketOpen] = useState(
    () => Boolean(launchBucket && launchBucket !== "readWrite"),
  );
  const chromeOverlayOpen =
    Boolean(sidePanel) ||
    toolbarBucketOpen ||
    mobileNotesOpen ||
    setupOpen ||
    importWizardOpen;
  const [laserActive, setLaserActive] = useState(false);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [pdfInkBridge, setPdfInkBridge] = useState<{
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    strokeCount: number;
  } | null>(null);
  const [studySessionLoading, setStudySessionLoading] = useState(false);
  const autoSessionLaunchedRef = useRef(false);
  const studyPackLaunchedRef = useRef(false);

  const startStudyNowForCourse = useCallback(
    async (targetCourseId: string, minutes: StudyMinutes = 20) => {
      setStudySessionLoading(true);
      try {
        await launchStudyNowSession({ minutes, courseId: targetCourseId });
        router.push(
          `/study/session?minutes=${minutes}&courseId=${encodeURIComponent(targetCourseId)}`,
        );
      } finally {
        setStudySessionLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!pendingAutoSessionMinutes || !courseId || autoSessionLaunchedRef.current) return;
    if (importWizardOpen || setupOpen || importBusy) return;

    autoSessionLaunchedRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("session");
    const coreQuery = params.toString();
    router.replace(coreQuery ? `/core?${coreQuery}` : "/core");

    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    void startStudyNowForCourse(courseId, pendingAutoSessionMinutes).catch((err) => {
      autoSessionLaunchedRef.current = false;
      window.alert(
        err instanceof Error ? err.message : "Could not start Study Now session.",
      );
    });
  }, [
    pendingAutoSessionMinutes,
    courseId,
    importWizardOpen,
    setupOpen,
    importBusy,
    router,
    searchParams,
    startStudyNowForCourse,
  ]);

  useEffect(() => {
    try {
      const touch = isTouchChrome();
      // Touch tablets/phones: finger/stylus both work unless the user opts into Pencil-only.
      if (touch) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
        setPencilOnly(false);
        setToolbarState((current) => ({
          ...current,
          penSettings: { ...current.penSettings, reduceLatency: true },
          pencilReduceLatency: true,
          highlighterReduceLatency: true,
        }));
        try {
          localStorage.setItem("core-pencil-only", "false");
        } catch {
          // ignore
        }
        return;
      }
      const stored = localStorage.getItem("core-pencil-only");
      if (stored === "true" || stored === "false") {
        setPencilOnly(stored === "true");
      }
    } catch {
      // ignore
    }
    try {
      if (localStorage.getItem("core-appearance") === "dark") setCoreDark(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("core-appearance", coreDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [coreDark]);

  const handlePencilOnlyChange = useCallback((value: boolean) => {
    setPencilOnly(value);
    try {
      localStorage.setItem("core-pencil-only", String(value));
    } catch {
      // ignore
    }
  }, []);

  const handlePenDetected = useCallback(() => {
    // Never auto-enable Pencil-only — it blocks finger input on iPad until toggled in toolbar.
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("core-notes-rail-open");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      if (stored === "true") setNotesRailOpen(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("core-notes-rail-open", String(notesRailOpen));
    } catch {
      // ignore storage errors
    }
  }, [notesRailOpen]);

  // Close panels on Escape (mobile/iPad — no global pointer trap that steals taps).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSidePanel(null);
      setMobileNotesOpen(false);
      setImportWizardOpen(false);
      setSetupOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close leftover wizards after first paint on touch — never clear sidePanel
  // or path-launched new/import wizards (URL-driven opens must survive).
  useEffect(() => {
    if (typeof navigator === "undefined" || (navigator.maxTouchPoints ?? 0) === 0) {
      return;
    }
    if (
      launchAction === "new" ||
      launchAction === "newWhiteboard" ||
      launchAction === "import"
    ) {
      return;
    }
    const id = window.setTimeout(() => {
      setImportWizardOpen(false);
      setSetupOpen(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, [launchAction]);
  const [toolbarState, setToolbarState] = useState<CoreToolbarState>(() => ({
    ...defaultCoreToolbarState(),
    ...(launchAction === "readWrite" ? { readOnly: true } : {}),
  }));
  const [selectedCanvasElementIds, setSelectedCanvasElementIds] = useState<string[]>([]);
  const [textPlaceMode, setTextPlaceMode] = useState(false);
  const [focusTextBoxId, setFocusTextBoxId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null);
  const [canvasClipboardReady, setCanvasClipboardReady] = useState(false);
  const canvasClipboardRef = useRef<CanvasClipboardItem[]>([]);
  const pageCanvasRef = useRef<HTMLDivElement>(null);
  const lastPointerLocalRef = useRef<{ x: number; y: number } | null>(null);
  const lastDocStrokesRef = useRef<string>(
    initialNote
      ? JSON.stringify(documentFromInitialNote(initialNote).strokes ?? [])
      : "",
  );
  const strokePageGateRef = useRef<string>(
    initialNote
      ? `${initialNote.id}:${documentFromInitialNote(initialNote).metadata?.notebookPages?.activePageId ?? ""}`
      : "",
  );
  const autoSaveSkipRef = useRef(true);
  const workbookBootstrapRef = useRef(false);
  const docRef = useRef(doc);
  docRef.current = doc;
  const saveGenRef = useRef(0);
  /** Last known server updatedAt for active note (optimistic concurrency). */
  const noteServerUpdatedAtRef = useRef<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const artifactSaveStatus = useMemo(
    () =>
      resolveArtifactSaveStatus({
        saving,
        saveError,
        dirty: noteDirty,
        lastSavedAt,
        conflict: saveConflict,
      }),
    [saving, saveError, noteDirty, lastSavedAt, saveConflict],
  );
  const artifactSaveLabel = artifactSaveStatusLabel(artifactSaveStatus);
  const projectMeta = useMemo(
    () => parseMultiFileProjectMeta(doc.metadata?.multiFileProject ?? null),
    [doc.metadata?.multiFileProject],
  );
  const sketchInk = useInkHistory(
    initialNote ? (documentFromInitialNote(initialNote).strokes ?? []) : [],
  );

  const refreshNotes = useCallback(async (options?: { quiet?: boolean }) => {
    if (!options?.quiet) setLoading(true);
    const response = await fetch(
      courseId ? `/api/notes?courseId=${courseId}` : "/api/notes",
      { credentials: "same-origin" },
    );
    const data = await response.json();
    if (data.success) {
      setNotes(data.data);
    }
    if (!options?.quiet) setLoading(false);
  }, [courseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void refreshNotes();
  }, [refreshNotes]);

  useEffect(() => {
    if (!pendingCourseId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setCourseId(
      resolveCoreCourseId(
        pendingCourseId,
        courses.map((course) => course.id),
      ),
    );
  }, [pendingCourseId, courses]);

  const sidePanelOpenedAt = useRef(launchAction && isCoreGoPanelAction(launchAction) ? Date.now() : 0);

  useEffect(() => {
    if (pendingStudio === "study-guide") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setSidePanel("assist");
      if (pendingTopicParam.trim()) {
        setStudioTopic(pendingTopicParam.trim());
      }
      return;
    }
    if (pendingOpenAssist) {
      setSidePanel("sources");
    }
  }, [pendingOpenAssist, pendingStudio, pendingTopicParam]);

  useEffect(() => {
    document.documentElement.dataset.coreAppearance = coreDark ? "dark" : "light";
    return () => {
      delete document.documentElement.dataset.coreAppearance;
    };
  }, [coreDark]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setOverlayPortalReady(true);
  }, []);

  // One-shot /core/go/save — run once then return to /core.
  useEffect(() => {
    if (launchAction !== "save") return;
    void (async () => {
      try {
        await saveNote();
      } finally {
        router.replace("/core", { scroll: false });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchAction]);

  // Touch native forms: /core/go/ink-* / fmt-* / surface-* / insert-*
  useEffect(() => {
    if (!launchAction) return;

    if (isCoreGoInkAction(launchAction)) {
      const mode = inkActionToPenMode(launchAction);
      patchToolbar({
        activePenMode: mode,
        inkTool: penModeToInkTool(mode),
        readOnly: false,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setTextPlaceMode(false);
      activateSketchTool(penModeToInkTool(mode));
      const size = penModeToInkSize(mode, { ...toolbarState, activePenMode: mode });
      setInkSize(size);
      if (mode === "highlighter") {
        setInkTool("highlighter");
        if (inkColor === "#1c1917" || inkColor === "#44403c") setInkColor("#facc15");
      } else if (mode === "chalk") {
        setInkTool("pen");
        if (inkColor === "#1c1917" || inkColor === "#44403c" || inkColor === "#000000") {
          setInkColor("#f8fafc");
        }
      } else if (mode === "crayon") {
        setInkTool("pen");
        if (
          inkColor === "#1c1917" ||
          inkColor === "#44403c" ||
          inkColor === "#000000" ||
          inkColor === "#f8fafc"
        ) {
          setInkColor("#dc2626");
        }
      } else if (mode === "colorPencil") {
        setInkTool("pen");
        if (
          inkColor === "#1c1917" ||
          inkColor === "#44403c" ||
          inkColor === "#000000" ||
          inkColor === "#f8fafc"
        ) {
          setInkColor("#0284c7");
        }
      } else if (mode === "marker") {
        setInkTool("pen");
        if (inkColor === "#facc15" || inkColor === "#f8fafc" || inkColor === "#a3e635") {
          setInkColor("#1e3a8a");
        }
      } else {
        setInkTool(penModeToInkTool(mode));
      }
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/core/go/")) {
        window.history.replaceState(null, "", "/core");
      }
      return;
    }

    if (isCoreGoFmtAction(launchAction)) {
      if (launchAction === "fmt-select") {
        setLaserActive(false);
        setTextPlaceMode(false);
        setTool("type");
        setInkTool("pen");
        patchToolbar({ inkTool: "pen" });
      } else if (launchAction === "fmt-lasso") {
        setTextPlaceMode(false);
        activateSketchTool("lasso");
        patchToolbar({ inkTool: "lasso" });
      } else if (launchAction === "fmt-eraser") {
        setTextPlaceMode(false);
        activateSketchTool("eraser");
        patchToolbar({ inkTool: "eraser" });
      } else if (launchAction === "fmt-shapes") {
        setTextPlaceMode(false);
        activateSketchTool("shape");
        patchToolbar({ inkTool: "shape", shapeKind: "rect" });
      } else if (launchAction === "fmt-text") {
        setTextPlaceMode(true);
        setTool("type");
      } else if (launchAction === "fmt-undo") {
        undoCore();
      } else if (launchAction === "fmt-redo") {
        redoCore();
      }
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/core/go/")) {
        window.history.replaceState(null, "", "/core");
      }
      return;
    }

    if (isCoreGoSurfaceAction(launchAction)) {
      const surface =
        launchAction === "surface-whiteboard"
          ? "whiteboard"
          : launchAction === "surface-chalkboard"
            ? "chalkboard"
            : "notebook";
      applyPaperSurface(surface);
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/core/go/")) {
        window.history.replaceState(null, "", "/core");
      }
      return;
    }

    if (isCoreGoInsertAction(launchAction)) {
      if (launchAction === "insert-sticky") {
        // Match toolbar sticky insert path when available after mount
        setSidePanel(null);
      } else if (launchAction === "insert-textbox") {
        setTextPlaceMode(true);
        setTool("type");
        setSidePanel(null);
      } else if (
        launchAction === "insert-sticker" ||
        launchAction === "insert-elements" ||
        launchAction === "insert-image"
      ) {
        setSidePanel("tools");
      }
      if (
        launchAction !== "insert-sticker" &&
        launchAction !== "insert-elements" &&
        launchAction !== "insert-image" &&
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/core/go/")
      ) {
        window.history.replaceState(null, "", "/core");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchAction]);

  useEffect(() => {
    if (pendingTopicParam.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setStudioTopic(pendingTopicParam.trim());
    }
  }, [pendingTopicParam]);

  useEffect(() => {
    if (!pendingStudyPack || studyPackLaunchedRef.current || !courseId || !materialsReady) return;
    studyPackLaunchedRef.current = true;
    const topic = pendingTopicParam.trim();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    if (topic) setStudioTopic(topic);

    void studyFromCurrentSource(undefined, topic || undefined)
      .then(() => {
        setSidePanel("assist");
      })
      .catch((error) => {
        window.alert(
          error instanceof Error
            ? error.message
            : "Could not build a study pack from your course topics.",
        );
      })
      .finally(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("pack");
        router.replace(`/core?${params.toString()}`, { scroll: false });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when course materials are ready
  }, [pendingStudyPack, courseId, materialsReady]);

  useEffect(() => {
    void loadMaterials();
  }, [courseId]);

  async function loadMaterials() {
    if (!courseId) {
      setMaterials([]);
      setMaterialsReady(true);
      return;
    }
    setMaterialsReady(false);
    const response = await fetch(`/api/courses`, { credentials: "same-origin" });
    const data = await response.json();
    const course = data.courses?.find((item: { id: string }) => item.id === courseId);
    setMaterials(course?.materials ?? []);
    setMaterialsReady(true);
  }

  useEffect(() => {
    // Import CTA without a material → Assist (add/pick material), never a stuck loader.
    if (launchAction === "import" && !pendingMaterialId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setSidePanel("sources");
      setImportWizardOpen(false);
      setImportPreview(null);
      setImportError(null);
    }
  }, [launchAction, pendingMaterialId]);

  useEffect(() => {
    if (!pendingMaterialId || !pendingImport) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setImportWizardOpen(true);
    setImportError(null);

    const previewTimeout = window.setTimeout(() => {
      if (cancelled) return;
      setImportError(
        "Loading material took too long. Check your connection or tap Cancel import.",
      );
    }, 12_000);

    void fetchMaterialPreview(pendingMaterialId)
      .then((material) => {
        if (cancelled) return;
        setImportPreview(material);
        if (material.courseId) setCourseId(material.courseId);
        setSelectedMaterialId(material.id);
      })
      .catch((error) => {
        if (cancelled) return;
        setImportError(
          error instanceof Error ? error.message : "Could not load material for import.",
        );
      });

    // All Core notebooks (not just the current course) for "Target workbook".
    void fetch("/api/notes", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        const list = (data.data as NoteRecord[]).map((note) => ({
          id: note.id,
          title: note.title,
          courseTitle: note.course?.title ?? null,
        }));
        setImportTargetNotes(list);
      })
      .catch(() => {
        if (!cancelled) setImportTargetNotes([]);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(previewTimeout);
    };
  }, [pendingMaterialId, pendingImport]);

  // Legacy: materialId without import — desktop only; on iPad this trapped Core behind import overlay.
  useEffect(() => {
    if (compactNav) return;
    if (!pendingMaterialId || pendingNoteId || pendingImport || workbookBootstrapRef.current) {
      return;
    }
    workbookBootstrapRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.set("import", "1");
    router.replace(`/core?${params.toString()}`);
  }, [compactNav, pendingMaterialId, pendingNoteId, pendingImport, router, searchParams]);

  useEffect(() => {
    const touchCapable =
      typeof navigator !== "undefined" && (navigator.maxTouchPoints ?? 0) > 0;
    if (!compactNav && !touchCapable) return;
    if (
      launchAction === "new" ||
      launchAction === "newWhiteboard" ||
      launchAction === "import"
    ) {
      return;
    }
    // Clear stuck import/setup overlays only — never sidePanel/Pages
    // (those open via Shelf-style Links and must survive compactNav hydration).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setImportWizardOpen(false);
    setSetupOpen(false);
    setImportPreview(null);
    setImportError(null);
    if (pendingImport) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("import");
      const query = params.toString();
      router.replace(query ? `/core?${query}` : "/core", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compactNav, launchAction]);

  useEffect(() => {
    if (pendingOpenAssist) return;
    // Never clear URL-launched Pages / rail — that made the left panel flash then die.
    if (launchAction === "pages" || launchAction === "rail") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setMobileNotesOpen(false);
    if (!pendingImport && !pendingMaterialId) {
      setImportWizardOpen(false);
      setImportPreview(null);
      setImportError(null);
    }
    // Recover stuck overlays after navigation — run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendingMaterialId || selectedMaterialId === pendingMaterialId) return;
    const material = materials.find((item) => item.id === pendingMaterialId);
    if (!material) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setSelectedMaterialId(material.id);
    // Study Guide / Studio deep-links keep assist focus — don't force annotate over them.
    if (material.filePath && pendingStudio !== "study-guide") {
      setTool("annotate");
    }
  }, [pendingMaterialId, materials, selectedMaterialId, pendingStudio]);

  useEffect(() => {
    if (!pendingNoteId || activeId === pendingNoteId) return;

    let cancelled = false;

    const existing = notes.find((note) => note.id === pendingNoteId);
    if (existing) {
      selectNote(existing);
      return;
    }

    void fetch(`/api/notes/${encodeURIComponent(pendingNoteId)}`, {
      credentials: "same-origin",
    })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data?.success || !data.data) return;
        const note = data.data as NoteRecord;
        if (note.course?.id) setCourseId(note.course.id);
        setNotes((current) => {
          if (current.some((item) => item.id === note.id)) return current;
          return [note, ...current];
        });
        selectNote(note);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectNote is stable enough; avoid re-entry loops
  }, [pendingNoteId, notes, activeId]);

  function clearImportQueryParams(noteId?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("import");
    if (noteId) params.set("noteId", noteId);
    if (pendingCourseId) params.set("courseId", pendingCourseId);
    if (pendingMaterialId) params.set("materialId", pendingMaterialId);
    router.replace(`/core?${params.toString()}`);
  }

  function cancelMaterialImport() {
    setImportWizardOpen(false);
    setImportPreview(null);
    setImportError(null);
    pendingImportChoiceRef.current = null;
    pendingExtractRef.current = null;
    setSetupDefaults(undefined);
    setSetupSuggestionsSummary(undefined);
    setSetupVariant("full");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("import");
    params.delete("materialId");
    if (pendingCourseId) params.set("courseId", pendingCourseId);
    if (activeId) params.set("noteId", activeId);
    router.replace(params.toString() ? `/core?${params.toString()}` : "/core");
  }

  async function ensureNoteSelected(noteId: string): Promise<NoteDocument> {
    if (activeId === noteId) return doc;
    const existing = notes.find((note) => note.id === noteId);
    if (existing) {
      selectNote(existing);
      return parseNoteDocument(existing.contentJson);
    }
    const response = await fetch(`/api/notes/${noteId}`);
    const data = await response.json();
    if (!data.success) throw new Error("Could not open that workbook.");
    const note = data.data as NoteRecord;
    if (note.course?.id) setCourseId(note.course.id);
    setNotes((current) => {
      if (current.some((item) => item.id === note.id)) return current;
      return [note, ...current];
    });
    selectNote(note);
    return parseNoteDocument(note.contentJson);
  }

  async function persistNoteContent(
    noteId: string,
    nextDoc: NoteDocument,
    options?: { title?: string; noteTool?: NoteTool; method?: NoteMethod },
  ) {
    const synced = syncCurrentPage(nextDoc);
    const nextTool = options?.noteTool ?? tool;
    const nextTitle = options?.title ?? title;
    const nextMethod = options?.method ?? method;
    setSaving(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nextTitle,
          method: nextMethod,
          content: synced.typed,
          contentJson: JSON.stringify({
            ...synced,
            tool: nextTool,
            pdfMaterialId: selectedMaterialId,
            metadata: {
              ...synced.metadata,
              activeFormat: synced.metadata?.activeFormat ?? activeFormat,
              recommendedFormats: synced.metadata?.recommendedFormats ?? recommendations,
            },
          }),
          materialId: selectedMaterialId,
          ...(noteServerUpdatedAtRef.current
            ? { expectedUpdatedAt: noteServerUpdatedAtRef.current }
            : {}),
        }),
      });
      if (response.ok) {
        const data = (await response.json().catch(() => null)) as {
          data?: { updatedAt?: string | Date };
        } | null;
        const nextUpdated = data?.data?.updatedAt;
        if (typeof nextUpdated === "string") {
          noteServerUpdatedAtRef.current = nextUpdated;
        } else if (nextUpdated instanceof Date) {
          noteServerUpdatedAtRef.current = nextUpdated.toISOString();
        }
        setLastSavedAt(new Date());
      }
    } finally {
      setSaving(false);
    }
  }

  async function applyMaterialImportToActiveDoc(
    choice: MaterialImportChoice,
    material: MaterialPreviewPayload,
    options?: {
      addPage?: boolean;
      noteId?: string | null;
      baseDoc?: NoteDocument;
      extract?: ChapterStudyExtract | null;
      extractTitle?: string;
    },
  ): Promise<{ flashcards: number }> {
    let flashcards = 0;
    const noteId = options?.noteId ?? activeId;
    if (!noteId) throw new Error("No workbook selected.");

    const localMaterial = materials.find((item) => item.id === material.id);
    let nextTitle = `${material.title} — workbook`;
    let nextTool: NoteTool = material.hasFile ? "annotate" : "type";
    let nextRecommendations = recommendations;
    const startingDoc = options?.baseDoc ?? doc;

    let nextDoc: NoteDocument = startingDoc;

    if (choice.mode === "ai") {
      let extract = options?.extract ?? null;
      let extractTitle = options?.extractTitle;
      if (!extract) {
        const fetched = await fetchChapterStudyExtract({
          courseId: material.courseId || courseId,
          materialId: material.id,
        });
        extract = fetched.extract;
        extractTitle = fetched.title;
      }
      nextTitle = extractTitle || extract.title || nextTitle;
      nextTool = "type";
      const adaptiveRecommendations = await fetchAdaptiveStudyRecommendations({
        courseId: material.courseId || courseId,
        materialId: material.id,
        extract,
      });
      const base = options?.addPage ? addNotebookPage(startingDoc) : startingDoc;
      nextDoc = applyAiExtractToDocument(base, extract, { adaptiveRecommendations });
      nextRecommendations =
        (nextDoc.metadata?.recommendedFormats as typeof recommendations | undefined) ??
        adaptiveRecommendations ??
        extract.recommendedFormats
          .filter((formatId) => formatId !== "QA")
          .map((formatId) => ({
            formatId,
            confidence: 0.9,
            reason: "Suggested for this material import",
            aiSuggested: true,
          }));
      // Keep cover/chrome from setup. Study workspace is content layout, not paper.
      if (startingDoc.notebook) {
        nextDoc = {
          ...nextDoc,
          notebook: {
            ...startingDoc.notebook,
            ...nextDoc.notebook,
            coverId: startingDoc.notebook.coverId ?? nextDoc.notebook?.coverId,
            customCoverColor:
              startingDoc.notebook.customCoverColor ?? nextDoc.notebook?.customCoverColor,
            showCover: startingDoc.notebook.showCover ?? nextDoc.notebook?.showCover,
            pageTemplateId: startingDoc.notebook.pageTemplateId,
          },
        };
      }
      setRecommendations(nextRecommendations);
      const studyFormat = displayFormatFromStudyDoc(nextDoc);
      setMethod(methodForStudyFormat(studyFormat));
      setActiveFormat(studyFormat);
      if (choice.mode === "ai" && (material.courseId || courseId)) {
        if (extract.testYourself.length > 0) {
          try {
            flashcards = await importExtractQaToFlashcards({
              courseId: material.courseId || courseId,
              materialId: material.id,
              deckTitle: `${extract.title} · Q&A`,
              pairs: extract.testYourself,
            });
          } catch {
            // Keep Core import even if flashcards fail.
          }
        }
        try {
          const quizId = await importExtractQuiz({
            courseId: material.courseId || courseId,
            materialId: material.id,
            extract,
          });
          if (quizId) setImportQuizId(quizId);
        } catch {
          // Notes import still succeeds if quiz generation fails.
        }
      }
    } else {
      const base = options?.addPage ? addNotebookPage(startingDoc) : startingDoc;
      nextDoc = seedRawMaterialDocument(
        {
          id: material.id,
          title: material.title,
          extractedText: material.previewText || localMaterial?.extractedText || null,
          filePath: material.hasFile ? "file" : localMaterial?.filePath,
        },
        {
          ...base,
          notebook: base.notebook,
        },
      );
      if (startingDoc.notebook) {
        nextDoc = { ...nextDoc, notebook: { ...nextDoc.notebook, ...startingDoc.notebook } };
      }
    }

    setTitle(nextTitle);
    setTool(nextTool);
    setSelectedMaterialId(material.id);
    replaceDoc(nextDoc);
    await persistNoteContent(noteId, nextDoc, {
      title: nextTitle,
      noteTool: nextTool,
      method: choice.mode === "ai" ? methodForStudyFormat(displayFormatFromStudyDoc(nextDoc)) : method,
    });
    return { flashcards };
  }

  function openBlankNotebookSetup(mode: "notes" | "whiteboard" = "notes") {
    pendingImportChoiceRef.current = null;
    pendingExtractRef.current = null;
    setSetupDefaults(
      mode === "whiteboard"
        ? {
            mode: "whiteboard",
            pageTemplateId: "blank",
            title: "Untitled whiteboard",
          }
        : undefined,
    );
    setSetupSuggestionsSummary(undefined);
    setSetupVariant("full");
    setSetupOpen(true);
    setNewMenuOpen(false);
  }

  function openNewImport() {
    setNewMenuOpen(false);
    setImportWizardOpen(true);
  }

  function applySuggestedSetup(suggestion: SuggestedNotebookSetup) {
    setSetupDefaults({
      title: suggestion.title,
      mode: suggestion.mode,
      pageTemplateId: suggestion.pageTemplateId,
      method: suggestion.method,
      penPresetId: suggestion.penPresetId,
      whiteboardStarterId: suggestion.whiteboardStarterId,
      showCover: false,
      customCoverColor: null,
      coverId: "classic_orange",
    });
    setSetupSuggestionsSummary(suggestion.summary);
    setSetupVariant("cover-only");
    setImportWizardOpen(false);
    setSetupOpen(true);
  }

  async function handleMaterialImportConfirm(choice: MaterialImportChoice) {
    if (!importPreview) return;
    setImportBusy(true);
    setImportError(null);
    setImportFlashcardCount(null);
    pendingImportChoiceRef.current = choice;

    try {
      if (choice.destination === "new-workbook") {
        if (choice.mode === "ai") {
          const { extract, title: extractTitle } = await fetchChapterStudyExtract({
            courseId: importPreview.courseId || courseId,
            materialId: importPreview.id,
          });
          pendingExtractRef.current = extract;
          const suggestion = suggestNotebookSetupFromExtract(extract, importPreview);
          suggestion.title = extractTitle || suggestion.title;
          applySuggestedSetup(suggestion);
          return;
        }

        pendingExtractRef.current = null;
        applySuggestedSetup(suggestNotebookSetupFromMaterial(importPreview));
        return;
      }

      if (choice.destination === "current") {
        if (!activeId) throw new Error("Open a workbook first to use the current sheet.");
        const result = await applyMaterialImportToActiveDoc(choice, importPreview, {
          noteId: activeId,
          baseDoc: doc,
        });
        setImportFlashcardCount(result.flashcards || null);
        pendingImportChoiceRef.current = null;
        pendingExtractRef.current = null;
        setImportWizardOpen(false);
        clearImportQueryParams(activeId);
        return;
      }

      const targetId = choice.targetNoteId || activeId;
      if (!targetId) throw new Error("Pick a workbook, or create a new one.");
      const baseDoc = await ensureNoteSelected(targetId);
      const result = await applyMaterialImportToActiveDoc(choice, importPreview, {
        addPage: true,
        noteId: targetId,
        baseDoc,
      });
      setImportFlashcardCount(result.flashcards || null);
      pendingImportChoiceRef.current = null;
      pendingExtractRef.current = null;
      setImportWizardOpen(false);
      clearImportQueryParams(targetId);
    } catch (error) {
      setImportError(friendlyAiImportError(error));
      setImportWizardOpen(true);
      setSetupOpen(false);
    } finally {
      setImportBusy(false);
    }
  }

  function retryMaterialImport() {
    const choice = pendingImportChoiceRef.current;
    if (!choice) return;
    void handleMaterialImportConfirm(choice);
  }

  function selectNote(note: NoteRecord) {
    autoSaveSkipRef.current = true;
    setActiveId(note.id);
    const serverUpdated =
      typeof note.updatedAt === "string"
        ? note.updatedAt
        : note.updatedAt instanceof Date
          ? note.updatedAt.toISOString()
          : null;
    noteServerUpdatedAtRef.current = serverUpdated;
    setTitle(note.title ?? "Untitled note");
    setMethod(note.method);
    setNoteDirty(false);
    setSaveConflict(false);
    setSaveError(null);
    setLastSavedAt(serverUpdated ? new Date(serverUpdated) : null);
    const parsed = parseNoteDocument(note.contentJson);
    if (!parsed.notebook?.pageTemplateId && !parsed.notebook?.customBackgroundAssetId) {
      parsed.notebook = {
        coverId: "classic_orange",
        customCoverColor: null,
        showCover: false,
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
    lastDocStrokesRef.current = JSON.stringify(withPages.strokes ?? []);
    strokePageGateRef.current = `${note.id}:${withPages.metadata?.notebookPages?.activePageId ?? ""}`;
    replaceDoc(withPages);
    setActiveFormat(resolveActiveFormat(withPages, note.method));
    setRecommendations(withPages.metadata?.recommendedFormats ?? []);
    {
      const saved = withPages.metadata?.coreToolbar;
      setToolbarState(
        saved
          ? {
              ...defaultCoreToolbarState(),
              ...saved,
              visibleItems: normalizeToolbarVisibleItems(saved.visibleItems),
            }
          : defaultCoreToolbarState(),
      );
    }
    setSelectedMaterialId(note.material?.id ?? null);
    setSelectedCanvasElementIds([]);
    setViewingCover(false);
    const narrowPhone =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches &&
      (window.matchMedia("(hover: none)").matches ||
        window.matchMedia("(pointer: coarse)").matches);
    // Phones: Select so study chrome stays tappable. iPad/tablet: pen ready for finger writing.
    // Use hydrated page fields (withPages), not raw parse — ink lives in notebookPages.
    const preferSketch =
      !narrowPhone &&
      !withPages.typed?.trim() &&
      (withPages.strokes?.length ?? 0) === 0 &&
      (withPages.metadata?.compositeSections?.length ?? 0) === 0;
    const nextTool: NoteTool =
      narrowPhone && withPages.tool === "sketch"
        ? "type"
        : preferSketch && withPages.tool !== "annotate"
          ? "sketch"
          : withPages.tool;
    setTool(nextTool);
    if (nextTool === "sketch") {
      setInkTool("pen");
      setToolbarState((current) => ({
        ...current,
        inkTool: "pen",
        activePenMode: "fountain",
      }));
    }
    sketchInk.replaceStrokes(withPages.strokes ?? []);
    const penPreset = PEN_PRESETS.find(
      (item) => item.id === withPages.notebook?.penPresetId,
    );
    if (penPreset) {
      setInkSize(penPreset.width);
      if (penPreset.id === "highlighter") setInkTool("highlighter");
      else if (inkTool === "highlighter") setInkTool("pen");
    }
  }

  function pageHasFormatBlocks(current = doc) {
    return (current.metadata?.compositeSections?.length ?? 0) > 0;
  }

  function clearCurrentPage() {
    if (!confirm("Clear everything on this page? This cannot be undone.")) return;
    sketchInk.replaceStrokes([]);
    lastDocStrokesRef.current = "[]";
    setSelectedCanvasElementIds([]);
    const next = prepareNoteDocumentForSave({
      ...docRef.current,
      typed: "",
      typedHtml: "",
      strokes: [],
      annotations: [],
      decorations: [],
      pageImages: [],
      pageTextBoxes: [],
      canvas: undefined,
      metadata: {
        ...docRef.current.metadata,
        compositeSections: undefined,
      },
    });
    docRef.current = next;
    setDoc(next);
    void saveNote({ docOverride: next });
  }

  function patchToolbar(patch: Partial<CoreToolbarState>) {
    if (patch.shapeKind) setShapeKind(patch.shapeKind);
    if (patch.inkTool) setInkTool(patch.inkTool);
    setToolbarState((current) => {
      const next = {
        ...current,
        ...patch,
        visibleItems: normalizeToolbarVisibleItems(
          patch.visibleItems ?? current.visibleItems,
        ),
      };
      setDoc((docCurrent) => ({
        ...docCurrent,
        metadata: { ...docCurrent.metadata, coreToolbar: next },
      }));
      return next;
    });
  }

  function activateSketchTool(ink: InkTool = toolbarState.inkTool) {
    setLaserActive(false);
    setTool("sketch");
    setInkTool(ink);
    patchToolbar({ inkTool: ink });
  }

  function addFormatsToPage(formatIds: CoreFormatId[], skipExisting = false) {
    if (formatIds.length === 0) return;
    let addedIds: string[] = [];
    setDoc((current) => {
      const extract = readStudyExtractFromUnknown(current.metadata?.chapterStudyExtract);
      const result = applyFilledFormatsToDocument(current, formatIds, extract, {
        skipExisting,
      });
      addedIds = result.addedIds;
      return {
        ...result.doc,
        metadata: {
          ...result.doc.metadata,
          recommendedFormats: recommendations,
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
    if (isStudyTemplateId(doc.metadata?.studyTemplateId) || pageHasFormatBlocks()) {
      if (isStudyTemplateId(doc.metadata?.studyTemplateId)) return null;
      return (
        <div data-page-typed className="relative z-[30] max-w-3xl px-1 pt-1">
          <RichTextEditor
            id="page-typed"
            text={doc.typed}
            html={doc.typedHtml}
            readOnly={
              toolbarState.readOnly ||
              tool === "sketch" ||
              tool === "annotate" ||
              tool === "textbox"
            }
            placeholder="Page notes (top)."
            className="min-h-[4rem] w-full min-w-0 px-1 py-1"
            style={{
              fontSize: doc.metadata?.fontSize ?? 15,
              fontFamily: doc.metadata?.fontFamily ?? "inherit",
            }}
            onChange={({ text, html }) =>
              setDoc((current) => ({ ...current, typed: text, typedHtml: html }))
            }
          />
        </div>
      );
    }

    if (tool === "annotate" && selectedMaterialId && selectedMaterial?.filePath) {
      return (
        <PdfInkViewer
          materialId={selectedMaterialId}
          courseId={courseId || null}
          focusTopic={
            courses.find((course) => course.id === courseId)?.focusTopic || null
          }
          active={tool === "annotate"}
          inkTool={inkTool}
          onInkToolChange={setInkTool}
          color={inkColor}
          onColorChange={setInkColor}
          lineWidth={inkSize}
          onLineWidthChange={setInkSize}
          pencilOnly={pencilOnly}
          onPencilOnlyChange={handlePencilOnlyChange}
          embedded
          pressureSensitivity={toolbarState.fountainPen.pressureSensitivity}
          tipFlatness={
            toolbarState.activePenMode === "chalk"
              ? 75
              : toolbarState.activePenMode === "crayon"
                ? 82
                : toolbarState.activePenMode === "colorPencil"
                  ? 40
                  : toolbarState.activePenMode === "marker"
                    ? 70
                    : toolbarState.fountainPen.tipFlatness
          }
          tipSharpness={
            toolbarState.activePenMode === "chalk"
              ? 45
              : toolbarState.activePenMode === "crayon"
                ? 35
                : toolbarState.activePenMode === "colorPencil"
                  ? 70
                  : toolbarState.activePenMode === "marker"
                    ? 40
                    : toolbarState.fountainPen.tipSharpness
          }
          strokeType={toolbarState.fountainPen.strokeType}
          reduceLatency={
            inkTool === "highlighter"
              ? toolbarState.highlighterReduceLatency
              : toolbarState.activePenMode === "pencil" ||
                  toolbarState.activePenMode === "colorPencil"
                ? toolbarState.pencilReduceLatency
                : toolbarState.penSettings.reduceLatency
          }
          inkMedium={penModeToInkMedium(toolbarState.activePenMode)}
          onLuckyOutcome={(target) => {
            setDoc((current) => ({
              ...current,
              metadata: {
                ...current.metadata,
                luckyOutcomeTarget: {
                  kind: target.kind ?? "quiz",
                  quizId: target.quizId,
                  topic: target.topic,
                  sourcePreview: target.sourcePreview,
                  createdAt: new Date().toISOString(),
                },
              },
            }));
            void saveNote({ refresh: false });
          }}
          onInkOcr={rememberInkOcr}
          onHistoryChange={setPdfInkBridge}
        />
      );
    }

    const pageFormat =
      activeFormat !== "BLANK" ? activeFormat : displayFormatFromStudyDoc(doc);

    if (
      pageFormat === "WHITEBOARD" ||
      pageFormat === "SKETCHNOTES" ||
      pageFormat === "SKETCH" ||
      method === "WHITEBOARD" ||
      (pageFormat === "BOXING" && tool === "sketch")
    ) {
      const canvas = doc.canvas ?? { viewport: { x: 0, y: 0, scale: 1 }, strokes: [], stickies: [], shapes: [] };
      return (
        <InfiniteCanvas
          data={canvas}
          onChange={(next) => setDoc((current) => ({ ...current, canvas: next }))}
          active={tool === "sketch" || pageFormat === "WHITEBOARD"}
          inkTool={inkTool}
          color={inkColor}
          lineWidth={inkSize}
          pencilOnly={pencilOnly}
          shapeKind={shapeKind}
          dark={coreDarkVisible}
        />
      );
    }

    if (pageFormat === "CORNELL_MIND") {
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

    if (pageFormat === "PROGRESSIVE") {
      return (
        <ProgressiveEditor
          steps={doc.progressive?.steps ?? []}
          onChange={(steps) => setDoc((current) => ({ ...current, progressive: { steps } }))}
        />
      );
    }

    if (pageFormat === "PROBLEM_SOLUTION") {
      return (
        <ProblemSolutionEditor
          items={doc.problemSolution?.items ?? []}
          onChange={(items) => setDoc((current) => ({ ...current, problemSolution: { items } }))}
        />
      );
    }

    if (pageFormat === "CONCEPT_DEFINITION") {
      return (
        <ConceptDefinitionEditor
          items={doc.concepts?.items ?? []}
          onChange={(items) => setDoc((current) => ({ ...current, concepts: { items } }))}
        />
      );
    }

    if (pageFormat === "TIMELINE") {
      return (
        <TimelineEditor
          events={doc.timeline?.events ?? []}
          onChange={(events) => setDoc((current) => ({ ...current, timeline: { events } }))}
        />
      );
    }

    if (pageFormat === "TWO_COLUMN" || pageFormat === "BOXING") {
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

    if (pageFormat === "HIERARCHY" || (pageFormat === "OUTLINE" && doc.outlineNodes?.length)) {
      return (
        <OutlineEditor
          nodes={doc.outlineNodes ?? []}
          onChange={(nodes) => setDoc((current) => ({ ...current, outlineNodes: nodes }))}
        />
      );
    }

    if (method === "MIND_MAP" || pageFormat === "MIND_MAP") {
      return (
        <MindMapEditor
          data={doc.mindMap ?? { nodes: [], edges: [] }}
          onChange={(mindMap) => setDoc((current) => ({ ...current, mindMap }))}
        />
      );
    }

    if (method === "FLOW" || pageFormat === "FLOW" || pageFormat === "PROCESS_FLOW") {
      return (
        <FlowDiagramEditor
          data={doc.flow ?? { nodes: [], edges: [] }}
          onChange={(flow) => setDoc((current) => ({ ...current, flow }))}
        />
      );
    }

    if (
      method === "CHARTING" ||
      pageFormat === "CHARTING" ||
      pageFormat === "COMPARISON_MATRIX"
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

    if (method === "CORNELL" || pageFormat === "CORNELL") {
      return renderCornellLayout();
    }

    return (
      <div data-page-typed className="relative z-[30] max-w-3xl px-1 pt-1">
        <RichTextEditor
          id="page-typed"
          text={doc.typed}
          html={doc.typedHtml}
          readOnly={
            toolbarState.readOnly ||
            tool === "sketch" ||
            tool === "annotate" ||
            tool === "textbox"
          }
          placeholder={
            pageFormat === "SENTENCE"
              ? "One fact per line — reorganize later"
              : method === "OUTLINE"
                ? "I. Main topic\n  A. Subtopic\n  B. Subtopic"
                : "Page notes (top). Click empty canvas to write anywhere."
          }
          className="min-h-[7rem] w-full rounded-xl border border-orange-100/80 bg-white/80 px-1 py-1"
          style={{
            fontSize: doc.metadata?.fontSize ?? 15,
            fontFamily: doc.metadata?.fontFamily ?? "inherit",
          }}
          onChange={({ text, html }) =>
            setDoc((current) => ({ ...current, typed: text, typedHtml: html }))
          }
        />
      </div>
    );
  }

  function renderCornellLayout() {
    const cornellReadOnly = toolbarState.readOnly;
    return (
      <div className="grid h-full min-h-[24rem] grid-cols-[1fr_12rem] grid-rows-[1fr_auto]">
        <RichTextEditor
          id="cornell-notes"
          text={doc.cornell?.notes ?? ""}
          html={doc.cornell?.notesHtml}
          readOnly={cornellReadOnly}
          placeholder="Main notes..."
          className="min-h-full"
          onChange={({ text, html }) =>
            setDoc((current) => ({
              ...current,
              cornell: {
                notes: text,
                cues: current.cornell?.cues ?? "",
                summary: current.cornell?.summary ?? "",
                notesHtml: html,
                cuesHtml: current.cornell?.cuesHtml,
                summaryHtml: current.cornell?.summaryHtml,
              },
            }))
          }
        />
        <RichTextEditor
          id="cornell-cues"
          text={doc.cornell?.cues ?? ""}
          html={doc.cornell?.cuesHtml}
          readOnly={cornellReadOnly}
          placeholder="Cues / questions"
          className="border-l border-orange-100 bg-orange-50/30"
          style={{ fontSize: 12 }}
          onChange={({ text, html }) =>
            setDoc((current) => ({
              ...current,
              cornell: {
                notes: current.cornell?.notes ?? "",
                cues: text,
                summary: current.cornell?.summary ?? "",
                notesHtml: current.cornell?.notesHtml,
                cuesHtml: html,
                summaryHtml: current.cornell?.summaryHtml,
              },
            }))
          }
        />
        <RichTextEditor
          id="cornell-summary"
          text={doc.cornell?.summary ?? ""}
          html={doc.cornell?.summaryHtml}
          readOnly={cornellReadOnly}
          placeholder="Summary"
          className="col-span-2 border-t border-orange-100 bg-teal-50/30"
          onChange={({ text, html }) =>
            setDoc((current) => ({
              ...current,
              cornell: {
                notes: current.cornell?.notes ?? "",
                cues: current.cornell?.cues ?? "",
                summary: text,
                notesHtml: current.cornell?.notesHtml,
                cuesHtml: current.cornell?.cuesHtml,
                summaryHtml: html,
              },
            }))
          }
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

  function applyPaperSurface(surface: PaperSurfaceId) {
    if (surface === "whiteboard") {
      void handleMethodChange("WHITEBOARD");
      setViewingCover(false);
      setTool("sketch");
      setInkTool("pen");
      patchToolbar({ inkTool: "pen" });
      return;
    }

    const leavingWhiteboard = method === "WHITEBOARD" || activeFormat === "WHITEBOARD";
    if (leavingWhiteboard) {
      setMethod("BLANK");
      setActiveFormat("BLANK");
    }

    if (surface === "chalkboard") {
      setDoc((current) => ({
        ...current,
        metadata: {
          ...current.metadata,
          activeFormat: leavingWhiteboard ? "BLANK" : current.metadata?.activeFormat,
        },
        notebook: {
          ...current.notebook,
          pageTemplateId: "blank",
          customBackgroundAssetId: null,
          pageBackgroundColor: CHALKBOARD_BACKGROUND,
        },
      }));
      setViewingCover(false);
      setTextPlaceMode(false);
      setTool("sketch");
      setInkTool("pen");
      setInkColor("#f8fafc");
      setInkSize(6);
      patchToolbar({ activePenMode: "chalk", inkTool: "pen" });
      void saveNote();
      return;
    }

    setDoc((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        activeFormat: leavingWhiteboard ? "BLANK" : current.metadata?.activeFormat,
      },
      notebook: {
        ...current.notebook,
        pageBackgroundColor:
          current.notebook?.pageBackgroundColor === CHALKBOARD_BACKGROUND
            ? "#fffdf9"
            : (current.notebook?.pageBackgroundColor ?? "#fffdf9"),
      },
    }));
    if (toolbarState.activePenMode === "chalk") {
      setInkColor("#1c1917");
      patchToolbar({ activePenMode: "fountain", inkTool: "pen" });
    }
    void saveNote();
  }

  async function createNoteWithSetup(config: NotebookSetupConfig) {
    const pendingChoice = pendingImportChoiceRef.current;
    const pendingMaterial = importPreview;

    const initialDoc: NoteDocument = {
      ...emptyDocument("sketch"),
      notebook: {
        coverId: config.coverId,
        // Preserve null so gradient/art presets apply (don't force solid orange).
        customCoverColor:
          config.customCoverColor === undefined
            ? null
            : config.customCoverColor,
        customCoverAssetId: config.customCoverAssetId ?? null,
        showCover: config.showCover === true,
        pageTemplateId: config.pageTemplateId,
        customBackgroundAssetId: config.customBackgroundAssetId,
        penPresetId: config.penPresetId,
        pageOrientation: config.pageOrientation ?? "portrait",
        pageBackgroundColor: config.pageBackgroundColor ?? "#fffdf9",
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
        courseId: courseId || pendingMaterial?.courseId || undefined,
        method: config.method,
        materialId: pendingMaterial?.id || undefined,
        contentJson: JSON.stringify(initialDoc),
      }),
    });
    const data = await response.json();
    if (data.success) {
      setSetupOpen(false);
      await refreshNotes();
      selectNote(data.data);
      setTool("sketch");
      setInkTool("pen");
      patchToolbar({ inkTool: "pen" });
      setViewingCover(false);
      if (config.mode === "whiteboard") {
        setMethod("WHITEBOARD");
        setActiveFormat("WHITEBOARD");
      }
      const preset = PEN_PRESETS.find((item) => item.id === config.penPresetId);
      if (preset) {
        setInkSize(preset.width);
        if (preset.id === "highlighter") setInkTool("highlighter");
      }

      if (pendingChoice && pendingMaterial) {
        setImportBusy(true);
        try {
          const result = await applyMaterialImportToActiveDoc(
            pendingChoice,
            pendingMaterial,
            {
              noteId: data.data.id as string,
              baseDoc: parseNoteDocument(data.data.contentJson),
              extract: pendingExtractRef.current,
              extractTitle: config.title,
            },
          );
          setImportFlashcardCount(result.flashcards || null);
          setImportPreview(null);
          pendingImportChoiceRef.current = null;
          pendingExtractRef.current = null;
          setSetupDefaults(undefined);
          setSetupSuggestionsSummary(undefined);
          setSetupVariant("full");
          clearImportQueryParams(data.data.id as string);
        } catch (error) {
          setImportError(friendlyAiImportError(error));
          setImportWizardOpen(true);
        } finally {
          setImportBusy(false);
        }
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
    openBlankNotebookSetup();
    void selectedMethod;
  }

  async function saveNote(options?: {
    refresh?: boolean;
    docOverride?: typeof doc;
  }) {
    if (!activeId) return;
    const saveId = ++saveGenRef.current;
    // Use docRef so setDoc(...); void saveNote() cannot persist a stale closure.
    // Do not ensureNotebookPages here — hydrate merge can resurrect cleared ink.
    const synced = prepareNoteDocumentForSave(
      options?.docOverride ?? docRef.current,
    );
    setSaving(true);
    setSaveError(null);
    setSaveConflict(false);
    const contentJsonPayload = JSON.stringify({
      ...synced,
      tool,
      pdfMaterialId: selectedMaterialId,
      metadata: {
        ...synced.metadata,
        activeFormat: synced.metadata?.activeFormat ?? activeFormat,
        recommendedFormats: recommendations,
      },
    });
    try {
      const payload = {
        title,
        method,
        content: synced.typed,
        contentJson: contentJsonPayload,
        materialId: selectedMaterialId,
        ...(noteServerUpdatedAtRef.current
          ? { expectedUpdatedAt: noteServerUpdatedAtRef.current }
          : {}),
      };
      const response = await fetch(`/api/notes/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!shouldApplySaveResult(saveId, saveGenRef.current)) return;
      if (response.ok) {
        const data = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { updatedAt?: string | Date };
        } | null;
        const nextUpdated = data?.data?.updatedAt;
        if (typeof nextUpdated === "string") {
          noteServerUpdatedAtRef.current = nextUpdated;
        } else if (nextUpdated instanceof Date) {
          noteServerUpdatedAtRef.current = nextUpdated.toISOString();
        }
        setLastSavedAt(new Date());
        setNoteDirty(false);
        setSaveError(null);
        setSaveConflict(false);
        clearLocalArtifactDraft(activeId);
      } else if (response.status === 409) {
        setSaveConflict(true);
        setSaveError(
          "Notebook was updated elsewhere. Reload the note, then Save again.",
        );
        writeLocalArtifactDraft({
          noteId: activeId,
          contentJson: contentJsonPayload,
          title,
          savedAt: new Date().toISOString(),
          serverUpdatedAt: noteServerUpdatedAtRef.current,
        });
      } else {
        setSaveError(
          "Could not save notebook. Your edits are still on screen — try Save again.",
        );
        writeLocalArtifactDraft({
          noteId: activeId,
          contentJson: contentJsonPayload,
          title,
          savedAt: new Date().toISOString(),
          serverUpdatedAt: noteServerUpdatedAtRef.current,
        });
      }
      if (options?.refresh !== false) {
        await refreshNotes({ quiet: notes.length > 0 });
      }
    } catch {
      if (shouldApplySaveResult(saveId, saveGenRef.current)) {
        setSaveError(
          "Could not save notebook. Your edits are still on screen — try Save again.",
        );
        writeLocalArtifactDraft({
          noteId: activeId,
          contentJson: contentJsonPayload,
          title,
          savedAt: new Date().toISOString(),
          serverUpdatedAt: noteServerUpdatedAtRef.current,
        });
      }
    } finally {
      if (shouldApplySaveResult(saveId, saveGenRef.current)) {
        setSaving(false);
      }
    }
  }

  /** Flush in-memory note before CORE → Adaptive so navigation cannot drop edits. */
  async function flushNoteBeforeAdaptive() {
    if (!activeId) return;
    await saveNote({ refresh: false });
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
  const layerVisibility = doc.notebook?.layerVisibility;
  function filterInkStrokes(
    strokes: import("@/lib/core/note-types").SketchStroke[] | undefined,
  ) {
    const list = strokes ?? [];
    return list.filter((stroke) => {
      if (stroke.tool === "highlighter") {
        return layerVisibility?.highlighter !== false;
      }
      return layerVisibility?.pen !== false;
    });
  }
  function mergeInkStrokes(
    all: import("@/lib/core/note-types").SketchStroke[] | undefined,
    visibleNext: import("@/lib/core/note-types").SketchStroke[],
  ) {
    const hidden = (all ?? []).filter((stroke) => {
      if (stroke.tool === "highlighter") {
        return layerVisibility?.highlighter === false;
      }
      return layerVisibility?.pen === false;
    });
    return [...hidden, ...visibleNext];
  }
  const customBackgroundUrl = doc.notebook?.customBackgroundAssetId
    ? `/api/customization/templates/${doc.notebook.customBackgroundAssetId}`
    : null;

  function getPageScrollport(): HTMLElement | null {
    return (
      (pageCanvasRef.current?.closest("[data-page-scrollport]") as HTMLElement | null) ?? null
    );
  }

  function getViewportInsertPoint(size = { w: 280, h: 140 }): { x: number; y: number } {
    const scrollport = getPageScrollport();
    if (!scrollport) return { x: 80, y: 120 };
    const x = scrollport.scrollLeft + Math.max(48, scrollport.clientWidth / 2 - size.w / 2);
    const y = scrollport.scrollTop + Math.max(48, scrollport.clientHeight / 2 - size.h / 2);
    return { x: Math.round(x), y: Math.round(y) };
  }

  /** Prefer last pointer on the page; fall back to viewport center. */
  function getInsertPoint(size = { w: 280, h: 140 }): { x: number; y: number } {
    const pointer = lastPointerLocalRef.current;
    if (pointer) {
      return {
        x: Math.max(0, Math.round(pointer.x - size.w / 2)),
        y: Math.max(0, Math.round(pointer.y - size.h / 2)),
      };
    }
    return getViewportInsertPoint(size);
  }

  function rememberPointerLocal(clientX: number, clientY: number) {
    if (!pageCanvasRef.current) return;
    lastPointerLocalRef.current = pointerToLocal(
      clientX,
      clientY,
      pageCanvasRef.current,
    );
  }

  function scrollPageToRect(rect: { x: number; y: number; w?: number; h?: number }) {
    const scrollport = getPageScrollport();
    if (!scrollport) return;
    const w = rect.w ?? 200;
    const h = rect.h ?? 160;
    const pad = 48;
    let nextLeft = scrollport.scrollLeft;
    let nextTop = scrollport.scrollTop;
    if (rect.x - pad < scrollport.scrollLeft) nextLeft = rect.x - pad;
    if (rect.x + w + pad > scrollport.scrollLeft + scrollport.clientWidth) {
      nextLeft = rect.x + w + pad - scrollport.clientWidth;
    }
    if (rect.y - pad < scrollport.scrollTop) nextTop = rect.y - pad;
    if (rect.y + h + pad > scrollport.scrollTop + scrollport.clientHeight) {
      nextTop = rect.y + h + pad - scrollport.clientHeight;
    }
    scrollport.scrollTo({
      left: Math.max(0, nextLeft),
      top: Math.max(0, nextTop),
      behavior: "smooth",
    });
  }

  function addTextBoxAt(
    x: number,
    y: number,
    options?: { scrollToTop?: boolean },
  ) {
    const box = createTextBox(Math.max(0, Math.round(x)), Math.max(0, Math.round(y)));
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
    setFocusTextBoxId(box.id);
    setTool("type");
    setTextPlaceMode(false);
    setLaserActive(false);
    requestAnimationFrame(() => {
      if (options?.scrollToTop) {
        getPageScrollport()?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } else {
        scrollPageToRect({ x: box.x, y: box.y, w: box.width, h: box.height });
      }
    });
  }

  function addTextBox() {
    const point = getInsertPoint({ w: 280, h: 140 });
    addTextBoxAt(point.x, point.y);
  }

  function beginTextPlaceMode() {
    setLaserActive(false);
    setTool("type");
    setInkTool("pen");
    patchToolbar({ inkTool: "pen" });
    setTextPlaceMode(true);
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
    // Paper surfaces shouldn't force a format-conversion dialog — only layouts do.
    if (template?.noteMethod && template.kind === "layout") {
      void handleMethodChange(template.noteMethod as NoteMethod);
    } else if (template?.noteMethod) {
      const nextMethod = template.noteMethod as NoteMethod;
      setMethod(nextMethod);
      const nextFormat = CORE_FORMAT_BY_METHOD[nextMethod] ?? resolveActiveFormat(doc, nextMethod);
      setActiveFormat(nextFormat);
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

  function insertPageImage(assetId: string, at?: { x: number; y: number }) {
    // Panel taps don't update lastPointer on the page — place in the visible viewport.
    const point =
      at ??
      (sidePanel
        ? getViewportInsertPoint({ w: 220, h: 220 })
        : getInsertPoint({ w: 220, h: 220 }));
    const image = createPageImage(assetId, point.x, point.y);
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      // Always stack pasted/imported images above existing page content.
      image.zIndex = Math.max(nextCanvasElementZIndex(synced), CANVAS_ELEMENT_BASE_Z + 50);
      const pageData = extractPageData(synced);
      return applyPageData(synced, {
        ...pageData,
        pageImages: [...pageData.pageImages, image],
      });
    });
    setSelectedCanvasElementIds([image.id]);
    setTool("type");
    setTextPlaceMode(false);
    // Close Inserts so the sticker is visible and the page can receive finger writing.
    clearSidePanel();
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/core/go/")
    ) {
      window.history.replaceState(null, "", "/core");
    }
    requestAnimationFrame(() =>
      scrollPageToRect({
        x: image.x,
        y: image.y,
        w: image.width,
        h: image.height ?? image.width,
      }),
    );
  }

  async function uploadAndInsertImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const form = new FormData();
    form.append("file", file);
    form.append("name", file.name.replace(/\.[^.]+$/, "") || "Pasted image");
    form.append("kind", "element");
    const res = await fetch("/api/customization/templates", { method: "POST", body: form });
    if (!res.ok) return;
    const created = (await res.json()) as { id: string };
    insertPageImage(created.id);
  }

  function insertElement(element: ElementDefinition) {
    recordRecentElement(element.id);
    const size = {
      w: element.defaultSize?.w ?? 160,
      h: element.defaultSize?.h ?? 120,
    };
    const point = sidePanel
      ? getViewportInsertPoint(size)
      : getInsertPoint(size);
    let insertedId = "";
    let insertedRect = { x: point.x, y: point.y, w: 160, h: 120 };
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const result = insertElementDefinition(synced, element, point);
      insertedId = result.insertedId;
      const image = result.doc.pageImages?.find((item) => item.id === insertedId);
      const decoration = result.doc.decorations?.find((item) => item.id === insertedId);
      if (image) {
        insertedRect = {
          x: image.x,
          y: image.y,
          w: image.width,
          h: image.height ?? image.width,
        };
      } else if (decoration) {
        insertedRect = {
          x: decoration.x,
          y: decoration.y,
          w: decoration.w,
          h: decoration.h,
        };
      }
      return applyPageData(synced, extractPageData(result.doc));
    });
    setSelectedCanvasElementIds([insertedId]);
    setTool("type");
    clearSidePanel();
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/core/go/")
    ) {
      window.history.replaceState(null, "", "/core");
    }
    requestAnimationFrame(() => scrollPageToRect(insertedRect));
  }

  function addDecoration(kind: Parameters<typeof createDecoration>[0]) {
    const point = getInsertPoint({ w: 180, h: 160 });
    const decoration = createDecoration(kind, point.x, point.y, inkColor);
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
    requestAnimationFrame(() =>
      scrollPageToRect({
        x: decoration.x,
        y: decoration.y,
        w: decoration.w,
        h: decoration.h,
      }),
    );
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
    !laserActive &&
    (tool === "sketch" || tool === "annotate") &&
    (inkTool === "pen" ||
      inkTool === "highlighter" ||
      inkTool === "eraser" ||
      inkTool === "lasso");

  const shapeDrawActive =
    !toolbarState.readOnly && tool === "sketch" && inkTool === "shape";

  function handleLassoComplete(lasso: SketchPoint[]) {
    const settings = toolbarState.lasso;
    const pageStrokes = tool === "annotate" ? doc.annotations ?? [] : doc.strokes ?? [];
    const strokeIds = settings.selectHandwriting
      ? selectStrokesInLasso(pageStrokes, lasso).map(
          (stroke, index) => stroke.id ?? `s${pageStrokes.indexOf(stroke) ?? index}`,
        )
      : [];
    const elementIds: string[] = [];

    if (settings.selectImages) {
      for (const image of doc.pageImages ?? []) {
        if (
          elementIntersectsLasso(
            { x: image.x, y: image.y, w: image.width, h: image.height ?? image.width },
            lasso,
          )
        ) {
          elementIds.push(image.id);
        }
      }
    }

    if (settings.selectStickyNotes || settings.selectShapes) {
      for (const decoration of doc.decorations ?? []) {
        const isSticky = decoration.kind === "sticky";
        const isShape = !isSticky;
        if ((isSticky && settings.selectStickyNotes) || (isShape && settings.selectShapes)) {
          if (elementIntersectsLasso({ x: decoration.x, y: decoration.y, w: decoration.w, h: decoration.h }, lasso)) {
            elementIds.push(decoration.id);
          }
        }
      }
    }

    if (settings.selectTextBoxes) {
      for (const box of doc.pageTextBoxes ?? []) {
        if (
          elementIntersectsLasso(
            { x: box.x, y: box.y, w: box.width, h: box.height },
            lasso,
          )
        ) {
          elementIds.push(box.id);
        }
      }
    }

    setSelectedStrokeIds(strokeIds);
    setSelectedCanvasElementIds(elementIds);
    setTool("sketch");
    setInkTool("pen");
    patchToolbar({ inkTool: "pen" });
  }

  function shouldRenderSketchLayer() {
    if (!shouldShowSketchOverlay()) return false;
    const strokes =
      tool === "annotate" ? doc.annotations ?? [] : doc.strokes ?? [];
    // Always paint existing ink — even in type mode — so open notebooks are not blank.
    if (strokes.length > 0) return true;
    if ((sketchInk.strokes?.length ?? 0) > 0 && tool !== "annotate") return true;
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

  useEffect(() => {
    if (!selectedCanvasElementId) return;
    if (selectedTextBox) {
      scrollPageToRect({
        x: selectedTextBox.x,
        y: selectedTextBox.y,
        w: selectedTextBox.width,
        h: selectedTextBox.height,
      });
      return;
    }
    if (selectedDecoration) {
      scrollPageToRect({
        x: selectedDecoration.x,
        y: selectedDecoration.y,
        w: selectedDecoration.w,
        h: selectedDecoration.h,
      });
      return;
    }
    if (selectedImage) {
      scrollPageToRect({
        x: selectedImage.x,
        y: selectedImage.y,
        w: selectedImage.width,
        h: selectedImage.height ?? selectedImage.width,
      });
    }
    // Intentionally only when selection id changes — not on every drag frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCanvasElementId]);

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
    setCanvasClipboardReady(canvasClipboardRef.current.length > 0);
  }

  function handleCanvasCut() {
    if (selectedCanvasElementIds.length === 0 || toolbarState.readOnly) return;
    handleCanvasCopy();
    handleCanvasDelete();
  }

  function handleCanvasSelectAll() {
    const ids = [
      ...(doc.pageImages ?? []).map((item) => item.id),
      ...(doc.decorations ?? []).map((item) => item.id),
      ...(doc.pageTextBoxes ?? []).map((item) => item.id),
    ];
    setSelectedCanvasElementIds(ids);
    setTool("type");
    setTextPlaceMode(false);
  }

  function handleCanvasPaste() {
    const items = canvasClipboardRef.current;
    if (items.length === 0) return;
    const point = getInsertPoint({ w: 200, h: 160 });
    const pasted = rebaseClipboardItemsToPoint(clipboardToDocumentItems(items, 0), point);
    let pastedIds: string[] = [];
    let pasteBounds = { x: point.x, y: point.y, w: 200, h: 160 };
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const pageData = extractPageData(synced);
      const total =
        pasted.decorations.length + pasted.images.length + pasted.textBoxes.length;
      const zBase = Math.max(nextCanvasElementZIndex(synced), CANVAS_ELEMENT_BASE_Z + 50);
      const zIndexes = Array.from({ length: total }, (_, index) => zBase + index);
      let zCursor = 0;
      const decorations = pasted.decorations.map((item) => ({
        ...item,
        locked: false,
        zIndex: zIndexes[zCursor++],
      }));
      const images = pasted.images.map((item) => ({
        ...item,
        locked: false,
        zIndex: zIndexes[zCursor++],
      }));
      const textBoxes = pasted.textBoxes.map((item) => ({
        ...item,
        locked: false,
        zIndex: zIndexes[zCursor++],
      }));
      pastedIds = [
        ...decorations.map((item) => item.id),
        ...images.map((item) => item.id),
        ...textBoxes.map((item) => item.id),
      ];
      if (pastedIds.length > 0) {
        const maxX = Math.max(
          ...decorations.map((item) => item.x + item.w),
          ...images.map((item) => item.x + item.width),
          ...textBoxes.map((item) => item.x + item.width),
          point.x,
        );
        const maxY = Math.max(
          ...decorations.map((item) => item.y + item.h),
          ...images.map((item) => item.y + (item.height ?? item.width)),
          ...textBoxes.map((item) => item.y + item.height),
          point.y,
        );
        pasteBounds = {
          x: point.x,
          y: point.y,
          w: Math.max(80, maxX - point.x),
          h: Math.max(80, maxY - point.y),
        };
      }
      return applyPageData(synced, {
        ...pageData,
        decorations: [...pageData.decorations, ...decorations],
        pageImages: [...pageData.pageImages, ...images],
        pageTextBoxes: [...pageData.pageTextBoxes, ...textBoxes],
      });
    });
    setSelectedCanvasElementIds(pastedIds);
    setTool("type");
    requestAnimationFrame(() => scrollPageToRect(pasteBounds));
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

  function handleCanvasBringToFront() {
    if (selectedCanvasElementIds.length === 0) return;
    const idSet = new Set(selectedCanvasElementIds);
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      let z = maxCanvasElementZIndex(synced) + 1;
      const bump = <T extends { id: string; zIndex?: number }>(items: T[] | undefined) =>
        (items ?? []).map((item) => (idSet.has(item.id) ? { ...item, zIndex: z++ } : item));
      return {
        ...synced,
        decorations: bump(synced.decorations),
        pageImages: bump(synced.pageImages),
        pageTextBoxes: bump(synced.pageTextBoxes),
        metadata: {
          ...synced.metadata,
          compositeSections: bump(synced.metadata?.compositeSections),
        },
      };
    });
  }

  function handleCanvasSendToBack() {
    if (selectedCanvasElementIds.length === 0) return;
    const idSet = new Set(selectedCanvasElementIds);
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      let z = 1;
      const bump = <T extends { id: string; zIndex?: number }>(items: T[] | undefined) =>
        (items ?? []).map((item) => (idSet.has(item.id) ? { ...item, zIndex: z++ } : item));
      const decorations = bump(synced.decorations);
      const pageImages = bump(synced.pageImages);
      const pageTextBoxes = bump(synced.pageTextBoxes);
      const compositeSections = bump(synced.metadata?.compositeSections);
      // Lift everything else above the sent-back selection.
      const maxBack = Math.max(
        CANVAS_ELEMENT_BASE_Z,
        ...decorations.filter((item) => idSet.has(item.id)).map((item) => item.zIndex ?? 1),
        ...pageImages.filter((item) => idSet.has(item.id)).map((item) => item.zIndex ?? 1),
        ...pageTextBoxes.filter((item) => idSet.has(item.id)).map((item) => item.zIndex ?? 1),
        ...(compositeSections ?? [])
          .filter((item) => idSet.has(item.id))
          .map((item) => item.zIndex ?? 1),
      );
      const lift = <T extends { id: string; zIndex?: number }>(items: T[]) =>
        items.map((item) =>
          idSet.has(item.id)
            ? item
            : { ...item, zIndex: Math.max(item.zIndex ?? CANVAS_ELEMENT_BASE_Z, maxBack + 1) },
        );
      return {
        ...synced,
        decorations: lift(decorations),
        pageImages: lift(pageImages),
        pageTextBoxes: lift(pageTextBoxes),
        metadata: {
          ...synced.metadata,
          compositeSections: compositeSections ? lift(compositeSections) : compositeSections,
        },
      };
    });
  }

  function handleCanvasBringForward() {
    if (selectedCanvasElementIds.length === 0) return;
    const idSet = new Set(selectedCanvasElementIds);
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const bump = <T extends { id: string; zIndex?: number }>(items: T[] | undefined) =>
        (items ?? []).map((item) =>
          idSet.has(item.id)
            ? { ...item, zIndex: (item.zIndex ?? CANVAS_ELEMENT_BASE_Z) + 1 }
            : item,
        );
      return {
        ...synced,
        decorations: bump(synced.decorations),
        pageImages: bump(synced.pageImages),
        pageTextBoxes: bump(synced.pageTextBoxes),
        metadata: {
          ...synced.metadata,
          compositeSections: bump(synced.metadata?.compositeSections),
        },
      };
    });
  }

  function handleCanvasSendBackward() {
    if (selectedCanvasElementIds.length === 0) return;
    const idSet = new Set(selectedCanvasElementIds);
    setDoc((current) => {
      const synced = syncCurrentPage(current);
      const bump = <T extends { id: string; zIndex?: number }>(items: T[] | undefined) =>
        (items ?? []).map((item) =>
          idSet.has(item.id)
            ? { ...item, zIndex: Math.max(1, (item.zIndex ?? CANVAS_ELEMENT_BASE_Z) - 1) }
            : item,
        );
      return {
        ...synced,
        decorations: bump(synced.decorations),
        pageImages: bump(synced.pageImages),
        pageTextBoxes: bump(synced.pageTextBoxes),
        metadata: {
          ...synced.metadata,
          compositeSections: bump(synced.metadata?.compositeSections),
        },
      };
    });
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setNoteDirty(true);

    const timer = window.setTimeout(() => {
      void saveNote({ refresh: false });
    }, 900);

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

      if (event.key === "Escape") {
        if (contextMenu) {
          event.preventDefault();
          setContextMenu(null);
          return;
        }
        if (textPlaceMode) {
          event.preventDefault();
          setTextPlaceMode(false);
          return;
        }
      }

      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redoCore();
        } else {
          undoCore();
        }
        return;
      }
      if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoCore();
        return;
      }
      if (mod && event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleCanvasSelectAll();
        return;
      }
      if (mod && event.key.toLowerCase() === "c") {
        event.preventDefault();
        handleCanvasCopy();
      }
      if (mod && event.key.toLowerCase() === "x") {
        event.preventDefault();
        handleCanvasCut();
      }
      // Ctrl/Cmd+V is handled by the paste event so OS clipboard images work.
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
  }, [
    activeId,
    toolbarState.readOnly,
    selectedCanvasElementIds,
    doc,
    textPlaceMode,
    contextMenu,
    canUndoDoc,
    canRedoDoc,
    sketchInk,
  ]);

  function undoCore() {
    if (tool === "annotate" && selectedMaterial?.filePath && pdfInkBridge?.canUndo) {
      pdfInkBridge.undo();
      return;
    }
    if (sketchInk.canUndo) {
      sketchInk.undo();
      return;
    }
    undoDoc();
  }

  function redoCore() {
    if (tool === "annotate" && selectedMaterial?.filePath && pdfInkBridge?.canRedo) {
      pdfInkBridge.redo();
      return;
    }
    if (sketchInk.canRedo) {
      sketchInk.redo();
      return;
    }
    redoDoc();
  }

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
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

      const dataItems = event.clipboardData?.items;
      if (dataItems) {
        for (const item of dataItems) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              void uploadAndInsertImageFile(file);
              return;
            }
          }
        }
      }

      if (canvasClipboardRef.current.length > 0) {
        event.preventDefault();
        handleCanvasPaste();
      }
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [activeId, toolbarState.readOnly]);

  const notebookPages = getNotebookPages(doc);
  const activePageRecord =
    notebookPages.pages.find((p) => p.id === notebookPages.activePageId) ??
    notebookPages.pages[0];
  const pageNumber = activePageRecord?.pageNumber ?? 1;
  const immersiveWriting = tool === "sketch" || tool === "annotate";

  const selectedMaterial = materials.find((item) => item.id === selectedMaterialId);

  const notebookHasStudyContent = useMemo(() => {
    if (readStudyExtractFromUnknown(doc.metadata?.chapterStudyExtract)) return true;
    const text = readAllNotebookSheetsText(doc) || readNotebookSourceText(doc);
    if (text.trim().length >= 80) return true;
    if (selectedMaterial?.extractedText?.trim()) return true;
    const notebookStrokes = doc.strokes?.length ?? 0;
    const pdfStrokes = pdfInkBridge?.strokeCount ?? doc.annotations?.length ?? 0;
    const inkStrokes = tool === "annotate" ? pdfStrokes : notebookStrokes;
    return inkStrokes >= 6;
  }, [doc, tool, selectedMaterial, pdfInkBridge?.strokeCount]);

  useEffect(() => {
    if (tool !== "sketch") return;
    const serialized = JSON.stringify(sketchInk.strokes);
    if (serialized === lastDocStrokesRef.current) return;
    lastDocStrokesRef.current = serialized;
    setDoc((current) => ({ ...current, strokes: sketchInk.strokes }), { history: false });
  }, [sketchInk.strokes, tool, setDoc]);

  useEffect(() => {
    const next = doc.strokes ?? [];
    const serialized = JSON.stringify(next);
    if (serialized === lastDocStrokesRef.current) return;
    const pageId = doc.metadata?.notebookPages?.activePageId ?? "";
    const gateKey = `${activeId ?? ""}:${pageId}`;
    // Same note+page: ignore empty doc mirrors that race ahead of hydrate.
    // Page/note changes always accept the new strokes (including empty pages).
    if (
      next.length === 0 &&
      (sketchInk.strokes?.length ?? 0) > 0 &&
      strokePageGateRef.current === gateKey
    ) {
      return;
    }
    strokePageGateRef.current = gateKey;
    lastDocStrokesRef.current = serialized;
    sketchInk.replaceStrokes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.strokes, activeId, doc.metadata?.notebookPages?.activePageId]);

  function applyStudioOutput(payload: {
    title: string;
    text: string;
    type: CoreStudioType;
    structured?: Record<string, unknown>;
    pageId?: string;
    loopOutcome?: import("@/lib/core/note-types").NoteDocumentMetadata["luckyOutcomeTarget"];
  }) {
    setTitle(payload.title);

    if (payload.type === "faq" || payload.type === "flashcards") {
      if (courseId) {
        void saveGeneratedToLocker({
          courseId,
          title: payload.title,
          text: payload.text,
        })
          .then((saved) => {
            if (saved) {
              setMaterials((current) => {
                if (current.some((item) => item.id === saved.id)) return current;
                return [
                  {
                    id: saved.id,
                    title: saved.title,
                    type: "DOCUMENT",
                    extractedText: payload.text,
                    filePath: null,
                  },
                  ...current,
                ];
              });
            }
          })
          .catch(() => {});
      }
      if (payload.type === "flashcards" && courseId) {
        const structured = payload.structured as {
          cards?: Array<{ front?: string; back?: string }>;
        };
        const pairs = (structured?.cards ?? []).map((card) => ({
          question: String(card.front ?? "").trim(),
          answer: String(card.back ?? "").trim(),
        }));
        if (pairs.length > 0) {
          void importExtractQaToFlashcards({
            courseId,
            materialId: selectedMaterialId,
            deckTitle: payload.title,
            pairs,
          })
            .then((count) => {
              if (count > 0) setImportFlashcardCount(count);
            })
            .catch(() => {});
        }
      }
      if (payload.type === "faq" && courseId) {
        const structured = payload.structured as {
          pairs?: Array<{ question?: string; answer?: string }>;
        };
        const pairs = (structured?.pairs ?? []).map((item) => ({
          question: String(item.question ?? "").trim(),
          answer: String(item.answer ?? "").trim(),
        }));
        if (pairs.length > 0) {
          void importExtractQaToFlashcards({
            courseId,
            materialId: selectedMaterialId,
            deckTitle: `${payload.title} · FAQ`,
            pairs,
          }).catch(() => {});
        }
      }
      return;
    }

    if (payload.type === "timeline") {
      setDoc((current) =>
        applyStudioStructuredToDocument(current, "timeline", payload.structured, {
          pageId: payload.pageId,
        }),
      );
      setMethod("BLANK");
      setActiveFormat("BLANK");
      setTool("type");
      void saveNote({ refresh: false });
      return;
    }

    if (payload.type === "chapter-study" || payload.type === "study-guide") {
      const extract = normalizeChapterStudyExtract(payload.structured ?? {});
      void (async () => {
        const adaptiveRecommendations = await fetchAdaptiveStudyRecommendations({
          courseId,
          materialId: selectedMaterialId,
          extract,
        });
        setDoc((current) => {
          const next = applyAiExtractToDocument(current, extract, {
            pageId: payload.pageId,
            adaptiveRecommendations,
          });
          if (payload.loopOutcome) {
            next.metadata = {
              ...next.metadata,
              luckyOutcomeTarget: payload.loopOutcome,
            };
          }
          const studyFormat = displayFormatFromStudyDoc(next);
          setMethod(methodForStudyFormat(studyFormat));
          setActiveFormat(studyFormat);
          return next;
        });
        void saveNote({ refresh: false });
        setRecommendations(
          adaptiveRecommendations ??
            extract.recommendedFormats.map((formatId) => ({
              formatId,
              confidence: 0.9,
              reason: "Suggested for this chapter extract",
              aiSuggested: true,
            })),
        );
      })();
      if (courseId) {
        if (extract.testYourself.length > 0) {
          void importExtractQaToFlashcards({
            courseId,
            materialId: selectedMaterialId,
            deckTitle: `${extract.title} · Q&A`,
            pairs: extract.testYourself,
          })
            .then((count) => {
              if (count > 0) setImportFlashcardCount(count);
            })
            .catch(() => {});
        }
        void importExtractQuiz({
          courseId,
          materialId: selectedMaterialId,
          extract,
        })
          .then((quizId) => {
            if (!quizId) return;
            setImportQuizId(quizId);
            if (payload.loopOutcome) {
              setDoc((current) => ({
                ...current,
                metadata: {
                  ...current.metadata,
                  luckyOutcomeTarget: {
                    ...payload.loopOutcome,
                    kind: "pack" as const,
                    quizId,
                  },
                },
              }));
              void saveNote({ refresh: false });
            }
          })
          .catch(() => {});
      }
      setTool("type");
      return;
    }

    if (payload.pageId) {
      setDoc((current) => switchNotebookPage(current, payload.pageId!));
    }
    setMethod("BLANK");
    setActiveFormat("BLANK");
    setDoc((current) => ({ ...current, typed: payload.text }));
    setTool("type");
  }

  function applyExtractLayout(
    apply: (current: NoteDocument, extract: NonNullable<ReturnType<typeof readStudyExtractFromUnknown>>) => NoteDocument,
  ) {
    const extract = readStudyExtractFromUnknown(doc.metadata?.chapterStudyExtract);
    if (!extract) return false;
    setDoc((current) => apply(current, extract));
    setMethod("BLANK");
    setActiveFormat("BLANK");
    setTool("type");
    void saveNote({ refresh: false });
    return true;
  }

  function insertPracticeFromExtract() {
    return applyExtractLayout(applyPracticeQuestionsToDocument);
  }

  function insertLearningPlanFromExtract() {
    return applyExtractLayout(applyLearningPlanToDocument);
  }

  function insertExplanationsFromExtract() {
    return applyExtractLayout(applyExplanationsToDocument);
  }

  function rememberInkOcr(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 8) return;
    const next = {
      ...doc,
      metadata: {
        ...doc.metadata,
        lastInkOcr: {
          text: trimmed.slice(0, 8000),
          updatedAt: new Date().toISOString(),
        },
      },
    };
    setDoc(next, { history: false });
    void saveNote({ refresh: false, docOverride: next });
  }

  async function openSelectionLoop(kind: "six" | "blurt") {
    if (!courseId) return;
    const courseFocus =
      courses.find((course) => course.id === courseId)?.focusTopic?.trim() || null;
    let studyText = selectionSourceText(
      [...selectedCanvasElementIds, ...selectedStrokeIds],
      doc,
      { includePackForInk: selectedStrokeIds.length > 0 },
    );
    if (selectedStrokeIds.length > 0 && studyText.length < 80) {
      const inkText = await ocrPageInkText();
      if (inkText) {
        studyText = [inkText, studyText].filter(Boolean).join("\n\n");
        rememberInkOcr(inkText);
      }
    }
    const topic = selectionStudyTopic(
      studyText,
      courseFocus || title || "this page",
    );
    router.push(
      kind === "six"
        ? sixChunkingHref(courseId, topic, selectedMaterialId)
        : blurtingHref(courseId, selectedMaterialId, topic),
    );
  }

  async function generateQuizFromExtract(options?: { fromSelection?: boolean }) {
    if (!courseId) {
      throw new Error("Select a course in the Core header, then tap Quiz.");
    }
    const extract = readStudyExtractFromUnknown(doc.metadata?.chapterStudyExtract);
    const selectedText = options?.fromSelection
      ? selectionSourceText([...selectedCanvasElementIds, ...selectedStrokeIds], doc, {
          includePackForInk: selectedStrokeIds.length > 0,
        })
      : "";
    let studyText = selectedText;
    // Ink-only selection: OCR handwriting so Lucky/Six use what was written.
    if (
      options?.fromSelection &&
      selectedStrokeIds.length > 0 &&
      studyText.length < 80
    ) {
      const inkText = await ocrPageInkText();
      if (inkText) {
        studyText = [inkText, studyText].filter(Boolean).join("\n\n");
        rememberInkOcr(inkText);
      }
    }
    const sourceText =
      (studyText && studyText.length >= 40 ? studyText : null) ||
      readAllNotebookSheetsText(doc) ||
      readNotebookSourceText(doc) ||
      undefined;
    const courseFocus =
      courses.find((course) => course.id === courseId)?.focusTopic?.trim() || null;
    const selectionTopic = selectionStudyTopic(studyText, courseFocus || title);
    const response = await fetch("/api/quizzes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        materialId: selectedMaterialId || undefined,
        questionCount: studyText && studyText.length >= 40 ? 12 : 30,
        extract: studyText && studyText.length >= 40 ? undefined : extract ?? undefined,
        sourceText: sourceText || undefined,
        topicName:
          studyText && studyText.length >= 40
            ? selectionTopic
            : courseFocus || undefined,
      }),
    });
    let data: { success?: boolean; error?: string; data?: { id?: string } };
    try {
      data = (await response.json()) as { success?: boolean; error?: string; data?: { id?: string } };
    } catch {
      throw new Error(
        "Could not build a quiz from this material. Make sure a course is selected and the notebook has text.",
      );
    }
    if (!data.success) {
      throw new Error(
        data.error && data.error.length < 180 && !/public class|System\.out|Unexpected token/i.test(data.error)
          ? data.error
          : "Could not build a quiz from this material. Try again after Study all sheets.",
      );
    }
    const quizId = data.data?.id as string | undefined;
    if (studyText && studyText.length >= 40) {
      setDoc((current) => ({
        ...current,
        metadata: {
          ...current.metadata,
          luckyOutcomeTarget: {
            kind: "quiz" as const,
            quizId,
            topic: selectionTopic,
            sourcePreview: studyText.slice(0, 240),
            createdAt: new Date().toISOString(),
          },
        },
      }));
      void saveNote({ refresh: false });
    }
    if (quizId) {
      setImportQuizId(quizId);
      router.push(`/quizzes/${quizId}`);
    } else {
      router.push(`/study/lucky?courseId=${courseId}`);
    }
  }

  async function studyFromCurrentSource(
    targetPageId?: string,
    topicOverride?: string,
  ) {
    const useAllSheets = !targetPageId || targetPageId === ALL_SHEETS_TARGET;
    let sourceText = useAllSheets
      ? readAllNotebookSheetsText(doc) || readNotebookSourceText(doc)
      : readNotebookPageSourceText(doc, targetPageId) || readNotebookSourceText(doc);
    let fromInk = false;
    // Mid-session ink: OCR handwriting so Study packs use what was written (not only typed).
    if (!sourceText.trim()) {
      const inkStrokeCount =
        (doc.strokes?.length ?? 0) +
        (doc.annotations?.length ?? 0) +
        (doc.canvas?.strokes?.length ?? 0);
      if (inkStrokeCount >= 4 || notebookHasStudyContent) {
        const inkText = await ocrPageInkText();
        if (inkText?.trim()) {
          sourceText = inkText.trim();
          fromInk = true;
          rememberInkOcr(inkText);
        }
      }
    }
    const focusTopic = topicOverride?.trim() || studioTopic.trim() || undefined;
    // Cold start: prefer syllabus / plan material when the notebook is empty.
    const coldStartMaterialId =
      selectedMaterialId ||
      (!sourceText.trim()
        ? materials.find((item) => item.type === "SYLLABUS")?.id ||
          materials.find((item) => /learning plan|syllabus/i.test(item.title))?.id ||
          null
        : null);
    if (!sourceText && !coldStartMaterialId && !courseId) {
      throw new Error(
        "Paste material, pick a class with topics, or select a material — then Study chapter.",
      );
    }
    if (coldStartMaterialId && coldStartMaterialId !== selectedMaterialId) {
      setSelectedMaterialId(coldStartMaterialId);
    }
    const response = await fetch("/api/core/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        type: "chapter-study",
        courseId: courseId || undefined,
        materialId: coldStartMaterialId || undefined,
        topic: focusTopic,
        sourceText: sourceText || undefined,
      }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error ?? "Study guide generation failed.");
    const packMeta = data.data as {
      coldStart?: boolean;
      deterministic?: boolean;
      topicCount?: number;
      title?: string;
    };
    const sourcePreview = fromInk
      ? "Study pack from your handwriting (OCR) — chunk in Six, then Lucky."
      : packMeta.deterministic
      ? `Instant study pack from ${packMeta.topicCount ?? "your"} LMS/syllabus topics — chunk in Six, then Lucky.`
      : packMeta.coldStart
        ? "AI study pack from course topics (Gemini → Groq → OpenRouter) — chunk in Six, then Lucky."
        : "Study pack from your chapter — chunk in Six, then Lucky.";
    applyStudioOutput({
      title: data.data.title,
      text: data.data.noteText,
      type: "chapter-study",
      structured: data.data.structured,
      pageId: useAllSheets ? undefined : targetPageId,
      loopOutcome:
        courseId && (focusTopic || packMeta.coldStart || fromInk)
          ? {
              kind: "pack" as const,
              topic: focusTopic || packMeta.title || "your notes",
              sourcePreview,
              createdAt: new Date().toISOString(),
            }
          : undefined,
    });
  }

  async function handleNotebookAction(
    ctx: import("@/lib/core/notebook-action-context").CoreNotebookActionContext,
  ) {
    const intent = ctx.coreStudyIntent;
    // Ephemeral WHY metadata — does not alter notebook generation.
    void ctx.learningIntent;
    if (!intent) return;
    if (intent === "study-guide") {
      await studyFromCurrentSource();
      return "Laid this out as editable Core study blocks. Your source page is unchanged.";
    }
    if (intent === "practice") {
      if (!insertPracticeFromExtract()) {
        throw new Error("Create a study guide first so practice questions have something to use.");
      }
      return "Added practice questions as an editable Q&A block.";
    }
    if (intent === "learning-plan") {
      if (!insertLearningPlanFromExtract()) {
        throw new Error("Create a study guide first so the learning plan can use the same extract.");
      }
      return "Added a learning plan as an editable Core sequence.";
    }
    if (intent === "explain") {
      if (!insertExplanationsFromExtract()) {
        throw new Error("Create a study guide first so explanations can use the same extract.");
      }
      return "Added explanations as editable Core objects.";
    }
    if (intent === "quiz") {
      if (!courseId) {
        throw new Error("Select a course to generate a Lucky quiz from this extract.");
      }
      await generateQuizFromExtract();
      return "Generated a quiz from this chapter extract.";
    }
    if (intent === "flashcards") {
      const sourceText = readNotebookSourceText(doc);
      const response = await fetch("/api/core/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "flashcards",
          courseId: courseId || undefined,
          materialId: selectedMaterialId || undefined,
          topic: studioTopic,
          sourceText: sourceText || undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Flashcard generation failed.");
      applyStudioOutput({
        title: data.data.title,
        text: data.data.noteText,
        type: "flashcards",
        structured: data.data.structured,
      });
      return "Added flashcards as an editable Q&A block. Use Assist Studio to also send them to Lucky.";
    }
  }

  const tapPages = useTapHandler(() => setMobileNotesOpen((open) => !open));
  const openSidePanel = (id: "tools" | "sources" | "assist" | "desk") => {
    sidePanelOpenedAt.current = Date.now();
    setSidePanel(id);
  };
  const clearSidePanel = () => {
    setSidePanel(null);
  };
  const tapNewNotebook = useTapHandler(() => setNewMenuOpen((open) => !open));
  const tapSideTools = useTapHandler(() => openSidePanel("tools"));
  const tapSideSources = useTapHandler(() => openSidePanel("sources"));
  const tapSideAssist = useTapHandler(() => openSidePanel("assist"));
  const tapSideDesk = useTapHandler(() => openSidePanel("desk"));
  const tapCloseSidePanel = useTapHandler(() => {
    if (Date.now() - sidePanelOpenedAt.current < 500) return;
    // Leave /core/go/* without a full reload so ink/stickers stay warm.
    if (launchAction && isCoreGoPanelAction(launchAction)) {
      clearSidePanel();
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/core/go/")) {
        window.history.replaceState(null, "", "/core");
      }
      return;
    }
    clearSidePanel();
  });
  const tapCloseMobileNotes = useTapHandler(() => setMobileNotesOpen(false));
  const tapMobileNewNotebook = useTapHandler(() => {
    setMobileNotesOpen(false);
    setNewMenuOpen(true);
  });
  const tapRailNewNotebook = useTapHandler(() => setNewMenuOpen((open) => !open));
  const tapCloseNotesRail = useTapHandler(() => setNotesRailOpen(false));
  const tapLuckyFromSelection = useTapHandler(() => {
    void generateQuizFromExtract({ fromSelection: true }).catch((err) => {
      window.alert(
        err instanceof Error
          ? err.message
          : "Could not build a quiz from this selection.",
      );
    });
  });
  const tapSixFromSelection = useTapHandler(() => void openSelectionLoop("six"));
  const tapBlurtFromSelection = useTapHandler(() => void openSelectionLoop("blurt"));
  const tapClearSelection = useTapHandler(() => {
    setSelectedStrokeIds([]);
    setSelectedCanvasElementIds([]);
  });
  const sidePanelTaps = {
    tools: tapSideTools,
    sources: tapSideSources,
    assist: tapSideAssist,
    desk: tapSideDesk,
  } as const;

  /**
   * Core → Six → Lucky lives in Assist Studio only — the desk, header, and
   * canvas stay notebook chrome so writing is the whole surface.
   */
  const hasCanvasSelection =
    selectedStrokeIds.length > 0 || selectedCanvasElementIds.length > 0;
  const projectNavigator =
    projectMeta && activeId ? (
      <ProjectFileNavigator
        projectId={activeId}
        meta={projectMeta}
        updatedAt={noteServerUpdatedAtRef.current}
        onMetaChange={({ meta, updatedAt }) => {
          noteServerUpdatedAtRef.current = updatedAt;
          setDoc((current) => ({
            ...current,
            metadata: {
              ...current.metadata,
              multiFileProject: meta,
            },
          }));
        }}
      />
    ) : null;

  const assistStudyLoop = (
    <div className="space-y-2">
      {projectNavigator}
      {courseId && doc.metadata?.luckyOutcomeTarget ? (
        <CoreLoopOutcomeStrip
          courseId={courseId}
          materialId={selectedMaterialId}
          target={doc.metadata.luckyOutcomeTarget}
          onDismiss={() => {
            setDoc((current) => ({
              ...current,
              metadata: { ...current.metadata, luckyOutcomeTarget: undefined },
            }));
            void saveNote({ refresh: false });
          }}
        />
      ) : null}
      {courseId && hasCanvasSelection ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/60 px-3 py-2">
          <p className="w-full text-[10px] font-bold uppercase tracking-wider text-teal-700">
            From your selection
          </p>
          <button
            type="button"
            {...tapLuckyFromSelection}
            className="min-h-11 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white touch-manipulation hover:bg-violet-500"
          >
            Lucky quiz
          </button>
          <button
            type="button"
            {...tapSixFromSelection}
            className="min-h-11 rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs font-bold text-teal-900 touch-manipulation hover:bg-teal-100"
          >
            Chunk in Six
          </button>
          <button
            type="button"
            {...tapBlurtFromSelection}
            className="min-h-11 rounded-xl border border-orange-300 bg-white px-3 py-1.5 text-xs font-bold text-orange-900 touch-manipulation hover:bg-orange-100"
          >
            Blurt
          </button>
          <button
            type="button"
            {...tapClearSelection}
            className="min-h-11 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 touch-manipulation hover:bg-stone-50"
          >
            Clear
          </button>
        </div>
      ) : null}
      <CoreCourseActionBar
        courseId={courseId}
        courseTitle={courses.find((course) => course.id === courseId)?.title}
        focusTopic={deskLoopTopic}
        sessionLoading={studySessionLoading}
        onStartSession={() => {
          void startStudyNowForCourse(courseId, 20).catch((err) => {
            window.alert(
              err instanceof Error ? err.message : "Could not start Study Now session.",
            );
          });
        }}
      />
    </div>
  );

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden page-canvas ${
        coreDarkVisible ? "core-dark bg-stone-950 text-stone-100" : ""
      }`}
      data-core-appearance={coreDarkVisible ? "dark" : "light"}
    >
      {/* Desktop hub — React onClick only (no path refresh). Only with server touch chrome. */}
      {hideHubChrome ? (
      <header
        data-core-header
        data-core-chrome
        data-core-hub-bar
        data-core-desktop-hub
        className="core-desktop-hub relative z-[400] shrink-0 flex-wrap items-center gap-1.5 border-b border-brand/30 bg-white px-2 py-1 sm:gap-2 sm:px-3"
      >
        <Link
          href="/dashboard"
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-stone-700 touch-manipulation hover:brightness-95"
        >
          <ClientIcon icon={ArrowLeft} className="h-3 w-3" />
          Hub
        </Link>
        <span className="hidden shrink-0 text-[11px] font-semibold text-stone-700 sm:inline">
          Core
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 flex-1 basis-[8rem] truncate bg-transparent text-sm font-bold text-stone-900 outline-none sm:basis-[12rem]"
          placeholder="Notebook title"
          aria-label="Notebook title"
        />
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          aria-label="Class for this note"
          title="Class for this note"
          className="input-brand max-w-[9rem] shrink-0 truncate px-2 py-1 text-[11px] sm:max-w-[12rem]"
        >
          <option value="">No class</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {readableCourseTitle(course.title)}
            </option>
          ))}
        </select>

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1">
          <Link
            href="/core/shelf"
            className="shrink-0 cursor-pointer rounded-lg border border-brand px-2 py-1 text-[10px] font-semibold text-stone-700 touch-manipulation hover:bg-brand-soft/40 sm:px-2.5 sm:text-[11px]"
          >
            Shelf
          </Link>
          <CoreChromeAction
            onActivate={() => setStudySplit((open) => !open)}
            pressed={studySplit}
            title="Watch & note split"
            aria-label="Watch and note split"
            className={`inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border touch-manipulation ${
              studySplit
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-brand text-stone-700"
            }`}
          >
            <ClientIcon icon={Columns2} className="h-3.5 w-3.5" />
          </CoreChromeAction>
          <CoreChromeAction
            onActivate={() => setCoreDark((dark) => !dark)}
            title={coreDark ? "Light mode" : "Dark mode"}
            aria-label={coreDark ? "Light mode" : "Dark mode"}
            className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-brand text-stone-700 touch-manipulation"
          >
            {coreDark ? (
              <ClientIcon icon={Sun} className="h-3.5 w-3.5" />
            ) : (
              <ClientIcon icon={Moon} className="h-3.5 w-3.5" />
            )}
          </CoreChromeAction>
          <span data-core-save-status={artifactSaveStatus} className="contents">
            <CoreChromeAction
              onActivate={() => void saveNote()}
              disabled={!activeId || saving}
              aria-label={artifactSaveLabel}
              title={artifactSaveLabel}
              className="btn-primary inline-flex min-h-9 shrink-0 items-center gap-1 px-2.5 py-1 text-[11px] touch-manipulation"
            >
              <ClientIcon icon={Save} className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{artifactSaveLabel}</span>
            </CoreChromeAction>
          </span>
          {saveError ? (
            <p
              data-core-save-error
              role="alert"
              className="max-w-[12rem] text-[10px] leading-snug text-rose-700 sm:max-w-xs"
            >
              {saveError}
            </p>
          ) : null}
        </div>
      </header>
      ) : null}

      {/* Standalone workspace (no server touch chrome) — React hub, no Pages */}
      {!hideHubChrome ? (
      <header
        data-core-header
        data-core-chrome
        data-core-hub-bar
        className="relative z-[400] flex shrink-0 flex-wrap items-center gap-1.5 border-b border-brand/30 bg-white px-2 py-1 sm:gap-2 sm:px-3"
      >
        <Link
          href="/dashboard"
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-stone-700 touch-manipulation hover:brightness-95"
        >
          <ClientIcon icon={ArrowLeft} className="h-3 w-3" />
          Hub
        </Link>
        <span className="hidden shrink-0 text-[11px] font-semibold text-stone-700 sm:inline">
          Core
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 flex-1 basis-[8rem] truncate bg-transparent text-sm font-bold text-stone-900 outline-none sm:basis-[12rem]"
          placeholder="Notebook title"
          aria-label="Notebook title"
        />
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          aria-label="Class for this note"
          title="Class for this note"
          className="input-brand max-w-[9rem] shrink-0 truncate px-2 py-1 text-[11px] sm:max-w-[12rem]"
        >
          <option value="">No class</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {readableCourseTitle(course.title)}
            </option>
          ))}
        </select>

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1">
          <Link
            href="/core/shelf"
            className="shrink-0 cursor-pointer rounded-lg border border-brand px-2 py-1 text-[10px] font-semibold text-stone-700 touch-manipulation hover:bg-brand-soft/40 sm:px-2.5 sm:text-[11px]"
          >
            Shelf
          </Link>
          <CoreChromeAction
            onActivate={() => setStudySplit((open) => !open)}
            pressed={studySplit}
            title="Watch & note split"
            aria-label="Watch and note split"
            className={`inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border touch-manipulation ${
              studySplit
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-brand text-stone-700"
            }`}
          >
            <ClientIcon icon={Columns2} className="h-3.5 w-3.5" />
          </CoreChromeAction>
          <CoreChromeAction
            onActivate={() => setCoreDark((dark) => !dark)}
            title={coreDark ? "Light mode" : "Dark mode"}
            aria-label={coreDark ? "Light mode" : "Dark mode"}
            className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-brand text-stone-700 touch-manipulation"
          >
            {coreDark ? (
              <ClientIcon icon={Sun} className="h-3.5 w-3.5" />
            ) : (
              <ClientIcon icon={Moon} className="h-3.5 w-3.5" />
            )}
          </CoreChromeAction>
          <span data-core-save-status={artifactSaveStatus} className="contents">
            <CoreChromeAction
              onActivate={() => void saveNote()}
              disabled={!activeId || saving}
              aria-label={artifactSaveLabel}
              title={artifactSaveLabel}
              className="btn-primary inline-flex min-h-9 shrink-0 items-center gap-1 px-2.5 py-1 text-[11px] touch-manipulation"
            >
              <ClientIcon icon={Save} className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{artifactSaveLabel}</span>
            </CoreChromeAction>
          </span>
        </div>
      </header>
      ) : (
      <header
        data-core-header
        data-core-touch-hub
        className="core-touch-hub relative z-[400] hidden shrink-0 flex-wrap items-center gap-1.5 border-b border-brand/30 bg-white px-2 py-1 sm:gap-2 sm:px-3"
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 flex-1 basis-[8rem] truncate bg-transparent text-sm font-bold text-stone-900 outline-none sm:basis-[12rem]"
          placeholder="Notebook title"
          aria-label="Notebook title"
        />
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          aria-label="Class for this note"
          title="Class for this note"
          className="input-brand max-w-[9rem] shrink-0 truncate px-2 py-1 text-[11px] sm:max-w-[12rem]"
        >
          <option value="">No class</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {readableCourseTitle(course.title)}
            </option>
          ))}
        </select>
      </header>
      )}

      {mobileNotesOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[105] bg-stone-900/35 touch-manipulation lg:hidden"
            aria-label="Close notebooks"
            {...tapCloseMobileNotes}
          />
          <aside
            data-core-notes-drawer
            className="fixed inset-y-0 left-0 z-[108] flex w-[min(100vw,18rem)] flex-col border-r border-brand bg-white/95 shadow-xl touch-manipulation"
          >
            <div className="flex items-center justify-between border-b border-brand/30 px-3 py-3">
              <p className="text-sm font-bold text-stone-800">Pages</p>
              <div className="flex items-center gap-1">
                <CoreChromeLink
                  href={coreGoPath("new")}
                  aria-label="New notebook"
                  className="rounded-lg bg-brand-soft p-1.5 text-brand touch-manipulation hover:brightness-95"
                >
                  <Plus className="h-4 w-4" />
                </CoreChromeLink>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 space-y-1.5 border-b border-brand/20 px-2 py-2">
                {loading ? (
                  <p className="px-1 text-xs text-stone-500">Loading…</p>
                ) : notes.length === 0 ? (
                  <CoreChromeLink
                    href={coreGoPath("new")}
                    className="w-full rounded-xl border border-dashed border-brand/40 px-3 py-4 text-xs text-stone-500 touch-manipulation hover:bg-brand-soft/40"
                  >
                    + New notebook
                  </CoreChromeLink>
                ) : (
                  <div className="flex items-center gap-1">
                    <select
                      value={activeId ?? ""}
                      onChange={(event) => {
                        const id = event.target.value;
                        if (!id) return;
                        // Full navigation — works on iPad even when React selectNote is flaky.
                        window.location.assign(
                          `/core?noteId=${encodeURIComponent(id)}`,
                        );
                      }}
                      aria-label="Select notebook"
                      className="input-brand min-w-0 flex-1 truncate px-2 py-1.5 text-xs font-semibold"
                    >
                      {!activeId ? (
                        <option value="" disabled>
                          Choose notebook
                        </option>
                      ) : null}
                      {notes.map((note) => (
                        <option key={note.id} value={note.id}>
                          {note.title ?? "Untitled"}
                          {note.method === "WHITEBOARD" ? " · Whiteboard" : ""}
                        </option>
                      ))}
                    </select>
                    {activeId ? (
                      <CoreChromeAction
                        onActivate={() => {
                          const note = notes.find((item) => item.id === activeId);
                          if (note) void deleteNote(note);
                        }}
                        className="rounded p-1.5 text-rose-500 touch-manipulation hover:bg-rose-50"
                        aria-label="Delete notebook"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </CoreChromeAction>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {activeId ? (
                  <div className="space-y-1">
                    <p className="px-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                      Pages in this notebook
                    </p>
                    {notebookPages.pages.map((page) => (
                      <div
                        key={page.id}
                        className={`flex items-center gap-1 rounded-lg px-1.5 py-1 ${
                          page.id === notebookPages.activePageId
                            ? "bg-brand-soft ring-1 ring-orange-300"
                            : "hover:bg-brand-soft/50"
                        }`}
                      >
                        <CoreChromeAction
                          onActivate={() => {
                            setViewingCover(false);
                            setMobileNotesOpen(false);
                            setScrollToPageId(page.id);
                            setDoc((current) => {
                              const next = switchNotebookPage(current, page.id);
                              queueMicrotask(() => {
                                void saveNote({ refresh: false, docOverride: next });
                              });
                              return next;
                            });
                          }}
                          className="w-5 shrink-0 text-[10px] font-bold text-stone-400 touch-manipulation"
                        >
                          {page.pageNumber}
                        </CoreChromeAction>
                        <input
                          key={`${page.id}-${page.label ?? ""}`}
                          defaultValue={
                            page.label?.trim() &&
                            !/^Page \d+$/i.test(page.label.trim())
                              ? page.label
                              : `Page ${page.pageNumber}`
                          }
                          onFocus={() => {
                            if (page.id !== notebookPages.activePageId) {
                              setViewingCover(false);
                              setScrollToPageId(page.id);
                              setDoc((current) => {
                                const next = switchNotebookPage(current, page.id);
                                queueMicrotask(() => {
                                  void saveNote({ refresh: false, docOverride: next });
                                });
                                return next;
                              });
                            }
                          }}
                          onBlur={(e) => {
                            const next = e.target.value.trim();
                            if (
                              next &&
                              next !== (page.label ?? `Page ${page.pageNumber}`)
                            ) {
                              setDoc((current) =>
                                renameNotebookPage(current, page.id, next),
                              );
                              void saveNote();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                              setMobileNotesOpen(false);
                            }
                          }}
                          className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] font-semibold text-stone-800 outline-none touch-manipulation hover:border-stone-200 focus:border-orange-300 focus:bg-white"
                          title="Name this page"
                          aria-label={`Page ${page.pageNumber} name`}
                        />
                      </div>
                    ))}
                    <CoreChromeAction
                      onActivate={() => {
                        setViewingCover(false);
                        setDoc((current) => {
                          const next = addNotebookPage(current, {
                            direction: "below",
                          });
                          const id = getNotebookPages(next).activePageId;
                          queueMicrotask(() => setScrollToPageId(id));
                          return withPageLayoutMode(next, "below");
                        });
                        void saveNote();
                      }}
                      className="w-full rounded-lg border border-dashed border-orange-300 px-2 py-1.5 text-left text-[10px] font-semibold text-orange-700 touch-manipulation hover:bg-orange-50"
                    >
                      + Add page
                    </CoreChromeAction>
                  </div>
                ) : notes.length > 0 ? (
                  <p className="px-2 py-4 text-xs text-stone-500">
                    Select a notebook above to see its pages.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {notesRailVisible ? (
        <aside
          data-core-notes-rail
          className="hidden w-56 shrink-0 flex-col border-r border-brand bg-white/90 lg:flex"
        >
          <div className="flex items-center justify-between border-b border-brand/30 px-3 py-2">
            <p className="text-sm font-bold text-stone-800">Pages</p>
            <div className="relative flex items-center gap-1">
              <CoreChromeLink
                href={coreGoPath("new")}
                aria-label="New notebook"
                className="rounded-lg bg-brand-soft p-1.5 text-brand touch-manipulation hover:brightness-95"
              >
                <Plus className="h-4 w-4" />
              </CoreChromeLink>
              <button
                type="button"
                {...tapCloseNotesRail}
                className="rounded-lg p-1.5 text-stone-500 touch-manipulation hover:bg-stone-100"
                aria-label="Close pages panel"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 space-y-1.5 border-b border-brand/20 px-2 py-2">
              {courseId ? (
                <p className="truncate px-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  {readableCourseTitle(
                    courses.find((c) => c.id === courseId)?.title ?? "Class",
                  )}
                </p>
              ) : null}
              {loading ? (
                <p className="px-1 text-xs text-stone-500">Loading…</p>
              ) : notes.length === 0 ? (
                <CoreChromeLink
                  href={coreGoPath("new")}
                  className="w-full rounded-xl border border-dashed border-brand/40 px-3 py-4 text-xs text-stone-500 touch-manipulation hover:bg-brand-soft/40"
                >
                  + New notebook
                </CoreChromeLink>
              ) : (
                <div className="flex items-center gap-1">
                  <select
                    value={activeId ?? ""}
                    onChange={(event) => {
                      const id = event.target.value;
                      if (!id) return;
                      window.location.assign(
                        `/core?noteId=${encodeURIComponent(id)}`,
                      );
                    }}
                    aria-label="Select notebook"
                    className="input-brand min-w-0 flex-1 truncate px-2 py-1.5 text-xs font-semibold"
                  >
                    {!activeId ? (
                      <option value="" disabled>
                        Choose notebook
                      </option>
                    ) : null}
                    {notes.map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.title ?? "Untitled"}
                        {note.method === "WHITEBOARD" ? " · Whiteboard" : ""}
                      </option>
                    ))}
                  </select>
                  {activeId ? (
                    <CoreChromeAction
                      onActivate={() => {
                        const note = notes.find((item) => item.id === activeId);
                        if (note) void deleteNote(note);
                      }}
                      className="rounded p-1.5 text-rose-500 hover:bg-rose-50"
                      aria-label="Delete notebook"
                      title="Delete notebook"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </CoreChromeAction>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {activeId && !viewingCover ? (
                <div className="space-y-1">
                  <p className="px-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                    Pages in this notebook
                  </p>
                  {notebookPages.pages.map((page) => (
                    <div
                      key={page.id}
                      className={`flex items-center gap-1 rounded-lg px-1.5 py-1 ${
                        page.id === notebookPages.activePageId
                          ? "bg-brand-soft ring-1 ring-orange-300"
                          : "hover:bg-brand-soft/50"
                      }`}
                    >
                      <CoreChromeAction
                        onActivate={() => {
                          setViewingCover(false);
                          autoSaveSkipRef.current = true;
                          setSelectedCanvasElementIds([]);
                          setScrollToPageId(page.id);
                          setDoc((current) => {
                            const next = switchNotebookPage(current, page.id);
                            queueMicrotask(() => {
                              void saveNote({ refresh: false, docOverride: next });
                            });
                            return next;
                          });
                        }}
                        className="w-5 shrink-0 text-[10px] font-bold text-stone-400 touch-manipulation"
                      >
                        {page.pageNumber}
                      </CoreChromeAction>
                      <input
                        key={`${page.id}-${page.label ?? ""}`}
                        defaultValue={
                          page.label?.trim() &&
                          !/^Page \d+$/i.test(page.label.trim())
                            ? page.label
                            : `Page ${page.pageNumber}`
                        }
                        onClick={() => {
                          if (page.id !== notebookPages.activePageId) {
                            setViewingCover(false);
                            autoSaveSkipRef.current = true;
                            setScrollToPageId(page.id);
                            setDoc((current) => {
                              const next = switchNotebookPage(current, page.id);
                              queueMicrotask(() => {
                                void saveNote({ refresh: false, docOverride: next });
                              });
                              return next;
                            });
                          }
                        }}
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          if (
                            next &&
                            next !== (page.label ?? `Page ${page.pageNumber}`)
                          ) {
                            setDoc((current) =>
                              renameNotebookPage(current, page.id, next),
                            );
                            void saveNote();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] font-semibold text-stone-800 outline-none hover:border-stone-200 focus:border-orange-300 focus:bg-white"
                        title="Name this page"
                        aria-label={`Page ${page.pageNumber} name`}
                      />
                    </div>
                  ))}
                  <CoreChromeAction
                    onActivate={() => {
                      setViewingCover(false);
                      setDoc((current) => {
                        const next = addNotebookPage(current, {
                          direction: "below",
                        });
                        const id = getNotebookPages(next).activePageId;
                        queueMicrotask(() => setScrollToPageId(id));
                        return withPageLayoutMode(next, "below");
                      });
                      void saveNote();
                    }}
                    className="w-full rounded-lg border border-dashed border-orange-300 px-2 py-1.5 text-left text-[10px] font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    + Add page
                  </CoreChromeAction>
                </div>
              ) : activeId && viewingCover ? (
                <p className="px-2 py-4 text-xs text-stone-500">
                  Viewing cover — pick a page below or from the page bar.
                </p>
              ) : notes.length > 0 ? (
                <p className="px-2 py-4 text-xs text-stone-500">
                  Select a notebook above to see its pages.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <LaserPointerOverlay active={laserActive} color="#ef4444" />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <CoreFlashcardSplit
            enabled={Boolean(flashcardSplit)}
            title={flashcardSplit?.title ?? "Flashcards"}
            cards={flashcardSplit?.cards ?? []}
            courseId={courseId}
            onClose={() => setFlashcardSplit(null)}
          >
          <CoreStudySplit
            enabled={studySplit && !flashcardSplit}
            material={selectedMaterial ?? null}
            onClose={() => setStudySplit(false)}
            onPickSource={() => setSidePanel("sources")}
            courseId={courseId}
            seedQuery={
              title.trim() ||
              courses.find((course) => course.id === courseId)?.focusTopic?.trim() ||
              ""
            }
          >
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <CoreToolbar
              state={toolbarState}
              onChange={patchToolbar}
              inkColor={inkColor}
              onInkColorChange={setInkColor}
              inkSize={inkSize}
              onInkSizeChange={setInkSize}
              fillPattern={inkFillPattern}
              onFillPatternChange={setInkFillPattern}
              selectActive={tool === "type" && !textPlaceMode}
              laserActive={laserActive}
              textPlaceActive={textPlaceMode}
              pageTemplateId={doc.notebook?.pageTemplateId}
              customBackgroundAssetId={doc.notebook?.customBackgroundAssetId}
              onSelectBuiltinTemplate={applyBuiltinTemplate}
              onSelectImportedTemplate={applyImportedTemplate}
              notesRailOpen={notesRailOpen || mobileNotesOpen}
              launchBucket={launchBucket}
              onBucketOpenChange={setToolbarBucketOpen}
              sidePanel={
                sidePanel === "tools" ||
                sidePanel === "sources" ||
                sidePanel === "assist" ||
                sidePanel === "desk"
                  ? sidePanel
                  : null
              }
              onToggleSidePanel={(id) => {
                if (sidePanel === id) clearSidePanel();
                else openSidePanel(id);
              }}
              onToggleNotesRail={() => {
                const narrow =
                  typeof window !== "undefined" &&
                  window.matchMedia("(max-width: 1023px)").matches;
                if (narrow) {
                  setMobileNotesOpen((open) => !open);
                  return;
                }
                setNotesRailOpen((open) => !open);
              }}
              notebook={doc.notebook}
              coverId={doc.notebook?.coverId}
              customCoverColor={doc.notebook?.customCoverColor}
              customCoverAssetId={doc.notebook?.customCoverAssetId}
              showCover={doc.notebook?.showCover === true}
              onCoverChange={(coverId) => {
                setDoc((current) => ({
                  ...current,
                  notebook: {
                    ...current.notebook,
                    coverId: coverId as never,
                    customCoverColor: null,
                    customCoverAssetId: null,
                  },
                }));
                void saveNote();
              }}
              onCustomCoverColorChange={(customCoverColor) => {
                setDoc((current) => ({
                  ...current,
                  notebook: {
                    ...current.notebook,
                    customCoverColor,
                    ...(customCoverColor ? { customCoverAssetId: null } : {}),
                  },
                }));
                void saveNote();
              }}
              onCustomCoverAssetChange={(customCoverAssetId) => {
                setDoc((current) => ({
                  ...current,
                  notebook: {
                    ...current.notebook,
                    customCoverAssetId,
                    ...(customCoverAssetId ? { customCoverColor: null } : {}),
                  },
                }));
                void saveNote();
              }}
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
              onPageOrientationChange={(pageOrientation) => {
                setDoc((current) => ({
                  ...current,
                  notebook: { ...current.notebook, pageOrientation },
                }));
                void saveNote();
              }}
              floating={false}
              onRulingLineColorChange={(rulingLineColor) => {
                setDoc((current) => ({
                  ...current,
                  notebook: { ...current.notebook, rulingLineColor },
                }));
                void saveNote();
              }}
              onRulingSpacingChange={(rulingSpacingPx) => {
                setDoc((current) => ({
                  ...current,
                  notebook: { ...current.notebook, rulingSpacingPx },
                }));
                void saveNote();
              }}
              onLayerVisibilityChange={(patch) => {
                setDoc((current) => ({
                  ...current,
                  notebook: {
                    ...current.notebook,
                    layerVisibility: {
                      ...current.notebook?.layerVisibility,
                      ...patch,
                    },
                  },
                }));
                void saveNote();
              }}
              onApplySurface={applyPaperSurface}
              activeSurface={
                method === "WHITEBOARD" || activeFormat === "WHITEBOARD"
                  ? "whiteboard"
                  : doc.notebook?.pageBackgroundColor === CHALKBOARD_BACKGROUND
                    ? "chalkboard"
                    : "notebook"
              }
              showTextFormat={
                tool === "type" || textPlaceMode || Boolean(selectedTextBox)
              }
              actions={{
                onOpenChat: () => setSidePanel("sources"),
                onOpenAssist: () => {
                  setSidePanel("sources");
                },
                onToggleReadOnly: () => {
                  patchToolbar({ readOnly: !toolbarState.readOnly });
                },
                onSelectPenMode: (mode) => {
                  setTextPlaceMode(false);
                  activateSketchTool(penModeToInkTool(mode));
                  const size = penModeToInkSize(mode, { ...toolbarState, activePenMode: mode });
                  setInkSize(size);
                  if (mode === "highlighter") {
                    setInkTool("highlighter");
                    if (inkColor === "#1c1917" || inkColor === "#44403c") {
                      setInkColor("#facc15");
                    }
                  }
                  if (mode === "chalk") {
                    setInkTool("pen");
                    if (
                      inkColor === "#1c1917" ||
                      inkColor === "#44403c" ||
                      inkColor === "#000000"
                    ) {
                      setInkColor("#f8fafc");
                    }
                  }
                  if (mode === "crayon") {
                    setInkTool("pen");
                    if (
                      inkColor === "#1c1917" ||
                      inkColor === "#44403c" ||
                      inkColor === "#000000" ||
                      inkColor === "#f8fafc"
                    ) {
                      setInkColor("#dc2626");
                    }
                  }
                  if (mode === "colorPencil") {
                    setInkTool("pen");
                    if (
                      inkColor === "#1c1917" ||
                      inkColor === "#44403c" ||
                      inkColor === "#000000" ||
                      inkColor === "#f8fafc"
                    ) {
                      setInkColor("#0284c7");
                    }
                  }
                  if (mode === "marker") {
                    setInkTool("pen");
                    if (
                      inkColor === "#facc15" ||
                      inkColor === "#f8fafc" ||
                      inkColor === "#a3e635"
                    ) {
                      setInkColor("#1e3a8a");
                    }
                  }
                  if (mode === "shape") setInkTool("shape");
                },
                onSetInkTool: (ink) => {
                  setTextPlaceMode(false);
                  if (ink === "eraser" && inkSize < 8) setInkSize(16);
                  activateSketchTool(ink);
                },
                onSetShapeKind: setShapeKind,
                onAddTextBox: (options) => {
                  if (toolbarState.readOnly) return;
                  if (options?.atTop) {
                    addTextBoxAt(48, 48, { scrollToTop: true });
                  } else {
                    beginTextPlaceMode();
                  }
                },
                onAddSticky: () => {
                  if (!toolbarState.readOnly) addDecoration("sticky");
                },
                onAddDecoration: (kind) => {
                  if (!toolbarState.readOnly) addDecoration(kind);
                },
                onSelectTool: () => {
                  setLaserActive(false);
                  setTextPlaceMode(false);
                  setTool("type");
                  setInkTool("pen");
                  patchToolbar({ inkTool: "pen" });
                },
                onToggleLaser: () => {
                  setTextPlaceMode(false);
                  setLaserActive((active) => !active);
                  setTool("type");
                  setInkTool("pen");
                  patchToolbar({ inkTool: "pen" });
                },
                onGroup: handleCanvasGroup,
                onUngroup: handleCanvasUngroup,
                onCopy: handleCanvasCopy,
                onPaste: handleCanvasPaste,
                onInsertImage: () => {},
                onInsertElements: () => {},
                onAnnotatePdf: (materialId) => {
                  if (materialId) {
                    setSelectedMaterialId(materialId);
                    setTool("annotate");
                    return;
                  }
                  setSidePanel("sources");
                },
                onStartRecord: () => {
                  setSidePanel("tools");
                  startDictation();
                },
                onShowRecordings: () => {
                  setSidePanel("tools");
                },
                onClearPage: clearCurrentPage,
                onUndo: undoCore,
                onRedo: redoCore,
                canUndo:
                  (tool === "annotate" && selectedMaterial?.filePath
                    ? Boolean(pdfInkBridge?.canUndo)
                    : false) ||
                  sketchInk.canUndo ||
                  canUndoDoc,
                canRedo:
                  (tool === "annotate" && selectedMaterial?.filePath
                    ? Boolean(pdfInkBridge?.canRedo)
                    : false) ||
                  sketchInk.canRedo ||
                  canRedoDoc,
              }}
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

            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div
              className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
                chromeOverlayOpen ? "pointer-events-none" : ""
              }`}
              aria-hidden={chromeOverlayOpen || undefined}
            >
              {!activeId ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto rounded-2xl border border-dashed border-orange-200 bg-white p-6 text-center sm:p-8">
                  <div>
                    <p className="text-lg font-bold text-stone-900">Start a notebook</p>
                    <p className="mt-2 max-w-md text-sm text-stone-500">
                      Pick a cover and paper, then write with pen ready — on phone, laptop, or iPad.
                    </p>
                    <div className="relative mt-4 inline-flex flex-col items-center gap-2">
                      {/* Desktop — in-page React, no refresh */}
                      <div className="core-desktop-hub flex flex-col items-center gap-2">
                        <CoreChromeAction
                          onActivate={() => {
                            setSetupDefaults(undefined);
                            setSetupVariant("full");
                            setSetupOpen(true);
                          }}
                          className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white touch-manipulation"
                        >
                          + New notebook
                        </CoreChromeAction>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <CoreChromeAction
                            onActivate={() => {
                              setSetupDefaults({
                                mode: "whiteboard",
                                pageTemplateId: "blank",
                                title: "Untitled whiteboard",
                              });
                              setSetupVariant("full");
                              setSetupOpen(true);
                            }}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-orange-50"
                          >
                            Whiteboard
                          </CoreChromeAction>
                          <CoreChromeAction
                            onActivate={() => openSidePanel("sources")}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-orange-50"
                          >
                            Import
                          </CoreChromeAction>
                          <Link
                            href="/core/shelf"
                            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-orange-50"
                          >
                            Shelf
                          </Link>
                        </div>
                      </div>
                      {/* iPad/phone — native forms (zero JS) */}
                      <div className="core-touch-hub hidden flex-col items-center gap-2">
                        <form action={coreGoPath("new")} method="get">
                          <button
                            type="submit"
                            className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white touch-manipulation"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                            + New notebook
                          </button>
                        </form>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <form action={coreGoPath("newWhiteboard")} method="get">
                            <button
                              type="submit"
                              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-orange-50"
                              style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                              Whiteboard
                            </button>
                          </form>
                          <form action={coreGoPath("import")} method="get">
                            <button
                              type="submit"
                              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-orange-50"
                              style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                              Import
                            </button>
                          </form>
                          <a
                            href="/core/shelf"
                            data-core-hard-nav="1"
                            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-orange-50"
                          >
                            Shelf
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : viewingCover ? (
                <NotebookCoverSheet
                  notebook={doc.notebook}
                  title={title}
                  subtitle={
                    courses.find((c) => c.id === courseId)?.title ??
                    PAGE_TEMPLATES.find((t) => t.id === doc.notebook?.pageTemplateId)?.label
                  }
                  onOpenPages={() => setViewingCover(false)}
                />
              ) : (
                <NotebookContinuousDesk
                  pages={notebookPages.pages}
                  activePageId={notebookPages.activePageId}
                  notebook={doc.notebook}
                  title={title}
                  paperClass={paperClass}
                  customBackgroundUrl={customBackgroundUrl}
                  scrollToPageId={scrollToPageId}
                  onActivatePage={(pageId) => {
                    if (pageId === notebookPages.activePageId) return;
                    autoSaveSkipRef.current = true;
                    setSelectedCanvasElementIds([]);
                    setSelectedStrokeIds([]);
                    setDoc((current) => {
                      const next = switchNotebookPage(current, pageId);
                      queueMicrotask(() => {
                        void saveNote({ refresh: false, docOverride: next });
                      });
                      return next;
                    });
                  }}
                  layoutMode={doc.notebook?.pageLayoutMode ?? "scroll"}
                  onGrowPages={(direction) => {
                    setDoc((current) => {
                      const next = addNotebookPageInDirection(current, direction);
                      const id = getNotebookPages(next).activePageId;
                      queueMicrotask(() => setScrollToPageId(id));
                      return withPageLayoutMode(next, direction);
                    });
                    void saveNote();
                  }}
                >
                  <div
                    ref={pageCanvasRef}
                    data-page-canvas
                    className={`relative z-[2] h-full w-full ${
                      !toolbarState.readOnly &&
                      !sketchDrawingActive &&
                      !shapeDrawActive &&
                      textPlaceMode
                        ? "cursor-text"
                        : !toolbarState.readOnly &&
                            !sketchDrawingActive &&
                            !shapeDrawActive &&
                            tool === "type"
                          ? "cursor-default"
                          : ""
                    }`}
                    onPointerMove={(event) => {
                      rememberPointerLocal(event.clientX, event.clientY);
                    }}
                    onContextMenu={(event) => {
                      if (toolbarState.readOnly) return;
                      event.preventDefault();
                      rememberPointerLocal(event.clientX, event.clientY);
                      const host = (event.target as HTMLElement).closest(
                        "[data-canvas-element]",
                      ) as HTMLElement | null;
                      const elementId = host?.dataset.elementId;
                      if (elementId) {
                        setSelectedCanvasElementIds((current) =>
                          current.includes(elementId) ? current : [elementId],
                        );
                      }
                      setContextMenu({ x: event.clientX, y: event.clientY });
                    }}
                    onPointerDown={(event) => {
                      if (event.button === 2) return;
                      rememberPointerLocal(event.clientX, event.clientY);
                      const target = event.target as HTMLElement;
                      if (
                        target.closest(
                          "[data-page-typed], [data-format-block], [data-canvas-element], [data-canvas-inspector]",
                        )
                      ) {
                        return;
                      }
                      // Only place a text box when Text place mode is on — Select just clears.
                      if (
                        textPlaceMode &&
                        !toolbarState.readOnly &&
                        !laserActive &&
                        !sketchDrawingActive &&
                        !shapeDrawActive &&
                        pageCanvasRef.current
                      ) {
                        event.preventDefault();
                        event.stopPropagation();
                        const point = pointerToLocal(
                          event.clientX,
                          event.clientY,
                          pageCanvasRef.current,
                        );
                        addTextBoxAt(point.x, point.y);
                        return;
                      }
                      setSelectedCanvasElementIds([]);
                      setSelectedStrokeIds([]);
                      setContextMenu(null);
                    }}
                  >
                    <PageTemplateOverlay templateId={doc.notebook?.pageTemplateId} />
                    {renderFormatCanvas()}
                    {shouldRenderSketchLayer() ? (
                      <SketchLayer
                        strokes={filterInkStrokes(
                          tool === "annotate"
                            ? doc.annotations ?? []
                            : (doc.strokes?.length
                                ? doc.strokes
                                : sketchInk.strokes) ?? [],
                        )}
                        onChange={(strokes) => {
                          const merged = mergeInkStrokes(
                            tool === "annotate" ? doc.annotations : doc.strokes,
                            strokes,
                          );
                          if (tool === "sketch") {
                            sketchInk.setStrokes(merged);
                          }
                          setDoc((current) =>
                            tool === "annotate"
                              ? { ...current, annotations: merged }
                              : { ...current, strokes: merged },
                          );
                        }}
                        active={sketchDrawingActive}
                        color={inkColor}
                        lineWidth={inkSize}
                        inkTool={inkTool}
                        pencilOnly={pencilOnly}
                        pressureSensitivity={toolbarState.fountainPen.pressureSensitivity}
                        tipFlatness={
                          toolbarState.activePenMode === "chalk"
                            ? 75
                            : toolbarState.activePenMode === "crayon"
                              ? 82
                              : toolbarState.activePenMode === "colorPencil"
                                ? 40
                                : toolbarState.activePenMode === "marker"
                                  ? 70
                                  : toolbarState.fountainPen.tipFlatness
                        }
                        tipSharpness={
                          toolbarState.activePenMode === "chalk"
                            ? 45
                            : toolbarState.activePenMode === "crayon"
                              ? 35
                              : toolbarState.activePenMode === "colorPencil"
                                ? 70
                                : toolbarState.activePenMode === "marker"
                                  ? 40
                                  : toolbarState.fountainPen.tipSharpness
                        }
                        strokeType={toolbarState.fountainPen.strokeType}
                        reduceLatency={
                          inkTool === "highlighter"
                            ? toolbarState.highlighterReduceLatency
                            : toolbarState.activePenMode === "pencil" ||
                                toolbarState.activePenMode === "colorPencil"
                              ? toolbarState.pencilReduceLatency
                              : toolbarState.penSettings.reduceLatency
                        }
                        inkMedium={penModeToInkMedium(toolbarState.activePenMode)}
                        fillPattern={inkFillPattern}
                        lassoMode={toolbarState.lasso.mode}
                        highlightedStrokeIds={new Set(selectedStrokeIds)}
                        onLassoComplete={handleLassoComplete}
                        onPenDetected={handlePenDetected}
                        className={`absolute inset-0 ${
                          sketchDrawingActive && !chromeOverlayOpen
                            ? "z-[5000]"
                            : "z-[5000] pointer-events-none"
                        }`}
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
                      decorations={
                        layerVisibility?.shapes === false || layerVisibility?.stickies === false
                          ? (doc.decorations ?? []).filter((item) => {
                              if (item.kind === "sticky") {
                                return layerVisibility?.stickies !== false;
                              }
                              return layerVisibility?.shapes !== false;
                            })
                          : (doc.decorations ?? [])
                      }
                      textBoxes={
                        layerVisibility?.textBoxes === false ? [] : (doc.pageTextBoxes ?? [])
                      }
                      selectedIds={selectedCanvasElementIds}
                      focusTextBoxId={focusTextBoxId}
                      editable={!toolbarState.readOnly}
                      inkPassThrough={sketchDrawingActive || shapeDrawActive}
                      onSelect={(ids) => {
                        setSelectedCanvasElementIds(ids);
                        if (focusTextBoxId && !ids.includes(focusTextBoxId)) {
                          setFocusTextBoxId(null);
                        }
                      }}
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
                    {shapeDrawActive ? (
                      <ShapeDrawOverlay
                        active
                        shapeKind={shapeKind}
                        color={inkColor}
                        onCreate={addShapeDecoration}
                      />
                    ) : null}
                  </div>
                </NotebookContinuousDesk>
              )}
            </div>
            </div>

            {sidePanel
              ? (() => {
                  const sheet = (
                    <>
                      <a
                        href="/core"
                        data-core-hard-nav="1"
                        data-core-toolbar-backdrop
                        className="fixed inset-0 z-[5090] cursor-default bg-stone-900/30"
                        aria-label="Close panel"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      />
                      <div
                        data-core-side-panel
                        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[5100] flex max-h-[min(82vh,40rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-brand bg-white shadow-2xl touch-manipulation sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-16 sm:max-h-[min(75vh,36rem)] sm:w-[min(22rem,calc(100vw-1.5rem))] sm:rounded-2xl"
                      >
                <div className="flex shrink-0 border-b border-brand/30">
                  {(
                    [
                      { id: "tools" as const, label: "Inserts" },
                      { id: "sources" as const, label: "Assist" },
                      { id: "assist" as const, label: "Format" },
                      { id: "desk" as const, label: "Desk" },
                    ] as const
                  ).map((item) => (
                    <a
                      key={item.id}
                      href={sidePanel === item.id ? "/core" : coreGoPath(item.id)}
                      data-core-hard-nav="1"
                      className={`flex flex-1 items-center justify-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider touch-manipulation ${
                        sidePanel === item.id
                          ? "border-b-2 border-brand text-brand"
                          : "text-stone-500"
                      }`}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      {item.label}
                    </a>
                  ))}
                  <a
                    href="/core"
                    data-core-hard-nav="1"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 py-2 text-xs font-bold text-stone-400 touch-manipulation hover:text-stone-700"
                    aria-label="Close panel"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    ✕
                  </a>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <CoreSidePanel
                    tab={sidePanel}
                    studyLoop={assistStudyLoop}
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
                    studyExtract={doc.metadata?.chapterStudyExtract ?? null}
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
                    showCover={doc.notebook?.showCover === true}
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
                    onCoverChange={(coverId) => {
                      setDoc((current) => ({
                        ...current,
                        notebook: {
                          ...current.notebook,
                          coverId: coverId as never,
                          customCoverColor: null,
                        },
                      }));
                      void saveNote();
                    }}
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
                        const mode =
                          preset.id === "highlighter"
                            ? "highlighter"
                            : preset.id === "fountain"
                              ? "fountain"
                              : preset.id === "pencil"
                                ? "pencil"
                                : preset.id === "marker"
                                  ? "brush"
                                  : "ball";
                        setInkTool(preset.id === "highlighter" ? "highlighter" : "pen");
                        patchToolbar({
                          activePenMode: mode,
                          inkTool: preset.id === "highlighter" ? "highlighter" : "pen",
                          fountainPen: {
                            ...toolbarState.fountainPen,
                            thickness: Math.round(preset.width),
                            pressureSensitivity: Math.round(preset.pressure * 100),
                            tipFlatness: preset.id === "ballpoint" ? 55 : preset.id === "marker" ? 20 : 35,
                            tipSharpness: preset.id === "fountain" ? 75 : preset.id === "pencil" ? 50 : 65,
                          },
                        });
                      }
                      setDoc((current) => ({
                        ...current,
                        notebook: { ...current.notebook, penPresetId: penPresetId as never },
                      }));
                    }}
                    onInkColorChange={setInkColor}
                    pencilOnly={pencilOnly}
                    onPencilOnlyChange={handlePencilOnlyChange}
                    onCanvasStarters={applyCanvasStarters}
                    onMethodChange={(nextMethod) => void handleMethodChange(nextMethod)}
                    method={method}
                    onStudioInsert={applyStudioOutput}
                    pageSourceText={
                      notebookPages.activePageId
                        ? readNotebookPageSourceText(doc, notebookPages.activePageId) ||
                          readNotebookSourceText(doc)
                        : readNotebookSourceText(doc)
                    }
                    allSheetsSourceText={readAllNotebookSheetsText(doc) || readNotebookSourceText(doc)}
                    onStudyThisPage={(targetPageId) => studyFromCurrentSource(targetPageId)}
                    onInsertPractice={insertPracticeFromExtract}
                    onInsertLearningPlan={insertLearningPlanFromExtract}
                    onInsertExplanations={insertExplanationsFromExtract}
                    onGenerateQuiz={() => generateQuizFromExtract()}
                    coldStart={!notebookHasStudyContent}
                    onPracticeFlashcardsInCore={(deck) => {
                      setStudySplit(false);
                      setFlashcardSplit(deck);
                      setSidePanel(null);
                    }}
                    onBeforeLeaveToAdaptive={flushNoteBeforeAdaptive}
                    onNotebookAction={handleNotebookAction}
                    notebookDesk={deskFromDocument(doc)}
                    onNotebookDeskChange={(desk) =>
                      setDoc((current) => withNotebookDesk(current, desk))
                    }
                    onPinDeskItem={(item) =>
                      setDoc((current) => pinDeskItemToPage(current, item))
                    }
                    activeId={activeId}
                    notebookPages={notebookPages.pages.map((page) => ({
                      id: page.id,
                      label: page.label || `Page ${page.pageNumber}`,
                      pageNumber: page.pageNumber,
                    }))}
                    activePageId={notebookPages.activePageId}
                    onMaterialAdded={(material) => {
                      setMaterials((current) => {
                        if (current.some((item) => item.id === material.id)) return current;
                        return [
                          {
                            id: material.id,
                            title: material.title,
                            type: material.type,
                            extractedText: material.extractedText ?? null,
                            filePath: material.filePath ?? null,
                          },
                          ...current,
                        ];
                      });
                      setSelectedMaterialId(material.id);
                      void loadMaterials();
                    }}
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
              </div>
                    </>
                  );
                  return overlayPortalReady
                    ? createPortal(sheet, document.body)
                    : sheet;
                })()
              : null}
            </div>
          </CoreStudySplit>
          </CoreFlashcardSplit>
          </div>

          {activeId ? (
            <div className="relative z-[60] shrink-0">
            <NotebookPageRail
              pages={notebookPages.pages}
              activePageId={notebookPages.activePageId}
              viewingCover={viewingCover}
              onShowCover={() => setViewingCover(true)}
              onSelect={(pageId) => {
                setViewingCover(false);
                autoSaveSkipRef.current = true;
                setSelectedCanvasElementIds([]);
                setScrollToPageId(pageId);
                setDoc((current) => {
                  const next = switchNotebookPage(current, pageId);
                  queueMicrotask(() => {
                    void saveNote({ refresh: false, docOverride: next });
                  });
                  return next;
                });
              }}
              layoutMode={doc.notebook?.pageLayoutMode ?? "scroll"}
              onAdd={() => {
                setViewingCover(false);
                setDoc((current) => {
                  const next = addNotebookPage(current, { direction: "below" });
                  const id = getNotebookPages(next).activePageId;
                  queueMicrotask(() => setScrollToPageId(id));
                  return withPageLayoutMode(next, "below");
                });
                void saveNote();
              }}
              onAddBeside={() => {
                setViewingCover(false);
                setDoc((current) => {
                  const next = addNotebookPage(current, { direction: "beside" });
                  const id = getNotebookPages(next).activePageId;
                  queueMicrotask(() => setScrollToPageId(id));
                  return withPageLayoutMode(next, "beside");
                });
                void saveNote();
              }}
              pageLabel={`${pageNumber}/${notebookPages.pages.length}`}
              onDuplicate={(pageId) => {
                setViewingCover(false);
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
            </div>
          ) : null}
        </div>
      </div>

      <NotebookSetupWizard
        open={setupOpen}
        variant={setupVariant}
        defaults={setupDefaults}
        suggestionsSummary={setupSuggestionsSummary}
        defaultTitle={setupDefaults?.title}
        onClose={() => {
          setSetupOpen(false);
          if (pendingImportChoiceRef.current) {
            setImportWizardOpen(true);
          } else {
            setSetupVariant("full");
            setSetupDefaults(undefined);
            setSetupSuggestionsSummary(undefined);
            if (launchAction === "new" || launchAction === "newWhiteboard") {
              window.location.assign("/core");
            }
          }
        }}
        onComplete={(config) => void createNoteWithSetup(config)}
      />

      {importWizardOpen ? (
        importPreview ? (
          <MaterialImportWizard
            material={importPreview}
            notes={
              importTargetNotes.length > 0
                ? importTargetNotes
                : notes.map((note) => ({
                    id: note.id,
                    title: note.title,
                    courseTitle: note.course?.title ?? null,
                  }))
            }
            hasActiveWorkbook={Boolean(activeId)}
            activeNoteId={activeId}
            busy={importBusy}
            error={importError}
            onCancel={cancelMaterialImport}
            onConfirm={(choice) => void handleMaterialImportConfirm(choice)}
            onRetry={pendingImportChoiceRef.current ? () => retryMaterialImport() : undefined}
          />
        ) : (
          <div
            data-core-import-loading
            className="fixed inset-0 z-[600] flex items-center justify-center bg-stone-900/40 touch-manipulation"
          >
            <div className="rounded-2xl border border-orange-100 bg-white px-5 py-4 text-sm font-semibold text-stone-700 shadow-xl">
              {importError ??
                (pendingMaterialId
                  ? "Loading material…"
                  : "Import needs a class material — open Assist to add one.")}
              <div className="mt-3 flex gap-2">
                {importError && pendingImportChoiceRef.current ? (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white touch-manipulation"
                    onClick={() => retryMaterialImport()}
                  >
                    Try again
                  </button>
                ) : null}
                <a
                  href="/core"
                  data-core-hard-nav="1"
                  className="inline-flex min-h-11 items-center rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {importError ? "Close" : "Cancel import"}
                </a>
              </div>
            </div>
          </div>
        )
      ) : null}

      {importFlashcardCount && importFlashcardCount > 0 ? (
        <div className="fixed bottom-4 left-1/2 z-[95] -translate-x-1/2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 shadow-lg">
          Added {importFlashcardCount} Q&A flashcards — find them in Study / Locker with your other
          decks.
          <button
            type="button"
            className="ml-3 text-teal-700 underline"
            onClick={() => setImportFlashcardCount(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {importQuizId ? (
        <div className="fixed bottom-16 left-1/2 z-[95] -translate-x-1/2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-950 shadow-lg">
          Lucky quiz ready from this chapter.
          <button
            type="button"
            className="ml-3 text-violet-800 underline"
            onClick={() => {
              const id = importQuizId;
              setImportQuizId(null);
              router.push(`/quizzes/${id}`);
            }}
          >
            Open quiz
          </button>
          <button
            type="button"
            className="ml-2 text-violet-700 underline"
            onClick={() => setImportQuizId(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <CanvasContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        hasSelection={selectedCanvasElementIds.length > 0}
        canPaste={canvasClipboardReady}
        canGroup={selectedCanvasElementIds.length >= 2}
        canUngroup={Boolean(hasGroupedSelection)}
        onCut={handleCanvasCut}
        onCopy={handleCanvasCopy}
        onPaste={handleCanvasPaste}
        onDuplicate={handleCanvasDuplicate}
        onDelete={handleCanvasDelete}
        onGroup={handleCanvasGroup}
        onUngroup={handleCanvasUngroup}
        onSelectAll={handleCanvasSelectAll}
        onBringToFront={handleCanvasBringToFront}
        onSendToBack={handleCanvasSendToBack}
        onBringForward={handleCanvasBringForward}
        onSendBackward={handleCanvasSendBackward}
      />
    </div>
  );
}
