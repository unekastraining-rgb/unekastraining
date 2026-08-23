"use client";

import { useState } from "react";

import { ColorPicker } from "@/components/customization/ColorPicker";
import { CompactPalettePicker } from "@/components/customization/CompactPalettePicker";
import { INK_COLORS } from "@/lib/core/ink-engine";

export function InkColorControls({
  inkColor,
  onInkColorChange,
  label = "Pen color",
}: {
  inkColor: string;
  onInkColorChange: (color: string) => void;
  label?: string;
}) {
  const [paletteSwatches, setPaletteSwatches] = useState<string[]>([]);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ColorPicker compact value={inkColor} onChange={onInkColorChange} label="Ink" />
        {INK_COLORS.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.label}
            onClick={() => onInkColorChange(option.value)}
            className={`h-6 w-6 rounded-full ring-1 ring-stone-200 ${
              inkColor === option.value ? "ring-2 ring-orange-400" : ""
            }`}
            style={{ backgroundColor: option.value }}
          />
        ))}
      </div>
      {paletteSwatches.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {paletteSwatches.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => onInkColorChange(color)}
              className={`h-5 w-5 rounded-full ring-1 ring-stone-200 ${
                inkColor === color ? "ring-2 ring-orange-400" : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ) : null}
      <CompactPalettePicker
        applyGlobally={false}
        label="Ink palettes"
        showImageImport
        onSelectPalette={(colors) => {
          setPaletteSwatches(colors);
          if (colors[0]) onInkColorChange(colors[0]);
        }}
      />
    </div>
  );
}
