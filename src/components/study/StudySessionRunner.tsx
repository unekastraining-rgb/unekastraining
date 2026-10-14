"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  SkipForward,
} from "lucide-react";

import type { StudyBlock, StudyMinutes } from "@/lib/csl/study-now";
import type { StudyNowUleBridgePick } from "@/lib/learning/study-now-ule-bridge";
import {
  isSixGuideComponent,
  personalizeSixGuide,
  sixGuideHref,
} from "@/lib/csl/six-guides";
import {
  blurtingHref,
  luckyQuizHref,
  sixChunkingHref,
} from "@/lib/study/loop-hrefs";
import { coreCourseHref } from "@/lib/study/core-href";
import { StudyLoopStrip } from "@/components/study/StudyLoopStrip";
import { ContinueLearningButton } from "@/components/study/ContinueLearningButton";
import { useTapHandler } from "@/hooks/useTapHandler";

export const STUDY_NOW_STORAGE_KEY = "study-now-session";
export const LUCKY_STORAGE_KEY = "lucky-session";

export interface StoredStudySession {
  summary: string;
  totalMinutes: StudyMinutes | 30 | 45 | 60;
  blocks: StudyBlock[];
  context?: Record<string, number>;
  activityType?: string;
  courseId?: string | null;
  courseTitle?: string | null;
  coldStartTopic?: string | null;
  /** Additive ULE bridge — optional Adaptive CTAs when concept linked. */
  uleFocusTopics?: StudyNowUleBridgePick[];
}

export interface SessionRunnerConfig {
  storageKey: string;
  backHref: string;
  backLabel: string;
  accent: "orange" | "violet";
  phaseLabel?: string;
  activityType?: string;
  loadFromApi?: { url: string; method?: "GET" | "POST"; body?: unknown };
  initialMinutes?: StudyMinutes;
  courseId?: string | null;
}

