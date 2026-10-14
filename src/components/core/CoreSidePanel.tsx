"use client";

import { NotebookDeskPanel } from "@/components/core/NotebookDeskPanel";
import { CoreAdaptivePanel } from "@/components/core/CoreAdaptivePanel";
import { CoreSourceChat } from "@/components/core/CoreSourceChat";
import { CoreStudioPanel } from "@/components/core/CoreStudioPanel";
import { CanvasStartersPanel } from "@/components/core/CanvasStartersPanel";
import { ElementsPanel } from "@/components/core/ElementsPanel";
import { StickersPanel } from "@/components/core/StickersPanel";
import { ImagesImportPanel } from "@/components/core/ImagesImportPanel";
import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import {
  AddCourseMaterialButton,
  type AddedCourseMaterial,
} from "@/components/materials/AddCourseMaterialModal";
import type { CoreStudioType } from "@/lib/core/studio-types";
import type { FormatRecommendation } from "@/lib/core/note-types";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import { NOTE_METHODS } from "@/lib/core/note-types";
import type { NoteMethod } from "@/generated/prisma";

export type CorePanelTab = "tools" | "sources" | "assist" | "desk";

interface MaterialOption {
  id: string;
  title: string;
  type: string;
  extractedText: string | null;
  filePath?: string | null;
  url?: string | null;
}

