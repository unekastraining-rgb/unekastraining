"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ProgressiveStep } from "@/lib/core/note-types";

export function ProgressiveEditor({
  steps,
  onChange,
}: {
  steps: ProgressiveStep[];
  onChange: (steps: ProgressiveStep[]) => void;
}) {
  const update = (index: number, patch: Partial<ProgressiveStep>) => {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  const addStep = () => {
    onChange([...steps, { title: `Step ${steps.length + 1}`, content: "", code: "", output: "" }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    onChange(steps.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs text-stone-500">
        Build complexity step by step — ideal for code, math, and worked examples.
      </p>
      <button
        type="button"
        onClick={addStep}
        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add step
      </button>
      {steps.map((step, index) => (
        <div key={index} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <input
              value={step.title}
              onChange={(event) => update(index, { title: event.target.value })}
              className="font-bold text-stone-900 outline-none"
              placeholder="Step title"
            />
            <button type="button" onClick={() => removeStep(index)} className="text-stone-400 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={step.content}
            onChange={(event) => update(index, { content: event.target.value })}
            placeholder="Explain this step..."
            rows={2}
            className="w-full resize-none rounded-xl border border-orange-100 px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={step.code ?? ""}
            onChange={(event) => update(index, { code: event.target.value })}
            placeholder="Code or formula (optional)"
            rows={2}
            className="mt-2 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs outline-none"
          />
          <input
            value={step.output ?? ""}
            onChange={(event) => update(index, { output: event.target.value })}
            placeholder="Output / result (optional)"
            className="mt-2 w-full rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-2 text-sm outline-none"
          />
        </div>
      ))}
    </div>
  );
}
