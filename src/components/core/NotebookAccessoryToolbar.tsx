"use client";

import {
  ArrowRight,
  Circle,
  Hash,
  Square,
  StickyNote,
  Type,
} from "lucide-react";

import type { DecorationKind } from "@/lib/core/note-types";

export function NotebookAccessoryToolbar({
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange,
  onAddDecoration,
  onAddTextBox,
}: {
  fontSize: number;
  fontFamily: string;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  onAddDecoration: (kind: DecorationKind) => void;
  onAddTextBox: () => void;
}) {
  const accessories: { kind: DecorationKind; label: string; icon: typeof Square }[] = [
    { kind: "sticky", label: "Sticky", icon: StickyNote },
    { kind: "color_block", label: "Block", icon: Square },
    { kind: "number_bubble", label: "Bubble", icon: Hash },
    { kind: "circle", label: "Circle", icon: Circle },
    { kind: "arrow", label: "Arrow", icon: ArrowRight },
    { kind: "dot", label: "Dot", icon: Circle },
    { kind: "shape_rect", label: "Shape", icon: Square },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-orange-100 bg-gradient-to-r from-[#fff8f1] to-white px-3 py-2">
      <div className="flex items-center gap-1 rounded-xl bg-white px-2 py-1 ring-1 ring-stone-200/60">
        <Type className="h-3.5 w-3.5 text-stone-500" />
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="max-w-[6rem] bg-transparent text-[10px] font-semibold text-stone-700 outline-none"
        >
          <option value="inherit">System</option>
          <option value="Georgia, serif">Serif</option>
          <option value="'Courier New', monospace">Mono</option>
          <option value="'Comic Sans MS', cursive">Hand</option>
        </select>
        <input
          type="range"
          min={12}
          max={28}
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-16"
          aria-label="Font size"
        />
        <span className="text-[10px] font-bold text-stone-500">{fontSize}px</span>
      </div>

      {accessories.map(({ kind, label, icon: Icon }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onAddDecoration(kind)}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-700 ring-1 ring-stone-200/60 hover:bg-orange-50"
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}

      <button
        type="button"
        onClick={onAddTextBox}
        className="inline-flex items-center gap-1 rounded-xl bg-stone-900 px-2.5 py-1.5 text-[10px] font-semibold text-white"
      >
        <Square className="h-3.5 w-3.5" /> Text box
      </button>
    </div>
  );
}
