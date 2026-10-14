"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type PackOption = {
  id: string;
  subject: string;
  concepts: Array<{ id: string; title: string }>;
};

type CourseOption = {
  id: string;
  title: string;
  topics: string[];
};

/** Merge query into continueHrefBase without dropping challengeId etc. */
function withContinueParams(
  continueHrefBase: string,
  extra: Record<string, string>,
): string {
  const [pathPart, existingQs = ""] = continueHrefBase.split("?");
  const params = new URLSearchParams(existingQs);
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${pathPart}?${qs}` : pathPart!;
}

/**
 * Bundle K — Concept-less entry: Choose subject → topic → start activity.
 * Never shows internal conceptId errors to learners.
 */
export function ConceptEntryPicker({
  activityKind,
  activityLabel,
  continueHrefBase,
}: {
  activityKind: string;
  activityLabel: string;
  /** Base path e.g. /study/activities/coding — conceptId appended on start */
  continueHrefBase: string;
}) {
  const router = useRouter();
  const [packs, setPacks] = useState<PackOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"library" | "course">("library");
  const [packId, setPackId] = useState("");
  const [klConceptId, setKlConceptId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [libRes, courseRes] = await Promise.all([
          fetch("/api/study/capability-topics", { credentials: "same-origin" }),
          fetch("/api/courses", { credentials: "same-origin" }),
        ]);
        const libData = await libRes.json();
        const courseData = await courseRes.json();
        if (!cancelled) {
          if (libData.success) setPacks(libData.data ?? []);
          if (courseData.success || courseData.courses) {
            setCourses(
              (courseData.courses ?? []).map(
                (c: { id: string; title: string; topics?: string[] }) => ({
                  id: c.id,
                  title: c.title,
                  topics: c.topics ?? [],
                }),
              ),
            );
          }
        }
      } catch {
        if (!cancelled) setError("Could not load topics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPack = useMemo(
    () => packs.find((p) => p.id === packId) ?? null,
    [packs, packId],
  );
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId) ?? null,
    [courses, courseId],
  );

  async function startFromLibrary() {
    if (!klConceptId) {
      setError("Choose a topic to continue.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/study/ensure-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ klConceptId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error ?? "Could not start.");
      }
      const conceptId = data.data.conceptId as string;
      router.push(
        withContinueParams(continueHrefBase, {
          conceptId,
          klConceptId,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start.");
    } finally {
      setStarting(false);
    }
  }

  function startFromCourse() {
    if (!courseId || !topic.trim()) {
      setError("Choose a class and topic to continue.");
      return;
    }
    router.push(
      withContinueParams(continueHrefBase, {
        courseId,
        topic: topic.trim(),
      }),
    );
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-stone-500"
        data-concept-entry-picker
      >
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading topics" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[minmax(0,14rem)_1fr]"
      data-concept-entry-picker
      data-activity-kind={activityKind}
    >
      <aside className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Get ready
        </p>
        <h1 className="text-2xl font-bold text-stone-900">{activityLabel}</h1>
        <p className="text-sm text-stone-600">
          Choose a subject and topic, then start. You don’t need Adaptive first.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => setMode("library")}
            className={`min-h-11 rounded-xl px-3 py-2 text-left text-sm font-semibold touch-manipulation ${
              mode === "library"
                ? "bg-stone-900 text-white"
                : "border border-stone-200 bg-white text-stone-800"
            }`}
          >
            Study library topics
          </button>
          <button
            type="button"
            onClick={() => setMode("course")}
            className={`min-h-11 rounded-xl px-3 py-2 text-left text-sm font-semibold touch-manipulation ${
              mode === "course"
                ? "bg-stone-900 text-white"
                : "border border-stone-200 bg-white text-stone-800"
            }`}
          >
            My classes
          </button>
        </div>
      </aside>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        {mode === "library" ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Subject
              <select
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                value={packId}
                onChange={(e) => {
                  setPackId(e.target.value);
                  setKlConceptId("");
                }}
              >
                <option value="">Choose a subject…</option>
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.subject}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Topic
              <select
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                value={klConceptId}
                disabled={!selectedPack}
                onChange={(e) => setKlConceptId(e.target.value)}
              >
                <option value="">Choose a topic…</option>
                {(selectedPack?.concepts ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={starting || !klConceptId}
              onClick={() => void startFromLibrary()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 touch-manipulation"
            >
              {starting ? "Starting…" : `Start ${activityLabel}`}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-sm text-stone-600">
                No classes yet. Use study library topics, or{" "}
                <Link href="/courses" className="font-semibold text-teal-700 underline">
                  add a class
                </Link>
                .
              </p>
            ) : (
              <>
                <label className="block text-sm font-medium text-stone-700">
                  Class
                  <select
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                    value={courseId}
                    onChange={(e) => {
                      setCourseId(e.target.value);
                      setTopic("");
                    }}
                  >
                    <option value="">Choose a class…</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-stone-700">
                  Topic
                  <select
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                    value={topic}
                    disabled={!selectedCourse}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="">Choose a topic…</option>
                    {(selectedCourse?.topics ?? []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!courseId || !topic.trim()}
                  onClick={startFromCourse}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 touch-manipulation"
                >
                  Start {activityLabel}
                </button>
              </>
            )}
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </section>
    </div>
  );
}
