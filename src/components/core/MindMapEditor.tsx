"use client";

import { useCallback, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { MindMapData, MindMapNode } from "@/lib/core/note-types";
import { emptyMindMap } from "@/lib/core/note-types";

export type { MindMapData, MindMapNode };
export { emptyMindMap };

export function MindMapEditor({
  data,
  onChange,
}: {
  data: MindMapData;
  onChange: (data: MindMapData) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const addNode = () => {
    const id = `node-${Date.now()}`;
    onChange({
      ...data,
      nodes: [
        ...data.nodes,
        {
          id,
          label: "New idea",
          x: 120 + Math.random() * 320,
          y: 80 + Math.random() * 240,
        },
      ],
    });
  };

  const updateNode = (id: string, patch: Partial<MindMapNode>) => {
    onChange({
      ...data,
      nodes: data.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    });
  };

  const removeNode = (id: string) => {
    if (id === "root") return;
    onChange({
      nodes: data.nodes.filter((node) => node.id !== id),
      edges: data.edges.filter((edge) => edge.from !== id && edge.to !== id),
    });
  };

  const toggleLink = (id: string) => {
    if (!linkFrom) {
      setLinkFrom(id);
      return;
    }
    if (linkFrom === id) {
      setLinkFrom(null);
      return;
    }
    const exists = data.edges.some(
      (edge) =>
        (edge.from === linkFrom && edge.to === id) ||
        (edge.from === id && edge.to === linkFrom),
    );
    if (!exists) {
      onChange({ ...data, edges: [...data.edges, { from: linkFrom, to: id }] });
    }
    setLinkFrom(null);
  };

  const onPointerDown = (id: string, event: React.PointerEvent) => {
    const node = data.nodes.find((item) => item.id === id);
    if (!node) return;
    setDraggingId(id);
    dragOffset.current = { x: event.clientX - node.x, y: event.clientY - node.y };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!draggingId) return;
      const parent = canvasRef.current?.getBoundingClientRect();
      if (!parent) return;
      updateNode(draggingId, {
        x: Math.max(40, Math.min(parent.width - 40, event.clientX - parent.left - dragOffset.current.x)),
        y: Math.max(40, Math.min(parent.height - 40, event.clientY - parent.top - dragOffset.current.y)),
      });
    },
    [draggingId, data, onChange],
  );

  const onPointerUp = () => setDraggingId(null);

  const nodeCenter = (id: string) => {
    const node = data.nodes.find((item) => item.id === id);
    return node ? { x: node.x + 70, y: node.y + 22 } : { x: 0, y: 0 };
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-orange-100 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-orange-50 px-3 py-2">
        <button
          type="button"
          onClick={addNode}
          className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
        >
          <Plus className="h-3.5 w-3.5" /> Add node
        </button>
        <p className="text-xs text-stone-500">
          {linkFrom
            ? "Click another node to connect"
            : "Double-click a node to start a link · drag to move"}
        </p>
      </div>

      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden bg-[radial-gradient(circle,#fed7aa33_1px,transparent_1px)] bg-[length:20px_20px]"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {data.edges.map((edge) => {
            const from = nodeCenter(edge.from);
            const to = nodeCenter(edge.to);
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#fdba74"
                strokeWidth={2}
              />
            );
          })}
        </svg>

        {data.nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute w-[140px] rounded-xl border-2 bg-white p-2 shadow-sm ${
              linkFrom === node.id
                ? "border-teal-500 ring-2 ring-teal-200"
                : node.id === "root"
                  ? "border-orange-400"
                  : "border-orange-200"
            }`}
            style={{ left: node.x, top: node.y }}
            onPointerDown={(event) => onPointerDown(node.id, event)}
            onDoubleClick={() => toggleLink(node.id)}
          >
            <input
              value={node.label}
              onChange={(event) => updateNode(node.id, { label: event.target.value })}
              className="w-full border-none bg-transparent text-sm font-semibold text-stone-900 outline-none"
              onPointerDown={(event) => event.stopPropagation()}
            />
            {node.id !== "root" ? (
              <button
                type="button"
                onClick={() => removeNode(node.id)}
                className="mt-1 text-stone-400 hover:text-red-500"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
