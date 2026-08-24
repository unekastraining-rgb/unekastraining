"use client";

import { useEffect, useRef, useState } from "react";
import {
  MousePointer2,
  Eraser,
  Image as ImageIcon,
  LayoutTemplate,
  Lasso,
  MessageCircle,
  Mic,
  Pencil,
  Redo2,
  Shapes,
  Sparkles,
  Square,
  StickyNote,
  Sticker,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  Ruler,
  Clock,
  Zap,
  Settings2,
  BookOpen,
} from "lucide-react";

import { CoreToolbarChatPanel } from "@/components/core/toolbar/CoreToolbarChatPanel";
import { CoreToolbarCustomizePanel } from "@/components/core/toolbar/CoreToolbarCustomizePanel";
import { CoreToolbarElementsPanel } from "@/components/core/toolbar/CoreToolbarElementsPanel";
import { CoreToolbarStickersPanel } from "@/components/core/toolbar/CoreToolbarStickersPanel";
import { CoreToolbarImagesPanel } from "@/components/core/toolbar/CoreToolbarImagesPanel";
import { CoreToolbarTemplatesPanel } from "@/components/core/toolbar/CoreToolbarTemplatesPanel";
import { CoreToolbarLassoPanel } from "@/components/core/toolbar/CoreToolbarLassoPanel";
import { CoreToolbarPenPanel } from "@/components/core/toolbar/CoreToolbarPenPanel";
import { penModeToInkSize, penModeToInkTool } from "@/lib/core/core-toolbar-defaults";
import type { CoreToolbarActions, CoreToolbarItemId, CoreToolbarState } from "@/lib/core/core-toolbar-types";
import type { ElementDefinition } from "@/lib/core/elements/catalog";

import type { PageTemplateId } from "@/lib/core/page-templates";

type OpenPanel =
  | "chat"
  | "lasso"
  | "pen"
  | "customize"
  | "elements"
  | "stickers"
  | "images"
  | "templates"
  | null;

const ITEM_META: Record<
  CoreToolbarItemId,
  { label: string; icon: typeof Pencil; group: "primary" | "tools" | "accessories" | "meta" }
> = {
  chat: { label: "Chat", icon: MessageCircle, group: "primary" },
  readWrite: { label: "Read", icon: BookOpen, group: "primary" },
  select: { label: "Select", icon: MousePointer2, group: "primary" },
  lasso: { label: "Lasso", icon: Lasso, group: "primary" },
  pen: { label: "Pen", icon: Pencil, group: "primary" },
  eraser: { label: "Eraser", icon: Eraser, group: "tools" },
  text: { label: "Text", icon: Type, group: "tools" },
  elements: { label: "Elements", icon: Sparkles, group: "tools" },
  stickers: { label: "Stickers", icon: Sticker, group: "tools" },
  images: { label: "Images", icon: ImageIcon, group: "tools" },
  templates: { label: "Templates", icon: LayoutTemplate, group: "tools" },
  shapes: { label: "Shapes", icon: Shapes, group: "tools" },
  sticky: { label: "Sticky", icon: StickyNote, group: "tools" },
  laser: { label: "Laser", icon: Zap, group: "tools" },
  record: { label: "Record", icon: Mic, group: "accessories" },
  recordings: { label: "Recordings", icon: Mic, group: "accessories" },
  zoom: { label: "Zoom", icon: ZoomIn, group: "accessories" },
  ruler: { label: "Ruler", icon: Ruler, group: "accessories" },
  timekeeper: { label: "Timer", icon: Clock, group: "accessories" },
  customize: { label: "Customize", icon: Settings2, group: "meta" },
  clearPage: { label: "Clear", icon: Trash2, group: "meta" },
};

