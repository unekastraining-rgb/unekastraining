"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ProblemSolutionEntry } from "@/lib/core/note-types";

export function ProblemSolutionEditor({
  items,
  onChange,
  bare = false,
}: {
  items: ProblemSolutionEntry[];
  onChange: (items: ProblemSolutionEntry[]) => void;
  bare?: boolean;
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

  if (bare) {
    return (
      <div className="space-y-2 px-0.5 py-0.5">
        {items.map((item, index) => (
          <div key={index} className="group relative space-y-0.5">
            <textarea
              value={item.problem}
              onChange={(event) => update(index, "problem", event.target.value)}
              placeholder="Problem"
              rows={1}
              className="w-full resize-none bg-transparent text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-300"
            />
            <textarea
              value={item.approach}
              onChange={(event) => update(index, "approach", event.target.value)}
              placeholder="Approach"
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-300"
            />
            <textarea
              value={item.solution}
              onChange={(event) => update(index, "solution", event.target.value)}
              placeholder="Solution"
              rows={2}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-stone-700 outline-none placeholder:text-stone-300"
            />
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute -right-1 top-0 hidden rounded p-0.5 text-stone-300 hover:text-rose-500 group-hover:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-teal-700"
        >
          <Plus className="h-3 w-3" /> Add problem
        </button>
      </div>
    );
  }

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
