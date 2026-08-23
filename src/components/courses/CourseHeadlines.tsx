"use client";

import type { ReactNode } from "react";
import { CalendarRange, ClipboardCheck, GraduationCap, Laptop, Package } from "lucide-react";

import {
  buildCourseHighlightsFromJson,
  formatDaysUntilLabel,
  formatHeadlineDate,
  formatTermDate,
  type CourseHighlights,
} from "@/lib/lms/course-info/highlights";

export function CourseHeadlines({
  courseInfoJson,
  assignments,
  instructor,
  accentColor = "#ea580c",
  onViewFullSyllabus,
}: {
  courseInfoJson: string | null;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    kind: string;
  }>;
  instructor: string | null;
  accentColor?: string | null;
  onViewFullSyllabus?: () => void;
}) {
  const highlights = buildCourseHighlightsFromJson(
    courseInfoJson,
    assignments,
    instructor,
  );

  if (!hasVisibleHighlights(highlights)) {
    return null;
  }

  const color = accentColor ?? "#ea580c";

  return (
    <section className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-md">
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="bg-gradient-to-br from-orange-50/90 via-white to-teal-50/50 p-6 sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800">
            Class essentials
          </p>
          <h2 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
            What you need to know
          </h2>
        </div>

        {(highlights.termStart || highlights.termEnd) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm">
            <GraduationCap className="h-4 w-4 text-orange-600" />
            {highlights.instructor}
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <HighlightPanel
            icon={ClipboardCheck}
            title="Quizzes & assessments"
            empty="No major quizzes or assessments found in the syllabus yet."
          >
            {highlights.importantAssessments.length > 0 ? (
              <ul className="space-y-2">
                {highlights.importantAssessments.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3"
                  >
                    <p className="font-semibold text-violet-950">{item.title}</p>
                    {item.date ? (
                      <p className="mt-0.5 text-sm text-violet-800">
                        {formatHeadlineDate(item.date)}
                        {item.daysUntil !== undefined
                          ? ` · ${formatDaysUntilLabel(item.daysUntil)}`
                          : null}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-violet-700">
                        Date in syllabus — see assignments for due dates
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </HighlightPanel>

          <HighlightPanel
            icon={Package}
            title="What you need"
            empty="Sync Moodle to pull textbook and tech requirements from the syllabus."
          >
            {highlights.whatYouNeed.length > 0 ? (
              <div className="space-y-4">
                {highlights.whatYouNeed.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                      {group.label === "Computer & tech" ? (
                        <Laptop className="h-3.5 w-3.5" />
                      ) : (
                        <Package className="h-3.5 w-3.5" />
                      )}
                      {group.label}
                    </p>
                    <ul className="space-y-2 text-sm leading-relaxed text-stone-700">
                      {group.items.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </HighlightPanel>
        </div>

        {highlights.gradingSnapshot ? (
          <div className="mt-5 rounded-2xl border border-stone-200 bg-white/90 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              How you&apos;re graded
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {highlights.gradingSnapshot}
            </p>
          </div>
        ) : null}

        {onViewFullSyllabus ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onViewFullSyllabus}
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              View full syllabus & policies →
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: string;
  accent: "teal" | "orange" | "stone";
}) {
  const styles =
    accent === "teal"
      ? "border-teal-200 bg-teal-50/80 text-teal-900"
      : accent === "orange"
        ? "border-orange-200 bg-orange-50/80 text-orange-950"
        : "border-stone-200 bg-white text-stone-900";

  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${styles}`}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-snug sm:text-base">{value}</p>
    </div>
  );
}

function HighlightPanel({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: typeof CalendarRange;
  title: string;
  empty?: string;
  children: ReactNode;
}) {
  const hasContent = Boolean(children);
  return (
    <div className="rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-orange-600" />
        <h3 className="text-base font-bold text-stone-900">{title}</h3>
      </div>
      {hasContent ? children : <p className="text-sm text-stone-500">{empty}</p>}
    </div>
  );
}

function hasVisibleHighlights(highlights: CourseHighlights): boolean {
  return (
    highlights.hasPortal ||
    highlights.importantAssessments.length > 0 ||
    highlights.whatYouNeed.length > 0 ||
    Boolean(highlights.gradingSnapshot) ||
    Boolean(highlights.termStart) ||
    Boolean(highlights.termEnd) ||
    Boolean(highlights.instructor)
  );
}
