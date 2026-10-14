"use client";

import { Plus, Trash2 } from "lucide-react";

import type { OutlineNode } from "@/lib/core/note-types";

export function OutlineEditor({
  nodes,
  onChange,
  bare = false,
}: {
  nodes: OutlineNode[];
  onChange: (nodes: OutlineNode[]) => void;
  bare?: boolean;
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

  if (bare) {
    return (
      <div className="space-y-1 px-0.5 py-0.5">
        {nodes.map((node, index) => (
          <div
            key={node.id}
            className="group flex items-start gap-1"
            style={{ paddingLeft: node.level * 16 }}
          >
            <span className="mt-1.5 select-none text-[10px] text-stone-300">•</span>
            <textarea
              value={node.text}
              onChange={(event) => updateNode(index, event.target.value)}
              placeholder={node.level === 0 ? "Main point" : "Sub-point"}
              rows={2}
              className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-relaxed text-stone-800 outline-none placeholder:text-stone-300 [overflow-wrap:anywhere]"
            />
            <div className="hidden gap-0.5 group-hover:flex">
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
              {nodes.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeNode(index)}
                  className="rounded p-0.5 text-stone-300 hover:text-rose-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addNode}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-teal-700"
        >
          <Plus className="h-3 w-3" /> Add point
        </button>
      </div>
    );
  }

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
