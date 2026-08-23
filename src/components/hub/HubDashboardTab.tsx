"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Download,
  Flame,
  FolderOpen,
  Layers,
  Link2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { HubStudyNowCard } from "./HubStudyNowCard";
import { HubWelcomeHeader } from "./HubWelcomeHeader";
import { FirstRunOnboarding } from "./FirstRunOnboarding";
import { GradeSchoolHubDashboard } from "./GradeSchoolHubDashboard";
import { hubAssignmentFocusHref, hubAssignmentsHref, hubCalendarHref } from "@/lib/hub/tabs";
import { filterUpcomingHubAssignments } from "@/lib/hub/dashboard-tasks";
import { hubEventFocusId } from "@/lib/calendar/hub-adapters";
import type { CalendarEvent } from "@/lib/calendar/types";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { AppNotification } from "@/lib/notifications";
import type {
  HubAssignment,
  HubJumpBackIn,
  HubStats,
  HubUser,
} from "./types";
import type { AttentionItem } from "@/lib/csl/attention";
import type { HubGradeSchoolPlan } from "./types";
import type { HubTelemetrySnapshot } from "@/lib/csl/study-sessions";

function formatDueLabel(dueDate: string | null, todayKey: string) {
  if (!dueDate) return "No date";
  const key = dueDate.slice(0, 10);
  if (key === todayKey) return "Today";
  const due = new Date(`${key}T12:00:00`);
  const today = new Date(`${todayKey}T12:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return "Overdue";
  if (diffDays <= 7) {
    return due.toLocaleDateString(undefined, { weekday: "short" });
  }
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatEventTime(time: string | null | undefined) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function eventKindLabel(kind: CalendarEvent["kind"]) {
  switch (kind) {
    case "class":
      return "Class";
    case "test":
      return "Test";
    case "quiz":
      return "Quiz";
    case "project":
      return "Project";
    case "study-session":
      return "Study";
    default:
      return "Event";
  }
}

function calendarEventHref(event: CalendarEvent) {
  const focus = hubEventFocusId(event.id);
  return hubCalendarHref({ date: event.date, focus: focus ?? undefined });
}

function dueTone(dueDate: string | null, todayKey: string) {
  if (!dueDate) return "neutral" as const;
  const key = dueDate.slice(0, 10);
  if (key === todayKey) return "today" as const;
  if (key < todayKey) return "overdue" as const;
  return "upcoming" as const;
}

export function HubDashboardTab({
  user,
  jumpBackIn,
  updates,
  assignments,
  todayCalendarEvents,
  stats,
  attention,
  telemetry,
  gradeSchoolPlans,
  courseCount,
}: {
  user: HubUser;
  jumpBackIn: HubJumpBackIn | null;
  updates: AppNotification[];
  assignments: HubAssignment[];
  todayCalendarEvents: CalendarEvent[];
  stats: HubStats;
  attention: AttentionItem[];
  telemetry: HubTelemetrySnapshot;
  gradeSchoolPlans: HubGradeSchoolPlan[];
  courseCount: number;
}) {
  const router = useRouter();
  const { settings } = useTheme();
  const todayKey = new Date().toISOString().slice(0, 10);

  const openAssignments = assignments.filter(
    (a) => a.status !== "SUBMITTED" && a.status !== "GRADED",
  );
  const overdueCount = openAssignments.filter(
    (a) => a.dueDate && a.dueDate.slice(0, 10) < todayKey,
  ).length;
  const upcomingTasks = filterUpcomingHubAssignments(assignments, todayKey).slice(0, 6);

  if (settings.elementaryMode) {
    return (
      <GradeSchoolHubDashboard
        plans={gradeSchoolPlans}
        telemetry={telemetry}
        onPlanSaved={() => router.refresh()}
      />
    );
  }

  if (openAssignments.length === 0 && assignments.length === 0) {
    return (
      <div className="space-y-5">
        <HubWelcomeHeader
          user={user}
          eyebrow="Getting started"
          subtitle="Welcome to Study Haul — add a class, connect your LMS, or explore with sample data."
        />
        <FirstRunOnboarding variant="hub" user={user} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <HubWelcomeHeader user={user}>
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <RingStat label="Today's focus" value={stats.todayTasks} href="/calendar" />
          <RingStat label="Total courses" value={courseCount} href="/dashboard?tab=classes" />
          <RingStat
            label="Cards due"
            value={stats.dueFlashcards}
            href="/flashcards"
            accent="teal"
          />
        </div>
      </HubWelcomeHeader>

      <HubStudyNowCard overdueCount={overdueCount} variant="banner" />

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="overflow-hidden rounded-3xl border border-brand bg-white shadow-sm xl:col-span-7">
          <div className="flex items-center justify-between gap-2 border-b border-brand px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-brand" />
              <h2 className="text-base font-bold text-stone-900">Upcoming tasks</h2>
            </div>
            <Link
              href={hubAssignmentsHref()}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          <p className="border-b border-brand px-5 pb-3 text-[11px] text-stone-500">
            This week, overdue work, exams, and high-priority deadlines.
          </p>
          {upcomingTasks.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-stone-500">
              Nothing on the horizon. You&apos;re caught up.
            </p>
          ) : (
            <ul className="divide-y divide-brand">
              {upcomingTasks.map((assignment) => {
                const tone = dueTone(assignment.dueDate, todayKey);
                return (
                  <li key={assignment.id}>
                    <Link
                      href={hubAssignmentFocusHref(assignment.id)}
                      className="flex items-start gap-3 px-5 py-4 transition hover:bg-brand-soft/40"
                    >
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          tone === "today"
                            ? "bg-rose-500"
                            : tone === "overdue"
                              ? "bg-amber-500"
                              : "bg-stone-300"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{assignment.title}</p>
                        <p className="truncate text-xs text-stone-500">{assignment.courseTitle}</p>
                      </span>
                      <span
                        suppressHydrationWarning
                        className={`shrink-0 text-xs font-bold ${
                          tone === "today"
                            ? "text-rose-600"
                            : tone === "overdue"
                              ? "text-amber-700"
                              : "text-stone-500"
                        }`}
                      >
                        {formatDueLabel(assignment.dueDate, todayKey)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-5 xl:col-span-5">
          {jumpBackIn ? (
            <section className="rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50/90 to-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900">Jump back in</h2>
              </div>
              <p className="font-bold text-stone-900">{jumpBackIn.title}</p>
              <p className="mt-1 text-sm text-stone-500">{jumpBackIn.subtitle}</p>
              <Link
                href={jumpBackIn.href}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-3xl border border-brand bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-brand px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                <h2 className="text-base font-bold text-stone-900">Today&apos;s schedule</h2>
              </div>
              {todayCalendarEvents.length > 0 ? (
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                  {todayCalendarEvents.length}
                </span>
              ) : null}
            </div>
            {todayCalendarEvents.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-500">
                Nothing on your calendar today.{" "}
                <Link href="/calendar" className="font-semibold text-brand">
                  Open calendar
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-brand">
                {todayCalendarEvents.slice(0, 6).map((event) => {
                  const timeLabel = formatEventTime(event.startTime);
                  return (
                    <li key={event.id}>
                      <Link
                        href={calendarEventHref(event)}
                        className="flex items-start gap-3 px-5 py-3.5 text-sm transition hover:bg-brand-soft/40"
                      >
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: event.courseColor ?? "#38bdf8" }}
                        />
                        <span className="min-w-0 flex-1">
                          <p className="font-semibold text-stone-900">{event.title}</p>
                          <p className="truncate text-xs text-stone-500">
                            {event.courseTitle ?? eventKindLabel(event.kind)}
                          </p>
                        </span>
                        <span
                          suppressHydrationWarning
                          className="shrink-0 text-xs font-bold text-stone-500"
                        >
                          {timeLabel ?? eventKindLabel(event.kind)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {todayCalendarEvents.length > 6 ? (
              <div className="border-t border-brand px-5 py-3 text-center">
                <Link href="/calendar" className="text-xs font-semibold text-brand hover:underline">
                  View full day on calendar
                </Link>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-brand bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickChip href="/calendar" icon={CalendarDays} label="Calendar" tone="sky" />
          <QuickChip href="/resources" icon={FolderOpen} label="Resources" tone="orange" />
          <QuickChip href="/core" icon={BookOpen} label="Core" tone="teal" />
          <QuickChip href="/study" icon={Sparkles} label="Study" tone="violet" />
          <QuickChip href="/flashcards" icon={Layers} label="Cards" tone="amber" />
          <QuickChip
            href="/dashboard/telemetry"
            icon={Flame}
            label="Day streak"
            tone="rose"
            badge={`${telemetry.currentStreak}d`}
          />
          <QuickChip href="/courses" icon={Link2} label="Connect" tone="orange" />
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/40 p-5">
        <div className="flex items-center gap-2 text-teal-800">
          <Download className="h-4 w-4" />
          <h2 className="text-sm font-bold">Export & share</h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ExportChip href="/api/calendar/export" label="Calendar (.ics)" />
          <ExportChip href="/api/flashcards/export?format=csv" label="Flashcards (CSV)" />
          <ExportChip href="/api/flashcards/export?format=anki" label="Flashcards (Anki)" />
          <ExportChip href="/api/notes/export?format=pdf" label="Notes (PDF)" />
          <ExportChip href="/api/notes/export" label="Notes (Markdown)" />
        </div>
      </section>
      </div>

      {updates.length > 0 ? (
        <CompactPanel title="Updates">
          <ul className="space-y-2">
            {updates.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-brand px-3 py-2 text-sm hover:bg-brand-soft/50"
                >
                  <span className="font-medium text-stone-900">{item.title}</span>
                  <ArrowRight className="h-4 w-4 text-stone-300" />
                </Link>
              </li>
            ))}
          </ul>
        </CompactPanel>
      ) : null}
    </div>
  );
}

function RingStat({
  label,
  value,
  href,
  accent = "orange",
}: {
  label: string;
  value: string | number;
  href: string;
  accent?: "orange" | "teal";
}) {
  const ring =
    accent === "teal"
      ? "border-[color-mix(in_srgb,var(--sh-accent)_35%,transparent)]"
      : "border-[color-mix(in_srgb,var(--sh-primary)_35%,transparent)]";
  const glow =
    accent === "teal" ? "bg-[color-mix(in_srgb,var(--sh-accent)_10%,white)]" : "bg-brand-soft/50";

  return (
    <Link href={href} className="group flex flex-col items-center gap-1.5 text-center">
      <div
        className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[3px] ${ring} ${glow} transition group-hover:scale-105`}
      >
        <span className="text-xl font-black text-stone-900">{value}</span>
      </div>
      <span className="max-w-[5.5rem] text-[10px] font-bold uppercase leading-tight tracking-wide text-stone-500">
        {label}
      </span>
    </Link>
  );
}

function QuickChip({
  href,
  icon: Icon,
  label,
  tone,
  badge,
}: {
  href: string;
  icon: typeof CalendarDays;
  label: string;
  tone: "sky" | "teal" | "violet" | "amber" | "rose" | "orange";
  badge?: string;
}) {
  const tones = {
    sky: "border-sky-100 bg-sky-50 text-sky-800",
    teal: "border-teal-100 bg-teal-50 text-teal-800",
    violet: "border-violet-100 bg-violet-50 text-violet-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
    orange: "border-brand bg-brand-soft text-brand",
  } as const;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition hover:opacity-90 ${tones[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {badge ? (
        <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">{badge}</span>
      ) : null}
    </Link>
  );
}

function ExportChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-50"
    >
      {label}
    </a>
  );
}

function CompactPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}
