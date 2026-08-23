import {
  occurrenceKey,
  parseRecurrenceRule,
  serializeRecurrenceRule,
  type RecurrenceEditScope,
  type RecurrenceException,
  type RecurrenceRule,
} from "@/lib/calendar/recurrence";

export type { RecurrenceEditScope };

export interface RecurrenceEventRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  eventType: string;
  color: string | null;
  priority: string;
  recurrence: string | null;
  reminderAt: Date | null;
  completed: boolean;
  location: string | null;
  courseId: string | null;
  assignmentId?: string | null;
  externalId?: string | null;
  externalSource?: string | null;
  calendarConnectionId?: string | null;
}

export interface RecurrenceEventPatch {
  title?: string;
  description?: string | null;
  startAt?: Date;
  endAt?: Date | null;
  allDay?: boolean;
  eventType?: string;
  color?: string | null;
  priority?: string;
  recurrence?: string | null;
  reminderAt?: Date | null;
  completed?: boolean;
  location?: string | null;
  courseId?: string | null;
}

export interface RecurrenceMutationResult {
  masterData: Record<string, unknown>;
  createEvent?: Record<string, unknown>;
  deleteSeries?: boolean;
}

export function parseOccurrenceItemId(
  id: string,
): { seriesId: string; occurrenceAt: Date } | null {
  const match = id.match(/^evt-(.+)-(\d{13})$/);
  if (!match?.[1] || !match[2]) return null;
  return {
    seriesId: match[1],
    occurrenceAt: new Date(Number(match[2])),
  };
}

function dayBefore(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  result.setHours(23, 59, 59, 999);
  return result;
}

function setRuleUntil(rule: RecurrenceRule, until: Date): RecurrenceRule {
  const next: RecurrenceRule = { ...rule, until: until.toISOString() };
  delete next.count;
  return next;
}

function baseRuleWithoutMeta(rule: RecurrenceRule): RecurrenceRule {
  const { exceptions: _exceptions, until: _until, count: _count, ...base } = rule;
  return base;
}

function upsertException(
  exceptions: RecurrenceException[],
  occurrenceAt: Date,
  patch: Partial<RecurrenceException>,
): RecurrenceException[] {
  const key = occurrenceKey(occurrenceAt);
  const index = exceptions.findIndex((item) => item.occurrenceAt === key);
  const current = index >= 0 ? exceptions[index] : { occurrenceAt: key };
  const next: RecurrenceException = {
    ...current,
    ...patch,
    occurrenceAt: key,
    override: patch.override
      ? { ...current.override, ...patch.override }
      : current.override,
  };

  if (index >= 0) {
    const copy = [...exceptions];
    copy[index] = next;
    return copy;
  }

  return [...exceptions, next];
}

function buildOverrideFromPatch(
  existing: RecurrenceEventRecord,
  updates: RecurrenceEventPatch,
): RecurrenceException["override"] {
  const override: NonNullable<RecurrenceException["override"]> = {};

  if (updates.title !== undefined) override.title = updates.title;
  if (updates.description !== undefined) override.description = updates.description;
  if (updates.startAt !== undefined) override.startAt = updates.startAt.toISOString();
  if (updates.endAt !== undefined) {
    override.endAt = updates.endAt ? updates.endAt.toISOString() : null;
  }
  if (updates.allDay !== undefined) override.allDay = updates.allDay;
  if (updates.location !== undefined) override.location = updates.location;
  if (updates.color !== undefined) override.color = updates.color;
  if (updates.completed !== undefined) override.completed = updates.completed;

  if (Object.keys(override).length === 0) {
    return {
      title: existing.title,
      description: existing.description,
      startAt: existing.startAt.toISOString(),
      endAt: existing.endAt?.toISOString() ?? null,
      allDay: existing.allDay,
      location: existing.location,
      color: existing.color,
      completed: existing.completed,
    };
  }

  return override;
}

