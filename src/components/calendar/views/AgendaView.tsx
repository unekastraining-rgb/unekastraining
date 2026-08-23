"use client";

import { formatTimeLabel } from "@/lib/calendar/date-utils";
import { EVENT_TYPE_LABELS } from "@/lib/calendar/workspace-types";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";

interface AgendaViewProps {
  items: WorkspaceCalendarItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

export function AgendaView({
  items,
  selectedId,
  onSelect,
  onToggleComplete,
}: AgendaViewProps) {
  const grouped = groupByDate(items);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-12 text-center">
        <p className="font-semibold text-stone-700">No events in this range</p>
        <p className="mt-1 text-sm text-stone-500">
          Add a task or adjust your filters to see your schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([dateLabel, dayItems]) => (
        <section
          key={dateLabel}
          className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
        >
          <div className="border-b border-orange-100 bg-orange-50/60 px-4 py-2">
            <h3 className="font-bold text-stone-900">{dateLabel}</h3>
          </div>
          <ul className="divide-y divide-orange-50">
            {dayItems.map((item) => {
              const canComplete =
                item.editable && item.source !== "meeting" && onToggleComplete;
              return (
                <li key={item.id}>
                  <div
                    className={`flex w-full items-start gap-3 px-4 py-3 transition hover:bg-orange-50/50 ${
                      selectedId === item.id ? "bg-orange-50" : ""
                    }`}
                  >
                    {canComplete ? (
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(event) =>
                          onToggleComplete(item.id, event.target.checked)
                        }
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-orange-300 text-orange-500"
                      />
                    ) : (
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p
                        className={`font-semibold text-stone-900 ${
                          item.completed ? "line-through text-stone-500" : ""
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-sm text-stone-500">
                        {item.allDay
                          ? "All day"
                          : `${formatTimeLabel(new Date(item.startAt))}${
                              item.endAt
                                ? ` – ${formatTimeLabel(new Date(item.endAt))}`
                                : ""
                            }`}
                        {item.courseTitle ? ` · ${item.courseTitle}` : ""}
                      </p>
                    </button>
                    <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700">
                      {EVENT_TYPE_LABELS[item.eventType]}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function groupByDate(items: WorkspaceCalendarItem[]): [string, WorkspaceCalendarItem[]][] {
  const map = new Map<string, WorkspaceCalendarItem[]>();

  for (const item of items) {
    const date = new Date(item.startAt);
    const label = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const list = map.get(label) ?? [];
    list.push(item);
    map.set(label, list);
  }

  return Array.from(map.entries());
}
