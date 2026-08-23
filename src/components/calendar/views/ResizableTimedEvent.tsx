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

    const onMove = (moveEvent: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || session.mode !== "resize") return;
      applyResizePreview(snapDeltaMinutes(moveEvent.clientY - session.startY));
    };

    const onUp = (upEvent: PointerEvent) => {
      const session = sessionRef.current;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      sessionRef.current = null;
      setPreview(null);

      if (!session || session.mode !== "resize") return;
      commitResize(snapDeltaMinutes(upEvent.clientY - session.startY));
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function beginMove(event: React.PointerEvent) {
    if (!item.editable || !item.endAt) return;

    event.preventDefault();
    event.stopPropagation();

    sessionRef.current = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      origTop: top,
      origHeight: height,
      origStart: new Date(item.startAt),
      origEnd: new Date(item.endAt),
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || session.mode !== "move") return;
      applyMovePreview(
        moveEvent.clientX - session.startX,
        moveEvent.clientY - session.startY,
      );
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      const session = sessionRef.current;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      sessionRef.current = null;
      setMoveOffset(null);

      if (!session || session.mode !== "move") return;
      commitMove(
        upEvent.clientX - session.startX,
        upEvent.clientY - session.startY,
      );
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  return (
    <div
      className="group absolute inset-x-1 z-10"
      style={{
        top: Math.max(0, displayTop),
        height: Math.max(28, displayHeight),
        transform: moveOffset
          ? `translate(${moveOffset.x}px, ${moveOffset.y}px)`
          : undefined,
        transition: moveOffset ? "none" : undefined,
      }}
    >
      {item.editable ? (
        <div
          role="separator"
          aria-label="Resize start time"
          onPointerDown={(e) => beginResize("top", e)}
          className="absolute inset-x-0 top-0 z-20 h-1.5 cursor-ns-resize rounded-t-lg opacity-0 transition group-hover:opacity-100"
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

      {item.editable ? (
        <div
          role="separator"
          aria-label="Resize end time"
          onPointerDown={(e) => beginResize("bottom", e)}
          className="absolute inset-x-0 bottom-0 z-20 h-1.5 cursor-ns-resize rounded-b-lg opacity-0 transition group-hover:opacity-100"
          style={{ backgroundColor: item.color }}
        />
      ) : null}
    </div>
  );
}
