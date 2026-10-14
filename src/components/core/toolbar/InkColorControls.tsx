"use client";

import { useState, type CSSProperties } from "react";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { ColorPicker } from "@/components/customization/ColorPicker";
import { CompactPalettePicker } from "@/components/customization/CompactPalettePicker";
import {
  CHALK_COLORS,
  COLOR_PENCIL_COLORS,
  CRAYON_COLORS,
  HIGHLIGHTER_COLORS,
  INK_COLORS,
  INK_FILL_PATTERNS,
  MARKER_COLORS,
  type InkFillPattern,
} from "@/lib/core/ink-engine";

export function InkColorControls({
  inkColor,
  onInkColorChange,
  label = "Pen color",
  palette = "ink",
  fillPattern = "solid",
  onFillPatternChange,
}: {
  inkColor: string;
  onInkColorChange: (color: string) => void;
  label?: string;
  palette?: "ink" | "highlighter" | "chalk" | "crayon" | "colorPencil" | "marker";
  fillPattern?: InkFillPattern;
  onFillPatternChange?: (pattern: InkFillPattern) => void;
}) {
  const [paletteSwatches, setPaletteSwatches] = useState<string[]>([]);
  const presets =
    palette === "highlighter"
      ? HIGHLIGHTER_COLORS
      : palette === "chalk"
        ? CHALK_COLORS
        : palette === "crayon"
          ? CRAYON_COLORS
          : palette === "colorPencil"
            ? COLOR_PENCIL_COLORS
            : palette === "marker"
              ? MARKER_COLORS
              : INK_COLORS;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <ColorPicker
            compact
            touchFriendly
            value={inkColor}
            onChange={onInkColorChange}
            label="Color wheel"
          />
          <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-600">
            Wheel
          </span>
        </div>
        {presets.map((option) => (
          <CoreChromeAction
            key={option.id}
            title={option.label}
            aria-label={option.label}
            pressed={inkColor === option.value && fillPattern === "solid"}
            onActivate={() => onInkColorChange(option.value)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation ${
              inkColor === option.value && fillPattern === "solid"
                ? "ring-2 ring-orange-400"
                : "ring-1 ring-stone-200"
            }`}
          >
            <span
              className="h-7 w-7 rounded-full ring-1 ring-stone-200"
              style={{ backgroundColor: option.value }}
            />
          </CoreChromeAction>
        ))}
      </div>

      {onFillPatternChange ? (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Design with your color
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INK_FILL_PATTERNS.map((pattern) => (
              <CoreChromeAction
                key={pattern.id}
                title={pattern.label}
                aria-label={pattern.label}
                pressed={fillPattern === pattern.id}
                onActivate={() => onFillPatternChange(pattern.id)}
                className={`inline-flex min-h-11 min-w-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1 touch-manipulation ${
                  fillPattern === pattern.id
                    ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
                    : "border-stone-200 bg-white"
                }`}
              >
                <span
                  className="h-5 w-8 rounded-md ring-1 ring-stone-200"
                  style={patternPreviewStyle(inkColor, pattern.id)}
                  aria-hidden
                />
                <span className="text-[8px] font-bold uppercase tracking-wide text-stone-500">
                  {pattern.label}
                </span>
              </CoreChromeAction>
            ))}
          </div>
        </div>
      ) : null}

      {paletteSwatches.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {paletteSwatches.map((color) => (
            <CoreChromeAction
              key={color}
              title={color}
              aria-label={`Color ${color}`}
              pressed={inkColor === color}
              onActivate={() => onInkColorChange(color)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation ${
                inkColor === color ? "ring-2 ring-orange-400" : "ring-1 ring-stone-200"
              }`}
            >
              <span
                className="h-6 w-6 rounded-full ring-1 ring-stone-200"
                style={{ backgroundColor: color }}
              />
            </CoreChromeAction>
          ))}
        </div>
      ) : null}
      <CompactPalettePicker
        applyGlobally={false}
        label={palette === "highlighter" ? "Marker palettes" : "Ink palettes"}
        showImageImport
        touchFriendly
        onSelectPalette={(colors) => {
          setPaletteSwatches(colors);
          if (colors[0]) onInkColorChange(colors[0]);
        }}
      />
    </div>
  );
}

function patternPreviewStyle(color: string, pattern: InkFillPattern): CSSProperties {
  if (pattern === "solid") return { backgroundColor: color };
  if (pattern === "stripes") {
    return {
      backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 3px, transparent 3px 6px)`,
    };
  }
  if (pattern === "bubbles") {
    return {
      backgroundColor: "transparent",
      backgroundImage: `radial-gradient(circle at 30% 35%, transparent 40%, ${color} 42%, transparent 44%), radial-gradient(circle at 70% 70%, transparent 38%, ${color} 40%, transparent 42%)`,
    };
  }
  if (pattern === "dots") {
    return {
      backgroundImage: `radial-gradient(${color} 1.4px, transparent 1.5px)`,
      backgroundSize: "6px 6px",
    };
  }
  return {
    backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
    backgroundSize: "6px 6px",
  };
}
