"use client";

import {
  Eraser,
  Highlighter,
  Lasso,
  Hand,
  Pencil,
  Redo2,
  Square,
  Undo2,
} from "lucide-react";

import { ColorPicker } from "@/components/customization/ColorPicker";
import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import {
  HIGHLIGHTER_COLORS,
  HIGHLIGHTER_SIZES,
  INK_COLORS,
  INK_SIZES,
  type InkTool,
  type ShapeKind,
} from "@/lib/core/ink-engine";

export function InkToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  size,
  onSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  pencilOnly,
  onPencilOnlyChange,
  shapeKind = "rect",
  onShapeKindChange,
  className = "",
}: {
  tool: InkTool;
  onToolChange: (tool: InkTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  pencilOnly: boolean;
  onPencilOnlyChange: (value: boolean) => void;
  shapeKind?: ShapeKind;
  onShapeKindChange?: (kind: ShapeKind) => void;
  className?: string;
}) {
  return (
    <div
      data-pdf-ink-toolbar
      data-canvas-inspector
      className={`flex flex-wrap items-center gap-2 rounded-2xl border border-orange-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur touch-manipulation ${className}`}
    >
      <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
        <ToolButton
          active={tool === "pen"}
          onActivate={() => onToolChange("pen")}
          label="Pen"
          icon={Pencil}
        />
        <ToolButton
          active={tool === "highlighter"}
          onActivate={() => onToolChange("highlighter")}
          label="Highlight"
          icon={Highlighter}
        />
        <ToolButton
          active={tool === "eraser"}
          onActivate={() => onToolChange("eraser")}
          label="Eraser"
          icon={Eraser}
        />
        <ToolButton
          active={tool === "lasso"}
          onActivate={() => onToolChange("lasso")}
          label="Lasso"
          icon={Lasso}
        />
        <ToolButton
          active={tool === "hand"}
          onActivate={() => onToolChange("hand")}
          label="Pan"
          icon={Hand}
        />
        <ToolButton
          active={tool === "shape"}
          onActivate={() => onToolChange("shape")}
          label="Shape"
          icon={Square}
        />
      </div>

      {tool === "shape" && onShapeKindChange ? (
        <select
          value={shapeKind}
          onChange={(event) => onShapeKindChange(event.target.value as ShapeKind)}
          className="rounded-lg border border-orange-100 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700"
        >
          <option value="rect">Rectangle</option>
          <option value="ellipse">Ellipse</option>
          <option value="line">Line</option>
          <option value="arrow">Arrow</option>
        </select>
      ) : null}

      <div className="flex items-center gap-1">
        <ColorPicker compact touchFriendly value={color} onChange={onColorChange} label="Ink" />
        <div className="flex items-center gap-0.5">
          {(tool === "highlighter" ? HIGHLIGHTER_COLORS : INK_COLORS).map((option) => (
            <CoreChromeAction
              key={option.id}
              title={option.label}
              aria-label={option.label}
              onActivate={() => onColorChange(option.value)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full ring-1 ring-stone-200 touch-manipulation ${
                color.toLowerCase() === option.value.toLowerCase() ? "ring-2 ring-stone-900" : ""
              }`}
              pressed={color.toLowerCase() === option.value.toLowerCase()}
            >
              <span
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: option.value }}
                aria-hidden
              />
            </CoreChromeAction>
          ))}
        </div>
      </div>

      <select
        value={
          (tool === "highlighter" ? HIGHLIGHTER_SIZES : INK_SIZES).some(
            (option) => option.value === size,
          )
            ? size
            : tool === "highlighter"
              ? 14
              : size
        }
        onChange={(event) => onSizeChange(Number(event.target.value))}
        className="min-h-11 rounded-lg border border-orange-100 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700 touch-manipulation"
        aria-label="Stroke size"
      >
        {(tool === "highlighter" ? HIGHLIGHTER_SIZES : INK_SIZES).map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <CoreChromeAction
          onActivate={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-stone-600 hover:bg-orange-50 disabled:opacity-40 touch-manipulation"
        >
          <Undo2 className="h-4 w-4" />
        </CoreChromeAction>
        <CoreChromeAction
          onActivate={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-stone-600 hover:bg-orange-50 disabled:opacity-40 touch-manipulation"
        >
          <Redo2 className="h-4 w-4" />
        </CoreChromeAction>
      </div>

      <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-600">
        <input
          type="checkbox"
          checked={pencilOnly}
          onChange={(event) => onPencilOnlyChange(event.target.checked)}
          className="rounded border-orange-300 text-orange-500"
        />
        Pencil only
      </label>
    </div>
  );
}

function ToolButton({
  active,
  onActivate,
  label,
  icon: Icon,
}: {
  active: boolean;
  onActivate: () => void;
  label: string;
  icon: typeof Pencil;
}) {
  return (
    <CoreChromeAction
      onActivate={onActivate}
      title={label}
      pressed={active}
      className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold touch-manipulation ${
        active ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </CoreChromeAction>
  );
}
