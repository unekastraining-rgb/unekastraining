"use client";

import { useState } from "react";
import {
  Eraser,
  Frame,
  Lasso,
  Minus,
  MousePointer2,
  Redo2,
  Shapes,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  Zap,
} from "lucide-react";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { CoreToolbarLassoPanel } from "@/components/core/toolbar/CoreToolbarLassoPanel";
import {
  CoreToolbarShell,
  OptionChip,
  SliderRow,
  ToggleRow,
} from "@/components/core/toolbar/CoreToolbarShell";
import { ERASER_SIZES } from "@/lib/core/ink-engine";
import type { CoreToolbarActions, CoreToolbarState } from "@/lib/core/core-toolbar-types";
import type { DecorationKind } from "@/lib/core/note-types";

type FormatScreen = "main" | "lasso" | "eraser" | "shapes" | "text" | "lines";

const LINE_BORDER_ITEMS: Array<{
  kind: DecorationKind;
  label: string;
  icon: typeof Minus;
}> = [
  { kind: "line", label: "Line", icon: Minus },
  { kind: "vline", label: "Vertical", icon: Minus },
  { kind: "border_frame", label: "Border", icon: Frame },
  { kind: "arrow", label: "Arrow", icon: Minus },
  { kind: "shape_rect", label: "Box", icon: Frame },
];

const FORMAT_ACTIONS: {
  id: string;
  label: string;
  icon: typeof MousePointer2;
  run: (actions: CoreToolbarActions) => void;
  active?: (ctx: Ctx) => boolean;
  screen?: FormatScreen;
  drillDown?: boolean;
}[] = [
  {
    id: "select",
    label: "Select",
    icon: MousePointer2,
    run: (a) => a.onSelectTool(),
    active: (c) => c.selectActive,
  },
  {
    id: "lasso",
    label: "Lasso",
    icon: Lasso,
    run: (a) => a.onSetInkTool("lasso"),
    active: (c) => c.lassoActive,
    screen: "lasso",
    drillDown: true,
  },
  {
    id: "eraser",
    label: "Eraser",
    icon: Eraser,
    run: (a) => a.onSetInkTool("eraser"),
    active: (c) => c.eraserActive,
    screen: "eraser",
    drillDown: true,
  },
  {
    id: "text",
    label: "Text",
    icon: Type,
    run: () => {
      /* place mode starts from the Text options screen */
    },
    active: (c) => c.textPlaceActive,
    screen: "text",
    drillDown: true,
  },
  {
    id: "shapes",
    label: "Shapes",
    icon: Shapes,
    run: (a) => {
      a.onSetInkTool("shape");
      a.onSetShapeKind("rect");
    },
    active: (c) => c.shapeActive,
    screen: "shapes",
    drillDown: true,
  },
  {
    id: "lines",
    label: "Lines",
    icon: Frame,
    run: () => {
      /* drill into lines / borders */
    },
    screen: "lines",
    drillDown: true,
  },
  {
    id: "sticky",
    label: "Sticky",
    icon: StickyNote,
    run: (a) => a.onAddSticky(),
  },
  {
    id: "laser",
    label: "Laser",
    icon: Zap,
    run: (a) => a.onToggleLaser(),
    active: (c) => c.laserActive,
  },
];

type Ctx = {
  selectActive: boolean;
  lassoActive: boolean;
  eraserActive: boolean;
  textPlaceActive: boolean;
  shapeActive: boolean;
  laserActive: boolean;
};

