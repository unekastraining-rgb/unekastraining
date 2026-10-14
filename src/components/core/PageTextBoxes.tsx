"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { RichTextEditor } from "@/components/core/RichTextEditor";
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
          className={`absolute z-[3] rounded-lg bg-transparent ${
            active ? "outline outline-1 outline-dashed outline-orange-300/80" : "border-0"
          }`}
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            minHeight: Math.max(28, box.height),
            backgroundColor: box.backgroundColor ?? "transparent",
          }}
        >
          {active ? (
            <div className="flex items-center justify-between px-1 py-0.5">
              <span
                className="cursor-move text-[9px] font-bold uppercase tracking-wider text-stone-400"
                onPointerDown={(event) => {
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
                Text
              </span>
              <CoreChromeAction
                onActivate={() => onChange(boxes.filter((item) => item.id !== box.id))}
                className="rounded p-0.5 text-stone-400 hover:bg-stone-100"
                title="Delete text box"
                aria-label="Delete text box"
              >
                <X className="h-3 w-3" />
              </CoreChromeAction>
            </div>
          ) : null}
          <RichTextEditor
            id={box.id}
            text={box.text}
            html={box.html}
            color={box.color}
            selected={active}
            bare
            placeholder={active ? "Type…" : ""}
            className="w-full bg-transparent"
            style={{ minHeight: Math.max(24, box.height - (active ? 22 : 0)) }}
            onPointerDown={(event) => {
              if (draggingId) event.stopPropagation();
            }}
            onChange={({ text, html }) =>
              onChange(
                boxes.map((item) =>
                  item.id === box.id ? { ...item, text, html } : item,
                ),
              )
            }
          />
          {active ? (
            <div
              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-stone-300"
              onPointerDown={(event) => {
                event.preventDefault();
                const startY = event.clientY;
                const startH = box.height;
                function onMove(moveEvent: PointerEvent) {
                  const nextH = Math.max(28, startH + (moveEvent.clientY - startY));
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
          ) : null}
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
    width: 220,
    height: 36,
    text: "",
    color: "#44403c",
    backgroundColor: "transparent",
  };
}
