"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { colorWithAlpha } from "@/lib/calendar/colors";
import { formatTimeLabel } from "@/lib/calendar/date-utils";
import { recurrenceLabel } from "@/lib/calendar/recurrence";
import { EVENT_TYPE_LABELS } from "@/lib/calendar/workspace-types";
import type { WorkspaceCalendarItem } from "@/lib/calendar/workspace-types";
import { hubAssignmentFocusHref, hubScheduleHref } from "@/lib/hub/tabs";

interface EventDetailDrawerProps {
  open: boolean;
  item: WorkspaceCalendarItem | null;
  relatedItems: WorkspaceCalendarItem[];
  onClose: () => void;
  onEdit: () => void;
  onToggleComplete: (completed: boolean) => void;
  onReschedule: () => void;
  onDelete?: () => void;
}

export function EventDetailDrawer({
  open,
  item,
  relatedItems,
  onClose,
  onEdit,
  onToggleComplete,
  onReschedule,
  onDelete,
}: EventDetailDrawerProps) {
  if (!open || !item) return null;

  const start = new Date(item.startAt);
  const end = item.endAt ? new Date(item.endAt) : null;

  const upcomingRelated = relatedItems
    .filter((related) => related.id !== item.id)
    .slice(0, 5);

  return (
    <>
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-[2px] lg:hidden"
      />

      <aside className="drawer-enter fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-orange-100/80 bg-white/95 shadow-2xl backdrop-blur-xl lg:static lg:z-auto lg:w-full lg:max-w-none lg:border-l-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
        <div className="flex items-start justify-between gap-3 border-b border-orange-100/80 p-5">
          <div className="min-w-0 flex-1">
            <div
              className="mb-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: colorWithAlpha(item.color, 0.25),
                color: "#292524",
              }}
            >
              {EVENT_TYPE_LABELS[item.eventType]}
            </div>
            <h2
              className={`text-xl font-bold tracking-tight text-stone-900 ${
                item.completed ? "line-through text-stone-500" : ""
              }`}
            >
              {item.title}
            </h2>
            {item.courseTitle ? (
              <p className="mt-1 text-sm font-medium text-muted">{item.courseTitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 transition hover:bg-orange-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section className="card-soft p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-soft">
              Schedule
            </h3>
            <p className="mt-2 text-sm font-semibold text-stone-800">
              {start.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-1 text-sm text-muted">
              {item.allDay
                ? "All day"
                : end
                  ? `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`
                  : formatTimeLabel(start)}
            </p>
            {item.location ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-stone-700">
                <MapPin className="h-4 w-4 text-orange-500" />
                {item.location}
              </p>
            ) : null}
            {item.description ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
            ) : null}
            {item.recurrence || item.isRecurrenceOccurrence ? (
              <p className="mt-3 text-sm font-medium text-orange-700">
                {item.isRecurrenceOccurrence
                  ? "Part of a repeating series"
                  : recurrenceLabel(item.recurrence)}
              </p>
            ) : null}
          </section>

          {upcomingRelated.length > 0 ? (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-soft">
                Upcoming for this class
              </h3>
              <ul className="space-y-2">
                {upcomingRelated.map((related) => (
                  <li
                    key={related.id}
                    className="flex items-start gap-3 rounded-xl border border-orange-100/80 bg-orange-50/40 px-3 py-2.5"
                  >
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: related.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {related.title}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(related.startAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid grid-cols-2 gap-2">
            {item.editable ? (
              <ActionButton icon={Pencil} label="Edit" onClick={onEdit} />
            ) : null}
            {item.editable ? (
              <ActionButton
                icon={CheckCircle2}
                label={item.completed ? "Mark incomplete" : "Mark complete"}
                onClick={() => onToggleComplete(!item.completed)}
                primary
              />
            ) : null}
            <ActionButton
              icon={CalendarClock}
              label="Reschedule"
              onClick={onReschedule}
            />
            <Link
              href={
                item.source === "assignment"
                  ? hubAssignmentFocusHref(item.sourceId)
                  : hubScheduleHref({
                      date: item.startAt.slice(0, 10),
                    })
              }
              className="card-interactive flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-stone-700"
            >
              <BookOpen className="h-4 w-4 text-orange-600" />
              View in Hub
            </Link>
            {onDelete ? (
              <ActionButton
                icon={Trash2}
                label="Delete"
                onClick={onDelete}
                danger
              />
            ) : null}
          </section>
        </div>
      </aside>
    </>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
        primary
          ? "bg-orange-500 text-white shadow-md shadow-orange-200 hover:bg-orange-600"
          : danger
            ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "card-soft hover:border-orange-200 hover:bg-orange-50/50"
      }`}
    >
      <Icon className={`h-4 w-4 ${primary ? "" : danger ? "" : "text-orange-600"}`} />
      {label}
    </button>
  );
}
