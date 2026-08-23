"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ProblemSolutionEntry } from "@/lib/core/note-types";

export function ProblemSolutionEditor({
  items,
  onChange,
}: {
  items: ProblemSolutionEntry[];
  onChange: (items: ProblemSolutionEntry[]) => void;
}) {
  const update = (index: number, field: keyof ProblemSolutionEntry, value: string) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    onChange([...items, { problem: "", approach: "", solution: "", notes: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4">
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add problem
      </button>
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
              Problem {index + 1}
            </p>
            <button type="button" onClick={() => removeItem(index)} className="text-stone-400 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {(
            [
              ["problem", "Problem", "State the problem clearly"],
              ["approach", "Approach", "Your strategy before solving"],
              ["solution", "Solution", "Answer, code, or result"],
              ["notes", "Reflection", "What to remember next time"],
            ] as const
          ).map(([field, label, placeholder]) => (
            <label key={field} className="mt-2 block text-xs font-semibold text-stone-500">
              {label}
              <textarea
                value={item[field]}
                onChange={(event) => update(index, field, event.target.value)}
                placeholder={placeholder}
                rows={field === "solution" ? 3 : 2}
                className="mt-1 w-full resize-none rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              />
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
