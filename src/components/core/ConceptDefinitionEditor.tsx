"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ConceptEntry } from "@/lib/core/note-types";

export function ConceptDefinitionEditor({
  items,
  onChange,
  bare = false,
}: {
  items: ConceptEntry[];
  onChange: (items: ConceptEntry[]) => void;
  bare?: boolean;
}) {
  const update = (index: number, field: keyof ConceptEntry, value: string) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    onChange([...items, { term: "", definition: "", example: "", application: "" }]);
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
            <input
              value={item.term}
              onChange={(e) => update(index, "term", e.target.value)}
              placeholder="Term"
              className="w-full bg-transparent text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-300"
            />
            <textarea
              value={item.definition}
              onChange={(e) => update(index, "definition", e.target.value)}
              placeholder="Definition"
              rows={2}
              className="w-full min-w-0 resize-none bg-transparent text-sm leading-relaxed text-stone-700 outline-none placeholder:text-stone-300 [overflow-wrap:anywhere]"
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
          <Plus className="h-3 w-3" /> Add concept
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
        <Plus className="h-3.5 w-3.5" /> Add concept
      </button>
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Concept {index + 1}
            </p>
            <button type="button" onClick={() => removeItem(index)} className="text-stone-400 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Field label="Term" value={item.term} onChange={(v) => update(index, "term", v)} />
          <Field label="Definition" value={item.definition} onChange={(v) => update(index, "definition", v)} multiline />
          <Field label="Example" value={item.example} onChange={(v) => update(index, "example", v)} multiline />
          <Field label="Application" value={item.application} onChange={(v) => update(index, "application", v)} multiline />
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const className =
    "mt-1 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200";
  return (
    <label className="mt-2 block text-xs font-semibold text-stone-500">
      {label}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={className} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={className} />
      )}
    </label>
  );
}
