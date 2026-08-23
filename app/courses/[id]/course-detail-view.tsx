"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Layers,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { CourseProgressStory } from "@/components/courses/CourseProgressStory";
import { CourseInfoView } from "@/components/courses/CourseInfoView";
import { MaterialOpenActions } from "@/components/materials/MaterialOpenActions";
import { BreakDownButton } from "@/components/study/BreakDownButton";
import { StudyTopicToolkit } from "@/components/courses/StudyTopicToolkit";
import { ClassMeetingsModal } from "@/components/hub/ClassMeetingsModal";
import type { HubCourse, HubMeeting } from "@/components/hub/types";
import { MasteryTree } from "@/components/csl/MasteryTree";
import { isAssignmentCompleted } from "@/lib/academic";
import { courseGradeSummary, formatGradeLabel } from "@/lib/grades";
import { hubAssignmentFocusHref, hubChatHref, hubScheduleHref } from "@/lib/hub/tabs";
import type { StudyTopicProfile } from "@/lib/study-topic/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CourseDetail {
  id: string;
  title: string;
  code: string | null;
  instructor: string | null;
  semester: string | null;
  description: string | null;
  color: string | null;
  gradeLevel: string | null;
  subject: string | null;
  moodleCourseId: number | null;
  quizCount: number;
  sessionCount: number;
  assignments: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    kind: string;
    grade: number | null;
    maxGrade: number | null;
  }>;
  materials: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  meetings: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
    title: string | null;
  }>;
  topics: Array<{
    id: string;
    name: string;
    proficiency: number | null;
  }>;
}

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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

function statusLabel(status: string) {
  switch (status) {
    case "GRADED":
      return "Graded";
    case "SUBMITTED":
      return "Submitted";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Done";
    case "NOT_STARTED":
    default:
      return "Not started";
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "GRADED":
      return "bg-violet-100 text-violet-700";
    case "SUBMITTED":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "NOT_STARTED":
    default:
      return "bg-stone-100 text-stone-600";
  }
}

