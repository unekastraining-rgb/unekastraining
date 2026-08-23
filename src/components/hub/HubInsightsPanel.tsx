"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Flame, TrendingUp } from "lucide-react";

import type { AttentionItem } from "@/lib/csl/attention";
import type { ProgressSnapshot } from "@/lib/csl/progress";
import type { HubTelemetrySnapshot } from "@/lib/csl/study-sessions";
import { formatActivityLabel } from "@/lib/search/search-meta";

const SEVERITY_STYLES = {
  high: "border-rose-200 bg-rose-50/80 text-rose-900",
  medium: "border-amber-200 bg-amber-50/80 text-amber-900",
  low: "border-brand bg-brand-soft/60 text-stone-700",
};

export function HubInsightsPanel({
  attention,
  progress,
  telemetry,
}: {
  attention: AttentionItem[];
  progress: ProgressSnapshot;
  telemetry: HubTelemetrySnapshot;
}) {
  const maxWeekly = Math.max(
    1,
    ...telemetry.weeklyMinutes.map((item) => item.minutes),
  );
  const topActivity = telemetry.minutesByActivity[0];
  const topCourse = telemetry.minutesByCourse[0];
  const latestSession = telemetry.recentSessions[0];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-brand bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold text-stone-900">Needs attention</h2>
        </div>
        {attention.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">
            You&apos;re caught up — no urgent items right now.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {attention.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition hover:opacity-90 ${SEVERITY_STYLES[item.severity]}`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{item.title}</p>
                    <p className="truncate text-xs opacity-80">{item.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {attention.length > 5 ? (
          <p className="mt-2 text-xs text-stone-500">+{attention.length - 5} more items</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-brand bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold text-stone-900">Progress</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ProgressStat label="Overall mastery" value={`${progress.overallMastery}%`} />
          <ProgressStat label="Topics tracked" value={String(progress.topicsTracked)} />
          <ProgressStat label="Reviews this week" value={String(progress.reviewsThisWeek)} />
          <ProgressStat label="Quizzes taken" value={String(progress.quizAttempts)} />
        </div>
        <div className="mt-4 space-y-2">
          <DimensionBar label="Understanding" value={progress.understanding} color="bg-sky-500" />
          <DimensionBar label="Recall" value={progress.recall} color="bg-violet-500" />
          <DimensionBar label="Application" value={progress.application} color="bg-amber-500" />
        </div>
      </section>

      <section className="rounded-2xl border border-brand bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-stone-900">Study rhythm</h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatPill
            label="Streak"
            value={`${telemetry.currentStreak}d`}
            hint={telemetry.longestStreak > 0 ? `best ${telemetry.longestStreak}d` : undefined}
          />
          <StatPill label="This week" value={`${telemetry.weekTotalMinutes}m`} />
          {topActivity ? (
            <StatPill
              label="Top activity"
              value={formatActivityLabel(topActivity.activityType)}
            />
          ) : null}
        </div>

        {telemetry.weeklyMinutes.some((item) => item.minutes > 0) ? (
          <div className="mt-4 flex items-end gap-1.5">
            {telemetry.weeklyMinutes.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-violet-400"
                  style={{
                    height: `${Math.max(6, (item.minutes / maxWeekly) * 72)}px`,
                  }}
                  title={`${item.minutes} min`}
                />
                <span className="text-[10px] font-semibold uppercase text-stone-500">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            No study sessions logged yet this week.
          </p>
        )}

        {topCourse ? (
          <p className="mt-4 text-sm text-stone-600">
            Most time on{" "}
            <span className="font-semibold text-stone-900">{topCourse.courseTitle}</span>{" "}
            ({topCourse.minutes}m)
          </p>
        ) : null}

        {latestSession ? (
          <p className="mt-2 text-xs text-stone-500">
            Last session: {formatActivityLabel(latestSession.activityType)} ·{" "}
            {Math.max(1, Math.round(latestSession.durationSeconds / 60))}m ·{" "}
            {formatRelativeTime(latestSession.startedAt)}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/study"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            Study now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/telemetry"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
          >
            Full telemetry <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-soft/50 px-3 py-2">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-lg font-bold text-stone-900">{value}</p>
    </div>
  );
}

function StatPill({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700/80">
        {label}
      </p>
      <p className="text-sm font-bold text-stone-900">
        {value}
        {hint ? <span className="ml-1 text-xs font-medium text-stone-500">({hint})</span> : null}
      </p>
    </div>
  );
}

function DimensionBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-stone-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-soft">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
