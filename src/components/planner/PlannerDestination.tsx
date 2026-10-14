"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Loader2, Sparkles } from "lucide-react";

import { ScheduleProposalsPanel } from "@/components/planner/ScheduleProposalsPanel";
import { hubAssignmentsHref } from "@/lib/hub/tabs";
import { buildCapabilityHref, getStudyCapability } from "@/lib/study/capability-registry";

type PlannerAssignment = {
  id: string;
  title: string;
  dueDate: string | null;
  course: string;
  completed: boolean;
  priority?: string;
  conceptId?: string | null;
};

type AdaptiveActivity = {
  conceptId: string;
  title: string;
  action: string;
  sixTechnique?: string | null;
  scheduledStartAt: string;
  minutes: number;
  urgency: string;
  reason: string;
  room?: string;
};

function launchHrefForActivity(activity: AdaptiveActivity): string {
  const room = (activity.room ?? activity.action ?? "").toLowerCase();
  if (room.includes("quiz") || activity.action === "check") {
    return buildCapabilityHref(getStudyCapability("quizzes")!, {
      conceptId: activity.conceptId,
    });
  }
  if (room.includes("flash") || room.includes("remember") || room.includes("retain")) {
    return buildCapabilityHref(getStudyCapability("flashcards")!, {
      conceptId: activity.conceptId,
    });
  }
  if (room.includes("coding") || activity.action === "code") {
    return buildCapabilityHref(getStudyCapability("coding")!, {
      conceptId: activity.conceptId,
    });
  }
  if (room.includes("sql")) {
    return buildCapabilityHref(getStudyCapability("sql")!, {
      conceptId: activity.conceptId,
    });
  }
  if (room.includes("haul") || room.includes("writ")) {
    return buildCapabilityHref(getStudyCapability("haul")!, {
      conceptId: activity.conceptId,
    });
  }
  if (activity.sixTechnique) {
    return `/study/six/${activity.sixTechnique}?conceptId=${encodeURIComponent(activity.conceptId)}`;
  }
  return buildCapabilityHref(getStudyCapability("practice")!, {
    conceptId: activity.conceptId,
  });
}

/**
 * Bundle K — Planner destination.
 * Uses /api/planner + existing schedule proposals. Not a second Orchestrator.
 */
export function PlannerDestination() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<PlannerAssignment[]>([]);
  const [adaptive, setAdaptive] = useState<AdaptiveActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/planner", { credentials: "same-origin" });
        const data = await res.json();
        if (!cancelled) {
          if (!data.success) throw new Error(data.error ?? "Could not load planner.");
          setAssignments(data.data ?? []);
          setAdaptive(data.adaptivePlan?.activities ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load planner.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = assignments.filter((a) => !a.completed).slice(0, 12);

  return (
    <div
      className="grid min-h-[70vh] gap-0 lg:grid-cols-[minmax(0,18rem)_1fr_minmax(0,20rem)]"
      data-planner-destination
    >
      <aside className="border-b border-stone-200 bg-stone-50/80 px-4 py-6 lg:border-b-0 lg:border-r">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Planning
        </p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">Planner</h1>
        <p className="mt-2 text-sm text-stone-600">
          Organize upcoming study and assignments. Adaptive Learning still decides
          what to teach next — Planner schedules when.
        </p>
        <nav className="mt-6 space-y-2">
          <Link
            href={hubAssignmentsHref()}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 touch-manipulation"
          >
            <ClipboardList className="h-4 w-4" />
            All assignments
          </Link>
          <Link
            href="/calendar"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 touch-manipulation"
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </Link>
          <Link
            href="/study/lucky"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 touch-manipulation"
          >
            <Sparkles className="h-4 w-4" />
            Retention reviews
          </Link>
        </nav>
      </aside>

      <main className="space-y-6 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-stone-500">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading planner" />
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4"
            data-planner-error
            role="alert"
          >
            <p className="text-sm font-semibold text-rose-900">
              Could not load planner
            </p>
            <p className="mt-1 text-sm text-rose-800">{error}</p>
            <p className="mt-2 text-xs text-rose-700">
              Check your connection, then refresh. Assignments stay on your
              courses even if this view fails.
            </p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                Upcoming work
              </h2>
              {upcoming.length === 0 ? (
                <div
                  className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-6"
                  data-planner-empty
                >
                  <p className="text-sm font-semibold text-stone-800">
                    No open assignments
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Add a class, sync LMS when credentials are available, or
                    open Practice Hub to study without a due date.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/courses"
                      className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 touch-manipulation"
                    >
                      Manage classes
                    </Link>
                    <Link
                      href="/study/practice-hub"
                      className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white touch-manipulation"
                    >
                      Practice Hub
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcoming.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-3"
                    >
                      <div>
                        <p className="font-semibold text-stone-900">{item.title}</p>
                        <p className="text-xs text-stone-500">
                          {item.course}
                          {item.dueDate
                            ? ` · due ${new Date(item.dueDate).toLocaleDateString()}`
                            : ""}
                        </p>
                      </div>
                      <Link
                        href={
                          item.conceptId
                            ? buildCapabilityHref(getStudyCapability("practice")!, {
                                conceptId: item.conceptId,
                              })
                            : hubAssignmentsHref()
                        }
                        className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white touch-manipulation"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                Planned learning
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                From your existing adaptive planner — not a separate decision engine.
              </p>
              {adaptive.length === 0 ? (
                <p className="mt-3 text-sm text-stone-600">
                  No scheduled learning blocks yet. Add classes or study a topic first.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {adaptive.map((activity, i) => (
                    <li
                      key={`${activity.conceptId}-${i}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-3"
                      data-planner-activity
                    >
                      <div>
                        <p className="font-semibold text-stone-900">{activity.title}</p>
                        <p className="text-xs text-stone-600">
                          {activity.minutes} min · {activity.urgency} ·{" "}
                          {new Date(activity.scheduledStartAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">{activity.reason}</p>
                      </div>
                      <Link
                        href={launchHrefForActivity(activity)}
                        className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-3 text-sm font-semibold text-white touch-manipulation"
                      >
                        Launch
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <aside className="border-t border-stone-200 bg-white px-4 py-6 lg:border-l lg:border-t-0">
        <ScheduleProposalsPanel />
      </aside>
    </div>
  );
}
