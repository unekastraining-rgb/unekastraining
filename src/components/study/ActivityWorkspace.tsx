"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { resolvePersonaPresentationHooks } from "@/lib/learning/persona-accessibility-hooks";
import type { LearningExperienceView } from "@/lib/learning/experience/types";
import type { ContentCoverageStatus } from "@/lib/learning/content-coverage/types";
import type { LearningScaffold } from "@/lib/learning/scaffolding/types";
import type {
  EducationalMarketChartView,
  EducationalMarketSimulationState,
} from "@/lib/learning/activities/simulation/educational-market";
import { EducationalMarketPanel } from "@/components/study/EducationalMarketPanel";
import { MathWorkspacePanel } from "@/components/study/MathWorkspacePanel";
import { NetworkWorkspacePanel } from "@/components/study/NetworkWorkspacePanel";
import { LanguageWorkspacePanel } from "@/components/study/LanguageWorkspacePanel";
import { CodingWorkspacePanel } from "@/components/study/CodingWorkspacePanel";
import { SqlWorkspacePanel } from "@/components/study/SqlWorkspacePanel";
import { LabWorkspacePanel } from "@/components/study/LabWorkspacePanel";
import { ProjectWorkspacePanel } from "@/components/study/ProjectWorkspacePanel";
import { PresentationWorkspacePanel } from "@/components/study/PresentationWorkspacePanel";
import { GameMatchPanel } from "@/components/study/GameMatchPanel";
import { AdaptiveReturnStrip } from "@/components/study/AdaptiveReturnStrip";
import { MaterialSourceCitation } from "@/components/study/MaterialSourceCitation";
import { presentWhyThisActivity } from "@/lib/learning/experience/activity-completion-present";
import type { MaterialSourceCitationView } from "@/lib/learning/material-context";
import {
  resolveUniversalActivityState,
  universalActivityStateLearnerLine,
} from "@/lib/learning/experience/activity-lifecycle-state";
import {
  buildActivityDraftKey,
  clearActivityLocalDraft,
  readActivityLocalDraft,
  writeActivityLocalDraft,
} from "@/lib/learning/artifact-persistence/activity-local-draft";

type ChallengeListItem = {
  id: string;
  title: string;
  prompt: string;
  objective?: string;
  domainTag?: string;
  starter?: string;
  language?: string;
  kind?: string;
  equation?: string;
  expectedX?: number;
  requireExplanation?: boolean;
  symptom?: string;
  initialState?: import("@/lib/learning/activities/networking/types").NetworkState;
  requireHostnameResolve?: boolean;
  hostname?: string;
  mode?: string;
  languageCode?: string;
  promptLanguageCode?: string;
  exampleUtterance?: string;
  tutorPrompt?: string;
  listenOptions?: readonly { id: string; label: string }[];
  matchLabel?: string;
  educationalMarket?: boolean;
  marketState?: EducationalMarketSimulationState;
  marketChart?: EducationalMarketChartView;
  marketDisclaimer?: string;
  /** Coding — safe client test metadata (args/expected only). */
  entryFunction?: string;
  tests?: readonly { id: string; args: unknown[]; expected: unknown }[];
  /** SQL — schema preview for workspace (not expected rows). */
  schemaPreview?: string;
  seedSql?: string;
  /** Bundle N — authored game match pairs when catalog provides them. */
  matchPairs?: readonly { term: string; definition: string }[];
  /** 2P-18 Writing Adaptive */
  requiresRevision?: boolean;
  writingType?: string;
  starterDraft?: string;
  revisionIssues?: readonly string[];
  sourceMaterial?: string;
  scaffolds?: LearningScaffold[];
};

const KIND_LABELS: Record<string, string> = {
  coding: "Coding challenge",
  sql: "SQL challenge",
  writing: "Writing exercise",
  lab: "Guided lab",
  simulation: "Simulation",
  game: "Learning game",
  project: "Project",
  presentation: "Presentation builder — guided draft",
  math: "Math workspace",
  networking: "Network workspace",
  language: "Language workspace",
};

