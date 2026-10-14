"use client";

import Link from "next/link";

import { ContinueLearningButton } from "@/components/study/ContinueLearningButton";
import { LearnerContextStrip } from "@/components/study/LearnerContextStrip";
import { OrchestratorSuggestionCard } from "@/components/study/OrchestratorSuggestionCard";
import { resolveGrowthAdaptivePrimaryCta } from "@/lib/learning/learner-model/growth-action-continuity";
import type { GrowthCenterView } from "@/lib/learning/learner-model/present-growth-center";
import type { LearnerGrowthContinuityView } from "@/lib/learning/learner-growth";
import type {
  LearnerModelVisibilityItem,
} from "@/lib/learning/mastery/present-learner-model";
import {
  TOPIC_PROGRESS_LEARNER_COPY,
  ULE_MASTERY_LEARNER_COPY,
} from "@/lib/learning/mastery/mastery-truth";
import type { ConceptProgressView } from "@/lib/learning/mastery/present-concept-progress";
import type { LearnerContextPresentation } from "@/lib/learning/universal-learner-context";

function FacetList({ progress }: { progress: ConceptProgressView }) {
  if (progress.status === "unavailable") return null;
  const dims = progress.dimensions.filter(
    (d) => d.status !== "not_yet_evidenced",
  );
  if (dims.length === 0 && progress.status === "insufficient_evidence") {
    return (
      <p className="mt-1 text-xs text-stone-500">
        Not enough evidence yet to show recognition, explanation, application,
        problem solving, performance, or retention.
      </p>
    );
  }
  if (dims.length === 0) return null;
  return (
    <ul
      data-growth-center-facets
      data-learner-model-facets
      className="mt-2 space-y-0.5 border-t border-stone-100 pt-2"
    >
      {dims.slice(0, 6).map((d) => (
        <li key={d.facet} className="text-xs text-stone-500">
          <span className="font-medium text-stone-600">{d.label}</span>
          {" — "}
          {d.learnerLine}
        </li>
      ))}
    </ul>
  );
}

function ConceptRow({
  item,
  showContinue,
  activeRunId,
}: {
  item: LearnerModelVisibilityItem;
  showContinue?: boolean;
  activeRunId?: string | null;
}) {
  const cta = resolveGrowthAdaptivePrimaryCta({
    conceptId: item.conceptId,
    activeRunId,
  });
  return (
    <li
      data-growth-center-concept={item.conceptId}
      data-learner-model-concept={item.conceptId}
      className="rounded-xl border border-stone-100 bg-stone-50/60 p-3 text-sm text-stone-700"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <span className="font-medium text-stone-900">
            {item.conceptTitle ?? "Concept"}
          </span>
          {item.progress.status === "available" ||
          item.progress.status === "insufficient_evidence" ? (
            <p className="mt-0.5 text-xs text-stone-500">
              {item.progress.supportingLine}
            </p>
          ) : null}
          <FacetList progress={item.progress} />
        </div>
        {showContinue && cta.kind !== "none" ? (
          <ContinueLearningButton
            conceptId={item.conceptId}
            activeRunId={activeRunId}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 touch-manipulation"
          />
        ) : null}
      </div>
    </li>
  );
}

function Section({
  title,
  description,
  items,
  empty,
  continueOnItems,
  sectionId,
  activeRunByConceptId,
}: {
  title: string;
  description?: string;
  items: LearnerModelVisibilityItem[];
  empty: string;
  continueOnItems?: boolean;
  sectionId: string;
  activeRunByConceptId?: Record<string, string>;
}) {
  return (
    <section
      data-growth-center-section={sectionId}
      data-learner-model-section={title}
      aria-labelledby={`growth-section-${sectionId}`}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2
        id={`growth-section-${sectionId}`}
        className="text-lg font-bold text-stone-900"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-xs text-stone-500">{description}</p>
      ) : null}
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <ConceptRow
              key={item.conceptId}
              item={item}
              showContinue={continueOnItems}
              activeRunId={activeRunByConceptId?.[item.conceptId] ?? null}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * 2P-21 — Learner Growth Center panel.
 * Presentation only over ConceptMastery + LearningAttempt + Orchestrator card.
 * Does not diagnose, score, or launch a second Adaptive engine.
 */
