"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Laptop,
  MessageCircle,
  Package,
  ScrollText,
  Sparkles,
  Truck,
} from "lucide-react";

import { CourseContentModal } from "@/components/courses/CourseContentModal";
import { buildCourseDashboardData } from "@/lib/lms/course-info/dashboard-data";
import {
  formatDaysUntilLabel,
  formatHeadlineDate,
  formatTermDate,
} from "@/lib/lms/course-info/highlights";
import { hubChatHref } from "@/lib/hub/tabs";
import type { CollegeLearningPlan } from "@/lib/lms/course-info/generate-college-learning-plan";

type ModalContent =
  | { kind: "policy"; title: string; body: string }
  | { kind: "announcement"; title: string; body: string; url?: string }
  | { kind: "instruction"; title: string; body: string; url?: string }
  | { kind: "learning-plan"; plan: CollegeLearningPlan };

export function CourseDashboard({
  courseId,
  courseInfoJson,
  assignments,
  instructor,
  meetings = [],
  accentColor = "#ea580c",
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
  onViewFullSyllabus?: () => void;
}) {
  const [modal, setModal] = useState<ModalContent | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const generateLearningPlan = useCallback(async () => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/learning-plan`, { method: "POST" });
      const data = await response.json();
      if (!data.success) {
        setPlanError(data.error ?? "Could not generate learning plan.");
        return;
      }
      setModal({ kind: "learning-plan", plan: data.plan });
    } catch {
      setPlanError("Could not generate learning plan.");
    } finally {
      setPlanLoading(false);
    }
  }, [courseId]);
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
        <div className="space-y-6 bg-gradient-to-br from-orange-50/90 via-white to-teal-50/50 p-6 sm:p-8">
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
            <DashCard icon={Package} label="Materials & requirements" accent="orange">
              <ul className="space-y-1.5 text-sm">
                {data.materials.map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </DashCard>
          ) : null}

          {highlights.thisWeeksHaul ? (
            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/90 to-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Truck className="h-5 w-5 text-teal-700" />
                <h3 className="text-base font-bold text-stone-900">This week&apos;s haul</h3>
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  {highlights.thisWeeksHaul.label}
                </span>
              </div>
              <ul className="space-y-2">
                {highlights.thisWeeksHaul.objectives.map((objective) => (
                  <li
                    key={objective}
                    className="flex gap-2 rounded-xl border border-teal-100 bg-white/80 px-3 py-2.5 text-sm text-stone-800"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel icon={CalendarRange} title="Important dates & sessions" empty="No important dates found yet.">
              {highlights.importantEvents.length > 0 ? (
                <ul className="space-y-2">
                  {highlights.importantEvents.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                      <p className="font-semibold text-amber-950">{item.title}</p>
                      {item.date ? (
                        <p className="mt-0.5 text-sm text-amber-800">
                          {formatHeadlineDate(item.date)}
                          {item.daysUntil !== undefined
                            ? ` · ${formatDaysUntilLabel(item.daysUntil)}`
                            : null}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-amber-700">See full syllabus for timing</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>

            <Panel icon={ClipboardCheck} title="Quizzes & assessments" empty="No major assessments found yet.">
              {highlights.importantAssessments.length > 0 ? (
                <ul className="space-y-2">
                  {highlights.importantAssessments.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3">
                      <p className="font-semibold text-violet-950">{item.title}</p>
                      {item.date ? (
                        <p className="mt-0.5 text-sm text-violet-800">
                          {formatHeadlineDate(item.date)}
                          {item.daysUntil !== undefined
                            ? ` · ${formatDaysUntilLabel(item.daysUntil)}`
                            : null}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-violet-700">Check assignments for due dates</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          </div>

          {data.gradingRows.length > 0 || data.gradingScale ? (
            <div className="rounded-2xl border border-stone-200 bg-white/90 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <ScrollText className="h-3.5 w-3.5" />
                Grading rubric
              </p>
              {data.gradingRows.length > 0 ? (
                <div className="space-y-2">
                  {data.gradingRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-stone-800">{row.label}</span>
                      <span className="font-bold text-stone-600">{row.percent}%</span>
                    </div>
                  ))}
                </div>
              ) : highlights.gradingSnapshot ? (
                <p className="text-sm leading-relaxed text-stone-700">{highlights.gradingSnapshot}</p>
              ) : null}
              {data.gradingScale ? (
                <p className="mt-3 text-xs text-stone-500">{data.gradingScale}</p>
              ) : null}
            </div>
          ) : highlights.gradingSnapshot ? (
            <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">How you&apos;re graded</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{highlights.gradingSnapshot}</p>
            </div>
          ) : null}

          {data.policies.length > 0 ? (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <BookOpen className="h-3.5 w-3.5" />
                Course policies
              </p>
              <div className="flex flex-wrap gap-2">
                {data.policies.map((policy) => (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() =>
                      setModal({ kind: "policy", title: policy.title, body: policy.body })
                    }
                    className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    {policy.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {data.announcements.length > 0 ? (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <Bell className="h-3.5 w-3.5" />
                News & announcements
              </p>
              <ul className="space-y-2">
                {data.announcements.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          kind: "announcement",
                          title: item.title,
                          body: item.body,
                          url: item.url,
                        })
                      }
                      className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
                    >
                      <p className="font-semibold text-stone-900">{item.title}</p>
                      {item.date ? (
                        <p className="mt-0.5 text-xs text-stone-500">{formatHeadlineDate(item.date)}</p>
                      ) : null}
                      <p className="mt-1 text-sm text-stone-600">{item.preview}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.instructions.length > 0 ? (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <FileText className="h-3.5 w-3.5" />
                Instructions & resources
              </p>
              <div className="flex flex-wrap gap-2">
                {data.instructions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setModal({
                        kind: "instruction",
                        title: item.title,
                        body: item.body,
                        url: item.url,
                      })
                    }
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Study
                </p>
                <h3 className="mt-1 text-lg font-bold text-stone-900">Ask AI about this course</h3>
                <p className="mt-1 max-w-xl text-sm text-stone-600">
                  Grounded in your imported syllabus — policies, grading, dates, and materials. AI won&apos;t invent
                  missing information.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void generateLearningPlan()}
                  disabled={planLoading || !highlights.hasPortal}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {planLoading ? "Generating…" : "Generate learning plan"}
                </button>
                <Link
                  href={hubChatHref({
                    courseId,
                    prompt: "What should I focus on this week based on my syllabus?",
                  })}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask AI
                </Link>
                <Link
                  href={`/study?courseId=${courseId}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
                >
                  <Laptop className="h-4 w-4" />
                  Study hub
                </Link>
              </div>
              {planError ? <p className="mt-2 text-sm text-red-600">{planError}</p> : null}
            </div>
          </div>

          {onViewFullSyllabus ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onViewFullSyllabus}
                className="text-sm font-semibold text-teal-700 hover:underline"
              >
                View full syllabus & details →
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {modal ? (
        <CourseContentModal
          title={
            modal.kind === "learning-plan"
              ? "Your learning plan"
              : modal.title
          }
          onClose={() => setModal(null)}
          footer={
            modal.kind === "announcement" || modal.kind === "instruction"
              ? modal.url ? (
                  <a
                    href={modal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-teal-700 hover:underline"
                  >
                    Open in Moodle →
                  </a>
                ) : undefined
              : undefined
          }
        >
          {modal.kind === "learning-plan" ? (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-stone-600">{modal.plan.summary}</p>
              {modal.plan.offline ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Generated from syllabus outline only — connect AI for a fuller plan.
                </p>
              ) : null}
              {modal.plan.weeks.map((week) => (
                <div key={week.weekNumber} className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                  <h4 className="font-bold text-stone-900">
                    {week.title}
                    {week.dateRange ? (
                      <span className="ml-2 text-sm font-medium text-stone-500">{week.dateRange}</span>
                    ) : null}
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {week.tasks.map((task) => (
                      <li key={task} className="flex gap-2 text-sm text-stone-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            modal.body
          )}
        </CourseContentModal>
      ) : null}
    </>
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

function DashCard({
  icon: Icon,
  label,
  accent,
  className = "",
  children,
}: {
  icon: typeof CalendarRange;
  label: string;
  accent: "teal" | "orange" | "stone";
  className?: string;
  children: ReactNode;
}) {
  const styles =
    accent === "teal"
      ? "border-teal-200 bg-teal-50/80"
      : accent === "orange"
        ? "border-orange-200 bg-orange-50/80"
        : "border-stone-200 bg-white";
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles} ${className}`}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="mt-2 text-sm font-medium leading-snug text-stone-900">{children}</div>
    </div>
  );
}

function Panel({
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
