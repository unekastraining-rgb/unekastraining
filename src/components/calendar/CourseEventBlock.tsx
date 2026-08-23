"use client";

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

  const timeLabel = item.allDay
    ? "All day"
    : end
      ? `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`
      : formatTimeLabel(start);

  return (
    <div
      className={`flex h-full w-full items-start gap-1 ${
        selected ? "z-20" : ""
      } ${dimmed ? "scale-[0.98] opacity-25 saturate-50" : ""} ${
        highlighted ? "z-10 scale-[1.02]" : ""
      }`}
      style={style}
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
        onClick={onClick}
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
          boxShadow: highlighted
            ? `0 6px 18px ${colorWithAlpha(item.color, 0.35)}`
            : selected
              ? `0 0 0 2px ${appearance.accentColor}`
              : undefined,
          ...style,
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
            {item.location ? (
              <p
                className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] opacity-75"
                style={{ color: appearance.mutedTextColor }}
              >
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                {item.location}
              </p>
            ) : null}
          </>
        ) : (
          <p
            className={`truncate text-[9px] ${item.completed ? "line-through opacity-50" : ""}`}
            style={{ color: appearance.mutedTextColor }}
          >
            {timeLabel}
          </p>
        )}

        {!compact && !item.allDay ? (
          <span
            className="mt-1 w-fit rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: colorWithAlpha(item.color, 0.45),
              color: appearance.textColor,
            }}
          >
            {EVENT_TYPE_LABELS[item.eventType]}
          </span>
        ) : null}
      </button>
    </div>
  );
}
