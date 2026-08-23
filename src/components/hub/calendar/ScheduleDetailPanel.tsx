"use client";

import Link from "next/link";
import { BookOpen, Calendar, MapPin, Pencil, Trash2, Upload } from "lucide-react";

import {
  hubEventCanComplete,
} from "@/lib/calendar/hub-event-actions";
import { hubEventFocusId } from "@/lib/calendar/hub-adapters";
import { hubScheduleHref } from "@/lib/hub/tabs";
import type { CalendarEvent } from "@/lib/calendar/types";

function kindLabel(kind: CalendarEvent["kind"]) {
  switch (kind) {
    case "class":
      return "Class";
    case "test":
      return "Test";
    case "quiz":
      return "Quiz";
    case "project":
      return "Project";
    case "study-session":
      return "Study session";
    default:
      return "Assignment";
  }
}

function kindEmoji(kind: CalendarEvent["kind"]) {
  switch (kind) {
    case "class":
      return "📚";
    case "test":
      return "📝";
    case "quiz":
      return "❓";
    case "project":
      return "🎯";
    case "study-session":
      return "⭐";
    default:
      return "📋";
  }
}

export function ScheduleDetailPanel({
  events,
  selectedEventId,
  onSelectEvent,
  quickViewLabel,
  onToggleComplete,
  onDelete,
  onEdit,
  editableEventIds,
  onManageClassSchedule,
  focusClass,
}: {
  events: CalendarEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  quickViewLabel: string;
  onToggleComplete?: (event: CalendarEvent, completed: boolean) => void;
  onDelete?: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  editableEventIds?: Set<string>;
  onManageClassSchedule?: (event: CalendarEvent) => void;
  focusClass?: (id: string, baseClass?: string) => string;
}) {
  const selected = events.find((event) => event.id === selectedEventId) ?? null;

  return (
    <div className="flex h-full min-h-[28rem] flex-col rounded-3xl border border-brand bg-white shadow-sm">
      <div className="border-b border-brand px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
          {quickViewLabel}
        </p>
        <h3 className="mt-1 text-lg font-bold text-stone-900">Your schedule</h3>
        <p className="mt-1 text-sm text-stone-500">
          Syllabus, LMS, Google Calendar, and manual events — same data as full calendar
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {events.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <Calendar className="mx-auto h-10 w-10 text-brand" />
            <p className="mt-4 text-sm font-medium text-stone-700">
              Nothing scheduled yet
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Upload a syllabus or add classes to fill your calendar.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-soft0 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Upload className="h-4 w-4" />
                Scan syllabus
              </Link>
              <Link
                href={hubScheduleHref()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-stone-700"
              >
                Add assignment
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const isSelected = event.id === selectedEventId;
              const canComplete = hubEventCanComplete(event);
              const isComplete = Boolean(event.completed);
              const focusKey = hubEventFocusId(event.id);

              return (
                <div
                  key={event.id}
                  data-focus-id={focusKey ?? undefined}
                  className={`rounded-2xl border p-4 transition ${
                    focusClass
                      ? focusClass(focusKey ?? "", "")
                      : ""
                  } ${
                    isSelected
                      ? "border-brand bg-brand-soft ring-2 ring-[color-mix(in_srgb,var(--sh-primary)_18%,transparent)]"
                      : "border-brand bg-white hover:border-brand hover:bg-brand-soft/50"
                  } ${isComplete ? "opacity-80" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {canComplete && onToggleComplete ? (
                      <input
                        type="checkbox"
                        checked={isComplete}
                        onChange={() => onToggleComplete(event, !isComplete)}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-brand text-brand"
                        aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
                      />
                    ) : (
                      <span className="text-xl">{kindEmoji(event.kind)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (canComplete && onToggleComplete) {
                          onToggleComplete(event, !isComplete);
                        } else {
                          onSelectEvent(event.id);
                        }
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: event.courseColor ?? "#ea580c",
                          }}
                        />
                        <p
                          className={`truncate font-semibold text-stone-900 ${
                            isComplete ? "line-through text-stone-500" : ""
                          }`}
                        >
                          {event.title}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {event.courseTitle ?? "General"}
                        {event.startTime
                          ? ` · ${formatTime(event.startTime)}`
                          : ` · ${formatDate(event.date)}`}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                        {kindLabel(event.kind)}
                      </span>
                    </button>
                    {onDelete && event.kind !== "class" ? (
                      <button
                        type="button"
                        onClick={() => onDelete(event)}
                        className="rounded-lg border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                        aria-label={`Delete ${event.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected ? (
        <div className="border-t border-brand bg-brand-soft/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            {kindLabel(selected.kind)} details
          </p>
          <h4
            className={`mt-1 font-bold text-stone-900 ${
              selected.completed ? "line-through text-stone-500" : ""
            }`}
          >
            {selected.title}
          </h4>
          {selected.courseTitle ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600">
              <BookOpen className="h-4 w-4" />
              {selected.courseTitle}
            </p>
          ) : null}
          {selected.location ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600">
              <MapPin className="h-4 w-4" />
              {selected.location}
            </p>
          ) : null}
          {selected.description ? (
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              {selected.description}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-stone-500">
            Source: {selected.source}
            {selected.priority ? ` · ${selected.priority} priority` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.kind === "class" && onManageClassSchedule ? (
              <button
                type="button"
                onClick={() => onManageClassSchedule(selected)}
                className="inline-flex items-center gap-2 rounded-xl border border-brand bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
              >
                <Calendar className="h-4 w-4" />
                Edit class schedule
              </button>
            ) : null}
            {onEdit && editableEventIds?.has(selected.id) ? (
              <button
                type="button"
                onClick={() => onEdit(selected)}
                className="inline-flex items-center gap-2 rounded-xl border border-brand bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            ) : null}
            {hubEventCanComplete(selected) && onToggleComplete ? (
              <button
                type="button"
                onClick={() => onToggleComplete(selected, !selected.completed)}
                className="rounded-xl border border-brand bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
              >
                {selected.completed ? "Mark incomplete" : "Mark complete"}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(selected)}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
