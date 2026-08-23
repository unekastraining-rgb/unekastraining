"use client";

import { useEffect, useState } from "react";

import { MasteryTree } from "@/components/csl/MasteryTree";

interface CourseOption {
  id: string;
  title: string;
}

interface DashboardStats {
  overallMastery: number;
  understanding: number;
  recall: number;
  application: number;
  topicsTracked: number;
  reviewsThisWeek: number;
  quizAttempts: number;
  dueFlashcards: number;
  pendingAssignments: number;
  activeCoursesCount: number;
  upcomingAssignment: {
    title: string;
    course: string;
    dueDate: string | null;
  } | null;
}

interface StudyTelemetry {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  minutesByActivity: Array<{ activityType: string; minutes: number; sessions: number }>;
  recentSessions: Array<{
    id: string;
    activityType: string;
    durationSeconds: number;
    startedAt: string;
    courseTitle: string | null;
  }>;
  weeklyMinutes: Array<{ day: string; minutes: number }>;
}

export function EcosystemDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [telemetry, setTelemetry] = useState<StudyTelemetry | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, coursesRes, telemetryRes] = await Promise.all([
          fetch("/api/user/stats"),
          fetch("/api/courses"),
          fetch("/api/study/telemetry"),
        ]);

        const statsJson = await statsRes.json();
        const coursesJson = await coursesRes.json();
        const telemetryJson = await telemetryRes.json();

        if (statsJson.success) setStats(statsJson.data);
        if (telemetryJson.success) setTelemetry(telemetryJson.data);
        if (coursesJson.success && coursesJson.courses.length > 0) {
          setCourses(coursesJson.courses);
          setSelectedCourseId(coursesJson.courses[0].id);
        }
      } catch (error) {
        console.error("Failed to load telemetry:", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="card-soft p-10 text-center text-sm text-stone-500">
        Loading ecosystem telemetry...
      </div>
    );
  }

  const maxWeekly = Math.max(1, ...(telemetry?.weeklyMinutes.map((item) => item.minutes) ?? [1]));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Progress</p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Ecosystem Telemetry</h1>
        <p className="mt-2 text-sm text-stone-600">
          Mastery, retention, and study time across your academic OS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Courses" value={stats?.activeCoursesCount ?? 0} />
        <MetricCard label="Pending Work" value={stats?.pendingAssignments ?? 0} accent="rose" />
        <MetricCard label="Cards Due" value={stats?.dueFlashcards ?? 0} accent="amber" />
        <MetricCard label="Mastery" value={`${stats?.overallMastery ?? 0}%`} accent="teal" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Study Sessions" value={telemetry?.totalSessions ?? 0} accent="violet" />
        <MetricCard label="Time Studied" value={`${telemetry?.totalMinutes ?? 0}m`} accent="violet" />
        <MetricCard label="Current Streak" value={`${telemetry?.currentStreak ?? 0}d`} accent="orange" />
        <MetricCard label="Best Streak" value={`${telemetry?.longestStreak ?? 0}d`} accent="orange" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Understanding" value={`${stats?.understanding ?? 0}%`} accent="teal" />
        <MetricCard label="Recall" value={`${stats?.recall ?? 0}%`} accent="teal" />
        <MetricCard label="Application" value={`${stats?.application ?? 0}%`} accent="teal" />
      </div>

      {telemetry && telemetry.weeklyMinutes.length > 0 ? (
        <div className="card-soft p-5">
          <h2 className="text-lg font-bold text-stone-900">Minutes this week</h2>
          <div className="mt-4 flex items-end gap-2">
            {telemetry.weeklyMinutes.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-teal-500 to-teal-400"
                  style={{ height: `${Math.max(8, (item.minutes / maxWeekly) * 120)}px` }}
                  title={`${item.minutes} min`}
                />
                <span className="text-[10px] font-semibold uppercase text-stone-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {telemetry && telemetry.minutesByActivity.length > 0 ? (
          <div className="card-soft p-5">
            <h2 className="text-lg font-bold text-stone-900">Time by activity</h2>
            <div className="mt-4 space-y-2">
              {telemetry.minutesByActivity.map((item) => (
                <div
                  key={item.activityType}
                  className="flex items-center justify-between rounded-xl bg-orange-50/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium capitalize text-stone-800">
                    {item.activityType.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="text-stone-500">
                    {item.minutes}m · {item.sessions} session{item.sessions === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {telemetry && telemetry.recentSessions.length > 0 ? (
          <div className="card-soft p-5">
            <h2 className="text-lg font-bold text-stone-900">Recent sessions</h2>
            <ul className="mt-4 divide-y divide-orange-100">
              {telemetry.recentSessions.map((session) => (
                <li key={session.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold capitalize text-stone-900">
                      {session.activityType.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="text-xs text-stone-500">
                      {session.courseTitle ?? "General"} ·{" "}
                      {new Date(session.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-semibold text-teal-700">
                    {Math.max(1, Math.round(session.durationSeconds / 60))}m
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {stats?.upcomingAssignment ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Next deadline</p>
          <h2 className="mt-1 text-lg font-bold text-stone-900">{stats.upcomingAssignment.title}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {stats.upcomingAssignment.course}
            {stats.upcomingAssignment.dueDate
              ? ` · Due ${new Date(stats.upcomingAssignment.dueDate).toLocaleDateString()}`
              : ""}
          </p>
        </div>
      ) : null}

      {courses.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-stone-900">Mastery by course</h2>
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          {selectedCourseId ? <MasteryTree courseId={selectedCourseId} /> : null}
        </div>
      ) : (
        <div className="card-soft p-8 text-center text-sm text-stone-500">
          Add a course to begin mastery tracking.
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent = "stone",
}: {
  label: string;
  value: string | number;
  accent?: "stone" | "amber" | "teal" | "violet" | "orange" | "rose";
}) {
  const valueClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "teal"
        ? "text-teal-600"
        : accent === "violet"
          ? "text-violet-600"
          : accent === "orange"
            ? "text-orange-600"
            : accent === "rose"
              ? "text-rose-600"
              : "text-stone-900";

  return (
    <div className="card-soft p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}
