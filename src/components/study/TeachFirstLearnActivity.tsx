"use client";

/**
 * Teach-first Learn experience for /study/teach-me.
 * Cold learners see instruction before any required recall/demonstration.
 * Reuses existing six-lesson + evaluate + six-tutor APIs — no new engines.
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Loader2,
} from "lucide-react";

import { SixTutorChat } from "@/components/study/SixTutorChat";
import { LearnPreferencesControls } from "@/components/study/LearnPreferencesControls";
import {
  TeachingStyleSelector,
  useSessionTeachingStyle,
} from "@/components/study/TeachingStyleSelector";
import { useTapHandler } from "@/hooks/useTapHandler";
import { useCourseTopics } from "@/hooks/useCourseTopics";
import { readableCourseTitle } from "@/lib/courses/display-name";
import {
  isMetaSyllabusTopic,
  type SixLessonChunk,
  type SixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";
import {
  type ContentDifficultyChoice,
  type LearnPreferenceKey,
  topicSuggestsCodingActivity,
  topicSuggestsSqlActivity,
} from "@/lib/learning/learner-preferences";
import {
  buildLearningExperienceContext,
  learningExperienceStatusLines,
} from "@/lib/learning/unified-experience";
import {
  buildLearningWorkspaceContext,
} from "@/lib/learning/workspace";
import {
  buildCurriculumSections,
  buildInstructionalMoments,
  curriculumStatusForIndex,
  evaluateSelectInteraction,
  isSelectInteraction,
  learningObjectFromChunk,
  resolveStageMode,
  studioStageFromChunk,
  type LearningInteraction,
} from "@/lib/learning/studio";
import {
  selectInteractiveActivityForConcept,
} from "@/lib/learning/activity/runtime";
import type {
  InteractiveFeedback,
  InteractiveSubmission,
} from "@/lib/learning/activity/runtime";
import {
  CurriculumDrawer,
  CurriculumRail,
  LearningDock,
  LearningObjectStage,
  LearningWorkspaceHeader,
  type CurriculumPathItem,
} from "@/components/study/learning-workspace";
import type { ResolvedInstructionalContext } from "@/lib/study/resolve-instructional-context";
import {
  parseLearningFocus,
  shouldTeachBeforePractice,
} from "@/lib/study/learning-focus";
import {
  luckyQuizHref,
  sixChunkingHref,
  sixFeynmanHref,
} from "@/lib/study/loop-hrefs";
import { resolveStudyRoomHref } from "@/lib/study/resolve-study-room";
import { hubTabPath } from "@/lib/hub/tabs";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { ContextualCapabilityStrip } from "@/components/study/ContextualCapabilityStrip";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import {
  buildCapabilityHref,
  getStudyCapability,
} from "@/lib/study/capability-registry";
import type { LearnerConceptState } from "@/lib/learning/learner-state/types";
import { presentAdaptiveNextAction } from "@/lib/learning/adaptive-next-action";
import "@/lib/learning/knowledge/packs";

interface CourseOption {
  id: string;
  title: string;
  topics?: { id: string; name: string }[];
}

interface Evaluation {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
}

/** Phase 5 — additive orchestration from six-lesson (UI consumes; does not decide). */
type LessonOrchestration = {
  action?: string;
  learnerLabel?: string;
  learnerHint?: string;
  destination?: { href?: string | null; room?: string | null } | null;
  sixRecommendation?: {
    technique?: string;
    reason?: string;
  } | null;
};

/** Bundle D — additive teach path progression (UI displays; does not decide). */
type TeachingProgression = {
  pathTitle?: string;
  scope?: string;
  currentIndex?: number;
  total?: number;
  currentConceptId?: string | null;
  currentConceptTitle?: string | null;
  nextConceptTitle?: string | null;
  conceptTitles?: string[];
  conceptIds?: string[];
  depthSections?: string[];
};

function usableTopics(course: CourseOption | undefined) {
  return (course?.topics ?? []).filter(
    (topic) =>
      topic.name.trim() &&
      !/^general$/i.test(topic.name) &&
      !isMetaSyllabusTopic(topic.name),
  );
}