export function CourseDetailView({
  course,
  studyTopic = null,
}: {
  course: CourseDetail;
  studyTopic?: StudyTopicProfile | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "course-info">("overview");

  useEffect(() => {
    if (searchParams.get("tab") === "course-info") {
      setActiveTab("course-info");
    }
  }, [searchParams]);

  const hubCourse: HubCourse = {
    id: course.id,
    title: course.title,
    code: course.code,
    instructor: course.instructor,
    semester: course.semester,
    color: course.color,
    assignmentCount: course.assignments.length,
    materialCount: course.materials.length,
    meetingCount: course.meetings.length,
  };

  const hubMeetings: HubMeeting[] = course.meetings.map((meeting) => ({
    id: meeting.id,
    courseId: course.id,
    courseTitle: course.title,
    courseColor: course.color,
    dayOfWeek: meeting.dayOfWeek,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    location: meeting.location,
    title: meeting.title,
  }));

  const pendingAssignments = course.assignments.filter(
    (assignment) =>
      !isAssignmentCompleted(
        assignment.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED",
      ),
  );
  const gradeSummary = courseGradeSummary(course.assignments);

  return (
    <div className="min-h-screen bg-[#fff8f1] text-stone-800">
      <div className="hub-shell flex w-full flex-col gap-8 py-6 lg:py-10">
        <header className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <div
            className="h-2 w-full"
            style={{ backgroundColor: course.color ?? "#ea580c" }}
          />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              {course.code ?? "Class"}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-stone-900">{course.title}</h1>
            <p className="mt-2 text-sm text-stone-500">
              {[course.instructor, course.semester, course.gradeLevel, course.subject]
                .filter(Boolean)
                .join(" · ") || "No details yet"}
            </p>
            {course.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600">
                {course.description}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/core?courseId=${course.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                <FileText className="h-4 w-4" />
                Core notes
              </Link>
              <Link
                href={`/study?courseId=${course.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
              >
                <Sparkles className="h-4 w-4" />
                Study hub
              </Link>
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50"
              >
                <Calendar className="h-4 w-4" />
                Class schedule
              </button>
              <Link
                href={hubChatHref({ courseId: course.id })}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50"
              >
                <MessageCircle className="h-4 w-4" />
                Ask copilot
              </Link>
              <Link
                href={`/quizzes?courseId=${course.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-orange-50"
              >
                <ClipboardList className="h-4 w-4" />
                Quizzes ({course.quizCount})
              </Link>
              <Link
                href={`/flashcards?courseId=${course.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                <Layers className="h-4 w-4" />
                Flashcards
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <span>{course.assignments.length} assignments</span>
              <span>{course.materials.length} materials</span>
              <span>{course.meetings.length} meetings/wk</span>
              <span>{course.sessionCount} study sessions</span>
              {gradeSummary ? (
                <span className="text-violet-700">
                  {gradeSummary.average}% avg · {gradeSummary.gradedCount} graded
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex gap-2 border-b border-orange-100">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "overview"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("course-info")}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "course-info"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Course Info
          </button>
        </div>

        {activeTab === "course-info" ? (
          <CourseInfoView courseId={course.id} moodleCourseId={course.moodleCourseId} />
        ) : (
          <>
        {studyTopic ? (
          <StudyTopicToolkit courseId={course.id} studyTopic={studyTopic} />
        ) : null}

        <CourseProgressStory courseId={course.id} />

        {!studyTopic ? (
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Break this down</h2>
            <p className="mt-1 text-sm text-stone-600">
              One button — outline, flashcards, quiz, and suggested calendar blocks.
            </p>
            <div className="mt-4">
              <BreakDownButton courseId={course.id} />
            </div>
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Assignments</h2>
                <p className="text-sm text-stone-500">
                  {pendingAssignments.length} still open
                </p>
              </div>
              <Link
                href={hubScheduleHref()}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                All assignments
              </Link>
            </div>

            {course.assignments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-orange-200 px-4 py-8 text-center text-sm text-stone-500">
                No assignments yet. Add one from the planner or upload a syllabus.
              </p>
            ) : (
              <ul className="space-y-2">
                {course.assignments.map((assignment) => {
                  const gradeLabel = formatGradeLabel(assignment);
                  return (
                    <li key={assignment.id}>
                      <Link
                        href={hubAssignmentFocusHref(assignment.id)}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-orange-100 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50/50"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900">{assignment.title}</p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            Due {formatDueDate(assignment.dueDate)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {gradeLabel ? (
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-800">
                              {gradeLabel}
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClasses(assignment.status)}`}
                          >
                            {statusLabel(assignment.status)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="space-y-8">
            <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Materials</h2>
                  <p className="text-sm text-stone-500">Quick view or open a Core workbook</p>
                </div>
                <BookOpen className="h-5 w-5 text-stone-400" />
              </div>

              {course.materials.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-orange-200 px-4 py-8 text-center text-sm text-stone-500">
                  No materials yet. Upload a syllabus or add files in Core.
                </p>
              ) : (
                <ul className="space-y-2">
                  {course.materials.map((material) => (
                    <li key={material.id}>
                      <MaterialOpenActions
                        materialId={material.id}
                        courseId={course.id}
                        title={material.title}
                        type={material.type}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Weekly schedule</h2>
                  <p className="text-sm text-stone-500">
                    {course.meetings.length === 0
                      ? "No class times set"
                      : `${course.meetings.length} meeting${course.meetings.length === 1 ? "" : "s"} per week`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  Edit
                </button>
              </div>

              {course.meetings.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="w-full rounded-2xl border border-dashed border-orange-200 px-4 py-8 text-center text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  Add class meeting times
                </button>
              ) : (
                <ul className="space-y-2">
                  {course.meetings.map((meeting) => (
                    <li
                      key={meeting.id}
                      className="rounded-2xl border border-orange-100 px-4 py-3"
                    >
                      <p className="font-semibold text-stone-900">
                        {DAY_LABELS[meeting.dayOfWeek] ?? "Day"}{" "}
                        {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
                      </p>
                      {meeting.title ? (
                        <p className="mt-0.5 text-sm text-stone-600">{meeting.title}</p>
                      ) : null}
                      {meeting.location ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                          <MapPin className="h-3 w-3" />
                          {meeting.location}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {course.topics.length > 0 ? (
          <MasteryTree courseId={course.id} />
        ) : null}
          </>
        )}
      </div>

      {scheduleOpen ? (
        <ClassMeetingsModal
          course={hubCourse}
          meetings={hubMeetings}
          open
          onClose={() => setScheduleOpen(false)}
          onChanged={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