export function CoreToolbar({
  state,
  onChange,
  inkColor,
  onInkColorChange,
  courseId,
  materialId,
  actions,
  onInsertPageAsset,
  onInsertElement,
  listening,
  selectActive = false,
  laserActive = false,
  pageTemplateId,
  customBackgroundAssetId,
  onSelectBuiltinTemplate,
  onSelectImportedTemplate,
}: {
  state: CoreToolbarState;
  onChange: (patch: Partial<CoreToolbarState>) => void;
  inkColor: string;
  onInkColorChange: (color: string) => void;
  courseId: string;
  materialId: string | null;
  actions: CoreToolbarActions;
  onInsertPageAsset: (assetId: string) => void;
  onInsertElement: (element: ElementDefinition) => void;
  listening?: boolean;
  selectActive?: boolean;
  laserActive?: boolean;
  pageTemplateId?: PageTemplateId;
  customBackgroundAssetId?: string | null;
  onSelectBuiltinTemplate?: (templateId: PageTemplateId) => void;
  onSelectImportedTemplate?: (assetId: string) => void;
}) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openPanel) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (toolbarRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-core-toolbar-panel]")) return;
      setOpenPanel(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openPanel]);

  function selectPenMode(mode: CoreToolbarState["activePenMode"]) {
    onChange({ activePenMode: mode, inkTool: penModeToInkTool(mode) });
    actions.onSelectPenMode(mode);
    actions.onSetInkTool(penModeToInkTool(mode));
    const size = penModeToInkSize(mode, { ...state, activePenMode: mode });
    if (mode === "highlighter") actions.onSetInkTool("highlighter");
    if (mode === "shape") actions.onSetInkTool("shape");
    void size;
  }

  function handleItemClick(id: CoreToolbarItemId) {
    if (state.readOnly && !["readWrite", "chat", "zoom", "customize"].includes(id)) return;

    switch (id) {
      case "chat":
        setOpenPanel((current) => (current === "chat" ? null : "chat"));
        break;
      case "readWrite":
        actions.onToggleReadOnly();
        break;
      case "select":
        actions.onSelectTool();
        setOpenPanel(null);
        break;
      case "lasso":
        actions.onSetInkTool("lasso");
        setOpenPanel((current) => (current === "lasso" ? null : "lasso"));
        break;
      case "pen":
        actions.onSetInkTool(penModeToInkTool(state.activePenMode));
        selectPenMode(state.activePenMode);
        setOpenPanel((current) => (current === "pen" ? null : "pen"));
        break;
      case "eraser":
        actions.onSetInkTool("eraser");
        setOpenPanel(null);
        break;
      case "text":
        actions.onAddTextBox();
        setOpenPanel(null);
        break;
      case "elements":
        setOpenPanel((current) => (current === "elements" ? null : "elements"));
        break;
      case "stickers":
        setOpenPanel((current) => (current === "stickers" ? null : "stickers"));
        break;
      case "images":
        setOpenPanel((current) => (current === "images" ? null : "images"));
        break;
      case "templates":
        setOpenPanel((current) => (current === "templates" ? null : "templates"));
        break;
      case "shapes":
        actions.onSetInkTool("shape");
        onChange({ activePenMode: "shape", inkTool: "shape" });
        setOpenPanel("pen");
        break;
      case "sticky":
        actions.onAddSticky();
        setOpenPanel(null);
        break;
      case "laser":
        actions.onToggleLaser();
        setOpenPanel(null);
        break;
      case "record":
        actions.onStartRecord();
        setOpenPanel(null);
        break;
      case "recordings":
        actions.onShowRecordings();
        setOpenPanel(null);
        break;
      case "zoom":
      case "ruler":
      case "timekeeper":
        setOpenPanel(null);
        break;
      case "customize":
        setOpenPanel((current) => (current === "customize" ? null : "customize"));
        break;
      case "clearPage":
        actions.onClearPage();
        setOpenPanel(null);
        break;
      default:
        break;
    }
  }

  const visible = state.visibleItems.filter((id) => id !== "customize");
  const showCustomize = state.visibleItems.includes("customize");

  return (
    <div
      ref={toolbarRef}
      data-core-toolbar
      className="relative z-20 shrink-0 touch-manipulation border-b border-orange-100 bg-white"
    >
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((id) => {
          const meta = ITEM_META[id];
          const Icon = meta.icon;
          const isReadWrite = id === "readWrite";
          const label = isReadWrite
            ? state.readOnly
              ? "Read"
              : "Write"
            : meta.label;
          const active =
            (id === "select" && selectActive) ||
            (id === "lasso" && (openPanel === "lasso" || state.inkTool === "lasso")) ||
            (id === "pen" && (openPanel === "pen" || ["pen", "highlighter", "shape"].includes(state.inkTool))) ||
            (id === "chat" && openPanel === "chat") ||
            (id === "elements" && openPanel === "elements") ||
            (id === "stickers" && openPanel === "stickers") ||
            (id === "images" && openPanel === "images") ||
            (id === "templates" && openPanel === "templates") ||
            (id === "readWrite" && !state.readOnly) ||
            (id === "eraser" && state.inkTool === "eraser") ||
            (id === "laser" && laserActive);

          return (
            <div key={id} className="relative">
              <button
                type="button"
                onClick={() => handleItemClick(id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:px-3 ${
                  active
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-orange-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                {id === "record" && listening ? " · on" : ""}
              </button>

              {id === "chat" && openPanel === "chat" ? (
                <CoreToolbarChatPanel
                  courseId={courseId}
                  materialId={materialId}
                  onOpenAssist={actions.onOpenAssist}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
              {id === "lasso" && openPanel === "lasso" ? (
                <CoreToolbarLassoPanel
                  state={state}
                  onChange={onChange}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
              {id === "pen" && openPanel === "pen" ? (
                <CoreToolbarPenPanel
                  state={state}
                  inkColor={inkColor}
                  onInkColorChange={onInkColorChange}
                  onChange={onChange}
                  onSelectPenMode={selectPenMode}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
              {id === "elements" && openPanel === "elements" ? (
                <CoreToolbarElementsPanel
                  onInsert={onInsertElement}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
              {id === "stickers" && openPanel === "stickers" ? (
                <CoreToolbarStickersPanel
                  onInsert={onInsertPageAsset}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
              {id === "images" && openPanel === "images" ? (
                <CoreToolbarImagesPanel
                  onInsert={onInsertPageAsset}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
              {id === "templates" && openPanel === "templates" ? (
                <CoreToolbarTemplatesPanel
                  pageTemplateId={pageTemplateId}
                  customBackgroundAssetId={customBackgroundAssetId}
                  onSelectBuiltin={(templateId) => onSelectBuiltinTemplate?.(templateId)}
                  onSelectImported={(assetId) => onSelectImportedTemplate?.(assetId)}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
            </div>
          );
        })}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={actions.onUndo}
            disabled={!actions.canUndo || state.readOnly}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={actions.onRedo}
            disabled={!actions.canRedo || state.readOnly}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40"
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          {showCustomize ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => handleItemClick("customize")}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                title="Customize toolbar"
              >
                <Settings2 className="h-4 w-4" />
              </button>
              {openPanel === "customize" ? (
                <CoreToolbarCustomizePanel
                  visibleItems={state.visibleItems}
                  onChange={(items) => onChange({ visibleItems: items })}
                  onClose={() => setOpenPanel(null)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {state.readOnly ? (
        <div className="border-t border-amber-100 bg-amber-50 px-3 py-1.5 text-center text-[10px] font-semibold text-amber-800">
          Read-only mode — tap Write to edit
        </div>
      ) : null}
    </div>
  );
}
