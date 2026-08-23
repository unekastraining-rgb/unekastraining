"use client";

import { Plus, Trash2 } from "lucide-react";

import type { QaData } from "@/lib/core/note-types";
import { emptyQa } from "@/lib/core/note-types";

export { emptyQa };

export function QaEditor({
  data,
  onChange,
}: {
  data: QaData;
  onChange: (data: QaData) => void;
}) {
  const updatePair = (index: number, field: "question" | "answer", value: string) => {
    onChange({
      pairs: data.pairs.map((pair, pairIndex) =>
        pairIndex === index ? { ...pair, [field]: value } : pair,
      ),
    });
  };

  const addPair = () => {
    onChange({ pairs: [...data.pairs, { question: "", answer: "" }] });
  };

  const removePair = (index: number) => {
    if (data.pairs.length <= 1) return;
    onChange({ pairs: data.pairs.filter((_, pairIndex) => pairIndex !== index) });
  };

  return (
    <div className="space-y-4 p-4">
      <button
        type="button"
        onClick={addPair}
        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add Q&A pair
      </button>

      {data.pairs.map((pair, index) => (
        <div
          key={index}
          className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Pair {index + 1}
            </p>
            <button
              type="button"
              onClick={() => removePair(index)}
              className="rounded p-1 text-stone-400 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <label className="text-xs font-semibold text-stone-500">Question</label>
          <input
            value={pair.question}
            onChange={(event) => updatePair(index, "question", event.target.value)}
            placeholder="What is...?"
            className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
          />
          <label className="mt-3 block text-xs font-semibold text-stone-500">Answer</label>
          <textarea
            value={pair.answer}
            onChange={(event) => updatePair(index, "answer", event.target.value)}
            placeholder="Your answer..."
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
      ))}
    </div>
  );
}
