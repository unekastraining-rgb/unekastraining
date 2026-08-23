"use client";

import { CoreAdaptivePanel } from "@/components/core/CoreAdaptivePanel";
import { CoreSourceChat } from "@/components/core/CoreSourceChat";
import { CoreStudioPanel } from "@/components/core/CoreStudioPanel";
import { CanvasStartersPanel } from "@/components/core/CanvasStartersPanel";
import { ElementsPanel } from "@/components/core/ElementsPanel";
import { StickersPanel } from "@/components/core/StickersPanel";
import { ImagesImportPanel } from "@/components/core/ImagesImportPanel";
import { NotebookChromePanel } from "@/components/core/NotebookChromePanel";
import type { CoreStudioType } from "@/lib/core/studio-types";
import type { FormatRecommendation } from "@/lib/core/note-types";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import { NOTE_METHODS } from "@/lib/core/note-types";
import type { NoteMethod } from "@/generated/prisma";

export type CorePanelTab = "tools" | "sources" | "assist";

interface MaterialOption {
  id: string;
  title: string;
  type: string;
  extractedText: string | null;
  filePath?: string | null;
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
  onInsertImage,
  onInsertElement,
  onInsertSticker,
  onCanvasStarters,
  onMethodChange,
  method,
  onStudioInsert,
  activeId,
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
  }) => void;
  activeId: string | null;
}) {
  if (tab === "tools") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <NotebookChromePanel
          notebook={notebook}
          coverId={coverId as never}
          customCoverColor={customCoverColor}
          showCover={showCover}
          pageTemplateId={pageTemplateId as never}
          customBackgroundAssetId={customBackgroundAssetId}
          penPresetId={penPresetId as never}
          inkColor={inkColor}
          onCoverChange={onCoverChange as never}
          onCustomCoverColorChange={onCustomCoverColorChange}
          onShowCoverChange={onShowCoverChange}
          onPageBackgroundChange={onPageBackgroundChange}
          onColorSchemeChange={onColorSchemeChange}
          onApplyPalette={onApplyPalette}
          onApplyCoverPalette={onApplyCoverPalette}
          onApplyPagePalette={onApplyPagePalette}
          onTemplateChange={onTemplateChange as never}
          onCustomBackgroundChange={onCustomBackgroundChange}
          onPenPresetChange={onPenPresetChange as never}
          onInkColorChange={onInkColorChange}
        />
        <section className="rounded-2xl border border-orange-100 bg-white p-4">
          <CanvasStartersPanel onApply={onCanvasStarters} />
        </section>
        <section className="rounded-2xl border border-orange-100 bg-white p-4">
          <ElementsPanel onInsert={onInsertElement} />
        </section>
        <section className="rounded-2xl border border-violet-100 bg-white p-4">
          <StickersPanel onInsert={onInsertSticker} />
        </section>
        <section className="rounded-2xl border border-orange-100 bg-white p-4">
          <ImagesImportPanel onInsert={onInsertImage} />
        </section>
        <section className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Page format
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {NOTE_METHODS.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onMethodChange(item.id)}
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                  method === item.id
                    ? "bg-teal-600 text-white"
                    : "bg-orange-50 text-stone-600"
                }`}
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (tab === "sources") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <section className="rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-sm font-bold text-stone-900">Course materials</p>
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
              </div>
            ))}
          </div>
        </section>
        <CoreStudioPanel
          courseId={courseId}
          materialId={selectedMaterialId}
          topic={studioTopic}
          onInsert={onStudioInsert}
        />
        <CoreSourceChat courseId={courseId} materialId={selectedMaterialId} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <CoreAdaptivePanel
        courseId={courseId}
        materialId={selectedMaterialId}
        sourcePreview={
          materials.find((item) => item.id === selectedMaterialId)?.extractedText?.slice(
            0,
            4000,
          ) ?? undefined
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
