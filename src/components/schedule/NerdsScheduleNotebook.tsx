"use client";

import type { CSSProperties } from "react";
import { Caveat } from "next/font/google";

import type { WeeklyCollegeGrid, WeeklyGridBlock } from "@/lib/schedule/weekly-college-grid";
import { ACADEMIC_WEEKDAYS, formatGridClock } from "@/lib/schedule/weekly-college-grid";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const HOUR_PX_DEFAULT = 72;
const HOUR_PX_COMPACT = 52;

const DAY_LABEL: Record<(typeof ACADEMIC_WEEKDAYS)[number], string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
};

function inkFor(bg: string): string {
  if (bg.startsWith("color-mix")) return "var(--sh-text-heading)";
  const hex = bg.replace("#", "");
  if (hex.length < 6) return "var(--sh-text-heading)";
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#1c1917" : "#fffbeb";
}



function blockStyle(
  block: WeeklyGridBlock,
  gridStart: number,
  hourPx: number,
): CSSProperties {
  const top = ((block.startMinutes - gridStart) / 60) * hourPx;
  const height = Math.max(((block.endMinutes - block.startMinutes) / 60) * hourPx - 6, 28);
  return {
    top,
    height,
    background: block.color,
    color: inkFor(block.color),
    borderColor: "color-mix(in srgb, var(--sh-text-heading) 16%, transparent)",
  };
}

function PaceNotes({
  accelerated,
  full,
}: {
  accelerated: WeeklyCollegeGrid["paceNotes"];
  full: WeeklyCollegeGrid["paceNotes"];
}) {
  return (
    <aside className="nerds-sticky mt-5 max-w-sm p-3 sm:mt-6 sm:rotate-[-1.5deg] sm:p-4">
      <p className="text-base font-bold tracking-wide text-[color:var(--sh-primary)] sm:text-lg">
        ACCELERATED
      </p>
      {accelerated.length === 0 ? (
        <p className="text-sm text-[color:var(--sh-text-body)] sm:text-base">
          No short-term courses detected.
        </p>
      ) : (
        accelerated.map((note) => (
          <div key={note.courseId} className="mt-2 first:mt-0">
            <p className="text-lg font-semibold leading-snug sm:text-xl">
              {note.title}
              <span className="ml-2 text-sm font-medium text-[color:var(--sh-text-body)] sm:text-base">
                {note.dateLabel}
              </span>
            </p>
          </div>
        ))
      )}
      <p className="mt-3 text-base font-bold tracking-wide text-[color:var(--sh-accent)] sm:text-lg">
        FULL SEMESTER
      </p>
      {full.length === 0 ? (
        <p className="text-sm text-[color:var(--sh-text-body)] sm:text-base">
          No full-term courses detected.
        </p>
      ) : (
        full.map((note) => (
          <div key={note.courseId} className="mt-2 first:mt-0">
            <p className="text-lg font-semibold leading-snug sm:text-xl">
              {note.title}
              <span className="ml-2 text-sm font-medium text-[color:var(--sh-text-body)] sm:text-base">
                {note.dateLabel}
              </span>
            </p>
          </div>
        ))
      )}
    </aside>
  );
}

