"use client";

import { colorWithAlpha } from "@/lib/calendar/colors";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

export function CalendarEventChip({
  item,
  selected,
  compact,
  onClick,
  onDragStart,
  style,
}: {
  item: WorkspaceCalendarItem;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      draggable={item.editable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`w-full overflow-hidden rounded-lg border px-2 py-1 text-left text-[11px] font-semibold shadow-sm transition hover:brightness-95 ${
        selected ? "ring-2 ring-orange-400" : ""
      } ${item.completed ? "opacity-60 line-through" : ""}`}
      style={{
        backgroundColor: colorWithAlpha(item.color, 0.18),
        borderColor: item.color,
        color: "#292524",
        ...style,
      }}
    >
      <p className="truncate">{item.title}</p>
      {!compact && item.courseTitle ? (
        <p className="truncate text-[10px] font-normal opacity-75">{item.courseTitle}</p>
      ) : null}
    </button>
  );
}
