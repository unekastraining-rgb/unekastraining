"use client";

import { Plus, Trash2 } from "lucide-react";

import type { TwoColumnRow } from "@/lib/core/note-types";

export function TwoColumnEditor({
  leftHeader,
  rightHeader,
  rows,
  onChange,
}: {
  leftHeader: string;
  rightHeader: string;
  rows: TwoColumnRow[];
  onChange: (data: { leftHeader: string; rightHeader: string; rows: TwoColumnRow[] }) => void;
}) {
  const updateRow = (index: number, side: "left" | "right", value: string) => {
    onChange({
      leftHeader,
      rightHeader,
      rows: rows.map((row, i) => (i === index ? { ...row, [side]: value } : row)),
    });
  };

  const addRow = () => {
    onChange({ leftHeader, rightHeader, rows: [...rows, { left: "", right: "" }] });
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChange({ leftHeader, rightHeader, rows: rows.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-2 border-b border-orange-200 pb-2">
        <input
          value={leftHeader}
          onChange={(e) => onChange({ leftHeader: e.target.value, rightHeader, rows })}
          className="text-xs font-bold uppercase tracking-wider text-teal-700 outline-none"
        />
        <input
          value={rightHeader}
          onChange={(e) => onChange({ leftHeader, rightHeader: e.target.value, rows })}
          className="text-xs font-bold uppercase tracking-wider text-teal-700 outline-none"
        />
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={row.left}
              onChange={(e) => updateRow(index, "left", e.target.value)}
              className="rounded-xl border border-orange-100 px-3 py-2 text-sm outline-none"
            />
            <input
              value={row.right}
              onChange={(e) => updateRow(index, "right", e.target.value)}
              className="rounded-xl border border-orange-100 px-3 py-2 text-sm outline-none"
            />
            <button type="button" onClick={() => removeRow(index)} className="text-stone-400 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add row
      </button>
    </div>
  );
}
