"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar, FileText, MessageCircle, Plus, Trash2 } from "lucide-react";

import { confirmDelete } from "@/lib/confirm-delete";
import { coursePath } from "@/lib/courses";
import { hubChatHref } from "@/lib/hub/tabs";

import { CourseProgressStory } from "@/components/courses/CourseProgressStory";
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
        `${course.title} and all its assignments, materials, and schedule`,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-stone-900">My classes</h3>
          <p className="mt-1 text-sm text-stone-500">
            {courses.length} active this semester
          </p>
        </div>
        <Link
          href="/courses"
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add class
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="card-soft overflow-hidden transition hover:shadow-md"
          >
            <div
              className="h-2 w-full"
              style={{ backgroundColor: course.color ?? "#ea580c" }}
            />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    {course.code ?? "Course"}
                  </p>
                  <h4 className="mt-1 text-lg font-bold text-stone-900">
                    <Link
                      href={coursePath(course.id)}
                      className="transition hover:text-brand"
                    >
                      {course.title}
                    </Link>
                  </h4>
                  <p className="mt-2 text-sm text-stone-500">
                    {[course.instructor, course.semester]
                      .filter(Boolean)
                      .join(" · ") || "No details yet"}
                  </p>
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

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleCourse(course)}
                  className="inline-flex flex-1 min-w-[7rem] items-center justify-center gap-2 rounded-xl border border-brand py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
                <Link
                  href={`/core?courseId=${course.id}`}
                  className="inline-flex flex-1 min-w-[7rem] items-center justify-center gap-2 rounded-xl border border-teal-200 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
                >
                  <FileText className="h-4 w-4" />
                  Core notes
                </Link>
                <Link
                  href={hubChatHref({ courseId: course.id })}
                  className="inline-flex flex-1 min-w-[7rem] items-center justify-center gap-2 rounded-xl border border-brand py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask
                </Link>
                <Link
                  href={coursePath(course.id)}
                  className="inline-flex flex-1 min-w-[7rem] items-center justify-center rounded-xl bg-brand-soft0 py-2.5 text-center text-sm font-semibold text-white transition "
                >
                  View class
                </Link>
                <Link
                  href="/courses"
                  className="flex-1 rounded-xl border border-brand py-2.5 text-center text-sm font-semibold text-stone-700 transition hover:bg-brand-soft"
                >
                  Manage
                </Link>
                <button
                  type="button"
                  onClick={() => void deleteCourse(course)}
                  className="rounded-xl border border-rose-200 px-3 py-2.5 text-rose-600 transition hover:bg-rose-50"
                  aria-label={`Delete ${course.title}`}
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