export function LearnerGrowthCenterPanel({
  growth,
  activeRunByConceptId = {},
  continuity = null,
  truncated = false,
  evidenceUnavailable = false,
  learnerContextPresentation = null,
}: {
  growth: GrowthCenterView;
  /** ACTIVE AdaptiveSequenceRun ids by concept — never COMPLETED/ABANDONED. */
  activeRunByConceptId?: Record<string, string>;
  /** 2P-43 — optional longitudinal continuity (same resolve as Study Hub). */
  continuity?: LearnerGrowthContinuityView | null;
  truncated?: boolean;
  /** Section-level degradation when LearningAttempt read fails. */
  evidenceUnavailable?: boolean;
  /** 2P-29 — optional human-facing strip from Universal Learner Context. */
  learnerContextPresentation?: LearnerContextPresentation | null;
}) {
  const { visibility, snapshot, recentEvidence, progressNotes, coldStart, focusConceptId } =
    growth;
  const focusActiveRunId = focusConceptId
    ? (activeRunByConceptId[focusConceptId] ?? null)
    : null;
  const focusCta = resolveGrowthAdaptivePrimaryCta({
    conceptId: focusConceptId,
    activeRunId: focusActiveRunId,
  });
  const temporal = continuity?.temporal ?? null;
  const nextAction = continuity?.nextAction ?? null;

  return (
    <div
      data-growth-center-surface
      data-learner-model-surface
      data-mastery-source={growth.source}
      data-growth-snapshot={snapshot.kind}
      data-learner-model-cold-start={coldStart ? "true" : "false"}
      className="mx-auto max-w-2xl space-y-6 px-4 py-8"
    >
      {learnerContextPresentation ? (
        <LearnerContextStrip presentation={learnerContextPresentation} />
      ) : null}
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Learner Growth Center
        </p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">
          Your learning at a glance
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          A clear window into your{" "}
          <span className="font-medium text-stone-800">
            {ULE_MASTERY_LEARNER_COPY.shortLabel.toLowerCase()}
          </span>{" "}
          and recent practice evidence — not{" "}
          <span className="font-medium text-stone-800">
            {TOPIC_PROGRESS_LEARNER_COPY.shortLabel.toLowerCase()}
          </span>{" "}
          percentages or a second progress system.
        </p>
      </header>

      {/* A. Learning Snapshot */}
      <section
        data-growth-center-snapshot
        aria-labelledby="growth-snapshot-heading"
        className="rounded-2xl border border-stone-200 bg-gradient-to-br from-teal-50/80 to-stone-50 p-5"
      >
        <h2
          id="growth-snapshot-heading"
          className="text-lg font-bold text-stone-900"
        >
          Learning snapshot
        </h2>
        <p className="mt-2 text-base font-semibold text-stone-800">
          {snapshot.headline}
        </p>
        <p className="mt-1 text-sm text-stone-600">{snapshot.supportingLine}</p>
        <ul className="mt-3 space-y-1" aria-label="Progress notes">
          {progressNotes.map((note) => (
            <li key={note} className="text-xs text-stone-500">
              {note}
            </li>
          ))}
        </ul>
      </section>

      {/* 2P-43 — Temporal truth + next action (same continuity as Study Hub) */}
      {temporal ? (
        <section
          data-growth-continuity-temporal
          aria-labelledby="growth-continuity-heading"
          className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5"
        >
          <h2
            id="growth-continuity-heading"
            className="text-lg font-bold text-stone-900"
          >
            Over time
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Recent evidence is not the same as older demonstrated progress.
            Study Haul does not claim anything is mastered forever.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {temporal.recentlyDemonstrated[0] ? (
              <li data-continuity-card="recently-demonstrated">
                <span className="font-medium text-stone-900">
                  Recently demonstrated —{" "}
                </span>
                {temporal.recentlyDemonstrated[0].conceptTitle ?? "a concept"}
              </li>
            ) : null}
            {temporal.historicallyDemonstrated[0] ? (
              <li data-continuity-card="historically-demonstrated">
                <span className="font-medium text-stone-900">
                  Previously demonstrated —{" "}
                </span>
                {temporal.historicallyDemonstrated[0].conceptTitle ?? "a concept"}
              </li>
            ) : null}
            {temporal.currentlyWeak[0] ? (
              <li data-continuity-card="needs-work">
                <span className="font-medium text-stone-900">
                  Needs more practice —{" "}
                </span>
                {temporal.currentlyWeak[0].conceptTitle ?? "a concept"}
              </li>
            ) : null}
            {temporal.needsMoreEvidence[0] ? (
              <li data-continuity-card="needs-more-evidence">
                <span className="font-medium text-stone-900">
                  Needs more evidence —{" "}
                </span>
                {temporal.needsMoreEvidence[0].conceptTitle ?? "a concept"}
              </li>
            ) : null}
            {!temporal.recentlyDemonstrated[0] &&
            !temporal.historicallyDemonstrated[0] &&
            !temporal.currentlyWeak[0] &&
            !temporal.needsMoreEvidence[0] ? (
              <li className="text-stone-500">
                Not enough longitudinal signal yet — keep practicing.
              </li>
            ) : null}
          </ul>
          {nextAction && nextAction.kind !== "NONE" ? (
            <div
              data-continuity-card="next-action"
              className="mt-4 rounded-xl border border-teal-100 bg-white/80 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                {continuity?.primaryResumeRunId
                  ? "Continue where you left off"
                  : "Next action"}
              </p>
              <p className="mt-1 text-sm font-medium text-stone-900">
                {nextAction.label}
              </p>
              {nextAction.reason ? (
                <p data-continuity-why className="mt-1 text-xs text-stone-500">
                  Why: {nextAction.reason}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Why + Next step — Orchestrator authority */}
      <section
        data-growth-center-orchestrator
        data-learner-model-orchestrator
        aria-labelledby="growth-recommend-heading"
      >
        <h2
          id="growth-recommend-heading"
          className="mb-2 text-sm font-bold text-stone-800"
        >
          Why Study Haul recommends this
        </h2>
        <p className="mb-3 text-xs text-stone-500">
          Recommendations come from Study Haul using what you have already
          practiced. This page does not invent a second recommendation.
        </p>
        <OrchestratorSuggestionCard />
      </section>

      {coldStart ? (
        <section
          data-growth-center-empty
          data-learner-model-empty
          className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-5"
        >
          <h2 className="text-lg font-bold text-stone-900">
            No concept mastery evidence yet
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Your learning profile is just getting started. Complete a learning
            activity and Study Haul will begin building your learning model. This
            is not a score of 0% — there simply is not enough concept evidence yet.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/study"
              data-growth-center-nav="study-hub"
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 touch-manipulation"
            >
              Open Study Hub
            </Link>
            <Link
              href="/core"
              data-growth-center-nav="core"
              className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
            >
              Core notebook
            </Link>
            <Link
              href="/study/lucky"
              data-growth-center-nav="lucky"
              className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
            >
              Lucky retention
            </Link>
          </div>
        </section>
      ) : null}

      {!coldStart && focusConceptId && focusCta.kind !== "none" ? (
        <section
          data-growth-center-primary-cta
          data-learner-model-primary-cta
          className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Next step
          </p>
          <p className="mt-1 text-sm text-stone-700">
            {focusCta.kind === "resume"
              ? "You have an active Adaptive study session for a concept that needs attention. Continue where you left off — Study Haul uses the same Adaptive path as Study Hub."
              : "Start Adaptive study for a concept that needs attention. Study Haul uses the same Adaptive path as Study Hub."}
          </p>
          <div className="mt-3">
            <ContinueLearningButton
              conceptId={focusConceptId}
              activeRunId={focusActiveRunId}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 touch-manipulation"
            />
          </div>
        </section>
      ) : null}

      <Section
        sectionId="know"
        title="What I know"
        description="Concepts with demonstrated progress from your practice evidence. Viewing these does not start a new activity."
        empty="No strong demonstrated evidence yet — keep practicing."
        items={visibility.strengths}
        activeRunByConceptId={activeRunByConceptId}
      />
      <Section
        sectionId="developing"
        title="What I'm developing"
        description="Meaningful evidence exists — still building, not a failure. Start or Continue learning uses Adaptive when available."
        empty="Nothing currently marked as developing."
        items={visibility.developing}
        continueOnItems
        activeRunByConceptId={activeRunByConceptId}
      />
      <Section
        sectionId="practice"
        title="What needs practice"
        description="Your learning progress signals that more practice would help. Start or Continue learning enters Adaptive (same path as Study Hub)."
        empty="No practice gaps flagged from concept evidence."
        items={visibility.needsMorePractice}
        continueOnItems
        activeRunByConceptId={activeRunByConceptId}
      />
      <Section
        sectionId="insufficient"
        title="Not enough evidence yet"
        description="Missing evidence is not the same as failure. Suggestions above come from Study Haul when available."
        empty="All listed concepts have some evidence."
        items={visibility.insufficientEvidence.map((s) => ({
          ...s,
          progress:
            s.progress.status === "unavailable"
              ? s.progress
              : {
                  ...s.progress,
                  supportingLine:
                    "We do not know enough yet — not a score of zero.",
                },
        }))}
        activeRunByConceptId={activeRunByConceptId}
      />

      {/* Recently practiced — mastery recency + LearningAttempt timeline */}
      <section
        data-growth-center-section="recent"
        aria-labelledby="growth-section-recent"
        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2
          id="growth-section-recent"
          className="text-lg font-bold text-stone-900"
        >
          Recently practiced
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Based on real learning attempts and recent concept mastery updates —
          not page opens or button clicks.
        </p>

        {evidenceUnavailable ? (
          <p
            role="status"
            className="mt-3 text-sm text-stone-500"
            data-growth-center-evidence-unavailable
          >
            Recent attempt details are temporarily unavailable. Your concept
            mastery sections above are still accurate.
          </p>
        ) : recentEvidence.length > 0 ? (
          <ol className="mt-3 space-y-2" aria-label="Recent learning evidence">
            {recentEvidence.map((item, index) => (
              <li
                key={`${item.conceptId ?? "none"}-${item.whenLabel}-${index}`}
                data-growth-center-evidence-item
                className="rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2 text-sm text-stone-700"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-stone-900">
                    {item.conceptTitle ?? "Learning activity"}
                  </span>
                  <span className="text-xs text-stone-500">{item.whenLabel}</span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {item.actionLabel}
                  {" — "}
                  <span className="font-medium text-stone-600">
                    {item.outcomeLabel}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            No recent learning attempts yet. Complete a quiz, study activity, or
            Adaptive step to see evidence here.
          </p>
        )}

        {visibility.recentDemonstrated.length > 0 ? (
          <div className="mt-4 border-t border-stone-100 pt-3">
            <p className="text-xs font-semibold text-stone-600">
              Demonstrated updates this week
            </p>
            <ul className="mt-2 space-y-1">
              {visibility.recentDemonstrated.map((r) => (
                <li key={r.conceptId} className="text-xs text-stone-500">
                  {r.conceptTitle ?? "Concept"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {truncated ? (
        <p
          data-growth-center-truncated
          data-learner-model-truncated
          className="text-center text-xs text-stone-500"
        >
          Showing your most recently updated concepts (up to 40).
        </p>
      ) : null}

      <nav
        data-growth-center-footer-nav
        data-learner-model-footer-nav
        aria-label="Other ways to learn"
        className="flex flex-wrap gap-2 border-t border-stone-200 pt-4"
      >
        <Link
          href="/study"
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Study Hub
        </Link>
        <Link
          href="/core"
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Core
        </Link>
        <Link
          href="/study#study-now"
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Study Now
        </Link>
        <Link
          href="/study/lucky"
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Lucky
        </Link>
        <Link
          href="/quizzes"
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Quizzes
        </Link>
        <Link
          href="/flashcards"
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Flashcards
        </Link>
      </nav>
    </div>
  );
}
