"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  combineDateAndTime,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/calendar/date-utils";
import {
  EVENT_TIME_SLOTS,
  REMINDER_NONE,
  REMINDER_OFFSETS,
  addMinutesToTime,
  reminderFromFormValue,
  reminderToFormValue,
  snapToNearestSlot,
  formatTime12h,
} from "@/lib/calendar/time-slots";
import { EVENT_COLOR_PALETTE } from "@/lib/calendar/colors";
import {
  RECURRENCE_PRESETS,
  recurrenceCountValue,
  recurrenceEndDateValue,
  recurrenceEndMode,
  recurrencePresetValue,
  recurrenceRuleFromPreset,
  serializeRecurrenceRule,
  type RecurrenceEditScope,
} from "@/lib/calendar/recurrence";
import type {
  CalendarEventInput,
  CalendarEventTypeFilter,
  WorkspaceCalendarItem,
  WorkspaceCourse,
} from "@/lib/calendar/workspace-types";
import { EVENT_TYPE_LABELS } from "@/lib/calendar/workspace-types";

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as CalendarEventTypeFilter[];

interface EventFormModalProps {
  open: boolean;
  courses: WorkspaceCourse[];
  initial?: Partial<WorkspaceCalendarItem> & {
    startAt?: string;
    endAt?: string | null;
    id?: string;
  };
  onClose: () => void;
  onSave: (input: CalendarEventInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EventFormModal({
  open,
  courses,
  initial,
  onClose,
  onSave,
  onDelete,
}: EventFormModalProps) {
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState<CalendarEventTypeFilter>("OTHER");
  const [color, setColor] = useState<string>(EVENT_COLOR_PALETTE[0]);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [recurrencePreset, setRecurrencePreset] = useState("");
  const [recurrenceEnds, setRecurrenceEnds] = useState<"never" | "until" | "count">(
    "never",
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceCount, setRecurrenceCount] = useState("");
  const [editScope, setEditScope] = useState<RecurrenceEditScope>("single");
  const [reminderAt, setReminderAt] = useState(REMINDER_NONE);
  const [completed, setCompleted] = useState(false);
  const [syncToPlanner, setSyncToPlanner] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const start = initial?.startAt ? new Date(initial.startAt) : new Date();
    const end = initial?.endAt ? new Date(initial.endAt) : new Date(start.getTime() + 60 * 60 * 1000);

    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setCourseId(initial?.courseId ?? "");
    setDate(toDateInputValue(start));
    setStartTime(snapToNearestSlot(toTimeInputValue(start)));
    setEndTime(snapToNearestSlot(toTimeInputValue(end)));
    setAllDay(initial?.allDay ?? false);
    setEventType(initial?.eventType ?? "OTHER");
    setColor(initial?.color ?? EVENT_COLOR_PALETTE[0]);
    setPriority(initial?.priority ?? "MEDIUM");
    setRecurrencePreset(recurrencePresetValue(initial?.recurrence ?? ""));
    setRecurrenceEnds(recurrenceEndMode(initial?.recurrence ?? ""));
    setRecurrenceEndDate(recurrenceEndDateValue(initial?.recurrence ?? ""));
    setRecurrenceCount(recurrenceCountValue(initial?.recurrence ?? ""));
    setEditScope(initial?.isRecurrenceOccurrence ? "single" : "series");
    setReminderAt(
      reminderToFormValue(initial?.reminderAt, start.toISOString()),
    );
    setCompleted(initial?.completed ?? false);
    setSyncToPlanner(!isEdit);
    setError(null);
  }, [open, initial, isEdit]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const startAt = allDay
        ? combineDateAndTime(date, "00:00").toISOString()
        : combineDateAndTime(date, startTime).toISOString();
      const endAt = allDay
        ? combineDateAndTime(date, "23:59").toISOString()
        : combineDateAndTime(date, endTime).toISOString();

      const reminderIso = allDay
        ? null
        : reminderFromFormValue(reminderAt, date, startTime);

      await onSave({
        title,
        description: description || null,
        courseId: courseId || null,
        startAt,
        endAt,
        allDay,
        eventType,
        color,
        priority,
        recurrence: serializeRecurrenceRule(
          recurrenceRuleFromPreset(recurrencePreset, {
            until:
              recurrenceEnds === "until" && recurrenceEndDate
                ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString()
                : undefined,
            count:
              recurrenceEnds === "count" && recurrenceCount
                ? Number(recurrenceCount)
                : undefined,
          }),
        ),
        reminderAt: reminderIso,
        completed,
        syncToPlanner,
        editScope: initial?.isRecurrenceOccurrence ? editScope : undefined,
        occurrenceAt: initial?.occurrenceAt,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-orange-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-orange-100 px-6 py-4">
          <h2 className="text-lg font-bold text-stone-900">
            {isEdit ? "Edit event" : "Add task / event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 hover:bg-orange-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="Study for AWS exam"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Course">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Type">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEventTypeFilter)}
                className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EVENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </Field>

            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded border-orange-200 text-orange-600"
            />
            All day
          </label>

          {!allDay ? (
            <div className="space-y-3 rounded-xl border border-orange-100 bg-orange-50/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Time
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <select
                    value={startTime}
                    onChange={(e) => {
                      const next = e.target.value;
                      setStartTime(next);
                      if (endTime <= next) {
                        setEndTime(snapToNearestSlot(addMinutesToTime(next, 60)));
                      }
                    }}
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    {EVENT_TIME_SLOTS.map((slot) => (
                      <option key={`start-${slot.value}`} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="End">
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    {(EVENT_TIME_SLOTS.filter((slot) => slot.value > startTime).length > 0
                      ? EVENT_TIME_SLOTS.filter((slot) => slot.value > startTime)
                      : [
                          {
                            value: snapToNearestSlot(addMinutesToTime(startTime, 15)),
                            label: formatTime12h(
                              snapToNearestSlot(addMinutesToTime(startTime, 15)),
                            ),
                          },
                        ]
                    ).map((slot) => (
                      <option key={`end-${slot.value}`} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ) : null}

          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {EVENT_COLOR_PALETTE.map((paletteColor) => (
                <button
                  key={paletteColor}
                  type="button"
                  onClick={() => setColor(paletteColor)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === paletteColor ? "border-stone-900 scale-110" : "border-white"
                  }`}
                  style={{ backgroundColor: paletteColor }}
                  aria-label={`Color ${paletteColor}`}
                />
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Recurrence">
              <select
                value={recurrencePreset}
                onChange={(e) => setRecurrencePreset(e.target.value)}
                disabled={initial?.isRecurrenceOccurrence && editScope === "single"}
                className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50"
              >
                {RECURRENCE_PRESETS.map((preset) => (
                  <option key={preset.value || "none"} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reminder">
              <select
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                disabled={allDay}
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50"
              >
                <option value={REMINDER_NONE}>No reminder</option>
                <optgroup label="Relative">
                  {REMINDER_OFFSETS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="At specific time">
                  {EVENT_TIME_SLOTS.map((slot) => (
                    <option key={`rem-${slot.value}`} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>
          </div>

          {recurrencePreset ? (
            <div className="space-y-3 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Repeats until
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-stone-700">
                {(["never", "until", "count"] as const).map((mode) => (
                  <label key={mode} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="recurrenceEnds"
                      checked={recurrenceEnds === mode}
                      onChange={() => setRecurrenceEnds(mode)}
                      disabled={initial?.isRecurrenceOccurrence && editScope === "single"}
                    />
                    {mode === "never"
                      ? "Never"
                      : mode === "until"
                        ? "On date"
                        : "After"}
                  </label>
                ))}
              </div>
              {recurrenceEnds === "until" ? (
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  disabled={initial?.isRecurrenceOccurrence && editScope === "single"}
                  className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50"
                />
              ) : null}
              {recurrenceEnds === "count" ? (
                <input
                  type="number"
                  min={1}
                  max={366}
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(e.target.value)}
                  disabled={initial?.isRecurrenceOccurrence && editScope === "single"}
                  placeholder="Number of occurrences"
                  className="w-full rounded-xl border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50"
                />
              ) : null}
            </div>
          ) : null}

          {isEdit && initial?.isRecurrenceOccurrence ? (
            <div className="space-y-2 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Apply changes to
              </p>
              {(
                [
                  ["single", "This event only"],
                  ["following", "This and following events"],
                  ["series", "All events in the series"],
                ] as const
              ).map(([scope, label]) => (
                <label key={scope} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="radio"
                    name="editScope"
                    checked={editScope === scope}
                    onChange={() => setEditScope(scope)}
                  />
                  {label}
                </label>
              ))}
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="rounded border-orange-200 text-orange-600"
            />
            Mark complete
          </label>

          {!isEdit ? (
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={syncToPlanner}
                onChange={(e) => setSyncToPlanner(e.target.checked)}
                className="rounded border-orange-200 text-orange-600"
              />
              Also add to Planner (assignments, exams, projects)
            </label>
          ) : null}

          <div className="flex gap-2 pt-2">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={() => void onDelete()}
                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-orange-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}
