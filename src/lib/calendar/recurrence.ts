export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export type RecurrenceEditScope = "single" | "following" | "series";

export interface RecurrenceException {
  occurrenceAt: string;
  cancelled?: boolean;
  override?: {
    title?: string;
    description?: string | null;
    startAt?: string;
    endAt?: string | null;
    allDay?: boolean;
    location?: string | null;
    color?: string | null;
    completed?: boolean;
  };
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  until?: string;
  count?: number;
  byWeekday?: number[];
  exceptions?: RecurrenceException[];
}

const MAX_OCCURRENCES = 366;

const LEGACY_MAP: Record<string, RecurrenceFrequency> = {
  daily: "daily",
  weekly: "weekly",
  biweekly: "biweekly",
  "every 2 weeks": "biweekly",
  monthly: "monthly",
};

export const RECURRENCE_PRESETS: Array<{
  value: string;
  label: string;
  rule: RecurrenceRule | null;
}> = [
  { value: "", label: "Does not repeat", rule: null },
  { value: "daily", label: "Daily", rule: { frequency: "daily" } },
  { value: "weekly", label: "Weekly", rule: { frequency: "weekly" } },
  { value: "biweekly", label: "Every 2 weeks", rule: { frequency: "biweekly" } },
  { value: "monthly", label: "Monthly", rule: { frequency: "monthly" } },
];

export function serializeRecurrenceRule(rule: RecurrenceRule | null): string | null {
  if (!rule) return null;
  return JSON.stringify(rule);
}

export function recurrenceRuleFromPreset(
  value: string,
  options?: { until?: string; count?: number | null },
): RecurrenceRule | null {
  const preset = RECURRENCE_PRESETS.find((item) => item.value === value);
  if (!preset?.rule) return null;

  return {
    ...preset.rule,
    until: options?.until || undefined,
    count: options?.count || undefined,
  };
}

export function occurrenceKey(date: Date): string {
  return date.toISOString();
}

function findException(
  exceptions: RecurrenceException[] | undefined,
  at: Date,
): RecurrenceException | undefined {
  const key = occurrenceKey(at);
  return exceptions?.find((item) => item.occurrenceAt === key);
}

export function parseRecurrenceRule(raw: string | null | undefined): RecurrenceRule | null {
  if (!raw?.trim()) return null;

  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as RecurrenceRule;
      if (parsed?.frequency) return parsed;
    } catch {
      return null;
    }
  }

  const legacy = LEGACY_MAP[trimmed.toLowerCase()];
  return legacy ? { frequency: legacy } : null;
}

export function recurrencePresetValue(raw: string | null | undefined): string {
  const rule = parseRecurrenceRule(raw);
  if (!rule) return "";
  if (rule.exceptions?.length) return "custom";
  const preset = RECURRENCE_PRESETS.find(
    (item) => item.rule?.frequency === rule.frequency && !rule.byWeekday?.length,
  );
  return preset?.value ?? "";
}

export function recurrenceEndDateValue(raw: string | null | undefined): string {
  const rule = parseRecurrenceRule(raw);
  if (!rule?.until) return "";
  return rule.until.slice(0, 10);
}

export function recurrenceCountValue(raw: string | null | undefined): string {
  const rule = parseRecurrenceRule(raw);
  return rule?.count ? String(rule.count) : "";
}

export function recurrenceEndMode(
  raw: string | null | undefined,
): "never" | "until" | "count" {
  const rule = parseRecurrenceRule(raw);
  if (rule?.until) return "until";
  if (rule?.count) return "count";
  return "never";
}

export function recurrenceLabel(raw: string | null | undefined): string | null {
  const rule = parseRecurrenceRule(raw);
  if (!rule) return null;

  const preset = RECURRENCE_PRESETS.find((item) => item.rule?.frequency === rule.frequency);
  let label = preset?.label ?? rule.frequency;

  if (rule.until) {
    label += ` until ${new Date(rule.until).toLocaleDateString()}`;
  } else if (rule.count) {
    label += ` (${rule.count} times)`;
  }

  return label;
}

function addInterval(date: Date, rule: RecurrenceRule): Date {
  const next = new Date(date);
  const interval = rule.interval ?? 1;

  switch (rule.frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7 * interval);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14 * interval);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next;
}

