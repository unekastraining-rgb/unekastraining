"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";

import { useCalendarAppearance } from "@/components/calendar/CalendarAppearanceContext";
import { colorWithAlpha } from "@/lib/calendar/colors";
import { formatTimeLabel } from "@/lib/calendar/date-utils";
import { EVENT_TYPE_LABELS } from "@/lib/calendar/workspace-types";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

interface CourseEventBlockProps {
  item: WorkspaceCalendarItem;
  selected?: boolean;
  dimmed?: boolean;
  highlighted?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onToggleComplete?: (completed: boolean) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onPointerDragStart?: (e: React.PointerEvent) => void;
  draggable?: boolean;
  style?: React.CSSProperties;
}

export function CourseEventBlock({
  item,
  selected,
  dimmed,
  highlighted,
  compact,
  onClick,
  onToggleComplete,
  onDragStart,
  onPointerDragStart,
  draggable,
  style,
}: CourseEventBlockProps) {
  const appearance = useCalendarAppearance();
  const start = new Date(item.startAt);
  const end = item.endAt ? new Date(item.endAt) : null;
  const canComplete = item.editable && item.source !== "meeting";
  const allDay = Boolean(item.allDay);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  const timeLabel = allDay
    ? "All day"
    : end
      ? `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`
      : formatTimeLabel(start);

  const hoverLines = [
    item.title,
    timeLabel,
    item.courseTitle ? `Class: ${item.courseTitle}` : null,
    item.location ? `Location: ${item.location}` : null,
    EVENT_TYPE_LABELS[item.eventType]
      ? `Type: ${EVENT_TYPE_LABELS[item.eventType]}`
      : null,
    item.description?.trim() ? item.description.trim().slice(0, 160) : null,
    item.completed ? "Completed" : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (!hover) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setTipPos(null);
      return;
    }
    function place() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const tipW = 224;
      const tipH = 140;
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - tipW - 8),
      );
      const preferAbove = rect.top > tipH + 16;
      const top = preferAbove
        ? Math.max(8, rect.top - tipH - 8)
        : Math.min(window.innerHeight - tipH - 8, rect.bottom + 8);
      setTipPos({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [hover]);

  return (
    <div
      ref={rootRef}
      className={`group/event relative flex w-full items-start gap-1 ${
        compact ? "h-auto" : "h-full"
      } ${selected ? "z-20" : ""} ${dimmed ? "scale-[0.98] opacity-25 saturate-50" : ""} ${
        highlighted ? "z-10 scale-[1.02]" : ""
      }`}
      style={compact ? undefined : style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {canComplete && onToggleComplete ? (
        <input
          type="checkbox"
          checked={item.completed}
          onChange={(event) => {
            event.stopPropagation();
            onToggleComplete(event.target.checked);
          }}
          onClick={(event) => event.stopPropagation()}
          className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer rounded"
          style={{ accentColor: appearance.accentColor }}
          aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
        />
      ) : null}

      <button
        type="button"
        draggable={draggable ?? (item.editable && item.source !== "meeting")}
        onDragStart={onDragStart}
        onPointerDown={onPointerDragStart}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
        title={hoverLines.join("\n")}
        className={`min-w-0 flex-1 overflow-hidden rounded-xl px-2 py-1.5 text-left shadow-sm transition-all duration-200 ease-in-out hover:shadow-md ${
          item.editable && item.source !== "meeting"
            ? "cursor-grab active:cursor-grabbing"
            : ""
        } ${item.completed ? "opacity-70" : ""}`}
        style={{
          backgroundColor: colorWithAlpha(
            item.color,
            compact ? appearance.eventFillOpacity * 0.9 : appearance.eventFillOpacity,
          ),
          outline: allDay ? "2px solid #0c0a09" : undefined,
          outlineOffset: allDay ? "-1px" : undefined,
          boxShadow: highlighted
            ? `0 6px 18px ${colorWithAlpha(item.color, 0.35)}`
            : selected
              ? `0 0 0 2px ${appearance.accentColor}`
              : undefined,
          ...(compact ? undefined : style),
        }}
      >
        <p
          className={`truncate font-bold leading-tight ${
            compact ? "text-[10px]" : "text-[11px]"
          } ${item.completed ? "line-through opacity-60" : ""}`}
          style={{ color: appearance.textColor }}
        >
          {item.title}
        </p>

        {!compact ? (
          <>
            <p
              className={`mt-0.5 truncate text-[10px] font-semibold ${
                item.completed ? "line-through opacity-50" : ""
              }`}
              style={{ color: appearance.mutedTextColor }}
            >
              {timeLabel}
            </p>
            {item.courseTitle ? (
              <p
                className="truncate text-[9px] font-medium uppercase tracking-wide opacity-80"
                style={{ color: appearance.mutedTextColor }}
              >
                {item.courseTitle}
              </p>
            ) : null}
          </>
        ) : null}
      </button>

      {hover && tipPos && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[700] w-56 rounded-xl border border-stone-800/20 bg-stone-900 px-3 py-2 text-left shadow-xl"
              style={{ top: tipPos.top, left: tipPos.left }}
            >
              <p className="text-xs font-bold text-white">{item.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-stone-300">
                {timeLabel}
              </p>
              {item.courseTitle ? (
                <p className="mt-1 text-[10px] text-stone-400">{item.courseTitle}</p>
              ) : null}
              {item.location ? (
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-stone-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {item.location}
                </p>
              ) : null}
              <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-500">
                {EVENT_TYPE_LABELS[item.eventType]}
                {allDay ? " · All day" : ""}
              </p>
              {item.description?.trim() ? (
                <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-stone-400">
                  {item.description.trim()}
                </p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
