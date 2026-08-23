"use client";

import { X } from "lucide-react";

import type { PageDecoration } from "@/lib/core/note-types";

export function PageDecorationsLayer({
  decorations,
  onChange,
}: {
  decorations: PageDecoration[];
  onChange: (items: PageDecoration[]) => void;
}) {
  return (
    <>
      {decorations.map((item) => (
        <div
          key={item.id}
          className="absolute z-[3]"
          style={{
            left: item.x,
            top: item.y,
            width: item.w,
            height: item.h,
            transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
          }}
        >
          {item.kind === "sticky" ? (
            <div
              className="relative h-full w-full rounded-xl border border-yellow-200/80 shadow-md"
              style={{ backgroundColor: item.color }}
            >
              <button
                type="button"
                onClick={() => onChange(decorations.filter((d) => d.id !== item.id))}
                className="absolute right-1 top-1 rounded p-0.5 hover:bg-black/5"
              >
                <X className="h-3 w-3 text-stone-500" />
              </button>
              <textarea
                value={item.text ?? ""}
                onChange={(e) =>
                  onChange(
                    decorations.map((d) =>
                      d.id === item.id ? { ...d, text: e.target.value } : d,
                    ),
                  )
                }
                className="h-full w-full resize-none bg-transparent p-3 text-sm text-stone-800 outline-none"
              />
            </div>
          ) : null}

          {item.kind === "color_block" ? (
            <div
              className="h-full w-full rounded-xl border border-white/50 shadow-inner"
              style={{ backgroundColor: item.color }}
            />
          ) : null}

          {item.kind === "number_bubble" ? (
            <div
              className="flex h-full w-full items-center justify-center rounded-full text-sm font-black text-white shadow"
              style={{ backgroundColor: item.color }}
            >
              {item.number ?? 1}
            </div>
          ) : null}

          {item.kind === "circle" ? (
            <div
              className="h-full w-full rounded-full border-2 border-white/60 shadow"
              style={{ backgroundColor: item.color }}
            />
          ) : null}

          {item.kind === "dot" ? (
            <div className="h-full w-full rounded-full" style={{ backgroundColor: item.color }} />
          ) : null}

          {item.kind === "arrow" ? (
            <div className="flex h-full items-center" style={{ color: item.color }}>
              <div className="h-0.5 flex-1 bg-current" />
              <div className="ml-[-2px] h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-current" />
            </div>
          ) : null}

          {item.kind === "shape_rect" ? (
            <div
              className="h-full w-full rounded-lg border-2"
              style={{ borderColor: item.color, backgroundColor: `${item.color}22` }}
            />
          ) : null}
        </div>
      ))}
    </>
  );
}
