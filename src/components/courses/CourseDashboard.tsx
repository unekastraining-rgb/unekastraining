"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarRange,
  ChevronDown,
  GraduationCap,
  Laptop,
  Package,
  Truck,
} from "lucide-react";

import { CourseContentModal } from "@/components/courses/CourseContentModal";
import { buildCourseDashboardData } from "@/lib/lms/course-info/dashboard-data";
import {
  formatEventTiming,
  formatTermDate,
} from "@/lib/lms/course-info/highlights";

/**
 * Primary class dashboard — teacher, term, materials chips (popup), haul, dates.
 * Full syllabus opens from the Study block link (popup), not a tab beside Dashboard.
 */
export function CourseDashboard({
  courseId,
  courseInfoJson,
  assignments,
  instructor,
  meetings = [],
  accentColor = "#ea580c",
  focusTopic: _focusTopic = null,
  onViewFullSyllabus,
}: {
  courseId: string;
  courseInfoJson: string | null;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    kind: string;
  }>;
  instructor: string | null;
  meetings?: Array<{
    title: string | null;
    dayOfWeek: number;
    startTime: string;
    location: string | null;
  }>;
  accentColor?: string | null;
  focusTopic?: string | null;
  onViewFullSyllabus?: () => void;
}) {
  const [materialModal, setMaterialModal] = useState<{
    title: string;
    body: string;
    url?: string;
  } | null>(null);
  const data = useMemo(
    () => buildCourseDashboardData(courseInfoJson, assignments, instructor, meetings),
    [courseInfoJson, assignments, instructor, meetings],
  );
  const { highlights } = data;
  const color = accentColor ?? "#ea580c";

  if (
    !highlights.hasPortal &&
    !highlights.termStart &&
    !highlights.instructor &&
    data.materials.length === 0
  ) {
    return null;
  }

  return (
    <>
    <section className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-md">
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="space-y-5 bg-gradient-to-br from-orange-50/90 via-white to-teal-50/50 p-5 sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800">
            Course dashboard
          </p>
          <h2 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
            What you need right now
          </h2>
        </div>

        {(highlights.termStart || highlights.termEnd) && (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={CalendarRange}
              label="Term starts"
              value={highlights.termStart ? formatTermDate(highlights.termStart) : "—"}
              accent="teal"
            />
            <StatCard
              icon={CalendarRange}
              label="Term ends"
              value={highlights.termEnd ? formatTermDate(highlights.termEnd) : "—"}
              accent="orange"
            />
            {highlights.instructor ? (
              <StatCard
                icon={GraduationCap}
                label="Instructor"
                value={highlights.instructor}
                accent="stone"
              />
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
        )}

        {!highlights.termStart && !highlights.termEnd && highlights.instructor ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm">
            <GraduationCap className="h-4 w-4 text-orange-600" />
            {highlights.instructor}
          </p>
        ) : null}

        {data.materials.length > 0 ? (
          <div className="rounded-2xl border border-orange-100 bg-white/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              <h3 className="text-sm font-bold text-stone-900">Materials & requirements</h3>
              <span className="text-xs font-semibold text-stone-400">
                {data.materials.length} · tap to open
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.materials.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setMaterialModal({
                      title: item.label,
                      body: item.body,
                      url: item.url,
                    })
                  }
                  className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {highlights.thisWeeksHaul ? (
          <CollapsibleBlock
            icon={Truck}
            title="This week's haul"
            defaultOpen
            summary={highlights.thisWeeksHaul.label}
          >
            <ul className="space-y-2">
              {highlights.thisWeeksHaul.objectives.map((objective) => (
                <li
                  key={objective}
                  className="flex gap-2 rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-2.5 text-sm text-stone-800"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CollapsibleBlock>
        ) : null}

        <CollapsibleBlock
          icon={CalendarRange}
          title="Important dates"
          defaultOpen={false}
          summary={`${highlights.importantEvents.length}`}
        >
          {highlights.importantEvents.length > 0 ? (
            <ul className="space-y-2">
              {highlights.importantEvents.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3"
                >
                  <p className="font-semibold text-amber-950">{item.title}</p>
                  {formatEventTiming(item) ? (
                    <p className="mt-0.5 text-sm text-amber-800">{formatEventTiming(item)}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">No upcoming important dates.</p>
          )}
        </CollapsibleBlock>

        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Study</p>
              <p className="mt-0.5 text-sm text-stone-600">Practice this class in Study hub.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/study?courseId=${courseId}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-violet-800"
              >
                <Laptop className="h-4 w-4" />
                Open Study
              </Link>
              <Link
                href={`/core?courseId=${courseId}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-900 touch-manipulation hover:bg-teal-50"
              >
                <BookOpen className="h-4 w-4" />
                Core notes
              </Link>
            </div>
          </div>
          {onViewFullSyllabus ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onViewFullSyllabus}
                className="min-h-11 text-sm font-semibold text-teal-700 touch-manipulation hover:underline"
              >
                View full syllabus & details →
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>

    {materialModal ? (
      <CourseContentModal
        title={materialModal.title}
        onClose={() => setMaterialModal(null)}
        footer={
          materialModal.url ? (
            <a
              href={materialModal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              Open in Moodle →
            </a>
          ) : undefined
        }
      >
        {materialModal.body}
      </CourseContentModal>
    ) : null}
    </>
  );
}

export function CourseThisWeek({
  courseId,
  courseInfoJson,
  assignments,
  instructor,
  meetings = [],
  focusTopic = null,
}: {
  courseId: string;
  courseInfoJson: string | null;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    kind: string;
  }>;
  instructor: string | null;
  meetings?: Array<{
    title: string | null;
    dayOfWeek: number;
    startTime: string;
    location: string | null;
  }>;
  focusTopic?: string | null;
}) {
  const data = useMemo(
    () => buildCourseDashboardData(courseInfoJson, assignments, instructor, meetings),
    [courseInfoJson, assignments, instructor, meetings],
  );
  const { highlights } = data;

  const nextDue = useMemo(() => {
    const open = assignments
      .filter(
        (item) =>
          item.kind !== "QUIZ" &&
          item.kind !== "TEST" &&
          !/\b(quiz|test|exam|midterm|final)\b/i.test(item.title) &&
          item.status !== "COMPLETED" &&
          item.status !== "GRADED" &&
          item.status !== "SUBMITTED",
      )
      .filter((item) => item.dueDate)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    return open[0] ?? null;
  }, [assignments]);

  const nextClass = useMemo(() => {
    if (meetings.length === 0) return null;
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date().getDay();
    const sorted = [...meetings].sort((a, b) => {
      const da = (a.dayOfWeek - today + 7) % 7;
      const db = (b.dayOfWeek - today + 7) % 7;
      return da - db || a.startTime.localeCompare(b.startTime);
    });
    const meeting = sorted[0]!;
    return `${DAY_LABELS[meeting.dayOfWeek] ?? "Day"} ${meeting.startTime}`;
  }, [meetings]);

  const studyTopic =
    focusTopic?.trim() ||
    highlights.thisWeeksHaul?.label ||
    nextDue?.title ||
    "this class";
  const studyMinutes = Math.min(
    45,
    Math.max(15, (highlights.thisWeeksHaul?.objectives.length ?? 2) * 10),
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
      <div className="space-y-4 bg-gradient-to-br from-violet-50/80 via-white to-teal-50/40 p-5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-800">
            This week
          </p>
          <h2 className="mt-1 text-xl font-bold text-stone-900">Your week in this class</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <WeekChip label="Next class" value={nextClass ?? "Not set"} />
          <WeekChip
            label="Next due"
            value={
              nextDue
                ? new Date(nextDue.dueDate!).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "Nothing open"
            }
          />
          <WeekChip label="Focus topic" value={studyTopic} />
          <WeekChip label="Study minutes" value={`~${studyMinutes} min`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/study?courseId=${courseId}&topic=${encodeURIComponent(studyTopic)}`}
            className="inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-violet-800"
          >
            Study next · {studyMinutes} min
          </Link>
          <Link
            href={`/core?courseId=${courseId}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-900 touch-manipulation hover:bg-teal-50"
          >
            Core notes
          </Link>
        </div>
      </div>
    </section>
  );
}

function WeekChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white/90 px-3 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-stone-900" title={value}>
        {value}
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
  accent: "teal" | "orange" | "stone";
}) {
  const accents = {
    teal: "border-teal-200 bg-teal-50/70 text-teal-900",
    orange: "border-orange-200 bg-orange-50/70 text-orange-900",
    stone: "border-stone-200 bg-white text-stone-900",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${accents[accent]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function CollapsibleBlock({
  icon: Icon,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  icon: typeof Package;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-orange-100 bg-white/80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-orange-600" />
          <span className="font-bold text-stone-900">{title}</span>
          {summary ? (
            <span className="truncate text-xs font-semibold text-stone-400">{summary}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-stone-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="border-t border-orange-50 px-4 pb-4 pt-2">{children}</div> : null}
    </div>
  );
}
