"use client";

import { useRef, useState } from "react";

import { CourseEventBlock } from "@/components/calendar/CourseEventBlock";
import {
  applyDayAndMinuteDelta,
  pixelsToMinutes,
  snapMinutes,
} from "@/lib/calendar/drag-utils";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

const MIN_DURATION_MS = 15 * 60 * 1000;
/** Pointer travel below this is a tap/click, not a drag. */
const DRAG_THRESHOLD_PX = 4;

/** Swallow the click a pointer drag leaves behind so it cannot select or create. */
function suppressNextClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  document.addEventListener("click", swallow, { capture: true, once: true });
  window.setTimeout(() => {
    document.removeEventListener("click", swallow, { capture: true });
  }, 0);
}

interface ResizableTimedEventProps {
  item: WorkspaceCalendarItem;
  top: number;
  height: number;
  hourHeight: number;
  dayWidth: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (id: string, startAt: string, endAt: string) => void;
  onResize: (id: string, startAt: string, endAt: string) => void;
  dimmed?: boolean;
  highlighted?: boolean;
  onToggleComplete?: (completed: boolean) => void;
}

export function ResizableTimedEvent({
  item,
  top,
  height,
  hourHeight,
  dayWidth,
  selected,
  onSelect,
  onMove,
  onResize,
  dimmed,
  highlighted,
  onToggleComplete,
}: ResizableTimedEventProps) {
  const [preview, setPreview] = useState<{ top: number; height: number } | null>(
    null,
  );
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const sessionRef = useRef<{
    mode: "resize" | "move";
    edge?: "top" | "bottom";
    startX: number;
    startY: number;
    origTop: number;
    origHeight: number;
    origStart: Date;
    origEnd: Date;
  } | null>(null);

  const displayTop = preview?.top ?? top;
  const displayHeight = preview?.height ?? height;

  function snapDeltaMinutes(deltaPixels: number): number {
    return snapMinutes(pixelsToMinutes(deltaPixels, hourHeight));
  }

  function applyResizePreview(deltaMinutes: number) {
    const session = sessionRef.current;
    if (!session || session.mode !== "resize" || !session.edge) return;

    if (session.edge === "bottom") {
      const newEnd = new Date(
        session.origEnd.getTime() + deltaMinutes * 60 * 1000,
      );
      if (newEnd.getTime() - session.origStart.getTime() < MIN_DURATION_MS) return;
      setPreview({
        top: session.origTop,
        height: session.origHeight + (deltaMinutes / 60) * hourHeight,
      });
      return;
    }

    const newStart = new Date(
      session.origStart.getTime() + deltaMinutes * 60 * 1000,
    );
    if (session.origEnd.getTime() - newStart.getTime() < MIN_DURATION_MS) return;
    setPreview({
      top: session.origTop + (deltaMinutes / 60) * hourHeight,
      height: session.origHeight - (deltaMinutes / 60) * hourHeight,
    });
  }

  function commitResize(deltaMinutes: number) {
    const session = sessionRef.current;
    if (!session || session.mode !== "resize" || !session.edge) return;

    if (session.edge === "bottom") {
      const newEnd = new Date(
        session.origEnd.getTime() + deltaMinutes * 60 * 1000,
      );
      if (newEnd.getTime() - session.origStart.getTime() < MIN_DURATION_MS) return;
      onResize(item.id, session.origStart.toISOString(), newEnd.toISOString());
      return;
    }

    const newStart = new Date(
      session.origStart.getTime() + deltaMinutes * 60 * 1000,
    );
    if (session.origEnd.getTime() - newStart.getTime() < MIN_DURATION_MS) return;
    onResize(item.id, newStart.toISOString(), session.origEnd.toISOString());
  }

  function applyMovePreview(deltaX: number, deltaY: number) {
    const session = sessionRef.current;
    if (!session || session.mode !== "move") return;

    const minuteDelta = snapDeltaMinutes(deltaY);
    const dayDelta = Math.round(deltaX / Math.max(dayWidth, 1));

    setMoveOffset({
      x: dayDelta * dayWidth,
      y: (minuteDelta / 60) * hourHeight,
    });
  }

  function commitMove(deltaX: number, deltaY: number) {
    const session = sessionRef.current;
    if (!session || session.mode !== "move") return;

    const minuteDelta = snapDeltaMinutes(deltaY);
    const dayDelta = Math.round(deltaX / Math.max(dayWidth, 1));
    const { startAt, endAt } = applyDayAndMinuteDelta(
      session.origStart,
      session.origEnd,
      dayDelta,
      minuteDelta,
    );

    if (!endAt) return;
    onMove(item.id, startAt.toISOString(), endAt.toISOString());
  }

  function beginResize(edge: "top" | "bottom", event: React.PointerEvent) {
    if (!item.editable || !item.endAt) return;

    event.preventDefault();
    event.stopPropagation();

    sessionRef.current = {
      mode: "resize",
      edge,
      startX: event.clientX,
      startY: event.clientY,
      origTop: top,
      origHeight: height,
      origStart: new Date(item.startAt),
      origEnd: new Date(item.endAt),
    };

    const detach = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
      sessionRef.current = null;
      setPreview(null);
    };

    function onMove(moveEvent: PointerEvent) {
      const session = sessionRef.current;
      if (!session || session.mode !== "resize") return;
      applyResizePreview(snapDeltaMinutes(moveEvent.clientY - session.startY));
    }

    function onCancel() {
      detach();
    }

    function onUp(upEvent: PointerEvent) {
      const session = sessionRef.current;
      detach();

      if (!session || session.mode !== "resize") return;
      suppressNextClick();
      commitResize(snapDeltaMinutes(upEvent.clientY - session.startY));
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
  }

  function beginMove(event: React.PointerEvent) {
    if (event.button > 0) return;
    if (!item.editable || !item.endAt) return;

    event.stopPropagation();

    // Touch and pen have to claim the gesture, otherwise a drag scrolls the grid.
    // That cancels the chip's click, so those pointers select on pointerup instead.
    const claimsGesture = event.pointerType !== "mouse";
    if (claimsGesture) event.preventDefault();

    sessionRef.current = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      origTop: top,
      origHeight: height,
      origStart: new Date(item.startAt),
      origEnd: new Date(item.endAt),
    };

    let dragging = false;

    const detach = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      sessionRef.current = null;
      setMoveOffset(null);
    };

    function onPointerMove(moveEvent: PointerEvent) {
      const session = sessionRef.current;
      if (!session || session.mode !== "move") return;

      const deltaX = moveEvent.clientX - session.startX;
      const deltaY = moveEvent.clientY - session.startY;

      if (!dragging) {
        if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;
        dragging = true;
      }

      moveEvent.preventDefault();
      applyMovePreview(deltaX, deltaY);
    }

    function onPointerCancel() {
      detach();
    }

    function onPointerUp(upEvent: PointerEvent) {
      const session = sessionRef.current;
      detach();

      if (!session || session.mode !== "move") return;

      if (!dragging) {
        // A press that never travelled is a tap on the event, not a reschedule.
        if (claimsGesture) onSelect();
        return;
      }

      suppressNextClick();
      commitMove(
        upEvent.clientX - session.startX,
        upEvent.clientY - session.startY,
      );
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
  }

  return (
    <div
      className="group absolute inset-x-0 z-10 px-1"
      onClick={onSelect}
      role="presentation"
      style={{
        top: Math.max(0, displayTop),
        height: Math.max(28, displayHeight),
        transform: moveOffset
          ? `translate(${moveOffset.x}px, ${moveOffset.y}px)`
          : undefined,
        transition: moveOffset ? "none" : undefined,
      }}
    >
      {item.editable && item.endAt && !item.allDay ? (
        <div
          role="separator"
          aria-label="Resize start time"
          onPointerDown={(e) => beginResize("top", e)}
          className="absolute left-1 right-1 top-0 z-20 h-1.5 cursor-ns-resize rounded-t-lg opacity-0 transition group-hover:opacity-100"
          style={{ backgroundColor: item.color }}
        />
      ) : null}

      <CourseEventBlock
        item={item}
        selected={selected}
        dimmed={dimmed}
        highlighted={highlighted}
        onClick={onSelect}
        onToggleComplete={onToggleComplete}
        draggable={false}
        onPointerDragStart={beginMove}
        style={{ height: "100%" }}
      />

      {item.editable && item.endAt && !item.allDay ? (
        <div
          role="separator"
          aria-label="Resize end time"
          onPointerDown={(e) => beginResize("bottom", e)}
          className="absolute bottom-0 left-1 right-1 z-20 h-1.5 cursor-ns-resize rounded-b-lg opacity-0 transition group-hover:opacity-100"
          style={{ backgroundColor: item.color }}
        />
      ) : null}
    </div>
  );
}
