"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  Layers,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { CourseProgressStory } from "@/components/courses/CourseProgressStory";
import {
  CourseDashboard,
  CourseThisWeek,
} from "@/components/courses/CourseDashboard";
import { CourseContentModal } from "@/components/courses/CourseContentModal";
import { CourseInfoView } from "@/components/courses/CourseInfoView";
import { AddCourseMaterialButton } from "@/components/materials/AddCourseMaterialModal";
import { MaterialOpenActions } from "@/components/materials/MaterialOpenActions";
import { BreakDownButton } from "@/components/study/BreakDownButton";
import { ContinueLearningButton } from "@/components/study/ContinueLearningButton";
import { ClassMeetingsModal } from "@/components/hub/ClassMeetingsModal";
import type { HubCourse, HubMeeting } from "@/components/hub/types";
import { MasteryTree } from "@/components/csl/MasteryTree";
import { isAssignmentCompleted } from "@/lib/academic";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { courseGradeSummary, formatGradeLabel } from "@/lib/grades";
import { hubAssignmentFocusHref, hubChatHref, hubScheduleHref } from "@/lib/hub/tabs";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { coreStudyPackHref } from "@/lib/study/loop-hrefs";
import type { StudyTopicProfile } from "@/lib/study-topic/types";
import type { AddedCourseMaterial } from "@/components/materials/AddCourseMaterialModal";

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
  courseInfoJson: string | null;
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
    /** Soft Topic→Concept link when available — never invented mastery. */
    conceptId?: string | null;
    alignmentState?: "confirmed" | "inferred" | "unaligned";
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

