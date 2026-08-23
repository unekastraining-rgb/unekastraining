"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ConceptEntry } from "@/lib/core/note-types";

export function ConceptDefinitionEditor({
  items,
  onChange,
}: {
  items: ConceptEntry[];
  onChange: (items: ConceptEntry[]) => void;
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