/** Bundle M — workspace-oriented activities get task-appropriate width. */
const WIDE_WORKSPACE_KINDS = new Set([
  "coding",
  "sql",
  "lab",
  "project",
  "presentation",
  "game",
  "simulation",
  "networking",
  "diagram",
]);

function learnerFacingActivityError(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    return "Submission failed.";
  }
  if (raw === "foreign_concept" || raw === "missing_concept") {
    return "That concept isn’t available for your account. Return to Adaptive study and try again.";
  }
  if (raw === "concept_mismatch") {
    return "This activity is linked to a different concept than your Adaptive study. Return to Adaptive and continue from there.";
  }
  if (raw === "unknown_challenge") {
    return "That challenge isn’t available. Pick another and try again.";
  }
  return raw;
}

function coverageMessage(status: ContentCoverageStatus | null | undefined): string | null {
  if (!status || status === "AVAILABLE") return null;
  if (status === "INCOMPATIBLE") {
    return "There isn’t a matching activity for this approach yet. Try another learning method from Study Hub or Adaptive.";
  }
  if (status === "UNAVAILABLE") {
    return "This activity isn’t available right now. Another practice option may be available.";
  }
  return "There isn’t a matching activity for this concept yet.";
}

/** Progressive scaffolding — local reveal only; never posts evidence (2P-12). */
function ScaffoldPanel({ scaffolds }: { scaffolds: LearningScaffold[] }) {
  const always = scaffolds.filter((s) => s.revealPolicy === "ALWAYS");
  const onRequest = scaffolds.filter((s) => s.revealPolicy === "ON_REQUEST");
  const [revealedCount, setRevealedCount] = useState(0);

  const revealed = onRequest.slice(0, revealedCount);
  const next = onRequest[revealedCount] ?? null;

  return (
    <div
      className="space-y-3"
      data-learning-scaffolds
      aria-label="Learning support"
    >
      {always.map((s, i) => (
        <div key={`always-${s.kind}-${i}`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {s.label}
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
            {s.content}
          </p>
        </div>
      ))}

      {revealed.map((s, i) => (
        <div
          key={`revealed-${s.kind}-${i}`}
          data-scaffold-revealed
          data-scaffold-level={s.level}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {s.label}
            <span className="ml-2 font-normal normal-case text-stone-400">
              (level {s.level})
            </span>
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
            {s.content}
          </p>
        </div>
      ))}

      {next ? (
        <button
          type="button"
          data-scaffold-request
          data-scaffold-next-level={next.level}
          onClick={() => setRevealedCount((n) => n + 1)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
          aria-label={`Show ${next.label} (level ${next.level}). This does not affect your score.`}
        >
          {revealedCount === 0
            ? "Show a hint"
            : `Show more guidance (level ${next.level})`}
        </button>
      ) : null}

      {onRequest.length > 0 ? (
        <p className="text-xs text-stone-500" data-scaffold-not-evidence>
          Asking for a hint does not change your score or mastery.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Learner-facing universal activity workspace (2G-71 / 2P-11 / 2P-12).
 * Submits work only — never outcomes/scores as authority.
 * Experience + scaffolding are projections — not a decision engine.
 * Hint requests are local UI only — not evidence.
 */
export function ActivityWorkspace({
  kind,
  conceptId,
  initialChallengeId = null,
  adaptiveRunId,
  adaptiveStep,
  materialCitation = null,
  modalityPreferencesJson,
  accessibilityPreferencesJson,
}: {
  kind: string;
  conceptId: string;
  /** Bundle M — catalog/deep-link challenge selection (e.g. Games). */
  initialChallengeId?: string | null;
  adaptiveRunId?: string | null;
  adaptiveStep?: number | null;
  /** 2P-28 — optional source citation (display only). */
  materialCitation?: MaterialSourceCitationView | null;
  modalityPreferencesJson?: string | null;
  accessibilityPreferencesJson?: string | null;
}) {
  const hooks = useMemo(
    () =>
      resolvePersonaPresentationHooks({
        modalityPreferencesJson,
        accessibilityPreferencesJson,
      }),
    [modalityPreferencesJson, accessibilityPreferencesJson],
  );

  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [challengeId, setChallengeId] = useState("");
  const [work, setWork] = useState("");
  const [revisionText, setRevisionText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [experience, setExperience] = useState<LearningExperienceView | null>(
    null,
  );
  const [coverageStatus, setCoverageStatus] =
    useState<ContentCoverageStatus | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [result, setResult] = useState<{
    outcome: string;
    score: number | null;
    rejectedForgeryKeys: string[];
    perCriterion: Array<{ id: string; pass: boolean; label: string }>;
    revisionGuidance: string | null;
  } | null>(null);
  const [adaptiveReturn, setAdaptiveReturn] = useState<{
    runId: string;
    notice?: string;
  } | null>(null);

  const selected = challenges.find((c) => c.id === challengeId);
  const requiresRevision = Boolean(selected?.requiresRevision);
  const inAdaptiveContext = Boolean(adaptiveRunId);
  const gapMessage = coverageMessage(coverageStatus);
  const activityState = resolveUniversalActivityState({
    loading,
    unavailable: Boolean(gapMessage),
    submitting,
    completed: Boolean(result),
    hasWork: Boolean(work.trim() || revisionText.trim()),
  });
  const whyThisActivity = presentWhyThisActivity({
    whyReason: experience?.whyReason,
    purpose: experience?.purpose,
    conceptTitle: experience?.conceptTitle,
    sourceProvenanceLabel: materialCitation?.provenanceLabel ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (conceptId) params.set("conceptId", conceptId);
        if (adaptiveRunId) params.set("adaptiveRunId", adaptiveRunId);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/study/activities/${kind}${qs}`, {
          credentials: "same-origin",
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          const list = (data.data.challenges ?? []) as ChallengeListItem[];
          setChallenges(list);
          setExperience(
            (data.data.experience as LearningExperienceView | null) ?? null,
          );
          setCoverageStatus(
            (data.data.coverageStatus as ContentCoverageStatus | null) ?? null,
          );
          const recommendedId =
            typeof data.data.recommendedContentId === "string"
              ? data.data.recommendedContentId
              : "";
          const deepLinkId = initialChallengeId?.trim() || "";
          const pick =
            (deepLinkId
              ? list.find((c) => c.id === deepLinkId)
              : undefined) ??
            list.find((c) => c.id === recommendedId) ??
            list[0] ??
            null;
          if (pick) {
            setChallengeId(pick.id);
            const draftKey = buildActivityDraftKey({
              kind,
              conceptId,
              challengeId: pick.id,
              adaptiveRunId,
            });
            const draft = readActivityLocalDraft(draftKey);
            if (draft && (draft.work.trim() || draft.revisionText.trim())) {
              setWork(draft.work);
              setRevisionText(draft.revisionText);
              setDraftRestored(true);
            } else {
              setWork(pick.starterDraft ?? pick.starter ?? "");
              setRevisionText("");
              setDraftRestored(false);
            }
          }
        }
      } catch {
        if (!cancelled) setError("Could not load challenges.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, conceptId, adaptiveRunId, initialChallengeId]);

  // Local draft recovery — not LearningAttempt / mastery (same boundary as CORE drafts).
  useEffect(() => {
    if (loading || !challengeId) return;
    const draftKey = buildActivityDraftKey({
      kind,
      conceptId,
      challengeId,
      adaptiveRunId,
    });
    if (!work.trim() && !revisionText.trim()) {
      clearActivityLocalDraft(draftKey);
      return;
    }
    const timer = window.setTimeout(() => {
      writeActivityLocalDraft({
        draftKey,
        kind,
        conceptId,
        challengeId,
        adaptiveRunId: adaptiveRunId ?? null,
        work,
        revisionText,
        savedAt: new Date().toISOString(),
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    work,
    revisionText,
    challengeId,
    kind,
    conceptId,
    adaptiveRunId,
    loading,
  ]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    setAdaptiveReturn(null);
    try {
      const body: Record<string, unknown> = {
        challengeId,
        conceptId,
        ...(adaptiveRunId ? { adaptiveRunId } : {}),
        ...(typeof adaptiveStep === "number" && Number.isFinite(adaptiveStep)
          ? { adaptiveStepIndex: adaptiveStep }
          : {}),
      };
      if (kind === "coding") body.code = work;
      else if (kind === "sql") body.sql = work;
      else if (kind === "math") {
        try {
          const parsed = JSON.parse(work) as {
            steps?: unknown;
            explanation?: unknown;
          };
          if (Array.isArray(parsed.steps)) {
            body.steps = parsed.steps.map((s) => String(s ?? ""));
          } else {
            body.text = work;
          }
          if (typeof parsed.explanation === "string") {
            body.explanation = parsed.explanation;
          }
        } catch {
          body.text = work;
        }
      } else if (kind === "networking") {
        try {
          const parsed = JSON.parse(work) as {
            state?: unknown;
            diagnosis?: unknown;
          };
          if (parsed.state) body.state = parsed.state;
          if (typeof parsed.diagnosis === "string") {
            body.diagnosis = parsed.diagnosis;
          }
        } catch {
          body.text = work;
        }
      } else if (kind === "language") {
        try {
          const parsed = JSON.parse(work) as {
            transcript?: unknown;
            typedResponse?: unknown;
            selectedOptionId?: unknown;
            responseChannel?: unknown;
            recordingState?: unknown;
            speechCapability?: unknown;
          };
          if (typeof parsed.transcript === "string") {
            body.transcript = parsed.transcript;
          }
          if (typeof parsed.typedResponse === "string") {
            body.typedResponse = parsed.typedResponse;
          }
          if (typeof parsed.selectedOptionId === "string") {
            body.selectedOptionId = parsed.selectedOptionId;
          }
          if (
            parsed.responseChannel === "spoken_transcript" ||
            parsed.responseChannel === "typed"
          ) {
            body.responseChannel = parsed.responseChannel;
          }
          if (typeof parsed.recordingState === "string") {
            body.recordingState = parsed.recordingState;
          }
          if (parsed.speechCapability) {
            body.speechCapability = parsed.speechCapability;
          }
        } catch {
          body.text = work;
        }
      } else if (kind === "writing" && requiresRevision) {
        body.draft = work;
        body.revision = revisionText;
        body.final = revisionText;
      } else {
        body.text = work;
      }

      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `activity-${kind}-${Date.now()}`;
      if (
        kind === "writing" ||
        kind === "project" ||
        kind === "presentation"
      ) {
        body.idempotencyKey = idempotencyKey;
      }

      const res = await fetch(`/api/study/activities/${kind}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(body.idempotencyKey
            ? { "X-Idempotency-Key": String(body.idempotencyKey) }
            : {}),
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(learnerFacingActivityError(data.error));
        return;
      }
      const details = (data.data.evaluation?.details ?? {}) as {
        perCriterion?: Array<{ id: string; pass: boolean; label: string }>;
        revisionGuidance?: string;
        mode?: string;
      };
      const perCriterion = Array.isArray(details.perCriterion)
        ? details.perCriterion.filter(
            (c) =>
              c &&
              typeof c.id === "string" &&
              typeof c.label === "string" &&
              typeof c.pass === "boolean",
          )
        : [];
      const failedLabels = perCriterion
        .filter((c) => !c.pass)
        .map((c) => c.label);
      const revisionGuidance =
        failedLabels.length > 0
          ? `Revise with attention to: ${failedLabels.join(", ")}. Your draft stays editable — change what you choose, then submit again.`
          : kind === "writing" || kind === "project" || kind === "presentation"
            ? "You can keep revising and resubmit. Feedback does not auto-edit your work."
            : null;
      setResult({
        outcome: data.data.completion.outcome,
        score: data.data.completion.score,
        rejectedForgeryKeys: data.data.rejectedForgeryKeys ?? [],
        perCriterion,
        revisionGuidance,
      });

      clearActivityLocalDraft(
        buildActivityDraftKey({
          kind,
          conceptId,
          challengeId,
          adaptiveRunId,
        }),
      );
      setDraftRestored(false);

      const adaptive = data.data.adaptive as
        | {
            kind?: string;
            runId?: string;
            plan?: { kind?: string };
            message?: string;
            reason?: string;
          }
        | undefined;
      if (
        inAdaptiveContext &&
        adaptive?.kind === "bound" &&
        adaptive.runId
      ) {
        const planKind = adaptive.plan?.kind;
        const notice =
          planKind &&
          (planKind.startsWith("STOP_") || planKind === "ALREADY_PROCESSED")
            ? planKind
            : undefined;
        setAdaptiveReturn({ runId: adaptive.runId, notice });
      } else if (inAdaptiveContext && adaptive?.kind === "error") {
        setError(
          adaptive.message ??
            "Adaptive study could not update from this activity. Your result was still saved.",
        );
      } else if (inAdaptiveContext && adaptiveRunId) {
        setAdaptiveReturn({ runId: adaptiveRunId });
      }
    } catch {
      setError("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }, [
    adaptiveRunId,
    adaptiveStep,
    challengeId,
    conceptId,
    inAdaptiveContext,
    kind,
    requiresRevision,
    revisionText,
    work,
  ]);

  const isWideWorkspace = WIDE_WORKSPACE_KINDS.has(kind);
  const layoutClass = [
    isWideWorkspace
      ? "mx-auto max-w-6xl space-y-6 px-4 py-8"
      : "mx-auto max-w-2xl space-y-6 px-4 py-8",
    hooks.accessibility.preferSimplifiedCopy ? "text-base leading-relaxed" : "",
    hooks.accessibility.preferLargerTargets
      ? "[&_button]:min-h-12 [&_textarea]:min-h-[12rem]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-stone-500"
        data-activity-state="LOADING"
        aria-busy="true"
      >
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading activity" />
      </div>
    );
  }

  const showWorkspace = !gapMessage;
  const scaffolds = experience?.scaffolds ?? [];

  return (
    <div
      className={layoutClass}
      data-activity-kind={kind}
      data-activity-state={activityState}
      data-coverage-status={coverageStatus ?? undefined}
      data-prefer-reduced-motion={hooks.accessibility.preferReducedMotion}
    >
      <p className="sr-only" aria-live="polite">
        {universalActivityStateLearnerLine(activityState)}
      </p>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {KIND_LABELS[kind] ?? kind}
        </p>
        {experience?.conceptTitle ? (
          <p className="text-sm text-stone-600" data-experience-concept>
            You&apos;re practicing:{" "}
            <span className="font-semibold text-stone-900">
              {experience.conceptTitle}
            </span>
          </p>
        ) : null}
        {materialCitation ? (
          <MaterialSourceCitation citation={materialCitation} compact />
        ) : null}
        <h1 className="text-2xl font-bold text-stone-900">
          {experience?.title ?? selected?.title ?? "Activity"}
        </h1>
        {(experience?.stageLabel || experience?.difficulty != null) &&
        !hooks.accessibility.preferSimplifiedCopy ? (
          <p className="text-xs text-stone-500">
            {[
              experience.stageLabel,
              experience.difficulty != null
                ? `Difficulty ${experience.difficulty}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </header>

      {draftRestored && showWorkspace ? (
        <p
          role="status"
          aria-live="polite"
          data-activity-draft-restored
          className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950"
        >
          Restored your local draft from this device. Drafts are not learning
          evidence — submit when ready for evaluation.
        </p>
      ) : null}

      {experience && !gapMessage ? (
        <section
          className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-4"
          data-learning-experience
          data-activity-inspector={isWideWorkspace ? "true" : undefined}
          data-activity-wide-layout={isWideWorkspace ? "true" : undefined}
          aria-label="Learning experience"
        >
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Goal
            </h2>
            <p className="mt-1 text-sm font-medium text-stone-900">
              {experience.objective}
            </p>
          </div>
          {!hooks.accessibility.preferSimplifiedCopy ? (
            <>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Why this activity
                </h2>
                <p
                  className="mt-1 whitespace-pre-line text-sm text-stone-700"
                  data-why-this-activity
                >
                  {whyThisActivity ?? experience.purpose}
                </p>
              </div>
              {experience.context ? (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Context
                  </h2>
                  <p className="mt-1 text-sm text-stone-700">
                    {experience.context}
                  </p>
                </div>
              ) : null}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Task
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  {experience.instructions}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  What to do
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  {experience.expectedAction}
                </p>
              </div>
              {experience.successLooksLike ? (
                <div data-success-looks-like>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    What success looks like
                  </h2>
                  <p className="mt-1 text-sm text-stone-700">
                    {experience.successLooksLike}
                  </p>
                </div>
              ) : null}
              {scaffolds.length > 0 ? (
                <ScaffoldPanel
                  key={experience.contentId ?? experience.contentKey ?? "scaffolds"}
                  scaffolds={scaffolds}
                />
              ) : null}
              <p className="text-xs text-stone-500">
                {experience.completionDescription}
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-700">{experience.instructions}</p>
          )}
        </section>
      ) : !experience && !gapMessage ? (
        <header className="space-y-1">
          {selected?.objective ? (
            <p className="text-sm font-medium text-stone-800">
              Goal: {selected.objective}
            </p>
          ) : null}
          <p className="text-sm text-stone-600">
            {selected?.prompt ??
              "Complete the task below, then submit for feedback."}
          </p>
        </header>
      ) : null}

      {gapMessage ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          data-coverage-gap
          role="status"
        >
          <p>{gapMessage}</p>
          {inAdaptiveContext && adaptiveRunId ? (
            <Link
              href={`/study/adaptive/${adaptiveRunId}`}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 touch-manipulation"
            >
              Return to adaptive study
            </Link>
          ) : (
            <Link
              href="/study"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 touch-manipulation"
            >
              Back to Study Hub
            </Link>
          )}
        </div>
      ) : null}

      {showWorkspace && !gapMessage ? (
        <>
          {challenges.length > 1 ? (
            <label className="block text-sm font-medium text-stone-700">
              Challenge
              <select
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
                value={challengeId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setChallengeId(nextId);
                  const next = challenges.find((c) => c.id === nextId);
                  setWork(next?.starterDraft ?? next?.starter ?? "");
                  setRevisionText("");
                }}
              >
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selected?.educationalMarket &&
          selected.marketState &&
          selected.marketChart ? (
            <EducationalMarketPanel
              key={selected.id}
              scenarioId={selected.id}
              state={selected.marketState}
              chart={selected.marketChart}
              prompt={selected.prompt}
              onArtifactChange={setWork}
            />
          ) : kind === "math" && selected ? (
            <MathWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                equation: selected.equation ?? selected.starter,
                expectedX: selected.expectedX,
                requireExplanation: selected.requireExplanation,
                scaffolds: selected.scaffolds,
              }}
              onArtifactChange={setWork}
            />
          ) : kind === "networking" && selected ? (
            <NetworkWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                symptom: selected.symptom,
                initialState: selected.initialState,
                requireHostnameResolve: selected.requireHostnameResolve,
                hostname: selected.hostname,
                scaffolds: selected.scaffolds,
              }}
              onArtifactChange={setWork}
            />
          ) : kind === "language" && selected ? (
            <LanguageWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                mode: selected.mode,
                languageCode: selected.languageCode,
                promptLanguageCode: selected.promptLanguageCode,
                exampleUtterance: selected.exampleUtterance,
                tutorPrompt: selected.tutorPrompt,
                listenOptions: selected.listenOptions,
                matchLabel: selected.matchLabel,
                scaffolds: selected.scaffolds,
              }}
              onArtifactChange={setWork}
            />
          ) : requiresRevision ? (
            <div className="space-y-4">
              {selected?.revisionIssues && selected.revisionIssues.length > 0 ? (
                <ul
                  className="list-disc space-y-1 pl-5 text-sm text-stone-700"
                  aria-label="Issues to revise"
                >
                  {selected.revisionIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : null}
              <label className="block text-sm font-medium text-stone-700">
                Draft
                <textarea
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm"
                  rows={hooks.accessibility.preferLargerTargets ? 8 : 6}
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  spellCheck
                  aria-label="Original draft"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Your revision
                <textarea
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm"
                  rows={hooks.accessibility.preferLargerTargets ? 12 : 8}
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  spellCheck
                  aria-label="Revised writing"
                  aria-describedby={
                    experience?.expectedAction ? "expected-action" : undefined
                  }
                />
              </label>
            </div>
          ) : kind === "coding" && selected ? (
            <CodingWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                language: selected.language,
                starter: selected.starter,
                objective: selected.objective,
                entryFunction: selected.entryFunction,
                tests: selected.tests
                  ? selected.tests.map((t) => ({
                      id: t.id,
                      args: [...t.args],
                      expected: t.expected,
                    }))
                  : undefined,
              }}
              value={work}
              onChange={setWork}
              onReset={() => setWork(selected.starter ?? "")}
            />
          ) : kind === "sql" && selected ? (
            <SqlWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                starter: selected.starter,
                objective: selected.objective,
                schemaPreview: selected.schemaPreview,
              }}
              value={work}
              onChange={setWork}
              onReset={() => setWork(selected.starter ?? "")}
            />
          ) : kind === "lab" && selected && !selected.educationalMarket ? (
            <LabWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                objective: selected.objective,
                starter: selected.starter,
              }}
              value={work}
              onChange={setWork}
              onReset={() => setWork(selected.starter ?? "")}
            />
          ) : kind === "project" && selected && !selected.educationalMarket ? (
            <ProjectWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                objective: selected.objective,
                starter: selected.starter,
              }}
              value={work}
              onChange={setWork}
              onReset={() => setWork(selected.starter ?? "")}
            />
          ) : kind === "presentation" &&
            selected &&
            !selected.educationalMarket ? (
            <PresentationWorkspacePanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                objective: selected.objective,
                starter: selected.starter,
              }}
              value={work}
              onChange={setWork}
              onReset={() => setWork(selected.starter ?? "")}
            />
          ) : kind === "game" && selected && !selected.educationalMarket ? (
            <GameMatchPanel
              key={selected.id}
              challenge={{
                id: selected.id,
                title: selected.title,
                prompt: selected.prompt,
                objective: selected.objective,
              }}
              pairs={
                selected.matchPairs
                  ? selected.matchPairs.map((p) => ({
                      term: p.term,
                      definition: p.definition,
                    }))
                  : undefined
              }
              onArtifactChange={setWork}
            />
          ) : (
            <label className="block text-sm font-medium text-stone-700">
              Your work
              <textarea
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm"
                rows={hooks.accessibility.preferLargerTargets ? 14 : 10}
                value={work}
                onChange={(e) => setWork(e.target.value)}
                spellCheck={kind === "writing" || kind === "presentation"}
                aria-describedby={
                  experience?.expectedAction ? "expected-action" : undefined
                }
              />
            </label>
          )}
          {experience?.expectedAction ? (
            <p id="expected-action" className="sr-only">
              {experience.expectedAction}
            </p>
          ) : null}

          <button
            type="button"
            disabled={
              submitting ||
              !challengeId ||
              !conceptId ||
              (requiresRevision ? !revisionText.trim() : !work.trim())
            }
            onClick={() => void submit()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 touch-manipulation"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating…
              </>
            ) : (
              "Submit for evaluation"
            )}
          </button>
        </>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {result ? (
        <div
          data-activity-result
          className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"
        >
          <p className="font-semibold text-stone-900">
            Result: {result.outcome}
            {result.score != null
              ? ` (${Math.round(result.score * 100)}% criteria met)`
              : ""}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Evaluation is server-authoritative. Your submission is your work —
            not a self-declared score. Saving a draft or pasting AI suggestions
            into a help field is not mastery evidence.
          </p>
          {result.perCriterion.length > 0 ? (
            <ul
              data-activity-rubric-feedback
              className="mt-3 space-y-1 text-sm"
            >
              {result.perCriterion.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span aria-hidden>{c.pass ? "✓" : "○"}</span>
                  <span>
                    <span className="font-medium text-stone-800">{c.label}</span>
                    {c.pass ? " — met" : " — needs revision"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {result.revisionGuidance ? (
            <p
              data-activity-revision-guidance
              className="mt-3 text-sm text-stone-600"
            >
              {result.revisionGuidance}
            </p>
          ) : null}
          {adaptiveReturn ? (
            <AdaptiveReturnStrip
              runId={adaptiveReturn.runId}
              notice={adaptiveReturn.notice ?? null}
              outcomeLabel={result.outcome}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
