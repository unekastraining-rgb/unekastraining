"use client";

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekStrip({
  selectedDate,
  onSelectDate,
  eventDays,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  eventDays: Set<string>;
}) {
  const today = new Date();
  const weekStart = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const monthLabel = selectedDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-3xl border border-brand bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            This week
          </p>
          <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">{monthLabel}</h2>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
          Live
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {days.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const hasEvents = eventDays.has(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`flex flex-col items-center rounded-2xl px-2 py-3 transition md:py-4 ${
                selected
                  ? "btn-primary text-white shadow-lg shadow-stone-200"
                  : "bg-brand-soft text-stone-600 hover:bg-brand-soft"
              }`}
            >
              <span className="text-xs font-medium uppercase md:text-sm">
                {date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3)}
              </span>
              <span
                className={`mt-1 text-lg font-bold md:text-xl ${
                  isToday && !selected ? "text-brand" : ""
                }`}
              >
                {date.getDate()}
              </span>
              <span
                className={`mt-2 h-2 w-2 rounded-full ${
                  hasEvents
                    ? selected
                      ? "bg-white"
                      : "bg-amber-500"
                    : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
