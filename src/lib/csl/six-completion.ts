/**
 * Phase 2G-12 — SIX guided-session completion boundary (shared UI + adaptive bind).
 *
 * Activity complete (existing SixGuidedSession signal):
 *   every practice stage has an evaluation score >= SIX_STAGE_PASS_SCORE
 *
 * Adaptive bind (this module) uses the same pass threshold and treats the
 * activity as eligible to complete the Adaptive Sequence step only when the
 * learner is on the final guided stage and that stage itself passes.
 *
 * Full cross-stage allDone without a parent session model would require
 * correlating intermediate Attempts across requests; the final-stage gate is
 * the trusted, session-free boundary that matches sequential guide UX.
 */
import { SIX_GUIDES, isSixGuideComponent } from "@/lib/csl/six-guides";
import type { SixComponent } from "@/lib/csl/six";

/** Matches SixGuidedSession: score >= 65 marks a stage complete. */
export const SIX_STAGE_PASS_SCORE = 65;

/** Lesson practicePrompts are capped at 4; static guides use 3. */
export const SIX_GUIDED_STAGE_COUNT_MIN = 2;
export const SIX_GUIDED_STAGE_COUNT_MAX = 4;

export function isSixStagePassing(score: number): boolean {
  return Number.isFinite(score) && score >= SIX_STAGE_PASS_SCORE;
}

/**
 * Trusted stage count: client may declare the live practiceSteps.length
 * (2–4 when a worked lesson is loaded); otherwise fall back to the static
 * guide definition (always 3 for every technique today).
 */
export function resolveTrustedSixGuidedStageCount(input: {
  component: unknown;
  clientStageCount?: unknown;
}): number | null {
  if (
    typeof input.component !== "string" ||
    !isSixGuideComponent(input.component)
  ) {
    return null;
  }

  const guideCount = SIX_GUIDES[input.component as SixComponent].steps.length;
  const raw = input.clientStageCount;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.floor(raw);
    if (n >= SIX_GUIDED_STAGE_COUNT_MIN && n <= SIX_GUIDED_STAGE_COUNT_MAX) {
      return n;
    }
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (
      Number.isFinite(n) &&
      Math.floor(n) >= SIX_GUIDED_STAGE_COUNT_MIN &&
      Math.floor(n) <= SIX_GUIDED_STAGE_COUNT_MAX
    ) {
      return Math.floor(n);
    }
  }

  return guideCount > 0 ? guideCount : null;
}

/**
 * Adaptive Sequence may consume this evaluate only when the current evaluate
 * is on the final guided stage and that stage passes the existing UI threshold.
 * Intermediate evaluates (and failing final stages) keep the Adaptive step ACTIVE.
 */
export function isSixAdaptiveCompletionEligible(input: {
  component: unknown;
  stepIndex: unknown;
  evaluationScore: unknown;
  clientStageCount?: unknown;
}): {
  eligible: boolean;
  reason: string;
  stageCount: number | null;
  stepIndex: number | null;
} {
  const stageCount = resolveTrustedSixGuidedStageCount({
    component: input.component,
    clientStageCount: input.clientStageCount,
  });
  if (stageCount == null) {
    return {
      eligible: false,
      reason: "unknown_six_component_or_stage_count",
      stageCount: null,
      stepIndex: null,
    };
  }

  let stepIndex: number | null = null;
  if (typeof input.stepIndex === "number" && Number.isFinite(input.stepIndex)) {
    stepIndex = Math.floor(input.stepIndex);
  } else if (
    typeof input.stepIndex === "string" &&
    input.stepIndex.trim() !== ""
  ) {
    const n = Number(input.stepIndex);
    if (Number.isFinite(n)) stepIndex = Math.floor(n);
  }

  if (stepIndex == null || stepIndex < 0) {
    return {
      eligible: false,
      reason: "invalid_step_index",
      stageCount,
      stepIndex: null,
    };
  }

  if (stepIndex < stageCount - 1) {
    return {
      eligible: false,
      reason: "six_activity_incomplete",
      stageCount,
      stepIndex,
    };
  }

  if (stepIndex > stageCount - 1) {
    return {
      eligible: false,
      reason: "step_index_out_of_range",
      stageCount,
      stepIndex,
    };
  }

  const score =
    typeof input.evaluationScore === "number" &&
    Number.isFinite(input.evaluationScore)
      ? input.evaluationScore
      : typeof input.evaluationScore === "string" &&
          input.evaluationScore.trim() !== ""
        ? Number(input.evaluationScore)
        : NaN;

  if (!isSixStagePassing(score)) {
    return {
      eligible: false,
      reason: "final_stage_not_passing",
      stageCount,
      stepIndex,
    };
  }

  return {
    eligible: true,
    reason: "six_activity_complete",
    stageCount,
    stepIndex,
  };
}

/** Characterization helpers — actual guide stage titles from SIX_GUIDES. */
export function sixGuideCompletionCharacterization(): Array<{
  technique: SixComponent;
  guideStageCount: number;
  stageTitles: string[];
  stagePassScore: number;
  activityCompleteWhen: string;
  adaptiveBindWhen: string;
}> {
  return (Object.keys(SIX_GUIDES) as SixComponent[]).map((technique) => {
    const guide = SIX_GUIDES[technique];
    return {
      technique,
      guideStageCount: guide.steps.length,
      stageTitles: guide.steps.map((s) => s.title),
      stagePassScore: SIX_STAGE_PASS_SCORE,
      activityCompleteWhen: `all ${guide.steps.length} stages have score >= ${SIX_STAGE_PASS_SCORE} (SixGuidedSession allDone)`,
      adaptiveBindWhen: `stepIndex === ${guide.steps.length - 1} AND score >= ${SIX_STAGE_PASS_SCORE} (final guided stage passes)`,
    };
  });
}
