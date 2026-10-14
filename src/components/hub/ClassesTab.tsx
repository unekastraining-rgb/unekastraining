"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, FileText, MessageCircle, Plus, Trash2 } from "lucide-react";

import { confirmDelete, confirmDeleteMany } from "@/lib/confirm-delete";
import { coursePath } from "@/lib/courses";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { useSelectableIds } from "@/lib/selection/use-selectable-ids";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { hubChatHref } from "@/lib/hub/tabs";

import { CourseProgressStory } from "@/components/courses/CourseProgressStory";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { SelectCheckbox } from "@/components/ui/SelectCheckbox";
import { ClassMeetingsModal } from "./ClassMeetingsModal";
import { FirstRunOnboarding } from "./FirstRunOnboarding";
import { HubWelcomeHeader } from "./HubWelcomeHeader";
import type { HubCourse, HubMeeting, HubUser } from "./types";

export function ClassesTab({
  courses,
  meetings,
  user,
  onCourseDeleted,
}: {
  courses: HubCourse[];
  meetings: HubMeeting[];
  user: HubUser;
  onCourseDeleted?: () => void;
}) {
  const [scheduleCourse, setScheduleCourse] = useState<HubCourse | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);
  const selection = useSelectableIds(courseIds);

  useEffect(() => {
    selection.pruneTo(courseIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIds.join("|")]);

  if (courses.length === 0) {
    return (
      <div className="space-y-5">
        <HubWelcomeHeader
          user={user}
          eyebrow="Getting started"
          subtitle="Add your first class or scan a syllabus to build your semester schedule."
        />
        <FirstRunOnboarding variant="classes" user={user} />
      </div>
    );
  }

  async function deleteCourse(course: HubCourse) {
    if (
      !confirmDelete(
        `${readableCourseTitle(course.title, course.code)} and all its assignments, materials, and schedule`,
      )
    ) {
      return;
    }

    const response = await fetch("/api/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: course.id }),
    });
    const data = await response.json();
    if (data.success) {
      onCourseDeleted?.();
    }
  }

  async function deleteSelectedCourses() {
    const ids = selection.selectedIds;
    if (ids.length === 0) return;
    if (
      !confirmDeleteMany(ids.length, {
        noun: "course",
        nounPlural: "courses",
        detail: "including assignments, materials, and schedules",
      })
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();
      if (data.success) {
        selection.clear();
        onCourseDeleted?.();
      }
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-stone-900">My Courses</h3>
          <p className="mt-1 text-sm text-stone-500">
            {courses.length} active this semester
          </p>
        </div>
        <Link
          href="/courses"
          data-hub-chrome
          className="btn-primary inline-flex min-h-11 items-center gap-2 px-5 py-2.5 text-sm shadow-md touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          Add class
        </Link>
      </div>

      <BulkSelectionBar
        totalCount={courses.length}
        selectedCount={selection.selectedCount}
        allSelected={selection.allSelected}
        someSelected={selection.someSelected}
        onToggleAll={selection.toggleAll}
        onClear={selection.clear}
        onDeleteSelected={() => void deleteSelectedCourses()}
        deleting={bulkDeleting}
        noun="course"
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`card-soft overflow-hidden transition hover:shadow-md ${
              selection.isSelected(course.id)
                ? "ring-2 ring-[var(--sh-primary,#ea580c)]"
                : ""
            }`}
          >
            <div
              className="h-2 w-full"
              style={{ backgroundColor: course.color ?? "#ea580c" }}
            />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <SelectCheckbox
                    checked={selection.isSelected(course.id)}
                    onChange={() => selection.toggle(course.id)}
                    label={`Select ${readableCourseTitle(course.title, course.code)}`}
                    className="-ml-2 -mt-1"
                  />
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-stone-900">
                      <Link
                        href={coursePath(course.id)}
                        className="transition hover:text-brand"
                      >
                        {readableCourseTitle(course.title, course.code)}
                      </Link>
                    </h4>
                    <p className="mt-2 text-sm text-stone-500">
                      {[course.instructor, course.semester]
                        .filter(Boolean)
                        .join(" · ") || "No details yet"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Active
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge label={`${course.assignmentCount} assignments`} tone="amber" />
                <Badge label={`${course.materialCount} materials`} tone="zinc" />
                {course.meetingCount > 0 ? (
                  <Badge
                    label={`${course.meetingCount} class${course.meetingCount === 1 ? "" : "es"}/wk`}
                    tone="zinc"
                  />
                ) : null}
              </div>

              <div className="mt-4">
                <CourseProgressStory courseId={course.id} compact />
              </div>

              <div className="mt-5 flex flex-wrap gap-2" data-hub-chrome>
                <button
                  type="button"
                  onClick={() => setScheduleCourse(course)}
                  className="inline-flex min-h-11 flex-1 min-w-[7rem] items-center justify-center gap-2 rounded-xl border border-brand py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft touch-manipulation"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
                <Link
                  href={`/core?courseId=${encodeURIComponent(course.id)}`}
                  className="inline-flex min-h-11 flex-1 min-w-[7rem] items-center justify-center gap-2 rounded-xl border border-teal-200 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 touch-manipulation"
                >
                  <FileText className="h-4 w-4" />
                  Core
                </Link>
                <Link
                  href={hubChatHref({
                    courseId: course.id,
                    topic: pickColdStartTopic(course.topics ?? []) ?? undefined,
                  })}
                  className="inline-flex min-h-11 flex-1 min-w-[7rem] items-center justify-center gap-2 rounded-xl border border-brand py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft touch-manipulation"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask
                </Link>
                <Link
                  href={coursePath(course.id)}
                  className="inline-flex min-h-11 flex-1 min-w-[7rem] items-center justify-center rounded-xl bg-[var(--sh-primary,#ea580c)] py-2.5 text-center text-sm font-semibold text-white transition touch-manipulation hover:brightness-95"
                >
                  View class
                </Link>
                <Link
                  href="/courses"
                  className="min-h-11 flex-1 rounded-xl border border-brand py-2.5 text-center text-sm font-semibold text-stone-700 transition hover:bg-brand-soft touch-manipulation"
                >
                  Manage
                </Link>
                <button
                  type="button"
                  onClick={() => void deleteCourse(course)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 touch-manipulation"
                  aria-label={`Delete ${readableCourseTitle(course.title, course.code)}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {scheduleCourse ? (
        <ClassMeetingsModal
          course={scheduleCourse}
          meetings={meetings}
          open
          onClose={() => setScheduleCourse(null)}
          onChanged={() => onCourseDeleted?.()}
        />
      ) : null}
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "amber" | "zinc";
}) {
  const classes =
    tone === "amber"
      ? "bg-amber-100 text-amber-700"
      : "bg-stone-100 text-stone-600";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${classes}`}
    >
      {label}
    </span>
  );
}