export function CoreToolbarFormattingPanel({
  state,
  onChange,
  actions,
  inkSize = 16,
  onInkSizeChange,
  selectActive,
  lassoActive,
  eraserActive,
  textPlaceActive,
  shapeActive,
  laserActive,
  onClose,
}: {
  state: CoreToolbarState;
  onChange: (patch: Partial<CoreToolbarState>) => void;
  actions: CoreToolbarActions;
  inkSize?: number;
  onInkSizeChange?: (size: number) => void;
  selectActive: boolean;
  lassoActive: boolean;
  eraserActive: boolean;
  textPlaceActive: boolean;
  shapeActive: boolean;
  laserActive: boolean;
  onClose: () => void;
}) {
  const [screen, setScreen] = useState<FormatScreen>("main");
  const ctx: Ctx = {
    selectActive,
    lassoActive,
    eraserActive,
    textPlaceActive,
    shapeActive,
    laserActive,
  };

  if (screen === "lasso") {
    return (
      <CoreToolbarLassoPanel
        state={state}
        onChange={onChange}
        onClose={onClose}
        onBack={() => setScreen("main")}
      />
    );
  }

  if (screen === "eraser") {
    return (
      <CoreToolbarShell title="Eraser" onBack={() => setScreen("main")} onClose={onClose}>
        <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-stone-400">
          Eraser size
        </p>
        <div className="flex flex-wrap gap-2 px-2">
          {ERASER_SIZES.map((tip) => (
            <OptionChip
              key={tip.id}
              label={tip.label}
              active={inkSize === tip.value}
              onClick={() => onInkSizeChange?.(tip.value)}
            />
          ))}
        </div>
        <SliderRow
          label="Eraser size"
          value={inkSize}
          min={4}
          max={48}
          onChange={(value) => onInkSizeChange?.(value)}
        />
        <ToggleRow
          label="Erase highlighter"
          checked={state.penSettings.gestures.eraseShapesAndHighlighter}
          onChange={(value) =>
            onChange({
              penSettings: {
                ...state.penSettings,
                gestures: {
                  ...state.penSettings.gestures,
                  eraseShapesAndHighlighter: value,
                },
              },
            })
          }
        />
      </CoreToolbarShell>
    );
  }

  if (screen === "shapes") {
    return (
      <CoreToolbarShell title="Shapes" onBack={() => setScreen("main")} onClose={onClose}>
        <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-stone-400">
          Shape type
        </p>
        <div className="flex flex-wrap gap-2 px-2">
          {(["rect", "ellipse", "triangle", "line", "arrow"] as const).map((kind) => (
            <OptionChip
              key={kind}
              label={kind}
              active={state.shapeKind === kind}
              onClick={() => {
                actions.onSetInkTool("shape");
                actions.onSetShapeKind(kind);
                onChange({ shapeKind: kind, inkTool: "shape" });
              }}
            />
          ))}
        </div>
        <div className="mt-3 border-t border-stone-100 pt-2">
          <ToggleRow
            label="Require hold to snap"
            checked={state.shapeDraw.requireHoldToSnap}
            onChange={(value) =>
              onChange({ shapeDraw: { ...state.shapeDraw, requireHoldToSnap: value } })
            }
          />
          <ToggleRow
            label="Snap to other shapes"
            checked={state.shapeDraw.snapToShapes}
            onChange={(value) =>
              onChange({ shapeDraw: { ...state.shapeDraw, snapToShapes: value } })
            }
          />
          <ToggleRow
            label="Fill color"
            checked={state.shapeDraw.fillColor}
            onChange={(value) =>
              onChange({ shapeDraw: { ...state.shapeDraw, fillColor: value } })
            }
          />
        </div>
      </CoreToolbarShell>
    );
  }

  if (screen === "text") {
    return (
      <CoreToolbarShell title="Text" onBack={() => setScreen("main")} onClose={onClose}>
        <p className="px-2 text-xs text-stone-500">
          Select stays on Select — use the button below only when you want to add a text box.
        </p>
        <CoreChromeAction
          onActivate={() => {
            actions.onAddTextBox();
            onClose();
          }}
          className="mt-3 w-full min-h-11 rounded-xl bg-stone-900 px-3 py-2.5 text-xs font-bold text-white touch-manipulation"
        >
          Place text box
        </CoreChromeAction>
      </CoreToolbarShell>
    );
  }

  if (screen === "lines") {
    return (
      <CoreToolbarShell title="Lines & borders" onBack={() => setScreen("main")} onClose={onClose}>
        <p className="mb-2 px-2 text-xs text-stone-500">
          Drop a line, divider, or border box onto the page — then resize or rotate it.
        </p>
        <div className="grid grid-cols-2 gap-2 px-1">
          {LINE_BORDER_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CoreChromeAction
                key={item.kind}
                onActivate={() => {
                  actions.onAddDecoration(item.kind);
                  onClose();
                }}
                className="flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 py-3 text-stone-700 touch-manipulation hover:border-orange-200 hover:bg-orange-50"
              >
                <Icon
                  className={`h-5 w-5 ${item.kind === "vline" ? "rotate-90" : ""}`}
                />
                <span className="text-[10px] font-bold">{item.label}</span>
              </CoreChromeAction>
            );
          })}
        </div>
        <div className="mt-3 border-t border-stone-100 pt-2">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Or draw on the page
          </p>
          <div className="flex flex-wrap gap-2 px-2">
            {(["line", "arrow"] as const).map((kind) => (
              <OptionChip
                key={kind}
                label={`Draw ${kind}`}
                active={state.shapeKind === kind && state.inkTool === "shape"}
                onClick={() => {
                  actions.onSetInkTool("shape");
                  actions.onSetShapeKind(kind);
                  onChange({ shapeKind: kind, inkTool: "shape" });
                  onClose();
                }}
              />
            ))}
          </div>
        </div>
      </CoreToolbarShell>
    );
  }

  return (
    <CoreToolbarShell title="Formatting" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {FORMAT_ACTIONS.map((item) => {
          const Icon = item.icon;
          const active = item.active?.(ctx) ?? false;
          return (
            <CoreChromeAction
              key={item.id}
              pressed={active}
              onActivate={() => {
                item.run(actions);
                if (item.drillDown && item.screen) {
                  setScreen(item.screen);
                  return;
                }
                if (!item.drillDown) onClose();
              }}
              className={`flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition touch-manipulation ${
                active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-orange-200 hover:bg-orange-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </CoreChromeAction>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-stone-100 pt-3">
        <CoreChromeAction
          onActivate={actions.onUndo}
          disabled={!actions.canUndo || state.readOnly}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 touch-manipulation disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </CoreChromeAction>
        <CoreChromeAction
          onActivate={actions.onRedo}
          disabled={!actions.canRedo || state.readOnly}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 touch-manipulation disabled:opacity-40"
        >
          <Redo2 className="h-4 w-4" />
          Redo
        </CoreChromeAction>
        <CoreChromeAction
          onActivate={() => {
            actions.onClearPage();
            onClose();
          }}
          disabled={state.readOnly}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2.5 text-xs font-bold text-rose-700 touch-manipulation disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </CoreChromeAction>
      </div>
    </CoreToolbarShell>
  );
}