function copyEventForFollowUp(
  existing: RecurrenceEventRecord,
  updates: RecurrenceEventPatch,
  occurrenceAt: Date,
  rule: RecurrenceRule,
) {
  const startAt = updates.startAt ?? occurrenceAt;
  const duration = existing.endAt
    ? existing.endAt.getTime() - existing.startAt.getTime()
    : existing.allDay
      ? 24 * 60 * 60 * 1000 - 1
      : 60 * 60 * 1000;
  const endAt =
    updates.endAt ??
    (updates.startAt ? new Date(startAt.getTime() + duration) : existing.endAt);

  return {
    userId: existing.userId,
    courseId: updates.courseId !== undefined ? updates.courseId : existing.courseId,
    title: updates.title ?? existing.title,
    description:
      updates.description !== undefined ? updates.description : existing.description,
    startAt,
    endAt,
    allDay: updates.allDay ?? existing.allDay,
    eventType: updates.eventType ?? existing.eventType,
    color: updates.color !== undefined ? updates.color : existing.color,
    priority: updates.priority ?? existing.priority,
    recurrence: serializeRecurrenceRule(baseRuleWithoutMeta(rule)),
    reminderAt:
      updates.reminderAt !== undefined ? updates.reminderAt : existing.reminderAt,
    completed: updates.completed ?? existing.completed,
    location: updates.location !== undefined ? updates.location : existing.location,
    externalSource: null,
    externalId: null,
    calendarConnectionId: null,
  };
}

export function applyRecurrenceEventUpdate(
  existing: RecurrenceEventRecord,
  occurrenceAt: Date | null,
  scope: RecurrenceEditScope,
  updates: RecurrenceEventPatch,
): RecurrenceMutationResult {
  const rule = parseRecurrenceRule(existing.recurrence);

  if (!rule || !occurrenceAt || scope === "series") {
    const masterData: Record<string, unknown> = {};
    if (updates.title !== undefined) masterData.title = updates.title;
    if (updates.description !== undefined) masterData.description = updates.description;
    if (updates.startAt !== undefined) masterData.startAt = updates.startAt;
    if (updates.endAt !== undefined) masterData.endAt = updates.endAt;
    if (updates.allDay !== undefined) masterData.allDay = updates.allDay;
    if (updates.eventType !== undefined) masterData.eventType = updates.eventType;
    if (updates.color !== undefined) masterData.color = updates.color;
    if (updates.priority !== undefined) masterData.priority = updates.priority;
    if (updates.recurrence !== undefined) masterData.recurrence = updates.recurrence;
    if (updates.reminderAt !== undefined) masterData.reminderAt = updates.reminderAt;
    if (updates.completed !== undefined) masterData.completed = updates.completed;
    if (updates.location !== undefined) masterData.location = updates.location;
    if (updates.courseId !== undefined) masterData.courseId = updates.courseId;
    return { masterData };
  }

  if (scope === "single") {
    const exceptions = upsertException(rule.exceptions ?? [], occurrenceAt, {
      override: buildOverrideFromPatch(existing, updates),
    });

    return {
      masterData: {
        recurrence: serializeRecurrenceRule({ ...rule, exceptions }),
      },
    };
  }

  const truncatedRule = setRuleUntil(rule, dayBefore(occurrenceAt));
  return {
    masterData: {
      recurrence: serializeRecurrenceRule(truncatedRule),
    },
    createEvent: copyEventForFollowUp(existing, updates, occurrenceAt, rule),
  };
}

export function applyRecurrenceEventDelete(
  existing: RecurrenceEventRecord,
  occurrenceAt: Date | null,
  scope: RecurrenceEditScope,
): RecurrenceMutationResult {
  const rule = parseRecurrenceRule(existing.recurrence);

  if (!rule || !occurrenceAt || scope === "series") {
    return { masterData: {}, deleteSeries: true };
  }

  if (scope === "single") {
    const exceptions = upsertException(rule.exceptions ?? [], occurrenceAt, {
      cancelled: true,
    });
    return {
      masterData: {
        recurrence: serializeRecurrenceRule({ ...rule, exceptions }),
      },
    };
  }

  return {
    masterData: {
      recurrence: serializeRecurrenceRule(setRuleUntil(rule, dayBefore(occurrenceAt))),
    },
  };
}
