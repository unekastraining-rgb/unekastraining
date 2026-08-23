/** 15-minute time blocks for calendar event forms. */

import { combineDateAndTimeSafe } from "@/lib/calendar/date-utils";

export interface TimeSlotOption {
  value: string;
  label: string;
}

export const REMINDER_NONE = "";

export const REMINDER_OFFSETS = [
  { value: "offset:0", label: "At event start" },
  { value: "offset:15", label: "15 minutes before" },
  { value: "offset:30", label: "30 minutes before" },
  { value: "offset:60", label: "1 hour before" },
  { value: "offset:1440", label: "1 day before" },
] as const;

export function buildTimeSlotOptions(
  startHour = 6,
  endHour = 23,
  stepMinutes = 15,
): TimeSlotOption[] {
  const slots: TimeSlotOption[] = [];
  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      if (hour === endHour && minute > 0) break;
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      slots.push({ value, label: formatTime12h(value) });
    }
  }
  return slots;
}

export const EVENT_TIME_SLOTS = buildTimeSlotOptions(6, 23, 15);

export function formatTime12h(time24: string): string {
  const [hourPart, minutePart] = time24.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time24;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function snapToNearestSlot(
  time24: string,
  slots: TimeSlotOption[] = EVENT_TIME_SLOTS,
): string {
  if (!time24 || !/^\d{2}:\d{2}$/.test(time24)) {
    return slots[0]?.value ?? "09:00";
  }
  const [h, m] = time24.split(":").map(Number);
  const minutes = h * 60 + m;
  let best = slots[0]?.value ?? "09:00";
  let bestDist = Number.POSITIVE_INFINITY;
  for (const slot of slots) {
    const [sh, sm] = slot.value.split(":").map(Number);
    const dist = Math.abs(sh * 60 + sm - minutes);
    if (dist < bestDist) {
      bestDist = dist;
      best = slot.value;
    }
  }
  return best;
}

export function addMinutesToTime(time24: string, minutesToAdd: number): string {
  const [h, m] = time24.split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(wrapped / 60);
  const nm = wrapped % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/** Map stored reminder ISO to form select value. */
export function reminderToFormValue(
  reminderIso: string | null | undefined,
  eventStartIso: string,
): string {
  if (!reminderIso) return REMINDER_NONE;

  const reminder = new Date(reminderIso);
  const start = new Date(eventStartIso);
  if (Number.isNaN(reminder.getTime())) return REMINDER_NONE;

  const diffMinutes = Math.round((start.getTime() - reminder.getTime()) / 60_000);
  const offsetMatch = REMINDER_OFFSETS.find(
    (o) => Number(o.value.replace("offset:", "")) === diffMinutes,
  );
  if (offsetMatch) return offsetMatch.value;

  return snapToNearestSlot(
    `${String(reminder.getHours()).padStart(2, "0")}:${String(reminder.getMinutes()).padStart(2, "0")}`,
  );
}

/** Convert form reminder value to ISO datetime on event date. */
export function reminderFromFormValue(
  value: string,
  dateStr: string,
  startTime: string,
): string | null {
  if (!value || value === REMINDER_NONE) return null;

  if (value.startsWith("offset:")) {
    const minutes = Number(value.slice("offset:".length));
    if (Number.isNaN(minutes)) return null;
    const start = combineDateAndTimeSafe(dateStr, startTime);
    if (!start) return null;
    return new Date(start.getTime() - minutes * 60_000).toISOString();
  }

  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const reminder = combineDateAndTimeSafe(dateStr, value);
  return reminder?.toISOString() ?? null;
}