function isQuizOrTestKind(kind: string, title: string) {
  if (kind === "QUIZ" || kind === "TEST") return true;
  return /\b(quiz|test|exam|midterm|final)\b/i.test(title);
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
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [courseInfoJson, setCourseInfoJson] = useState(course.courseInfoJson);

  const coldStartTopic = useMemo(
    () => pickColdStartTopic(course.topics.map((topic) => topic.name)),
    [course.topics],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setCourseInfoJson(course.courseInfoJson);
  }, [course.courseInfoJson]);

  useEffect(() => {
    if (!course.moodleCourseId) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/courses/${course.id}/course-info`);
        const data = await response.json();
        if (!cancelled && data.success && data.portal) {
          setCourseInfoJson(JSON.stringify(data.portal));
        }
      } catch {
        // Keep SSR courseInfoJson on failure
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course.id, course.moodleCourseId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "course-info" || tab === "overview") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setSyllabusOpen(true);
    }
  }, [searchParams]);

  const openMaterialUpload = searchParams.get("upload") === "1";

  const topicNames = useMemo(
    () =>
      course.topics
        .map((topic) => topic.name)
        .filter((name) => !isMetaSyllabusTopic(name)),
    [course.topics],
  );

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

  const workAssignments = course.assignments.filter(
    (assignment) => !isQuizOrTestKind(assignment.kind, assignment.title),
  );
  const quizAssessments = course.assignments.filter((assignment) =>
    isQuizOrTestKind(assignment.kind, assignment.title),
  );
  const pendingAssignments = workAssignments.filter(
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
            {course.description && !course.moodleCourseId && !course.courseInfoJson ? (
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
                href={hubChatHref({
                  courseId: course.id,
                  topic: coldStartTopic ?? undefined,
                })}
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

        <CourseDashboard
          courseId={course.id}
          courseInfoJson={courseInfoJson}
          assignments={course.assignments}
          instructor={course.instructor}
          meetings={course.meetings}
          accentColor={course.color}
          focusTopic={coldStartTopic}
          onViewFullSyllabus={
            course.moodleCourseId || courseInfoJson
              ? () => setSyllabusOpen(true)
              : undefined
          }
        />

        <CourseThisWeek
          courseId={course.id}
          courseInfoJson={courseInfoJson}
          assignments={course.assignments}
          instructor={course.instructor}
          meetings={course.meetings}
          focusTopic={coldStartTopic}
        />

        {!studyTopic && topicNames.length === 0 ? (
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Break this down</h2>
            <p className="mt-1 text-sm text-stone-600">
              No study topics yet. Use this once to draft an outline, flashcards, and a quiz from
              what the syllabus already knows — then refine in Study.
            </p>
            <div className="mt-4">
              <BreakDownButton courseId={course.id} />
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <CollapsibleSection
            title="Assignments"
            hint={`${pendingAssignments.length} still open · no quizzes/tests`}
            count={workAssignments.length}
            defaultOpen
            empty="No homework-style assignments yet."
            headerRight={
              <Link
                href={hubScheduleHref()}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                onClick={(e) => e.stopPropagation()}
              >
                All
              </Link>
            }
          >
            <ul className="space-y-2">
              {workAssignments.map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} />
              ))}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="Quizzes & assessments"
            hint="Quizzes, tests, exams only"
            count={quizAssessments.length}
            defaultOpen={false}
            empty="No quizzes or tests synced yet."
            tone="violet"
          >
            <ul className="space-y-2">
              {quizAssessments.map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} tone="violet" />
              ))}
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="Materials"
            hint="Files you uploaded or open in Core"
            count={course.materials.length}
            defaultOpen={false}
            empty="No materials yet. Add a chapter, syllabus, slides, or paste text."
            headerRight={
              <span onClick={(e) => e.stopPropagation()}>
                <AddCourseMaterialButton
                  courseId={course.id}
                  courses={[{ id: course.id, title: course.title }]}
                  compact
                  defaultOpen={openMaterialUpload}
                  onAdded={(material: AddedCourseMaterial) => {
                    router.refresh();
                    if ((material.topicsCreated ?? 0) > 0) {
                      const href = new URL(
                        coreStudyPackHref(course.id, material.title),
                        "http://local",
                      );
                      if (material.id) href.searchParams.set("materialId", material.id);
                      router.push(`${href.pathname}${href.search}`);
                    }
                  }}
                />
              </span>
            }
          >
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
          </CollapsibleSection>

          <CollapsibleSection
            title="Progress & study map"
            hint="Study activity — not official proficiency"
            count={course.topics.length}
            defaultOpen={false}
            empty="No topics yet to map."
            className="lg:col-span-2"
            alwaysShowChildren
          >
            <CourseProgressStory courseId={course.id} />
            {course.topics.length > 0 ? (
              <div className="mt-6 border-t border-teal-50 pt-6">
                <MasteryTree courseId={course.id} />
              </div>
            ) : null}
          </CollapsibleSection>
        </div>
      </div>

      {syllabusOpen ? (
        <CourseContentModal
          title="Full syllabus & details"
          onClose={() => setSyllabusOpen(false)}
        >
          <div className="whitespace-normal -m-1">
            <CourseInfoView
              courseId={course.id}
              moodleCourseId={course.moodleCourseId}
            />
          </div>
        </CourseContentModal>
      ) : null}

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

function AssignmentRow({
  assignment,
  tone = "orange",
}: {
  assignment: CourseDetail["assignments"][number];
  tone?: "orange" | "violet";
}) {
  const gradeLabel = formatGradeLabel(assignment);
  const border =
    tone === "violet"
      ? "border-violet-100 hover:border-violet-200 hover:bg-violet-50/50"
      : "border-orange-100 hover:border-orange-200 hover:bg-orange-50/50";
  const conceptId =
    typeof assignment.conceptId === "string" && assignment.conceptId.trim()
      ? assignment.conceptId.trim()
      : null;
  return (
    <li
      className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition ${border}`}
    >
      <Link
        href={hubAssignmentFocusHref(assignment.id)}
        className="min-w-0 flex-1"
      >
        <p className="font-semibold text-stone-900">{assignment.title}</p>
        <p className="mt-0.5 text-xs text-stone-500">
          Due {formatDueDate(assignment.dueDate)}
          {assignment.alignmentState &&
          assignment.alignmentState !== "unaligned"
            ? ` · ${assignment.alignmentState} concept link`
            : ""}
        </p>
      </Link>
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
        {/* 2P-49 — launch ULE when soft concept link exists; status ≠ mastery. */}
        {conceptId ? (
          <ContinueLearningButton
            conceptId={conceptId}
            assignmentId={assignment.id}
            secondaryHint="Study this assignment"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 touch-manipulation"
          />
        ) : null}
      </div>
    </li>
  );
}

function CollapsibleSection({
  title,
  hint,
  count,
  defaultOpen = true,
  empty,
  children,
  headerRight,
  tone = "orange",
  className = "",
  alwaysShowChildren = false,
}: {
  title: string;
  hint: string;
  count: number;
  defaultOpen?: boolean;
  empty: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  tone?: "orange" | "violet";
  className?: string;
  alwaysShowChildren?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const border = tone === "violet" ? "border-violet-100" : "border-orange-100";
  const emptyBorder =
    tone === "violet" ? "border-violet-200" : "border-orange-200";
  return (
    <section className={`rounded-3xl border ${border} bg-white p-6 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 text-left touch-manipulation"
      >
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          <p className="text-sm text-stone-500">{hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
          <span className="text-xs font-bold text-stone-400">{count}</span>
          <ChevronDown
            className={`h-5 w-5 text-stone-400 transition ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open ? (
        <div className="mt-4">
          {!alwaysShowChildren && count === 0 ? (
            <p
              className={`rounded-2xl border border-dashed ${emptyBorder} px-4 py-8 text-center text-sm text-stone-500`}
            >
              {empty}
            </p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </section>
  );
}