/** Phone: stacked day lists — absolute grid columns overlap on narrow screens. */
function MobileDayList({ grid }: { grid: WeeklyCollegeGrid }) {
  return (
    <div className="space-y-3 md:hidden">
      {ACADEMIC_WEEKDAYS.map((dayOfWeek) => {
        const blocks = grid.blocks
          .filter((block) => block.dayOfWeek === dayOfWeek)
          .slice()
          .sort((a, b) => a.startMinutes - b.startMinutes);
        return (
          <section
            key={dayOfWeek}
            className="rounded-xl border bg-white/70 p-3"
            style={{
              borderColor: "color-mix(in srgb, var(--sh-primary) 22%, transparent)",
            }}
          >
            <p className="text-lg font-bold text-[color:var(--sh-text-heading)]">
              {DAY_LABEL[dayOfWeek]}
            </p>
            {blocks.length === 0 ? (
              <p className="mt-1 text-sm text-[color:var(--sh-muted)]">No classes</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {blocks.map((block) => (
                  <li
                    key={block.id}
                    className="rounded-lg border px-3 py-2 shadow-sm"
                    style={{
                      background: block.color,
                      color: inkFor(block.color),
                      borderColor: "color-mix(in srgb, var(--sh-text-heading) 16%, transparent)",
                    }}
                  >
                    <p className="text-base font-bold leading-tight">{block.label}</p>
                    <p className="text-xs opacity-85">
                      {formatGridClock(block.startMinutes)}–{formatGridClock(block.endMinutes)}
                    </p>
                    {block.courseTitle && block.courseTitle !== block.label ? (
                      <p className="mt-0.5 truncate text-xs opacity-80">{block.courseTitle}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function NerdsScheduleNotebook({
  grid,
  compact = false,
}: {
  grid: WeeklyCollegeGrid;
  compact?: boolean;
}) {
  const hourPx = compact ? HOUR_PX_COMPACT : HOUR_PX_DEFAULT;
  const hours: number[] = [];
  for (let minute = grid.startMinutes; minute < grid.endMinutes; minute += 60) {
    hours.push(minute);
  }
  const gridHeight = hours.length * hourPx;
  const accelerated = grid.paceNotes.filter((note) => note.pace === "accelerated");
  const full = grid.paceNotes.filter((note) => note.pace === "full");
  return (
    <div className={`${caveat.className} nerds-notebook mx-auto w-full max-w-6xl`}>
      <div className="nerds-notebook-spine" aria-hidden />
      <div className="nerds-notebook-page">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2 pr-1 sm:mb-4 sm:gap-3 sm:pr-2">
          <div className="min-w-0">
            <p className="text-lg font-medium tracking-wide text-[color:var(--sh-primary)] sm:text-2xl">
              The Nerd&apos;s Schedule
            </p>
            <h2 className="text-2xl font-bold leading-none text-[color:var(--sh-text-heading)] sm:text-4xl">
              Weekly class schedule
            </h2>
            <p className="mt-1 text-base text-[color:var(--sh-text-body)] sm:text-lg">
              {grid.termLabel} · Monday–Thursday · ~{Math.round(grid.targetWeeklyMinutes / 60)}{" "}
              hrs/week
            </p>
          </div>
          <p className="hidden max-w-xs text-right text-base text-[color:var(--sh-text-body)] sm:block">
            Class times stay put. Study fills around them — 9–1 first, then other Mon–Thu hours.
            Fri–Sun stay work-only.
          </p>
        </div>

        <MobileDayList grid={grid} />

        <div
          className="nerds-notebook-grid hidden md:grid"
          role="grid"
          aria-label="Weekly class schedule"
        >
          <div />
          {grid.days.map((day) => (
            <p
              key={day}
              className="border-b pb-1 text-center text-xl font-bold text-[color:var(--sh-text-heading)] sm:text-2xl"
              style={{ borderColor: "color-mix(in srgb, var(--sh-primary) 28%, transparent)" }}
            >
              {day}
            </p>
          ))}

          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((hour) => (
              <p
                key={hour}
                className="absolute right-1 -translate-y-2 text-right text-[11px] text-[color:var(--sh-muted)] sm:right-2 sm:text-sm"
                style={{ top: ((hour - grid.startMinutes) / 60) * hourPx }}
              >
                {formatGridClock(hour)}
              </p>
            ))}
          </div>

          {ACADEMIC_WEEKDAYS.map((dayOfWeek) => (
            <div
              key={dayOfWeek}
              className="relative border-l"
              style={{
                height: gridHeight,
                borderColor: "color-mix(in srgb, var(--sh-text-heading) 10%, transparent)",
              }}
            >
              {hours.map((hour) => (
                <div
                  key={`${dayOfWeek}-${hour}`}
                  className="absolute inset-x-0 border-t"
                  style={{
                    top: ((hour - grid.startMinutes) / 60) * hourPx,
                    borderColor: "color-mix(in srgb, var(--sh-accent) 22%, transparent)",
                  }}
                />
              ))}
              {grid.blocks
                .filter((block) => block.dayOfWeek === dayOfWeek)
                .map((block) => (
                    <div
                      key={block.id}
                      className="absolute inset-x-0.5 overflow-hidden rounded-md border px-1 py-1 text-left shadow-sm sm:inset-x-1 sm:px-1.5"
                      style={blockStyle(block, grid.startMinutes, hourPx)}
                      title={block.courseTitle}
                    >
                      <p className="text-[13px] font-bold leading-tight sm:text-[15px]">
                        {block.label}
                      </p>
                      <p className="text-[10px] opacity-80 sm:text-xs">
                        {formatGridClock(block.startMinutes)}–{formatGridClock(block.endMinutes)}
                      </p>
                    </div>
                  ))}
            </div>
          ))}
        </div>

        <PaceNotes accelerated={accelerated} full={full} />
      </div>
    </div>
  );
}
