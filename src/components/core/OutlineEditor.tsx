"use client";

import { Plus, Trash2 } from "lucide-react";

import type { OutlineNode } from "@/lib/core/note-types";

export function OutlineEditor({
  nodes,
  onChange,
}: {
  nodes: OutlineNode[];
  onChange: (nodes: OutlineNode[]) => void;
}) {
  const updateNode = (index: number, text: string) => {
    onChange(nodes.map((node, i) => (i === index ? { ...node, text } : node)));
  };

  const updateLevel = (index: number, delta: number) => {
    onChange(
      nodes.map((node, i) =>
        i === index ? { ...node, level: Math.max(0, Math.min(3, node.level + delta)) } : node,
      ),
    );
  };

  const addNode = () => {
    onChange([
      ...nodes,
      { id: `o${Date.now()}`, text: "", level: nodes[nodes.length - 1]?.level ?? 0 },
    ]);
  };

  const removeNode = (index: number) => {
    if (nodes.length <= 1) return;
    onChange(nodes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 p-4">
      <button
        type="button"
        onClick={addNode}
        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add heading
      </button>
      {nodes.map((node, index) => (
        <div key={node.id} className="flex items-start gap-2">
          <div className="flex flex-col gap-0.5 pt-2">
            <button
              type="button"
              onClick={() => updateLevel(index, -1)}
              className="rounded px-1 text-[10px] text-stone-400 hover:bg-stone-100"
              aria-label="Outdent"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => updateLevel(index, 1)}
              className="rounded px-1 text-[10px] text-stone-400 hover:bg-stone-100"
              aria-label="Indent"
            >
              ▶
            </button>
          </div>
          <input
            value={node.text}
            onChange={(event) => updateNode(index, event.target.value)}
            placeholder={node.level === 0 ? "Main heading" : "Sub-point"}
            style={{ marginLeft: node.level * 20 }}
            className="min-w-0 flex-1 rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
          />
          <button
            type="button"
            onClick={() => removeNode(index)}
            className="mt-2 rounded p-1 text-stone-400 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