const ACCENT = {
  orange: {
    badge: "text-orange-600",
    bar: "bg-orange-100",
    fill: "bg-orange-500",
    ring: "#f97316",
    ringBg: "#fed7aa",
    card: "border-orange-200 from-orange-50",
    btn: "bg-orange-500 hover:bg-orange-600",
    link: "hover:text-orange-600",
    list: "border-orange-100",
    current: "bg-orange-50",
    border: "border-orange-200",
  },
  violet: {
    badge: "text-violet-600",
    bar: "bg-violet-100",
    fill: "bg-violet-500",
    ring: "#8b5cf6",
    ringBg: "#ddd6fe",
    card: "border-violet-200 from-violet-50",
    btn: "bg-violet-600 hover:bg-violet-500",
    link: "hover:text-violet-600",
    list: "border-violet-100",
    current: "bg-violet-50",
    border: "border-violet-200",
  },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function StudySessionRunner({
  config = {
    storageKey: STUDY_NOW_STORAGE_KEY,
    backHref: "/study",
    backLabel: "Study Hub",
    accent: "orange",
    phaseLabel: "Now studying",
  },
}: {
  config?: SessionRunnerConfig;
}) {
  const {
    storageKey,
    backHref,
    backLabel,
    accent,
    phaseLabel = "Now studying",
    activityType = "GENERAL",
    loadFromApi,
    initialMinutes,
    courseId: configCourseId,
  } = config;
  const colors = ACCENT[accent];

  const [session, setSession] = useState<StoredStudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockIndex, setBlockIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const [sessionStart] = useState(() => Date.now());

  useEffect(() => {
    async function load() {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as StoredStudySession;
          setSession(parsed);
          setSecondsLeft((parsed.blocks[0]?.minutes ?? 5) * 60);
          setLoading(false);
          return;
        } catch {
          sessionStorage.removeItem(storageKey);
        }
      }

      if (loadFromApi) {
        let apiUrl = loadFromApi.url;
        if (
          configCourseId &&
          (loadFromApi.method ?? "GET") === "GET" &&
          typeof window !== "undefined"
        ) {
          const resolved = new URL(apiUrl, window.location.origin);
          if (!resolved.searchParams.has("courseId")) {
            resolved.searchParams.set("courseId", configCourseId);
            apiUrl = `${resolved.pathname}${resolved.search}`;
          }
        }
        const response = await fetch(apiUrl, {
          method: loadFromApi.method ?? "GET",
          headers:
            loadFromApi.method === "POST"
              ? { "Content-Type": "application/json" }
              : undefined,
          body:
            loadFromApi.method === "POST"
              ? JSON.stringify(loadFromApi.body ?? {})
              : undefined,
        });
        const data = await response.json();
        if (data.success) {
          const stored: StoredStudySession = {
            summary: data.data.summary,
            totalMinutes: data.data.totalMinutes,
            blocks: data.data.blocks,
            context: data.data.context,
            courseId: data.data.courseId ?? configCourseId ?? null,
            courseTitle: data.data.courseTitle ?? null,
            coldStartTopic: data.data.coldStartTopic ?? null,
            uleFocusTopics: data.data.uleFocusTopics ?? [],
          };
          sessionStorage.setItem(storageKey, JSON.stringify(stored));
          setSession(stored);
          setSecondsLeft((stored.blocks[0]?.minutes ?? 5) * 60);
        }
      } else if (initialMinutes) {
        const response = await fetch("/api/study-now", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            minutes: initialMinutes,
            ...(configCourseId ? { courseId: configCourseId } : {}),
          }),
        });
        const data = await response.json();
        if (data.success) {
          const stored: StoredStudySession = {
            summary: data.data.summary,
            totalMinutes: data.data.totalMinutes,
            blocks: data.data.blocks,
            context: data.data.context,
            courseId: data.data.courseId ?? configCourseId ?? null,
            courseTitle: data.data.courseTitle ?? null,
            coldStartTopic: data.data.coldStartTopic ?? null,
            uleFocusTopics: data.data.uleFocusTopics ?? [],
          };
          sessionStorage.setItem(storageKey, JSON.stringify(stored));
          setSession(stored);
          setSecondsLeft((stored.blocks[0]?.minutes ?? 5) * 60);
        }
      }
      setLoading(false);
    }
    void load();
  }, [storageKey, loadFromApi, initialMinutes, configCourseId]);

  const currentBlock = session?.blocks[blockIndex];
  const progress = useMemo(() => {
    if (!session) return 0;
    const done = completedIds.size + skippedIds.size;
    return Math.round((done / session.blocks.length) * 100);
  }, [session, completedIds, skippedIds]);

  useEffect(() => {
    if (!running || finished || !currentBlock) return;
    if (secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, finished, currentBlock, secondsLeft]);

  const advance = useCallback(
    (mark: "complete" | "skip") => {
      if (!session || !currentBlock) return;

      if (mark === "complete") {
        setCompletedIds((prev) => new Set(prev).add(currentBlock.id));
      } else {
        setSkippedIds((prev) => new Set(prev).add(currentBlock.id));
      }

      const nextIndex = blockIndex + 1;
      if (nextIndex >= session.blocks.length) {
        setFinished(true);
        setRunning(false);
        sessionStorage.removeItem(storageKey);
        const durationSeconds = Math.max(
          60,
          Math.round((Date.now() - sessionStart) / 1000),
        );
        void fetch("/api/study/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: session.activityType ?? activityType,
            durationSeconds,
            cardsReviewed: completedIds.size + (mark === "complete" ? 1 : 0),
            startedAt: new Date(sessionStart).toISOString(),
          }),
        }).catch(() => {});
        return;
      }

      setBlockIndex(nextIndex);
      setSecondsLeft(session.blocks[nextIndex].minutes * 60);
      setRunning(true);
    },
    [session, currentBlock, blockIndex, storageKey, activityType, sessionStart, completedIds.size],
  );

  const tapToggleRunning = useTapHandler(() => setRunning((prev) => !prev));
  const tapCompleteBlock = useTapHandler(() => advance("complete"));
  const tapSkipBlock = useTapHandler(() => advance("skip"));

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session || session.blocks.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-stone-600">No session plan found.</p>
        <Link
          href={backHref}
          className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-600 ${colors.link}`}
        >
          <ArrowLeft className="h-4 w-4" /> Back to {backLabel}
        </Link>
      </div>
    );
  }

  if (finished) {
    const completed = completedIds.size;
    const skipped = skippedIds.size;
    const courseId = session?.courseId?.trim() || null;
    const topicName =
      session?.coldStartTopic?.trim() ||
      session?.blocks.find((block) => block.topicName)?.topicName ||
      session?.courseTitle ||
      null;
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="text-2xl font-black text-stone-900">Session complete</h1>
        <p className="text-stone-600">
          {completed} block{completed === 1 ? "" : "s"} completed
          {skipped > 0 ? ` · ${skipped} skipped` : ""}.
        </p>
        {courseId ? (
          <>
            <StudyLoopStrip
              courseId={courseId}
              courseTitle={session?.courseTitle ?? "this class"}
              topics={
                session?.coldStartTopic
                  ? [session.coldStartTopic]
                  : session?.blocks
                      .map((block) => block.topicName)
                      .filter((name): name is string => Boolean(name?.trim()))
              }
              focusTopic={topicName}
            />
            <div
              data-hub-chrome
              className="rounded-2xl border border-brand bg-brand-soft/30 p-4 text-left"
            >
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              Keep the loop going
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Core notes → Six → Lucky for {session?.courseTitle ?? "this class"}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={coreCourseHref({ courseId })}
                className="inline-flex min-h-11 items-center rounded-full border border-brand bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-brand-soft touch-manipulation"
              >
                Core notes
              </Link>
              <Link
                href={sixChunkingHref(courseId, topicName || "notes")}
                className="inline-flex min-h-11 items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 touch-manipulation"
              >
                Six chunking
              </Link>
              <Link
                href={blurtingHref(courseId, null, topicName ?? undefined)}
                className="inline-flex min-h-11 items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800 hover:bg-orange-100 touch-manipulation"
              >
                Blurt gaps
              </Link>
              <Link
                href={luckyQuizHref(courseId, null, topicName)}
                className="inline-flex min-h-11 items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100 touch-manipulation"
              >
                Lucky quiz
              </Link>
            </div>
            </div>
          </>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={backHref}
            className={`inline-flex min-h-11 items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white touch-manipulation ${colors.btn}`}
          >
            Back to {backLabel}
          </Link>
          <Link
            href="/dashboard"
            className={`inline-flex min-h-11 items-center rounded-xl border px-5 py-2.5 text-sm font-semibold text-stone-700 touch-manipulation ${colors.border} hover:bg-stone-50`}
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalSeconds = (currentBlock?.minutes ?? 1) * 60;
  const timerPct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));
  const phase =
    currentBlock && "phase" in currentBlock
      ? String((currentBlock as StudyBlock & { phase?: string }).phase)
      : null;

  const uleContinue = (session.uleFocusTopics ?? []).filter(
    (t) => t.conceptId && t.adaptiveCta.kind !== "none",
  );

  const blockActivity = currentBlock?.activity;
  const sixGuide =
    currentBlock &&
    typeof blockActivity === "string" &&
    isSixGuideComponent(blockActivity)
      ? personalizeSixGuide(blockActivity, {
          topicName: currentBlock.topicName,
          courseTitle: currentBlock.subtitle?.split("·")[0]?.trim(),
        })
      : null;

  const openHref =
    currentBlock?.href ||
    (sixGuide
      ? sixGuideHref(sixGuide.component, {
          courseId: session?.courseId ?? undefined,
          topicName: currentBlock?.topicName,
        })
      : undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={backHref}
          className={`inline-flex items-center gap-1 text-sm font-semibold text-stone-500 ${colors.link}`}
        >
          <ArrowLeft className="h-4 w-4" /> Exit
        </Link>
        <p className={`text-xs font-bold uppercase tracking-wider ${colors.badge}`}>
          Block {blockIndex + 1} of {session.blocks.length}
          {phase ? ` · ${phase}` : ""}
        </p>
      </div>

      <div>
        <div className={`h-2 overflow-hidden rounded-full ${colors.bar}`}>
          <div
            className={`h-full transition-all duration-500 ${colors.fill}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">{session.summary}</p>
      </div>

      {uleContinue.length > 0 ? (
        <div
          data-study-now-ule-bridge
          className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Adaptive practice
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Optional Start / Continue learning for topics already linked to a concept —
            does not replace this Study Now plan.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {uleContinue.map((topic) => (
              <ContinueLearningButton
                key={topic.topicId}
                conceptId={topic.conceptId!}
                secondaryHint={topic.topicName}
              />
            ))}
          </div>
        </div>
      ) : null}

      {session.courseId ? (
        <StudyLoopStrip
          courseId={session.courseId}
          courseTitle={session.courseTitle ?? "this course"}
          topics={
            session.blocks
              .map((block) => block.topicName)
              .filter((name): name is string => Boolean(name?.trim()))
          }
          focusTopic={
            session.coldStartTopic?.trim() ||
            session.blocks.find((block) => block.topicName)?.topicName ||
            null
          }
        />
      ) : null}

      <div
        className={`rounded-3xl border bg-gradient-to-br to-white p-8 text-center shadow-sm ${colors.card}`}
      >
        <p className={`text-sm font-semibold uppercase tracking-wider ${colors.badge}`}>
          {phaseLabel}
        </p>
        <h1 className="mt-2 text-2xl font-black text-stone-900">{currentBlock?.label}</h1>
        {currentBlock?.subtitle ? (
          <p className="mt-1 text-sm text-stone-600">{currentBlock.subtitle}</p>
        ) : null}
        <p className="mt-1 text-sm text-stone-500">{currentBlock?.minutes} min suggested</p>

        <div className="relative mx-auto mt-8 flex h-36 w-36 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke={colors.ringBg} strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${timerPct * 2.76} 276`}
            />
          </svg>
          <span className="text-3xl font-black tabular-nums text-stone-900">
            {formatTime(secondsLeft)}
          </span>
        </div>

        <button
          type="button"
          {...tapToggleRunning}
          className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-stone-700 touch-manipulation ${colors.border} hover:opacity-90`}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Resume"}
        </button>
      </div>

      {sixGuide ? (
        <div className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-5 text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Technique · {sixGuide.title}
            </p>
            <p className="mt-1 text-sm text-stone-800">{sixGuide.whatItMeans}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Do this now
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-stone-800">
              {sixGuide.howTo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Examples
            </p>
            <ul className="mt-2 space-y-2 text-sm text-stone-700">
              {sixGuide.examples.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-teal-100 bg-white/80 px-3 py-2"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {openHref ? (
          <Link
            href={openHref}
            data-hub-chrome
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100 touch-manipulation"
          >
            {sixGuide ? "Open guided steps" : "Open activity"}{" "}
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}
        <button
          type="button"
          {...tapCompleteBlock}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white touch-manipulation ${colors.btn}`}
        >
          <CheckCircle2 className="h-4 w-4" /> Complete block
        </button>
        <button
          type="button"
          {...tapSkipBlock}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold text-stone-600 touch-manipulation ${colors.border} hover:bg-stone-50`}
        >
          <SkipForward className="h-4 w-4" /> Skip
        </button>
      </div>

      <ul className={`space-y-2 rounded-2xl border bg-white p-4 ${colors.list}`}>
        {session.blocks.map((block, index) => {
          const status = completedIds.has(block.id)
            ? "done"
            : skippedIds.has(block.id)
              ? "skipped"
              : index === blockIndex
                ? "current"
                : "upcoming";
          const blockPhase =
            "phase" in block ? (block as StudyBlock & { phase?: string }).phase : null;
          return (
            <li
              key={block.id}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                status === "current"
                  ? `${colors.current} font-semibold text-stone-900`
                  : status === "done"
                    ? "text-emerald-700 line-through opacity-70"
                    : status === "skipped"
                      ? "text-stone-400 line-through"
                      : "text-stone-500"
              }`}
            >
              <span>
                {blockPhase ? (
                  <span className={`mr-2 text-[10px] font-bold uppercase ${colors.badge}`}>
                    {blockPhase}
                  </span>
                ) : null}
                {block.label}
              </span>
              <span className="text-xs">{block.minutes}m</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function saveStudySession(
  plan: StoredStudySession,
  storageKey = STUDY_NOW_STORAGE_KEY,
) {
  sessionStorage.setItem(storageKey, JSON.stringify(plan));
}
