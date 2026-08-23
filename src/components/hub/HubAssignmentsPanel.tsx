"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Plus } from "lucide-react";

import { computePriority, isAssignmentCompleted } from "@/lib/academic";
import { formatGradeLabel } from "@/lib/grades";
import { coursePath } from "@/lib/courses";
import { hubScheduleHref } from "@/lib/hub/tabs";

import type { HubAssignment, HubCourse } from "./types";

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function priorityClasses(priority: ReturnType<typeof computePriority>) {
  switch (priority) {
    case "HIGH":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-stone-200 bg-stone-50 text-stone-600";
  }
}

export function HubAssignmentsPanel({
  assignments: initialAssignments,
  courses,
  courseFilterId,
  focusAssignmentId,
  onSelectAssignment,
  onChanged,
  expanded = false,
}: {
  assignments: HubAssignment[];
  courses: HubCourse[];
  courseFilterId?: string | null;
  focusAssignmentId?: string | null;
  onSelectAssignment?: (assignmentId: string) => void;
  onChanged?: () => void;
  expanded?: boolean;
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showCompleted, setShowCompleted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [courseTitle, setCourseTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoped = useMemo(() => {
    const filtered = courseFilterId
      ? assignments.filter((assignment) => assignment.courseId === courseFilterId)
      : assignments;

    return filtered.filter((assignment) => {
      const completed = isAssignmentCompleted(
        assignment.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED",
      );
      return showCompleted || !completed;
    });
  }, [assignments, courseFilterId, showCompleted]);

  const pendingCount = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          !isAssignmentCompleted(
            assignment.status as
              | "NOT_STARTED"
              | "IN_PROGRESS"
              | "SUBMITTED"
              | "GRADED",
          ),
      ).length,
    [assignments],
  );

  async function refreshAssignments() {
    const response = await fetch("/api/planner");
    const data = await response.json();
    if (!data.success) return;

    setAssignments(
      data.data.map(
        (task: {
          id: string;
          title: string;
          description?: string | null;
          dueDate: string | null;
          status: string;
          grade?: number | null;
          maxGrade?: number | null;
          courseId: string;
          course: string;
        }) => {
          const course = courses.find((entry) => entry.id === task.courseId);
          return {
            id: task.id,
            title: task.title,
            description: task.description ?? null,
            dueDate: task.dueDate,
            kind: "ASSIGNMENT",
            status: task.status,
            grade: task.grade ?? null,
            maxGrade: task.maxGrade ?? null,
            courseId: task.courseId,
            courseTitle: task.course,
            courseColor: course?.color ?? null,
            source: "manual" as const,
          };
        },
      ),
    );
  }

  async function toggleComplete(assignment: HubAssignment) {
    const completed = isAssignmentCompleted(
      assignment.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED",
    );

    setAssignments((current) =>
      current.map((item) =>
        item.id === assignment.id
          ? {
              ...item,
              status: completed ? "NOT_STARTED" : "SUBMITTED",
            }
          : item,
      ),
    );

    try {
      await fetch("/api/planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assignment.id, completed: !completed }),
      });
      await refreshAssignments();
      onChanged?.();
    } catch {
      await refreshAssignments();
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Enter an assignment title.");
      return;
    }

    if (courses.length === 0 && !courseTitle.trim()) {
      setError("Enter a class name first.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          courseId: courses.length > 0 ? courseId : undefined,
          courseTitle: courses.length === 0 ? courseTitle : undefined,
          dueDate: dueDate || null,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Could not add assignment.");
      }

      setTitle("");
      setDueDate("");
      setCourseTitle("");
      setAddOpen(false);
      await refreshAssignments();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add assignment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="hub-assignments" className="rounded-3xl border border-brand bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            Coursework
          </p>
          <h2 className="text-lg font-bold text-stone-900">Assignments</h2>
          <p className="mt-1 text-sm text-stone-500">
            {pendingCount} open ·{" "}
            {expanded ? "full list across your classes" : "add and check off without leaving the hub"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            className="rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-brand-soft"
          >
            {showCompleted ? "Hide done" : "Show done"}
          </button>
          <button
            type="button"
            onClick={() => setAddOpen((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-full btn-primary px-3 py-1.5 text-xs font-semibold text-white transition "
          >
            <Plus className="h-3.5 w-3.5" />
            Add
            {addOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          {!expanded ? (
            <Link
              href={hubScheduleHref()}
              className="rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-brand-soft"
            >
              Full schedule
            </Link>
          ) : null}
        </div>
      </div>

      {addOpen ? (
        <form onSubmit={(event) => void handleAdd(event)} className="mt-4 space-y-3">
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Assignment title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-xl border border-brand px-3 py-2 text-sm"
            />
            {courses.length > 0 ? (
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="rounded-xl border border-brand px-3 py-2 text-sm"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Class name"
                value={courseTitle}
                onChange={(event) => setCourseTitle(event.target.value)}
                className="rounded-xl border border-brand px-3 py-2 text-sm"
              />
            )}
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="rounded-xl border border-brand px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl btn-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Adding…" : "Save"}
            </button>
          </div>
        </form>
      ) : null}

      {scoped.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-brand px-4 py-8 text-center text-sm text-stone-500">
          {pendingCount === 0 && !showCompleted
            ? "No open assignments. Tap Add to create one."
            : "No assignments match this filter."}
        </p>
      ) : (
        <ul
          className={`mt-4 space-y-2 ${expanded ? "" : "max-h-72 overflow-y-auto"}`}
        >
          {(expanded ? scoped : scoped.slice(0, 12)).map((assignment) => {
            const completed = isAssignmentCompleted(
              assignment.status as
                | "NOT_STARTED"
                | "IN_PROGRESS"
                | "SUBMITTED"
                | "GRADED",
            );
            const priority = computePriority(
              assignment.dueDate ? new Date(assignment.dueDate) : null,
            );
            const gradeLabel = formatGradeLabel(assignment);
            const isFocused = focusAssignmentId === assignment.id;

            return (
              <li key={assignment.id}>
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                    isFocused
                      ? "border-[color-mix(in_srgb,var(--sh-primary)_45%,transparent)] bg-brand-soft ring-2 ring-[color-mix(in_srgb,var(--sh-primary)_18%,transparent)]"
                      : completed
                        ? "border-stone-200 bg-stone-50 opacity-80"
                        : "border-brand hover:border-brand"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => void toggleComplete(assignment)}
                    className="h-4 w-4 shrink-0 rounded border-brand text-brand"
                    aria-label={`Mark ${assignment.title} complete`}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectAssignment?.(assignment.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={`text-sm font-semibold text-stone-900 ${
                        completed ? "line-through text-stone-500" : ""
                      }`}
                    >
                      {assignment.title}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      <Link
                        href={coursePath(assignment.courseId)}
                        onClick={(event) => event.stopPropagation()}
                        className="font-semibold text-brand hover:text-brand"
                      >
                        {assignment.courseTitle}
                      </Link>
                      <span> · Due {formatDueDate(assignment.dueDate)}</span>
                    </p>
                  </button>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityClasses(priority)}`}
                  >
                    {priority}
                  </span>
                  {gradeLabel ? (
                    <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                      {gradeLabel}
                    </span>
                  ) : null}
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!expanded && scoped.length > 12 ? (
        <p className="mt-3 text-center text-xs text-stone-500">
          Showing 12 of {scoped.length}.{" "}
          <Link href={hubScheduleHref()} className="font-semibold text-brand">
            See all on schedule
          </Link>
        </p>
      ) : null}
    </section>
  );
}
