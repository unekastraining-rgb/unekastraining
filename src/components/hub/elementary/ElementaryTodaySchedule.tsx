"use client";

import type { CalendarEvent } from "@/lib/calendar/types";

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
    default:
      return "📋";
  }
}

function formatTime(time: string | null | undefined) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ElementaryTodaySchedule({
  events,
  loading,
  selectedEventId,
  onSelectEvent,
}: {
  events: CalendarEvent[];
  loading?: boolean;
  selectedEventId?: string | null;
  onSelectEvent?: (id: string) => void;
}) {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const classes = events.filter((event) => event.kind === "class");
  const homework = events.filter((event) => event.kind !== "class");

  return (
    <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
        Today
      </p>
      <h3 className="mt-1 text-2xl font-black text-stone-900">{todayLabel}</h3>
      <p className="mt-2 text-sm text-stone-600">
        Your classes and homework for today — tap to see details.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-stone-500">Loading your day…</p>
      ) : events.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-teal-200 bg-white/80 px-4 py-10 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-3 text-sm font-semibold text-stone-800">
            Nothing scheduled today!
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Enjoy free time or try a fun study activity below.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {classes.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-stone-500">
                Classes
              </h4>
              <ul className="space-y-2">
                {classes.map((event) => (
                  <ScheduleRow
                    key={event.id}
                    event={event}
                    selected={event.id === selectedEventId}
                    onSelect={onSelectEvent}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {homework.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-stone-500">
                Homework & tests
              </h4>
              <ul className="space-y-2">
                {homework.map((event) => (
                  <ScheduleRow
                    key={event.id}
                    event={event}
                    selected={event.id === selectedEventId}
                    onSelect={onSelectEvent}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ScheduleRow({
  event,
  selected,
  onSelect,
}: {
  event: CalendarEvent;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const timeLabel = formatTime(event.startTime);
  const completed = Boolean(event.completed);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(event.id)}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
          selected
            ? "border-teal-400 bg-teal-50 ring-2 ring-teal-200"
            : completed
              ? "border-stone-200 bg-stone-50 opacity-75"
              : "border-brand bg-white hover:border-brand"
        }`}
      >
        <span className="text-2xl">{kindEmoji(event.kind)}</span>
        <div className="min-w-0 flex-1">
          <p
            className={`font-bold text-stone-900 ${
              completed ? "line-through text-stone-500" : ""
            }`}
          >
            {event.title}
          </p>
          <p className="text-xs text-stone-500">
            {event.courseTitle ?? "School"}
            {timeLabel ? ` · ${timeLabel}` : ""}
            {completed ? " · Done!" : ""}
          </p>
        </div>
      </button>
    </li>
  );
}
