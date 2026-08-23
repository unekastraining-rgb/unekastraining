"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { FlowData, FlowNode } from "@/lib/core/note-types";
import { emptyFlow } from "@/lib/core/note-types";

export { emptyFlow };

export function FlowDiagramEditor({
  data,
  onChange,
}: {
  data: FlowData;
  onChange: (data: FlowData) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const addNode = () => {
    const id = `flow-${Date.now()}`;
    onChange({
      ...data,
      nodes: [
        ...data.nodes,
        {
          id,
          label: "New step",
          x: 120 + Math.random() * 280,
          y: 80 + Math.random() * 200,
        },
      ],
    });
  };

  const updateNode = (id: string, patch: Partial<FlowNode>) => {
    onChange({
      ...data,
      nodes: data.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    });
  };

  const removeNode = (id: string) => {
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
      (edge) => edge.from === linkFrom && edge.to === id,
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

  const onPointerMove = (event: React.PointerEvent) => {
    if (!draggingId) return;
    updateNode(draggingId, {
      x: event.clientX - dragOffset.current.x,
      y: event.clientY - dragOffset.current.y,
    });
  };

  const onPointerUp = () => setDraggingId(null);

  return (
    <div className="flex h-full min-h-[24rem] flex-col">
      <div className="flex flex-wrap gap-2 border-b border-orange-100 bg-orange-50/40 p-2">
        <button
          type="button"
          onClick={addNode}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Add step
        </button>
        <p className="self-center text-xs text-stone-500">
          {linkFrom ? "Click another step to connect" : "Click a step twice to draw arrows"}
        </p>
      </div>

      <div
        ref={canvasRef}
        className="relative min-h-[22rem] flex-1 overflow-auto bg-[radial-gradient(circle_at_1px_1px,#f5d0a8_1px,transparent_0)] bg-[length:20px_20px]"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {data.edges.map((edge) => {
            const from = data.nodes.find((node) => node.id === edge.from);
            const to = data.nodes.find((node) => node.id === edge.to);
            if (!from || !to) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x + 60}
                y1={from.y + 24}
                x2={to.x + 60}
                y2={to.y + 24}
                stroke="#0d9488"
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#0d9488" />
            </marker>
          </defs>
        </svg>

        {data.nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute w-[120px] rounded-xl border-2 bg-white shadow-sm ${
              linkFrom === node.id ? "border-teal-500 ring-2 ring-teal-200" : "border-orange-200"
            }`}
            style={{ left: node.x, top: node.y }}
            onPointerDown={(event) => onPointerDown(node.id, event)}
          >
            <input
              value={node.label}
              onChange={(event) => updateNode(node.id, { label: event.target.value })}
              className="w-full rounded-t-[10px] border-b border-orange-100 bg-teal-50 px-2 py-1.5 text-xs font-semibold outline-none"
            />
            <div className="flex justify-between p-1">
              <button
                type="button"
                onClick={() => toggleLink(node.id)}
                className="rounded px-2 py-0.5 text-[10px] font-semibold text-teal-700 hover:bg-teal-50"
              >
                Link
              </button>
              <button
                type="button"
                onClick={() => removeNode(node.id)}
                className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
