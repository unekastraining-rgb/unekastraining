"use client";

import Link from "next/link";
import { useState } from "react";

interface DashboardStats {
  overallMastery: number;
  dueFlashcards: number;
  pendingAssignments: number;
  activeCoursesCount: number;
  upcomingAssignment: {
    title: string;
    course: string;
    dueDate: string | null;
  } | null;
}

interface AcademicDashboardProps {
  initialStats: DashboardStats;
}

export function AcademicDashboard({ initialStats }: AcademicDashboardProps) {
  const [stats] = useState(initialStats);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Study Haul Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Phase 4 dashboard — mastery, retention, and workload
          </p>
        </div>
        <span className="rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-xs text-emerald-300">
          Online
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Courses" value={stats.activeCoursesCount} />
        <Metric label="Pending" value={stats.pendingAssignments} />
        <Metric label="Cards due" value={stats.dueFlashcards} accent="amber" />
        <Metric label="Mastery" value={`${stats.overallMastery}%`} accent="indigo" />
      </div>

      {stats.upcomingAssignment ? (
        <div className="rounded-2xl border border-rose-900/30 bg-rose-950/20 p-5">
          <p className="text-xs uppercase tracking-wider text-rose-300">Next deadline</p>
          <h2 className="mt-1 text-lg font-medium">{stats.upcomingAssignment.title}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {stats.upcomingAssignment.course}
            {stats.upcomingAssignment.dueDate
              ? ` · Due ${new Date(stats.upcomingAssignment.dueDate).toLocaleDateString()}`
              : ""}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          title="Review flashcards"
          description="Run your spaced repetition queue."
          href="/flashcards"
          cta="Start review"
        />
        <ActionCard
          title="Open schedule"
          description="See all assignments and due dates."
          href="/dashboard"
          cta="View schedule"
        />
        <ActionCard
          title="Manage courses"
          description="Upload syllabi and manage course data."
          href="/courses"
          cta="Go to courses"
        />
        <ActionCard
          title="View telemetry"
          description="Inspect mastery trees and ecosystem signals."
          href="/dashboard/telemetry"
          cta="Open telemetry"
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string | number;
  accent?: "default" | "amber" | "indigo";
}) {
  const color =
    accent === "amber"
      ? "text-amber-400"
      : accent === "indigo"
        ? "text-indigo-400"
        : "text-zinc-100";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        {cta}
      </Link>
    </div>
  );
}
