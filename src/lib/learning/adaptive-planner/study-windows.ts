/**
 * Phase 15 — Study windows from existing calendar busy blocks (no second calendar).
 */

import type { StudyWindow } from "@/lib/learning/adaptive-planner/types";

export type BusyInterval = {
  startAt: Date;
  endAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Find free study windows within [rangeStart, rangeEnd] outside busy intervals.
 * Defaults to 9:00–21:00 local blocks of up to maxBlockMinutes.
 */
export function findAvailableStudyWindows(input: {
  rangeStart: Date;
  rangeEnd: Date;
  busy: readonly BusyInterval[];
  dayStartHour?: number;
  dayEndHour?: number;
  maxBlockMinutes?: number;
  minBlockMinutes?: number;
}): StudyWindow[] {
  const dayStartHour = input.dayStartHour ?? 9;
  const dayEndHour = input.dayEndHour ?? 21;
  const maxBlock = input.maxBlockMinutes ?? 45;
  const minBlock = input.minBlockMinutes ?? 20;
  const windows: StudyWindow[] = [];

  const busy = input.busy
    .map((b) => ({
      startAt: b.startAt.getTime(),
      endAt: Math.max(b.endAt.getTime(), b.startAt.getTime()),
    }))
    .sort((a, b) => a.startAt - b.startAt);

  let cursor = new Date(input.rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const endMs = input.rangeEnd.getTime();

  while (cursor.getTime() < endMs) {
    const dayStart = new Date(cursor);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(dayEndHour, 0, 0, 0);

    const freeStart = Math.max(dayStart.getTime(), input.rangeStart.getTime());
    const freeEndCap = Math.min(dayEnd.getTime(), endMs);

    const dayBusy = busy.filter(
      (b) => b.endAt > freeStart && b.startAt < freeEndCap,
    );

    let t = freeStart;
    for (const b of dayBusy) {
      if (b.startAt > t) {
        pushBlocks(windows, t, Math.min(b.startAt, freeEndCap), maxBlock, minBlock);
      }
      t = Math.max(t, b.endAt);
    }
    if (t < freeEndCap) {
      pushBlocks(windows, t, freeEndCap, maxBlock, minBlock);
    }

    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  return windows;
}

function pushBlocks(
  out: StudyWindow[],
  startMs: number,
  endMs: number,
  maxBlock: number,
  minBlock: number,
) {
  let s = startMs;
  while (s + minBlock * 60_000 <= endMs) {
    const e = Math.min(s + maxBlock * 60_000, endMs);
    const minutes = Math.round((e - s) / 60_000);
    if (minutes >= minBlock) {
      out.push({
        startAt: new Date(s),
        endAt: new Date(e),
        minutes,
      });
    }
    s = e;
  }
}
