"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { bindPointerResize } from "@/lib/core/canvas-transform";
import { CANVAS_ELEMENT_BASE_Z } from "@/lib/core/canvas-layer";

export interface TransformableRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
}

export function TransformableElement({
  rect,
  selected,
  editable = true,
  dragFromHandleOnly = false,
  zIndex = CANVAS_ELEMENT_BASE_Z,
  onChange,
  onSelect,
  onDuplicate,
  onDelete,
  onToggleLock,
  onLayerForward,
  onLayerBackward,
  children,
}: {
  rect: TransformableRect;
  selected?: boolean;
  editable?: boolean;
  dragFromHandleOnly?: boolean;
  zIndex?: number;
  onChange: (patch: Partial<TransformableRect>) => void;
  onSelect?: (options?: { shiftKey?: boolean }) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onToggleLock?: () => void;
  onLayerForward?: () => void;
  onLayerBackward?: () => void;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: rect.x, y: rect.y, active: false });
  const [liveRect, setLiveRect] = useState<Partial<TransformableRect> | null>(null);

  useEffect(() => {
    if (!dragRef.current.active) {
      dragRef.current.x = rect.x;
      dragRef.current.y = rect.y;
    }
  }, [rect.x, rect.y]);

  const display = {
    x: liveRect?.x ?? rect.x,
    y: liveRect?.y ?? rect.y,
    width: liveRect?.width ?? rect.width,
    height: liveRect?.height ?? rect.height,
    rotation: liveRect?.rotation ?? rect.rotation,
  };

  function startDrag(event: React.PointerEvent) {
    if (!editable || rect.locked) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.({ shiftKey: event.shiftKey });

    const startX = rect.x;
    const startY = rect.y;
    const pointerStartX = event.clientX;
    const pointerStartY = event.clientY;
    dragRef.current = { x: startX, y: startY, active: true };

    const target = rootRef.current;
    target?.setPointerCapture(event.pointerId);

    function onMove(moveEvent: PointerEvent) {
      const x = Math.max(0, startX + (moveEvent.clientX - pointerStartX));
      const y = Math.max(0, startY + (moveEvent.clientY - pointerStartY));
      dragRef.current = { x, y, active: true };
      if (target) {
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
      }
    }

    function onUp(moveEvent: PointerEvent) {
      dragRef.current.active = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (target?.hasPointerCapture(moveEvent.pointerId)) {
        target.releasePointerCapture(moveEvent.pointerId);
      }
      const { x, y } = dragRef.current;
      setLiveRect(null);
      onChange({ x, y });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function startResize(event: React.PointerEvent) {
    if (!editable || rect.locked) return;
    event.preventDefault();
    event.stopPropagation();
    const startW = rect.width;
    const startH = rect.height;
    const originX = event.clientX;
    const originY = event.clientY;

    bindPointerResize({
      event: event.nativeEvent,
      startRect: { x: rect.x, y: rect.y, width: startW, height: startH },
      onResize: (next) => {
        setLiveRect({
          width: next.width,
          height: next.height,
        });
        if (rootRef.current) {
          rootRef.current.style.width = `${next.width}px`;
          rootRef.current.style.height = `${next.height}px`;
        }
      },
      onEnd: () => {
        const el = rootRef.current;
        if (el) {
          onChange({
            width: el.offsetWidth,
            height: el.offsetHeight,
          });
        }
        setLiveRect(null);
      },
    });
  }

  function startRotate(event: React.PointerEvent) {
    if (!editable || rect.locked) return;
    event.preventDefault();
    event.stopPropagation();
    const el = rootRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const startAngle = Math.atan2(event.clientY - cy, event.clientX - cx);
    const baseRotation = rect.rotation ?? 0;
    let currentRotation = baseRotation;

    function onMove(moveEvent: PointerEvent) {
      const angle = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx);
      currentRotation = Math.round(baseRotation + ((angle - startAngle) * 180) / Math.PI);
      if (rootRef.current) {
        rootRef.current.style.transform = `rotate(${currentRotation}deg)`;
      }
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onChange({ rotation: currentRotation });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      ref={rootRef}
      data-canvas-element
      className="pointer-events-auto absolute touch-manipulation"
      style={{
        left: display.x,
        top: display.y,
        width: display.width,
        height: display.height,
        zIndex,
        transform: display.rotation ? `rotate(${display.rotation}deg)` : undefined,
        transformOrigin: "center center",
        willChange: dragRef.current.active ? "left, top" : undefined,
      }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onSelect?.({ shiftKey: event.shiftKey });
        }
      }}
    >
      <div
        className={`relative h-full w-full ${editable && !rect.locked && !dragFromHandleOnly ? "cursor-move" : ""}`}
        onPointerDown={dragFromHandleOnly ? undefined : startDrag}
      >
        {children}
      </div>

      {selected && editable ? (
        <>
          <div
            className="absolute -bottom-1.5 -right-1.5 z-10 h-4 w-4 cursor-se-resize rounded-sm border border-white bg-orange-500 shadow"
            onPointerDown={startResize}
          />
          <div
            className="absolute -top-5 left-1/2 z-10 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-white bg-stone-700 shadow"
            onPointerDown={startRotate}
            title="Rotate"
          />
          <div className="absolute -top-8 right-0 z-10 flex gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 shadow-lg">
            {onLayerForward ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerForward();
                }}
                className="rounded p-1 hover:bg-stone-100"
                title="Bring forward"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
            ) : null}
            {onLayerBackward ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerBackward();
                }}
                className="rounded p-1 hover:bg-stone-100"
                title="Send backward"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            ) : null}
            {onDuplicate ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="rounded p-1 hover:bg-stone-100"
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </button>
            ) : null}
            {onToggleLock ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock();
                }}
                className="rounded p-1 hover:bg-stone-100"
                title={rect.locked ? "Unlock" : "Lock"}
              >
                {rect.locked ? (
                  <Unlock className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded p-1 text-rose-600 hover:bg-rose-50"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