export function CoreSidePanel({
  tab,
  materials,
  selectedMaterialId,
  onSelectMaterial,
  onAnnotate,
  studioTopic,
  onStudioTopicChange,
  courseId,
  activeFormat,
  recommendations,
  onRecommendations,
  onApplyFormat,
  onAddFormats,
  onApplyAllRecommendations,
  activeSections,
  onStartBlank,
  coverId,
  customCoverColor,
  showCover,
  notebook,
  pageTemplateId,
  customBackgroundAssetId,
  penPresetId,
  inkColor,
  onCoverChange,
  onCustomCoverColorChange,
  onShowCoverChange,
  onPageBackgroundChange,
  onColorSchemeChange,
  onApplyPalette,
  onApplyCoverPalette,
  onApplyPagePalette,
  onTemplateChange,
  onCustomBackgroundChange,
  onPenPresetChange,
  onInkColorChange,
  pencilOnly,
  onPencilOnlyChange,
  onInsertImage,
  onInsertElement,
  onInsertSticker,
  onCanvasStarters,
  onMethodChange,
  method,
  onStudioInsert,
  activeId,
  notebookPages = [],
  activePageId = null,
  onMaterialAdded,
  studyExtract = null,
  pageSourceText = "",
  allSheetsSourceText = "",
  onStudyThisPage,
  onInsertPractice,
  onInsertLearningPlan,
  onInsertExplanations,
  onGenerateQuiz,
  onNotebookAction,
  coldStart = false,
  notebookDesk,
  onNotebookDeskChange,
  onPinDeskItem,
  studyLoop,
  onPracticeFlashcardsInCore,
  onBeforeLeaveToAdaptive,
}: {
  tab: CorePanelTab;
  materials: MaterialOption[];
  selectedMaterialId: string | null;
  onSelectMaterial: (materialId: string | null) => void;
  onAnnotate: (materialId: string) => void;
  studioTopic: string;
  onStudioTopicChange: (value: string) => void;
  courseId: string;
  activeFormat: CoreFormatId;
  recommendations: FormatRecommendation[];
  onRecommendations: (items: FormatRecommendation[]) => void;
  onApplyFormat: (formatId: CoreFormatId, combo?: CoreFormatId[]) => void;
  onAddFormats: (formatIds: CoreFormatId[]) => void;
  onApplyAllRecommendations?: () => void;
  activeSections?: CoreFormatId[];
  onStartBlank: () => void;
  coverId?: string;
  customCoverColor?: string | null;
  showCover?: boolean;
  notebook?: import("@/lib/core/note-types").NotebookChromeState;
  pageTemplateId?: string;
  customBackgroundAssetId?: string | null;
  penPresetId?: string;
  inkColor?: string;
  onCoverChange: (id: string) => void;
  onCustomCoverColorChange: (color: string | null) => void;
  onShowCoverChange: (show: boolean) => void;
  onPageBackgroundChange?: (color: string) => void;
  onColorSchemeChange?: (scheme: "solid" | "ombre" | "edge" | "bubbles") => void;
  onApplyPalette?: (colors: string[]) => void;
  onApplyCoverPalette?: (colors: string[]) => void;
  onApplyPagePalette?: (colors: string[]) => void;
  onTemplateChange: (id: string) => void;
  onCustomBackgroundChange: (assetId: string | null) => void;
  onPenPresetChange: (id: string) => void;
  onInkColorChange?: (color: string) => void;
  pencilOnly?: boolean;
  onPencilOnlyChange?: (value: boolean) => void;
  onInsertImage: (assetId: string) => void;
  onInsertElement: (element: import("@/lib/core/elements/catalog").ElementDefinition) => void;
  onInsertSticker: (assetId: string) => void;
  onCanvasStarters: (starterIds: string[]) => void;
  onMethodChange: (method: NoteMethod) => void;
  method: NoteMethod;
  onStudioInsert: (payload: {
    title: string;
    text: string;
    type: CoreStudioType;
    structured?: Record<string, unknown>;
    pageId?: string;
  }) => void;
  activeId: string | null;
  notebookPages?: Array<{ id: string; label: string; pageNumber: number }>;
  activePageId?: string | null;
  onMaterialAdded?: (material: AddedCourseMaterial) => void;
  studyExtract?: ChapterStudyExtract | null;
  pageSourceText?: string;
  allSheetsSourceText?: string;
  onStudyThisPage?: (targetPageId: string) => Promise<void> | void;
  onInsertPractice?: () => boolean;
  onInsertLearningPlan?: () => boolean;
  onInsertExplanations?: () => boolean;
  onGenerateQuiz?: () => Promise<void> | void;
  coldStart?: boolean;
  onNotebookAction?: (
    ctx: import("@/lib/core/notebook-action-context").CoreNotebookActionContext,
  ) => Promise<string | void>;
  notebookDesk?: import("@/lib/core/notebook-desk").NotebookDeskState;
  onNotebookDeskChange?: (
    desk: import("@/lib/core/notebook-desk").NotebookDeskState,
  ) => void;
  onPinDeskItem?: (item: import("@/lib/core/notebook-desk").NotebookDeskItem) => void;
  /**
   * Core → Six → Lucky launches and study outcomes. Assist Studio is the only
   * place they appear — the notebook desk stays writing chrome.
   */
  studyLoop?: React.ReactNode;
  onPracticeFlashcardsInCore?: (deck: {
    title: string;
    cards: Array<{ front: string; back: string }>;
  }) => void;
  /** Flush in-memory note before CORE → Adaptive navigation. */
  onBeforeLeaveToAdaptive?: () => Promise<void> | void;
}) {
  if (tab === "desk") {
    return (
      <NotebookDeskPanel
        desk={notebookDesk ?? { items: [] }}
        onChange={(desk) => onNotebookDeskChange?.(desk)}
        onPinToPage={(item) => onPinDeskItem?.(item)}
      />
    );
  }

  if (tab === "tools") {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Inserts — starters & insertables
        </p>
        <p className="text-[10px] text-stone-500">
          Covers & paper templates live on the top <strong>Paper</strong> icon. Stickers,
          images, and elements are also under Inserts on the toolbar.
        </p>
        <details open className="rounded-2xl border border-orange-200 bg-orange-50/40 open:shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold text-stone-800 marker:content-none [&::-webkit-details-marker]:hidden">
            Starters
            <span className="mt-0.5 block text-[10px] font-medium text-stone-500">
              Quick layouts — grids, timelines, whiteboards
            </span>
          </summary>
          <div className="space-y-3 border-t border-orange-100 p-3">
            <section className="rounded-xl border border-orange-100 bg-white p-3">
              <CanvasStartersPanel onApply={onCanvasStarters} />
            </section>
          </div>
        </details>
        <details open className="rounded-2xl border border-stone-200 bg-white open:shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold text-stone-700 marker:content-none [&::-webkit-details-marker]:hidden">
            Stickers · images · elements
            <span className="mt-0.5 block text-[10px] font-medium text-stone-400">
              Also on the Inserts toolbar icon
            </span>
          </summary>
          <div className="space-y-3 border-t border-stone-100 p-3">
            <section className="rounded-xl border border-orange-100 p-3">
              <ElementsPanel onInsert={onInsertElement} />
            </section>
            <section className="rounded-xl border border-violet-100 p-3">
              <StickersPanel onInsert={onInsertSticker} />
            </section>
            <section className="rounded-xl border border-orange-100 p-3">
              <ImagesImportPanel onInsert={onInsertImage} />
            </section>
            <section className="rounded-xl border border-orange-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Study format
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {NOTE_METHODS.slice(0, 8).map((item) => (
                  <CoreChromeAction
                    key={item.id}
                    onActivate={() => onMethodChange(item.id)}
                    pressed={method === item.id}
                    className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                      method === item.id
                        ? "bg-teal-600 text-white"
                        : "bg-orange-50 text-stone-600"
                    }`}
                  >
                    {item.emoji} {item.label}
                  </CoreChromeAction>
                ))}
              </div>
            </section>
          </div>
        </details>
      </div>
    );
  }

  if (tab === "sources") {
    return (
      <div className="flex flex-col gap-4 p-4">
        {studyLoop}
        <CoreStudioPanel
          courseId={courseId}
          materialId={selectedMaterialId}
          topic={studioTopic}
          pages={notebookPages}
          activePageId={activePageId}
          noteId={activeId}
          onInsert={onStudioInsert}
          pageSourceText={pageSourceText}
          allSheetsSourceText={allSheetsSourceText}
          hasStudyExtract={Boolean(studyExtract)}
          onStudyThisPage={onStudyThisPage}
          onInsertPractice={onInsertPractice}
          onInsertLearningPlan={onInsertLearningPlan}
          onInsertExplanations={onInsertExplanations}
          onGenerateQuiz={onGenerateQuiz}
          coldStart={coldStart}
          onPracticeFlashcardsInCore={onPracticeFlashcardsInCore}
          onBeforeLeaveToAdaptive={onBeforeLeaveToAdaptive}
        />
        <section className="rounded-2xl border border-orange-100 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-stone-900">Course materials</p>
              <p className="text-[10px] text-stone-500">
                Add a chapter once — it shows in Locker &amp; Course too.
              </p>
            </div>
            <AddCourseMaterialButton
              courseId={courseId}
              compact
              onAdded={(material) => {
                onMaterialAdded?.(material);
                onSelectMaterial(material.id);
              }}
            />
          </div>
          <input
            value={studioTopic}
            onChange={(event) => onStudioTopicChange(event.target.value)}
            placeholder="Topic focus (optional)"
            className="mt-2 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm"
          />
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => onSelectMaterial(null)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                !selectedMaterialId ? "bg-orange-100 font-semibold" : "hover:bg-orange-50"
              }`}
            >
              All materials
            </button>
            {materials.map((material) => (
              <div
                key={material.id}
                className={`rounded-xl border px-3 py-2 ${
                  selectedMaterialId === material.id
                    ? "border-orange-200 bg-orange-50"
                    : "border-transparent"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectMaterial(material.id)}
                  className="w-full text-left text-sm font-semibold text-stone-900"
                >
                  {material.title}
                </button>
                {material.filePath ? (
                  <button
                    type="button"
                    onClick={() => onAnnotate(material.id)}
                    className="mt-2 text-xs font-semibold text-teal-700"
                  >
                    Annotate PDF →
                  </button>
                ) : null}
                {material.url ||
                material.type?.toUpperCase() === "VIDEO" ||
                (material.filePath &&
                  /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(material.filePath)) ? (
                  <p className="mt-1 text-[10px] text-stone-500">
                    Use Watch &amp; note (columns icon) to split video + notebook
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
        <CoreSourceChat
          courseId={courseId}
          materialId={selectedMaterialId}
          studyExtract={studyExtract}
          pageSourceText={pageSourceText}
          onNotebookAction={onNotebookAction}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <CoreAdaptivePanel
        courseId={courseId}
        materialId={selectedMaterialId}
        sourcePreview={
          pageSourceText?.slice(0, 4000) ||
          materials.find((item) => item.id === selectedMaterialId)?.extractedText?.slice(
            0,
            4000,
          ) ||
          undefined
        }
        activeFormat={activeFormat}
        activeSections={activeSections}
        recommendations={recommendations}
        onRecommendations={onRecommendations}
        onApplyFormat={onApplyFormat}
        onAddFormats={onAddFormats}
        onApplyAllRecommendations={onApplyAllRecommendations}
        onStartBlank={onStartBlank}
        onAnalyze={() => {}}
      />
      {!activeId ? (
        <p className="mt-3 text-xs text-stone-500">
          Open or create a notebook page to use adaptive suggestions.
        </p>
      ) : null}
    </div>
  );
}
