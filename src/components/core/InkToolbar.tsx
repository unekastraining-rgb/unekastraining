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
import {
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
      className={`flex flex-wrap items-center gap-2 rounded-2xl border border-orange-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur ${className}`}
    >
      <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
        <ToolButton
          active={tool === "pen"}
          onClick={() => onToolChange("pen")}
          label="Pen"
          icon={Pencil}
        />
        <ToolButton
          active={tool === "highlighter"}
          onClick={() => onToolChange("highlighter")}
          label="Highlight"
          icon={Highlighter}
        />
        <ToolButton
          active={tool === "eraser"}
          onClick={() => onToolChange("eraser")}
          label="Eraser"
          icon={Eraser}
        />
        <ToolButton
          active={tool === "lasso"}
          onClick={() => onToolChange("lasso")}
          label="Lasso"
          icon={Lasso}
        />
        <ToolButton
          active={tool === "hand"}
          onClick={() => onToolChange("hand")}
          label="Pan"
          icon={Hand}
        />
        <ToolButton
          active={tool === "shape"}
          onClick={() => onToolChange("shape")}
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
        <ColorPicker compact value={color} onChange={onColorChange} label="Ink" />
        <div className="flex items-center gap-0.5">
          {INK_COLORS.map((option) => (
            <button
              key={option.id}
              type="button"
              title={option.label}
              onClick={() => onColorChange(option.value)}
              className={`h-5 w-5 rounded-full ring-1 ring-stone-200 ${
                color.toLowerCase() === option.value.toLowerCase() ? "ring-2 ring-stone-900" : ""
              }`}
              style={{ backgroundColor: option.value }}
              aria-label={option.label}
            />
          ))}
        </div>
      </div>

      <select
        value={size}
        onChange={(event) => onSizeChange(Number(event.target.value))}
        className="rounded-lg border border-orange-100 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700"
        aria-label="Stroke size"
      >
        {INK_SIZES.map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-lg p-2 text-stone-600 hover:bg-orange-50 disabled:opacity-40"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded-lg p-2 text-stone-600 hover:bg-orange-50 disabled:opacity-40"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
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
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof Pencil;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        active ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