function matchesWeekday(date: Date, rule: RecurrenceRule): boolean {
  if (!rule.byWeekday?.length) return true;
  return rule.byWeekday.includes(date.getDay());
}

export function expandRecurrenceOccurrences(input: {
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  recurrence: string | null;
  rangeStart: Date;
  rangeEnd: Date;
}): Array<{
  startAt: Date;
  endAt: Date;
  isSeriesStart: boolean;
  originalStartAt: Date;
  override?: RecurrenceException["override"];
}> {
  const rule = parseRecurrenceRule(input.recurrence);
  if (!rule) {
    const endAt =
      input.endAt ??
      new Date(
        input.startAt.getTime() + (input.allDay ? 24 * 60 * 60 * 1000 - 1 : 60 * 60 * 1000),
      );
    return [{ startAt: input.startAt, endAt, isSeriesStart: true, originalStartAt: input.startAt }];
  }

  const durationMs = input.endAt
    ? Math.max(0, input.endAt.getTime() - input.startAt.getTime())
    : input.allDay
      ? 24 * 60 * 60 * 1000 - 1
      : 60 * 60 * 1000;

  const untilDate = rule.until ? new Date(rule.until) : null;
  if (untilDate) untilDate.setHours(23, 59, 59, 999);

  const occurrences: Array<{
    startAt: Date;
    endAt: Date;
    isSeriesStart: boolean;
    originalStartAt: Date;
    override?: RecurrenceException["override"];
  }> = [];
  let cursor = new Date(input.startAt);
  let generated = 0;

  while (generated < MAX_OCCURRENCES) {
    if (rule.count && generated >= rule.count) break;
    if (untilDate && cursor > untilDate) break;
    if (cursor > input.rangeEnd) break;

    const occurrenceEnd = new Date(cursor.getTime() + durationMs);
    const overlapsRange =
      occurrenceEnd >= input.rangeStart && cursor <= input.rangeEnd;

    if (matchesWeekday(cursor, rule) && overlapsRange) {
      const exception = findException(rule.exceptions, cursor);
      if (exception?.cancelled) {
        generated += 1;
        cursor = addInterval(cursor, rule);
        continue;
      }

      let occStart = new Date(cursor);
      let occEnd = occurrenceEnd;
      if (exception?.override?.startAt) {
        occStart = new Date(exception.override.startAt);
      }
      if (exception?.override?.endAt) {
        occEnd = new Date(exception.override.endAt);
      } else if (exception?.override?.startAt) {
        occEnd = new Date(occStart.getTime() + durationMs);
      }

      occurrences.push({
        startAt: occStart,
        endAt: occEnd,
        isSeriesStart: generated === 0,
        originalStartAt: new Date(cursor),
        override: exception?.override,
      });
    }

    generated += 1;
    cursor = addInterval(cursor, rule);
  }

  return occurrences;
}

export function toRrule(rule: RecurrenceRule): string | null {
  const interval = rule.interval ?? 1;
  let base: string | null = null;

  switch (rule.frequency) {
    case "daily":
      base = `FREQ=DAILY;INTERVAL=${interval}`;
      break;
    case "weekly":
      base = `FREQ=WEEKLY;INTERVAL=${interval}`;
      break;
    case "biweekly":
      base = "FREQ=WEEKLY;INTERVAL=2";
      break;
    case "monthly":
      base = `FREQ=MONTHLY;INTERVAL=${interval}`;
      break;
    default:
      return null;
  }

  if (rule.until) {
    const until = new Date(rule.until);
    const stamp = [
      until.getUTCFullYear(),
      String(until.getUTCMonth() + 1).padStart(2, "0"),
      String(until.getUTCDate()).padStart(2, "0"),
      "T",
      String(until.getUTCHours()).padStart(2, "0"),
      String(until.getUTCMinutes()).padStart(2, "0"),
      String(until.getUTCSeconds()).padStart(2, "0"),
      "Z",
    ].join("");
    base += `;UNTIL=${stamp}`;
  } else if (rule.count) {
    base += `;COUNT=${rule.count}`;
  }

  return base;
}