function buildFocusStepContext(
  chunk: SixLessonChunk | null,
  topic: string,
  stepIndex: number,
  total: number,
): string {
  if (!chunk) return `Topic: ${topic}`;
  return [
    `Topic: ${topic}`,
    `Step ${stepIndex + 1} of ${total}: ${chunk.title}`,
    chunk.role ? `Role: ${chunk.role}` : null,
    `Explanation:\n${chunk.explanation.slice(0, 900)}`,
    chunk.example ? `Example / code:\n${chunk.example.slice(0, 700)}` : null,
    chunk.breakdown ? `Breakdown:\n${chunk.breakdown.slice(0, 500)}` : null,
    chunk.representation
      ? `Visual:\n${chunk.representation.slice(0, 400)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

interface Evaluation {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
}

export function TeachFirstLearnActivity({
  initialCourses,
  initialCourseId,
  initialTopic,
  initialMaterialId,
}: {
  initialCourses: CourseOption[];
  initialCourseId?: string;
  initialTopic?: string;
  initialMaterialId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = parseLearningFocus(searchParams.get("focus"));
  const teachFirst = shouldTeachBeforePractice({ focus });

  const [courses] = useState(initialCourses);
  const courseIds = courses.map((c) => c.id);
  const [courseId, setCourseId] = useState(() =>
    resolveUrlCourseId(initialCourseId, courseIds),
  );
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [topicCustom, setTopicCustom] = useState(false);
  const [materialId] = useState(initialMaterialId?.trim() || "");
  const [focusChunkIndex, setFocusChunkIndex] = useState<number | null>(null);
  const [lesson, setLesson] = useState<SixWorkedLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonWarning, setLessonWarning] = useState<string | null>(null);
  const [showExplain, setShowExplain] = useState(
    () => !teachFirst || focus === "explain",
  );
  const [tutorOpen, setTutorOpen] = useState(() => focus === "tutor");
  const [howILearnOpen, setHowILearnOpen] = useState(false);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [curriculumOpen, setCurriculumOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [makingQuiz, setMakingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  /** Bundle N — session recognition success unlocks application interactive forms. */
  const [sessionRecognitionOk, setSessionRecognitionOk] = useState(false);
  const [teachingStyle, setTeachingStyle] = useSessionTeachingStyle("");
  const [learnPreferences, setLearnPreferences] = useState<LearnPreferenceKey[]>(
    [],
  );
  const learnPreferencesKey = learnPreferences.join(",");
  const [contentDifficulty, setContentDifficulty] =
    useState<ContentDifficultyChoice | null>(null);
  const [instructionalContext, setInstructionalContext] =
    useState<ResolvedInstructionalContext | null>(null);
  const [orchestration, setOrchestration] = useState<LessonOrchestration | null>(
    null,
  );
  const [teachingProgression, setTeachingProgression] =
    useState<TeachingProgression | null>(null);
  const sessionStart = useRef(0);

  useEffect(() => {
    sessionStart.current = Date.now();
  }, []);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const seededTopics = usableTopics(selectedCourse);
  const { topics: liveTopics, loading: topicsLoading } = useCourseTopics(
    courseId,
    seededTopics,
  );
  const courseTopics =
    liveTopics.length > 0 ? liveTopics : usableTopics(selectedCourse);

  // Prefer explicit topic; otherwise first syllabus topic (derived — no seed effect).
  const effectiveTopic =
    topic.trim() ||
    (!topicsLoading && courseTopics[0]?.name ? courseTopics[0].name : "");
  const topicLooksMeta = Boolean(
    effectiveTopic && isMetaSyllabusTopic(effectiveTopic),
  );
  /** Canonical teach target — resolved instructional title beats LMS week label. */
  const learnTitle =
    instructionalContext?.teachingTopic?.trim() ||
    lesson?.topic?.trim() ||
    effectiveTopic ||
    "this topic";
  const organizationalLabel =
    instructionalContext?.organizationalLabel?.trim() || null;

  async function buildLesson() {
    if (!effectiveTopic || topicLooksMeta) return;
    setLessonLoading(true);
    setError(null);
    setLessonWarning(null);
    try {
      const res = await fetch("/api/study/six-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component: "detailed-explanation",
          topic: effectiveTopic,
          courseId: courseId || undefined,
          materialId: materialId || undefined,
          ...(teachingStyle ? { teachingStyle } : {}),
          ...(contentDifficulty != null
            ? { contentDifficulty }
            : {}),
          ...(learnPreferences.length > 0
            ? { learnPreferences }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        warning?: string;
        lesson?: SixWorkedLesson;
        instructionalContext?: ResolvedInstructionalContext;
        orchestration?: LessonOrchestration | null;
        teachingProgression?: TeachingProgression | null;
      };
      if (!data.success || !data.lesson) {
        throw new Error(
          data.error ?? "Could not finish generating this lesson. Please try again.",
        );
      }
      setLesson(data.lesson);
      setInstructionalContext(data.instructionalContext ?? null);
      setOrchestration(data.orchestration ?? null);
      setTeachingProgression(data.teachingProgression ?? null);
      setFocusChunkIndex(data.lesson.chunks.length > 0 ? 0 : null);
      setSelectedChoice(null);
      setResponse("");
      setResult(null);
      if (data.warning) setLessonWarning(data.warning);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not finish generating this lesson. Please try again.",
      );
      setLesson(null);
      setInstructionalContext(null);
      setOrchestration(null);
      setTeachingProgression(null);
    } finally {
      setLessonLoading(false);
    }
  }

  useEffect(() => {
    if (!effectiveTopic || topicLooksMeta) return;
    const handle = window.setTimeout(() => {
      void buildLesson();
    }, 400);
    return () => window.clearTimeout(handle);
    // Rebuild when topic/course/material/style/prefs/difficulty change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effectiveTopic,
    courseId,
    materialId,
    teachingStyle,
    contentDifficulty,
    learnPreferencesKey,
  ]);

  async function evaluateExplain() {
    const currentStep =
      focusChunkIndex != null && lesson?.chunks[focusChunkIndex]
        ? focusChunkIndex
        : 0;
    const moments = lesson
      ? buildInstructionalMoments({
          lesson,
          conceptTitle:
            teachingProgression?.currentConceptTitle ??
            lesson.chunks[0]?.title ??
            learnTitle,
          topic: learnTitle,
          neighborTitles: teachingProgression?.conceptTitles,
        })
      : [];
    const moment = moments[currentStep] ?? null;
    const interaction = moment?.interaction ?? null;

    if (isSelectInteraction(interaction)) {
      if (selectedChoice == null) {
        setError("Choose an option before checking.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const local = evaluateSelectInteraction(interaction, selectedChoice);
        setResult({
          score: local.score,
          summary: local.summary,
          strengths: local.strengths,
          gaps: local.gaps,
          misconceptions: local.misconceptions,
          nextSteps: local.nextSteps,
        });
        if (local.correct) {
          void fetch("/api/study/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "teach-me",
              courseId: courseId || undefined,
              materialId: materialId || undefined,
              topic:
                teachingProgression?.currentConceptTitle?.trim() || learnTitle,
              userResponse: `[Recognition] Selected: ${interaction.choices?.[selectedChoice] ?? ""}\nPrompt: ${interaction.prompt}`,
              durationMs: Date.now() - sessionStart.current,
              evidenceEventKey: `learn-recognize:${learnTitle}:${Date.now()}`,
              ...(teachingStyle ? { teachingStyle } : {}),
            }),
          }).catch(() => {
            /* evidence best-effort; UI already shows local feedback */
          });
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!response.trim()) {
      setError("Write what you understand before checking.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const stepChunk = lesson?.chunks[currentStep] ?? null;
      const focusTopic = stepChunk?.title?.trim() || learnTitle;
      const evidenceEventKey = `learn-check:${learnTitle}:${Date.now()}`;
      const res = await fetch("/api/study/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "teach-me",
          courseId: courseId || undefined,
          materialId: materialId || undefined,
          topic: focusTopic,
          userResponse: stepChunk
            ? `[Explaining step: ${stepChunk.title}]\n${
                stepChunk.example
                  ? `Code/example in view:\n${stepChunk.example.slice(0, 400)}\n\n`
                  : ""
              }${response}`
            : response,
          durationMs: Date.now() - sessionStart.current,
          evidenceEventKey,
          ...(teachingStyle ? { teachingStyle } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Check failed.");
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed.");
    } finally {
      setLoading(false);
    }
  }

  async function makeQuiz() {
    if (!courseId) {
      setError("Select a course first.");
      return;
    }
    setMakingQuiz(true);
    setError(null);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          materialId: materialId || undefined,
          topicName: learnTitle,
          questionCount: 20,
          sourceText: lesson
            ? lesson.chunks
                .map(
                  (c) =>
                    `## ${c.title}\n${c.explanation}\nExample: ${c.example}`,
                )
                .join("\n\n")
            : undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { id?: string };
      };
      if (!data.success || !data.data?.id) {
        throw new Error(data.error ?? "Could not make a quiz.");
      }
      router.push(`/quizzes/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not make a quiz.");
      setMakingQuiz(false);
    }
  }

  const tapRebuild = useTapHandler(() => void buildLesson());
  const courseTitleForHints = selectedCourse?.title ?? "";
  const roomCtx = {
    courseId,
    topic: learnTitle !== "this topic" ? learnTitle : effectiveTopic || null,
    materialId: materialId || null,
    courseTitle: courseTitleForHints,
  };
  const practiceHref = resolveStudyRoomHref("practice", roomCtx);
  const checkHref = resolveStudyRoomHref("check", roomCtx);
  const rememberHref = resolveStudyRoomHref("remember", roomCtx);

  // Phase 5 — consume Orchestrator destination (do not re-implement rules in UI).
  const suggestedHref = orchestration?.destination?.href?.trim() || null;
  const suggestedLabel = orchestration?.learnerLabel?.trim() || null;
  const suggestedHint = orchestration?.learnerHint?.trim() || null;
  const showOrchestratedNext =
    Boolean(suggestedHref && suggestedLabel) &&
    orchestration?.action !== "teach" &&
    orchestration?.action !== "complete";
  const preferCoding = topicSuggestsCodingActivity(
    learnTitle,
    courseTitleForHints,
  );
  const preferSql = topicSuggestsSqlActivity(learnTitle, courseTitleForHints);

  const stepIndex =
    focusChunkIndex != null && lesson?.chunks[focusChunkIndex]
      ? focusChunkIndex
      : 0;
  const activeChunk = lesson?.chunks[stepIndex] ?? null;

  // Clear stale chrome errors when the instructional moment changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setError(null);
  }, [stepIndex]);

  const hasNextStep = Boolean(lesson && stepIndex < lesson.chunks.length - 1);
  const hasPrevStep = stepIndex > 0;
  const focusStepContext = buildFocusStepContext(
    activeChunk,
    effectiveTopic || learnTitle,
    stepIndex,
    lesson?.chunks.length ?? 0,
  );

  const lessonSummary = lesson
    ? [
        lesson.learningFrame,
        ...lesson.chunks.map(
          (c, i) => `Chunk ${i + 1} ${c.title}: ${c.explanation.slice(0, 220)}`,
        ),
      ].join("\n")
    : undefined;

  /* eslint-disable react-hooks/preserve-manual-memoization -- presentation bundle; deps match KL context inputs */
  const learningExperience = useMemo(() => {
    if (!lesson && !orchestration && !teachingProgression) return null;
    // Presentation only — consume Orchestrator/Six fields already on the response.
    // Do not import decision engines into this surface.
    return buildLearningExperienceContext({
      topic: learnTitle !== "this topic" ? learnTitle : effectiveTopic || "topic",
      rawRequest: effectiveTopic || undefined,
      teachingProgression,
      orchestration: orchestration
        ? {
            action: orchestration.action,
            conceptId: teachingProgression?.currentConceptId ?? null,
            learnerLabel: orchestration.learnerLabel,
            learnerHint: orchestration.learnerHint,
            destination: orchestration.destination,
            sixRecommendation: orchestration.sixRecommendation,
          }
        : null,
    });
  }, [lesson, orchestration, teachingProgression, learnTitle, effectiveTopic]);
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const experienceLines = learningExperience
    ? learningExperienceStatusLines(learningExperience)
    : null;

  const formativeComplete = Boolean(result && result.score >= 70);
  const workspace = buildLearningWorkspaceContext({
    experience: learningExperience,
    lesson,
    activeChunk,
    formativeComplete,
    hasResult: Boolean(result),
  });
  const instructionalMoments = lesson
    ? buildInstructionalMoments({
        lesson,
        conceptTitle:
          teachingProgression?.currentConceptTitle ??
          activeChunk?.title ??
          learnTitle,
        topic: learnTitle,
        neighborTitles: teachingProgression?.conceptTitles,
      })
    : [];
  const activeMoment = instructionalMoments[stepIndex] ?? null;
  const activeInteraction: LearningInteraction | null =
    activeMoment?.interaction ?? null;
  const studioStage = activeChunk
    ? studioStageFromChunk(activeChunk, {
        formativeComplete,
        hasResult: Boolean(result),
        isComplete: !hasNextStep && formativeComplete,
      })
    : "understand";
  const stageMode = resolveStageMode({
    studioStage,
    hasInteraction: Boolean(activeInteraction),
    formativeRequired: workspace.formativeRequired,
    hasResult: Boolean(result),
  });
  // When formative is required, prefer in-stage interact/assess over teach-only.
  const effectiveStageMode =
    workspace.formativeRequired && !result && activeInteraction
      ? studioStage === "check"
        ? "assess"
        : "interact"
      : stageMode;
  const learningObject = activeChunk
    ? learningObjectFromChunk({
        chunk: activeChunk,
        studioStage,
        interaction: activeInteraction,
        stageMode: effectiveStageMode,
        feedbackSummary: result?.summary,
      })
    : null;
  const canAdvanceStep = !workspace.formativeRequired || formativeComplete;
  const pathTitles =
    teachingProgression?.conceptTitles?.length
      ? teachingProgression.conceptTitles
      : lesson?.roadmap ?? [];
  const curriculumItems: CurriculumPathItem[] = pathTitles.map((title, i) => {
    const idx = teachingProgression?.currentIndex ?? stepIndex;
    return {
      id: `path-${i}`,
      title,
      status: curriculumStatusForIndex(i, idx),
    };
  });
  const curriculumSections = buildCurriculumSections({
    pathTitle: teachingProgression?.pathTitle ?? lesson?.topic,
    conceptTitles: pathTitles,
    currentIndex: teachingProgression?.currentIndex ?? stepIndex,
  });

  /** Bundle I — real interactive runtime when KL concept id is known on check/apply. */
  /* eslint-disable react-hooks/preserve-manual-memoization -- stage gating for interactive KL runtime */
  const interactiveActivity = useMemo(() => {
    const conceptId = teachingProgression?.currentConceptId;
    if (!conceptId || !lesson) return null;
    if (
      studioStage !== "check" &&
      studioStage !== "apply" &&
      studioStage !== "transfer" &&
      effectiveStageMode !== "assess" &&
      effectiveStageMode !== "interact"
    ) {
      return null;
    }
    const learnerState: LearnerConceptState | null = sessionRecognitionOk
      ? {
          userId: "session",
          conceptId,
          exposureCount: 1,
          attemptCount: 1,
          correctCount: 1,
          incorrectCount: 0,
        }
      : null;
    return selectInteractiveActivityForConcept({ conceptId, learnerState });
  }, [
    teachingProgression?.currentConceptId,
    lesson,
    studioStage,
    effectiveStageMode,
    sessionRecognitionOk,
  ]);
  /* eslint-enable react-hooks/preserve-manual-memoization */

  function applyInteractiveFeedback(feedback: InteractiveFeedback) {
    const score =
      feedback.outcome === "correct"
        ? 100
        : feedback.outcome === "partial"
          ? 70
          : feedback.outcome === "completed"
            ? 80
            : feedback.outcome === "incorrect"
              ? 35
              : 50;
    if (feedback.outcome === "correct" || feedback.outcome === "completed") {
      setSessionRecognitionOk(true);
    }
    const adaptive = presentAdaptiveNextAction({
      outcome: feedback.outcome,
      score,
      conceptId: teachingProgression?.currentConceptId ?? null,
      conceptTitle:
        teachingProgression?.currentConceptTitle?.trim() || learnTitle,
      courseId: courseId || null,
      materialId: materialId || null,
      demonstratedRecognition:
        sessionRecognitionOk ||
        feedback.outcome === "correct" ||
        feedback.outcome === "completed",
    });
    setResult({
      score,
      summary: feedback.summary,
      strengths: feedback.relatedConceptTitles.map(
        (t) => `Connects to ${t}`,
      ),
      gaps: feedback.correctionNote ? [feedback.correctionNote] : [],
      misconceptions: feedback.misconceptionNote
        ? [feedback.misconceptionNote]
        : [],
      nextSteps: adaptive.nextSteps,
    });
  }

  function handleInteractiveComplete(
    submission: InteractiveSubmission,
    feedback: InteractiveFeedback,
  ) {
    applyInteractiveFeedback(feedback);
    const conceptTitle =
      teachingProgression?.currentConceptTitle?.trim() || learnTitle;
    const conceptId = teachingProgression?.currentConceptId ?? null;
    /** Bundle N — structured submission fingerprint (not timestamp-only). */
    const submissionFingerprint = JSON.stringify({
      form: interactiveActivity?.form ?? "activity",
      activityId: interactiveActivity?.id ?? null,
      textAnswer: submission.textAnswer ?? null,
      selectedIndex: submission.selectedIndex ?? null,
      selectedIndices: submission.selectedIndices ?? null,
      matches: submission.matches ?? null,
      orderedItems: submission.orderedItems ?? null,
    });
    /**
     * Bundle L evidence authority (Option B):
     * Local form evaluation → UI feedback only.
     * `/api/study/evaluate` is the sole evidence writer (authenticated session).
     * Do not call studio LAF completion without a real user id.
     */
    void fetch("/api/study/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "teach-me",
        courseId: courseId || undefined,
        materialId: materialId || undefined,
        topic: conceptTitle,
        conceptId: conceptId || undefined,
        activityId: interactiveActivity?.id ?? undefined,
        userResponse: `[Interactive ${interactiveActivity?.form ?? "activity"}]\n${submissionFingerprint}\nPrompt: ${interactiveActivity?.prompt ?? ""}`,
        submissionFingerprint,
        durationMs: Date.now() - sessionStart.current,
        ...(teachingStyle ? { teachingStyle } : {}),
      }),
    }).catch(() => {
      /* evidence best-effort — UI feedback already shown */
    });
  }

  function advanceLearningStep() {
    if (!lesson) return;
    if (!canAdvanceStep) {
      setError("Submit your response before continuing.");
      return;
    }
    if (hasNextStep) {
      setFocusChunkIndex(Math.min(lesson.chunks.length - 1, stepIndex + 1));
      setResult(null);
      setResponse("");
      setSelectedChoice(null);
      setError(null);
      return;
    }
    // Concept complete — surface orchestrated next or keep feedback visible.
    setShowExplain(true);
  }

  function selectCourse(nextId: string) {
    setCourseId(nextId);
    setTopic("");
    setLesson(null);
    setInstructionalContext(null);
    setOrchestration(null);
    setTeachingProgression(null);
    setCourseMenuOpen(false);
  }

  function selectTopic(next: string) {
    if (next === "__custom__") {
      setTopicCustom(true);
      setTopic("");
      setTopicMenuOpen(false);
      return;
    }
    setTopicCustom(false);
    setTopic(next);
    setLesson(null);
    setInstructionalContext(null);
    setOrchestration(null);
    setTeachingProgression(null);
    setTopicMenuOpen(false);
  }

  return (
    <div
      data-learn-teach-first
      data-learn-workspace
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-stone-50/40"
    >
      {/* Compact workspace chrome */}
      <header
        data-learn-workspace-chrome
        className="border-b border-stone-200/80 bg-white/95 px-3 py-2 sm:px-4"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="relative">
            <button
              type="button"
              data-learn-change-course
              onClick={() => {
                setCourseMenuOpen((v) => !v);
                setTopicMenuOpen(false);
                setHowILearnOpen(false);
              }}
              className="inline-flex max-w-[11rem] items-center gap-1 truncate rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-stone-700 touch-manipulation hover:bg-stone-100 sm:max-w-[14rem] sm:text-sm"
              aria-expanded={courseMenuOpen}
            >
              <span className="truncate">
                {selectedCourse
                  ? readableCourseTitle(selectedCourse.title)
                  : "Course"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            </button>
            {courseMenuOpen ? (
              <div className="absolute left-0 top-full z-40 mt-1 max-h-64 w-[min(18rem,85vw)] overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCourse(c.id)}
                    className={`flex w-full px-3 py-2 text-left text-sm touch-manipulation hover:bg-stone-50 ${
                      c.id === courseId
                        ? "font-semibold text-teal-800"
                        : "text-stone-800"
                    }`}
                  >
                    {readableCourseTitle(c.title)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative min-w-0 flex-1 sm:flex-none">
            <button
              type="button"
              data-learn-change-topic
              onClick={() => {
                setTopicMenuOpen((v) => !v);
                setCourseMenuOpen(false);
                setHowILearnOpen(false);
              }}
              className="inline-flex max-w-full items-center gap-1 truncate rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-stone-800 touch-manipulation hover:bg-stone-100 sm:max-w-[16rem] sm:text-sm"
              aria-expanded={topicMenuOpen}
            >
              <span className="truncate">
                {learnTitle !== "this topic"
                  ? learnTitle
                  : effectiveTopic || "Topic"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            </button>
            {topicMenuOpen ? (
              <div className="absolute left-0 top-full z-40 mt-1 max-h-64 w-[min(20rem,90vw)] overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                {courseTopics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTopic(t.name)}
                    className={`flex w-full px-3 py-2 text-left text-sm touch-manipulation hover:bg-stone-50 ${
                      (topic || effectiveTopic) === t.name
                        ? "font-semibold text-teal-800"
                        : "text-stone-800"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => selectTopic("__custom__")}
                  className="flex w-full border-t border-stone-100 px-3 py-2 text-left text-sm text-stone-600 touch-manipulation hover:bg-stone-50"
                >
                  Other / type your own…
                </button>
                {topicCustom ? (
                  <div className="border-t border-stone-100 px-2 py-2">
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setLesson(null);
                          setInstructionalContext(null);
                          setTopicMenuOpen(false);
                        }
                      }}
                      placeholder="Type a topic…"
                      className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                      autoFocus
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="relative ml-auto">
            <button
              type="button"
              data-learn-how-i-learn-trigger
              onClick={() => {
                setHowILearnOpen((v) => !v);
                setCourseMenuOpen(false);
                setTopicMenuOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-600 touch-manipulation hover:bg-stone-100 sm:text-sm"
              aria-expanded={howILearnOpen}
            >
              How I Learn
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            </button>
            {howILearnOpen ? (
              <div
                data-learn-how-i-learn-panel
                className="absolute right-0 top-full z-40 mt-1 w-[min(22rem,92vw)] space-y-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lg"
              >
                <TeachingStyleSelector
                  value={teachingStyle}
                  onChange={setTeachingStyle}
                  id="learn-workspace-teaching-style"
                />
                <LearnPreferencesControls
                  embedded
                  onPreferencesChange={setLearnPreferences}
                  onDifficultyChange={setContentDifficulty}
                />
                <button
                  type="button"
                  {...tapRebuild}
                  disabled={lessonLoading || !effectiveTopic || topicLooksMeta}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-100 disabled:opacity-50"
                >
                  {lessonLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                  {lesson ? "Rebuild lesson" : "Build lesson"}
                </button>
                {materialId ? (
                  <Link
                    href={hubTabPath("locker")}
                    data-learn-from-material
                    className="block text-xs font-semibold text-teal-800 hover:underline"
                  >
                    From your material · Locker
                  </Link>
                ) : null}
                {preferCoding || preferSql ? (
                  <p data-learn-coding-hint className="text-[11px] text-stone-500">
                    Practice can open the{" "}
                    {preferSql && !preferCoding ? "SQL" : "coding"} activity.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {topicLooksMeta ? (
          <p className="mx-auto mt-1 max-w-6xl text-xs font-medium text-amber-700">
            That looks like a syllabus heading. Pick a content topic.
          </p>
        ) : null}
        {topicsLoading ? (
          <p className="mx-auto mt-1 max-w-6xl text-xs text-stone-500">
            Loading topics…
          </p>
        ) : null}
      </header>

      {/* Bundle G UX — Interactive Learning Studio */}
      <div
        data-learning-workspace
        data-learning-studio
        data-learn-canvas
        data-curriculum-open={curriculumOpen ? "true" : "false"}
        className="relative flex w-full flex-1 flex-col bg-[#f7f5f1] pb-24"
      >
        {lesson || lessonLoading || experienceLines ? (
          <LearningWorkspaceHeader
            courseTitle={
              selectedCourse?.title
                ? readableCourseTitle(selectedCourse.title)
                : null
            }
            organizationalLabel={organizationalLabel}
            workspace={workspace}
            experienceLines={experienceLines}
            learningGoal={
              curriculumOpen ? null : lesson?.learningFrame ?? null
            }
            curriculumCollapsed={!curriculumOpen}
            onShowCurriculum={() => setCurriculumOpen(true)}
          />
        ) : null}

        <div className="relative flex min-h-0 flex-1">
          {/* Desktop / landscape: collapsible left curriculum */}
          <div className="hidden lg:flex">
            <CurriculumRail
              open={curriculumOpen}
              onOpenChange={setCurriculumOpen}
              pathTitle={teachingProgression?.pathTitle ?? lesson?.topic}
              items={curriculumItems}
              sections={curriculumSections}
              currentIndex={teachingProgression?.currentIndex ?? stepIndex}
              conceptIds={teachingProgression?.conceptIds}
              compactLabel={
                teachingProgression?.pathTitle ?? lesson?.topic ?? learnTitle
              }
            />
          </div>

          <div
            className={`flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row ${
              tutorOpen ? "" : ""
            }`}
          >
            {lessonWarning ? (
              <p className="px-4 pt-2 text-xs text-amber-800 lg:absolute lg:left-[17rem] lg:top-0">
                {lessonWarning}
              </p>
            ) : null}

            {lessonLoading && !lesson ? (
              <p className="m-auto flex items-center gap-2 text-sm text-stone-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building your lesson…
              </p>
            ) : null}

            {error && !lesson ? (
              <p className="m-4 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            {lesson && learningObject ? (
              <LearningObjectStage
                object={learningObject}
                studioStage={studioStage}
                response={response}
                onResponseChange={setResponse}
                selectedChoice={selectedChoice}
                onSelectChoice={setSelectedChoice}
                onSubmit={() => void evaluateExplain()}
                loading={loading}
                error={error}
                result={result}
                interactiveActivity={interactiveActivity}
                onInteractiveComplete={handleInteractiveComplete}
                showAdvance
                canAdvance={canAdvanceStep}
                advanceLabel={
                  hasNextStep ? "Continue →" : "Done with concept"
                }
                onAdvance={() => advanceLearningStep()}
                momentIndex={stepIndex}
                momentTotal={lesson.chunks.length}
                hasPrev={hasPrevStep}
                onPrev={() => {
                  setFocusChunkIndex(Math.max(0, stepIndex - 1));
                  setResult(null);
                  setResponse("");
                  setSelectedChoice(null);
                  setError(null);
                }}
                remediationLinks={
                  result && result.score < 70 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {courseId ? (
                        <>
                          <Link
                            href={sixChunkingHref(
                              courseId,
                              learnTitle || "notes",
                              materialId || null,
                            )}
                            className="inline-flex min-h-11 items-center border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900"
                          >
                            Break it into smaller pieces
                          </Link>
                          <Link
                            href={sixFeynmanHref(
                              courseId,
                              learnTitle || "notes",
                              materialId || null,
                            )}
                            className="inline-flex min-h-11 items-center border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-900"
                          >
                            Teach it back
                          </Link>
                          <Link
                            href={luckyQuizHref(
                              courseId,
                              materialId || null,
                              learnTitle || null,
                            )}
                            className="inline-flex min-h-11 items-center border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-950"
                          >
                            Review with Lucky
                          </Link>
                        </>
                      ) : null}
                      {getStudyCapability("practice") ? (
                        <Link
                          href={buildCapabilityHref(
                            getStudyCapability("practice")!,
                            {
                              courseId: courseId || null,
                              topic: learnTitle || null,
                              conceptId:
                                teachingProgression?.currentConceptId ?? null,
                              materialId: materialId || null,
                            },
                          )}
                          className="inline-flex min-h-11 items-center border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-800"
                        >
                          Open Practice Hub
                        </Link>
                      ) : null}
                    </div>
                  ) : null
                }
              />
            ) : !lessonLoading && effectiveTopic && !topicLooksMeta ? (
              <p className="m-auto text-sm text-stone-600">
                Open How I Learn → Build lesson to start.
              </p>
            ) : null}

            {result && lesson && !hasNextStep && formativeComplete ? (
              <div
                data-concept-complete
                className="absolute bottom-20 right-4 z-10 border border-teal-500 bg-teal-50 px-4 py-3 shadow-sm lg:bottom-4"
              >
                <p className="text-sm font-bold text-teal-950">
                  Concept complete
                </p>
                {teachingProgression?.nextConceptTitle ? (
                  <p className="mt-1 text-sm text-stone-800">
                    Next: {teachingProgression.nextConceptTitle}
                  </p>
                ) : null}
              </div>
            ) : null}

            {tutorOpen ? (
              <div
                className="fixed inset-0 z-40 bg-stone-900/30 lg:hidden"
                aria-hidden
                onClick={() => setTutorOpen(false)}
              />
            ) : null}
            <div
              data-learn-tutor-slot
              className={
                tutorOpen
                  ? "fixed inset-x-0 bottom-14 top-[28%] z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl lg:static lg:inset-auto lg:z-0 lg:h-auto lg:w-[20rem] lg:shrink-0 lg:rounded-none lg:border-l lg:border-stone-800/10 lg:shadow-none"
                  : "hidden"
              }
            >
              <SixTutorChat
                component="detailed-explanation"
                techniqueTitle="Learn"
                topic={learnTitle}
                courseId={courseId || undefined}
                materialId={materialId || undefined}
                lessonSummary={lessonSummary}
                focusStepContext={focusStepContext}
                learnPreferences={learnPreferences}
                layout="workspace"
                open={tutorOpen}
                onOpenChange={setTutorOpen}
                hideTrigger
                openLabel="Tutor Me"
              />
            </div>
          </div>
        </div>

        {/* Phone / portrait: curriculum as drawer, not permanent rail */}
        <div className="lg:hidden">
          <CurriculumDrawer
            pathTitle={teachingProgression?.pathTitle ?? lesson?.topic}
            items={curriculumItems}
            sections={curriculumSections}
            currentIndex={teachingProgression?.currentIndex ?? stepIndex}
          />
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-[3.25rem] z-30 border-t border-stone-200/80 bg-[#f7f5f1]/95 px-3 py-2 backdrop-blur"
        data-learn-capability-launches
      >
        <ContextualCapabilityStrip
          topicOrSubject={learnTitle}
          practiceForms={
            findInstructionalConceptById(
              teachingProgression?.conceptIds?.[0] ?? "",
            )?.concept.practiceForms ?? null
          }
          courseId={courseId || null}
          topic={learnTitle}
          materialId={materialId || null}
          conceptId={teachingProgression?.conceptIds?.[0] ?? null}
        />
      </div>

      <LearningDock
        active="learn"
        practiceHref={practiceHref}
        checkHref={checkHref}
        rememberHref={rememberHref}
        onTutor={() => setTutorOpen(true)}
        tutorOpen={tutorOpen}
        onCurriculum={() => setCurriculumOpen(true)}
        orchestratedNext={
          showOrchestratedNext && suggestedHref && suggestedLabel
            ? {
                href: suggestedHref,
                label: suggestedLabel,
                hint: suggestedHint,
              }
            : null
        }
      />

    </div>
  );
}
