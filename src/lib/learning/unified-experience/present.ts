/**
 * Bundle E — Build LearningExperienceContext from existing intelligence outputs.
 * Pure presentation projection — never diagnoses, never writes evidence.
 */

import type { KnowledgeOrchestrationApiView } from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { TeachScope } from "@/lib/learning/teach/scope";
import type { TeachingProgressionView } from "@/lib/learning/teach/depth";
import {
  activityDoingLabel,
  continueLabelForAction,
  sixHowMessageForLearner,
} from "@/lib/learning/unified-experience/copy";
import type { LearningExperienceContext } from "@/lib/learning/unified-experience/types";

/** Thin orchestration payload safe for Learn UI (no decision-engine fields required). */
export type UiOrchestrationView = {
  action?: string;
  conceptId?: string | null;
  nextConceptId?: string | null;
  learnerLabel?: string;
  learnerHint?: string;
  destination?: {
    href?: string | null;
    room?: string | null;
  } | null;
  sixRecommendation?: {
    technique?: string;
    reason?: string;
  } | null;
};

export type BuildLearningExperienceInput = {
  topic: string;
  rawRequest?: string;
  activity?: string;
  scope?: TeachScope | string;
  resolution?: string;
  teachingProgression?: {
    pathTitle?: string;
    scope?: string;
    currentIndex?: number;
    total?: number;
    currentConceptId?: string | null;
    currentConceptTitle?: string | null;
    nextConceptId?: string | null;
    nextConceptTitle?: string | null;
  } | TeachingProgressionView | null;
  /** Full API view or thin UI view — both accepted. */
  orchestration?: KnowledgeOrchestrationApiView | UiOrchestrationView | null;
};

/**
 * Project existing Orchestrator / Six / path metadata into a UI context.
 */
export function buildLearningExperienceContext(
  input: BuildLearningExperienceInput,
): LearningExperienceContext {
  const orch = input.orchestration ?? null;
  const prog = input.teachingProgression ?? null;
  const total = prog?.total ?? 0;
  const currentIndex = prog?.currentIndex ?? 0;
  const currentTitle =
    prog && "currentConceptTitle" in prog
      ? prog.currentConceptTitle
      : null;
  const currentId =
    prog && "currentConceptId" in prog
      ? prog.currentConceptId
      : orch && "conceptId" in orch
        ? orch.conceptId ?? null
        : null;

  const sixRaw = orch?.sixRecommendation ?? null;
  const six =
    sixRaw && sixRaw.technique
      ? {
          technique: sixRaw.technique,
          reasonCode: "ui" as const,
          reason: ("reason" in sixRaw && sixRaw.reason) || "",
          confidence: "medium" as const,
        }
      : null;
  const href = orch?.destination?.href ?? null;
  const action = orch?.action ?? "teach";

  const nextAction =
    orch && orch.learnerLabel
      ? {
          action,
          label: orch.learnerLabel,
          hint: orch.learnerHint,
          href,
          room: orch.destination?.room ?? null,
        }
      : orch
        ? {
            action,
            label: continueLabelForAction(action),
            hint: orch.learnerHint,
            href,
            room: orch.destination?.room ?? null,
          }
        : null;

  return {
    target: {
      rawRequest: input.rawRequest,
      topic: input.topic,
      activity: input.activity,
      scope: input.scope ?? prog?.scope,
      resolution: input.resolution,
    },
    currentConcept:
      currentId || currentTitle
        ? {
            conceptId: currentId ?? "unknown",
            title: currentTitle ?? input.topic,
            position: total > 0 ? currentIndex + 1 : undefined,
            total: total > 0 ? total : undefined,
          }
        : undefined,
    path:
      total > 1
        ? {
            title:
              (prog && "pathTitle" in prog && prog.pathTitle) ||
              input.topic,
            currentIndex,
            total,
            kind: "path-position",
          }
        : undefined,
    orchestratorDecision: orch
      ? {
          action: (orch.action ??
            "teach") as KnowledgeOrchestrationApiView["action"],
          conceptId: currentId,
          nextConceptId:
            orch && "nextConceptId" in orch ? orch.nextConceptId : undefined,
          learnerLabel: orch.learnerLabel,
          learnerHint: orch.learnerHint,
        }
      : null,
    sixRecommendation: six,
    sixHowMessage: sixHowMessageForLearner(six),
    nextAction,
    destinationHref: href,
    isComplete: orch?.action === "complete",
    pathIsNotMastery: true,
  };
}

/** Compact status lines for Learn UI (what / where / doing / next). */
export function learningExperienceStatusLines(
  ctx: LearningExperienceContext,
): {
  what: string;
  where: string | null;
  doing: string;
  next: string | null;
  how: string | null;
} {
  const what = ctx.currentConcept?.title ?? ctx.target.topic;
  const where =
    ctx.path && ctx.path.total > 1
      ? `${ctx.path.currentIndex + 1} of ${ctx.path.total} · path position`
      : null;
  const doing = activityDoingLabel(
    ctx.orchestratorDecision?.action ?? null,
  );
  const next = ctx.isComplete
    ? "You've covered this learning path for now."
    : ctx.nextAction?.label ?? null;
  return {
    what,
    where,
    doing,
    next,
    how: ctx.sixHowMessage ?? null,
  };
}
