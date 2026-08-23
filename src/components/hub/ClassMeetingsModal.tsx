"use client";

import { useMemo, useState } from "react";
import { Calendar, Loader2, Plus, Trash2, X } from "lucide-react";

import { confirmDelete } from "@/lib/confirm-delete";
import type { HubCourse, HubMeeting } from "./types";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function dayLabel(dayOfWeek: number) {
  return DAY_OPTIONS.find((day) => day.value === dayOfWeek)?.label ?? "Day";
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

const emptyForm = {
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  title: "",
};

export function ClassMeetingsModal({
  course,
  meetings,
  open,
  onClose,
  onChanged,
}: {
  course: HubCourse;
  meetings: HubMeeting[];
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const courseMeetings = useMemo(
    () =>
      meetings
        .filter((meeting) => meeting.courseId === course.id)
        .sort((a, b) =>
          a.dayOfWeek !== b.dayOfWeek
            ? a.dayOfWeek - b.dayOfWeek
            : a.startTime.localeCompare(b.startTime),
        ),
    [course.id, meetings],
  );

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  function startEdit(meeting: HubMeeting) {
    setEditingId(meeting.id);
    setForm({
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location ?? "",
      title: meeting.title ?? "",
    });
  }

  async function saveMeeting() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location || null,
        title: form.title || null,
      };

      const response = await fetch("/api/meetings", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { id: editingId, ...payload }
            : { courseId: course.id, ...payload },
        ),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Failed to save meeting");
      }

      resetForm();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meeting");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeeting(meeting: HubMeeting) {
    const label = meeting.title ?? `${course.title} class`;
    if (!confirmDelete(label)) return;

    const response = await fetch("/api/meetings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: meeting.id }),
    });
    const data = await response.json();
    if (!data.success) {
      setError(data.error ?? "Failed to delete meeting");
      return;
    }

    if (editingId === meeting.id) resetForm();
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-brand bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-brand px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Class schedule
            </p>
            <h3 className="mt-1 text-xl font-bold text-stone-900">{course.title}</h3>
            <p className="mt-1 text-sm text-stone-500">
              Recurring weekly meetings appear on your calendar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-brand-soft hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {courseMeetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand bg-brand-soft/40 px-4 py-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-brand" />
              <p className="mt-3 text-sm font-medium text-stone-700">
                No class times yet
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Add lecture, lab, or discussion blocks below.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {courseMeetings.map((meeting) => (
                <li
                  key={meeting.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-brand px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-stone-900">
                      {meeting.title ?? "Class"}
                    </p>
                    <p className="text-sm text-stone-600">
                      {dayLabel(meeting.dayOfWeek)} · {formatTime(meeting.startTime)}
                      –{formatTime(meeting.endTime)}
                      {meeting.location ? ` · ${meeting.location}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(meeting)}
                      className="rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-brand-soft"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteMeeting(meeting)}
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                      aria-label="Delete meeting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-2xl border border-brand bg-brand-soft/30 p-4">
            <p className="text-sm font-semibold text-stone-900">
              {editingId ? "Edit meeting" : "Add meeting"}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium text-stone-700">Day</span>
                <select
                  value={form.dayOfWeek}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dayOfWeek: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-brand px-3 py-2"
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-stone-700">Start</span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-brand px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-stone-700">End</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-brand px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium text-stone-700">Title (optional)</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Lecture, Lab, Discussion…"
                  className="w-full rounded-xl border border-brand px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium text-stone-700">Location (optional)</span>
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Room 204"
                  className="w-full rounded-xl border border-brand px-3 py-2"
                />
              </label>
            </div>

            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveMeeting()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl btn-primary px-4 py-2 text-sm font-semibold text-white  disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingId ? "Save changes" : "Add meeting"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-brand px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-brand-soft"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
