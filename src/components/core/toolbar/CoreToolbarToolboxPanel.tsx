"use client";

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  MessageCircle,
  Mic,
  Settings2,
  Sparkles,
  Sticker,
  ZoomIn,
  Ruler,
  Clock,
} from "lucide-react";

import { CoreToolbarChatPanel } from "@/components/core/toolbar/CoreToolbarChatPanel";
import { CoreToolbarCustomizePanel } from "@/components/core/toolbar/CoreToolbarCustomizePanel";
import { CoreToolbarElementsPanel } from "@/components/core/toolbar/CoreToolbarElementsPanel";
import { CoreToolbarImagesPanel } from "@/components/core/toolbar/CoreToolbarImagesPanel";
import { CoreToolbarShell } from "@/components/core/toolbar/CoreToolbarShell";
import { CoreToolbarStartersPanel } from "@/components/core/toolbar/CoreToolbarStartersPanel";
import { CoreToolbarStickersPanel } from "@/components/core/toolbar/CoreToolbarStickersPanel";
import type { CoreToolbarActions, CoreToolbarState } from "@/lib/core/core-toolbar-types";
import type { ElementDefinition } from "@/lib/core/elements/catalog";

type ToolboxScreen =
  | "main"
  | "chat"
  | "elements"
  | "stickers"
  | "images"
  | "starters"
  | "customize"
  | "pdf";

export type PdfMaterialOption = {
  id: string;
  title: string;
};

const TOOLBOX_ITEMS: {
  id: ToolboxScreen;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { id: "chat", label: "Assist", icon: MessageCircle },
  { id: "starters", label: "Starters", icon: LayoutGrid },
  { id: "stickers", label: "Stickers", icon: Sticker },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "elements", label: "Elements", icon: Sparkles },
  { id: "pdf", label: "PDF", icon: FileText },
];

export function CoreToolbarToolboxPanel({
  state,
  onChange,
  courseId,
  materialId,
  studyExtract,
  pageSourceText,
  onNotebookAction,
  actions,
  onInsertPageAsset,
  onInsertElement,
  listening,
  onApplyCanvasStarters,
  pdfMaterials = [],
  onClose,
}: {
  state: CoreToolbarState;
  onChange: (patch: Partial<CoreToolbarState>) => void;
  courseId: string;
  materialId: string | null;
  studyExtract?: import("@/lib/core/chapter-study-extract").ChapterStudyExtract | null;
  pageSourceText?: string;
  onNotebookAction?: (
    ctx: import("@/lib/core/notebook-action-context").CoreNotebookActionContext,
  ) => Promise<string | void>;
  actions: CoreToolbarActions;
  onInsertPageAsset: (assetId: string) => void;
  onInsertElement: (element: ElementDefinition) => void;
  listening?: boolean;
  onApplyCanvasStarters?: (starterIds: string[]) => void;
  pdfMaterials?: PdfMaterialOption[];
  onClose: () => void;
}) {
  const [screen, setScreen] = useState<ToolboxScreen>("main");

  if (screen === "chat") {
    return (
      <CoreToolbarChatPanel
        courseId={courseId}
        materialId={materialId}
        studyExtract={studyExtract}
        pageSourceText={pageSourceText}
        onNotebookAction={onNotebookAction}
        onOpenAssist={actions.onOpenAssist}
        onClose={onClose}
      />
    );
  }

  if (screen === "elements") {
    return (
      <CoreToolbarElementsPanel onInsert={onInsertElement} onClose={onClose} />
    );
  }
  if (screen === "stickers") {
    return (
      <CoreToolbarStickersPanel onInsert={onInsertPageAsset} onClose={onClose} />
    );
  }
  if (screen === "images") {
    return (
      <CoreToolbarImagesPanel onInsert={onInsertPageAsset} onClose={onClose} />
    );
  }
  if (screen === "starters") {
    return (
      <CoreToolbarStartersPanel
        onApply={(starterIds) => onApplyCanvasStarters?.(starterIds)}
        onClose={onClose}
      />
    );
  }
  if (screen === "customize") {
    return (
      <CoreToolbarCustomizePanel
        visibleItems={state.visibleItems}
        onChange={(items) => onChange({ visibleItems: items })}
        onClose={onClose}
      />
    );
  }

  if (screen === "pdf") {
    return (
      <CoreToolbarShell title="Annotate PDF" onBack={() => setScreen("main")} onClose={onClose}>
        {pdfMaterials.length === 0 ? (
          <div className="space-y-3 px-1">
            <p className="text-xs text-stone-500">
              No PDFs in this course yet. Add a reading in Assist → materials, then annotate here.
            </p>
            <button
              type="button"
              onClick={() => {
                actions.onAnnotatePdf?.();
                onClose();
              }}
              className="min-h-11 w-full rounded-xl bg-stone-900 px-3 py-2.5 text-xs font-bold text-white touch-manipulation"
            >
              Open materials
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {pdfMaterials.map((material) => (
              <button
                key={material.id}
                type="button"
                onClick={() => {
                  actions.onAnnotatePdf?.(material.id);
                  onClose();
                }}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left touch-manipulation hover:bg-orange-50 ${
                  materialId === material.id ? "bg-orange-50 ring-1 ring-orange-200" : ""
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-teal-700" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                  {material.title}
                </span>
                <span className="shrink-0 text-[10px] font-bold text-teal-700">Annotate</span>
              </button>
            ))}
          </div>
        )}
      </CoreToolbarShell>
    );
  }

  return (
    <CoreToolbarShell title="Inserts" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {TOOLBOX_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "pdf" && pdfMaterials.length === 1) {
                  actions.onAnnotatePdf?.(pdfMaterials[0]!.id);
                  onClose();
                  return;
                }
                setScreen(item.id);
              }}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 py-3 text-center touch-manipulation hover:border-orange-200 hover:bg-orange-50"
            >
              <Icon className="h-5 w-5 text-stone-700" />
              <span className="text-[10px] font-bold text-stone-800">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
        <button
          type="button"
          onClick={() => {
            actions.onStartRecord();
            onClose();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 touch-manipulation"
        >
          <Mic className="h-4 w-4" />
          Record{listening ? " · on" : ""}
        </button>
        <button
          type="button"
          onClick={() => {
            actions.onShowRecordings();
            onClose();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 touch-manipulation"
        >
          <Mic className="h-4 w-4" />
          Recordings
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-100 py-2.5 text-xs font-bold text-stone-400 touch-manipulation"
        >
          <ZoomIn className="h-4 w-4" />
          Zoom
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-100 py-2.5 text-xs font-bold text-stone-400 touch-manipulation"
        >
          <Ruler className="h-4 w-4" />
          Ruler
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-100 py-2.5 text-xs font-bold text-stone-400 touch-manipulation"
        >
          <Clock className="h-4 w-4" />
          Timer
        </button>
        <button
          type="button"
          onClick={() => setScreen("customize")}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 touch-manipulation"
        >
          <Settings2 className="h-4 w-4" />
          Customize
        </button>
      </div>
      <p className="mt-2 px-1 text-center text-[10px] text-stone-400">
        Covers & paper templates → Paper icon on the toolbar
      </p>
    </CoreToolbarShell>
  );
}
