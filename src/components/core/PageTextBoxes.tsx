"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { pointerToLocal } from "@/lib/core/canvas-transform";
import type { PageTextBox } from "@/lib/core/note-types";

function randomId() {
  return `tb_${Math.random().toString(36).slice(2, 9)}`;
}

export function PageTextBoxes({
  boxes,
  onChange,
  active,
  containerRef,
}: {
  boxes: PageTextBox[];
  onChange: (boxes: PageTextBox[]) => void;
  active: boolean;
  containerRef?: React.RefObject<HTMLElement | null>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <>
      {boxes.map((box) => (
        <div
          key={box.id}
          className="absolute z-[3] rounded-xl border border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-sm"
          style={{ left: box.x, top: box.y, width: box.width, minHeight: box.height }}
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-2 py-1">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider text-stone-400 ${
                active ? "cursor-move" : ""
              }`}
              onPointerDown={(event) => {
                if (!active) return;
                event.preventDefault();
                const container = containerRef?.current;
                if (!container) return;
                const pageContainer = container;
                setDraggingId(box.id);
                const start = pointerToLocal(event.clientX, event.clientY, pageContainer);
                const offsetX = start.x - box.x;
                const offsetY = start.y - box.y;
                const el = event.currentTarget.closest(".absolute") as HTMLElement;

                function onMove(moveEvent: PointerEvent) {
                  const point = pointerToLocal(
                    moveEvent.clientX,
                    moveEvent.clientY,
                    pageContainer,
                  );
                  const x = Math.max(0, point.x - offsetX);
                  const y = Math.max(0, point.y - offsetY);
                  if (el) {
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;
                  }
                }

                function onUp(moveEvent: PointerEvent) {
                  setDraggingId(null);
                  window.removeEventListener("pointermove", onMove);
                  window.removeEventListener("pointerup", onUp);
                  const point = pointerToLocal(
                    moveEvent.clientX,
                    moveEvent.clientY,
                    pageContainer,
                  );
                  onChange(
                    boxes.map((item) =>
                      item.id === box.id
                        ? {
                            ...item,
                            x: Math.max(0, point.x - offsetX),
                            y: Math.max(0, point.y - offsetY),
                          }
                        : item,
                    ),
                  );
                }

                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
              }}
            >
              Text box
            </span>
            <button
              type="button"
              onClick={() => onChange(boxes.filter((item) => item.id !== box.id))}
              className="rounded p-0.5 text-stone-400 hover:bg-stone-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <textarea
            value={box.text}
            onChange={(event) =>
              onChange(
                boxes.map((item) =>
                  item.id === box.id ? { ...item, text: event.target.value } : item,
                ),
              )
            }
            onPointerDown={(event) => {
              if (draggingId) event.stopPropagation();
            }}
            placeholder="Type here..."
            className="w-full resize-none bg-transparent p-3 text-sm outline-none"
            style={{ minHeight: box.height - 28, color: box.color }}
            rows={4}
          />
          <div
            className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-stone-300"
            onPointerDown={(event) => {
              event.preventDefault();
              const startY = event.clientY;
              const startH = box.height;
              function onMove(moveEvent: PointerEvent) {
                const nextH = Math.max(80, startH + (moveEvent.clientY - startY));
                onChange(
                  boxes.map((item) =>
                    item.id === box.id ? { ...item, height: nextH } : item,
                  ),
                );
              }
              function onUp() {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              }
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />
        </div>
      ))}
    </>
  );
}

export function createTextBox(x = 48, y = 120): PageTextBox {
  return {
    id: randomId(),
    x,
    y,
    width: 280,
    height: 140,
    text: "",
    color: "#44403c",
  };
}
