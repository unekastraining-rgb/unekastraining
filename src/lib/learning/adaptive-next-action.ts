/**
 * Bundle O — Adaptive next-action presentation (recommendation-only).
 * Uses existing Six intelligence + capability hrefs. Does not write mastery.
 */

import type { SixComponent } from "@/lib/csl/six";
import {
  recommendSixTechnique,
  type KnowledgeSixRecommendation,
} from "@/lib/learning/orchestrator/knowledge-loop/six-intelligence";
import type { KnowledgeOrchestratorDecision } from "@/lib/learning/orchestrator/knowledge-loop/types";
import {
  buildCapabilityHref,
  getStudyCapability,
} from "@/lib/study/capability-registry";
import {
  luckyQuizHref,
  sixChunkingHref,
  sixFeynmanHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";

export type AdaptiveOutcome =
  | "correct"
  | "incorrect"
  | "partial"
  | "completed"
  | "attempted";

export type AdaptiveNextAction = {
  nextSteps: string[];
  links: Array<{ href: string; label: string }>;
  six?: KnowledgeSixRecommendation | null;
  /** Never a mastery claim — presentation only. */
  disclaimer: string;
};

function sixHref(
  technique: SixComponent,
  courseId: string,
  topic: string,
  materialId?: string | null,
): string {
  if (technique === "feynman") {
    return sixFeynmanHref(courseId, topic, materialId);
  }
  if (technique === "chunking") {
    return sixChunkingHref(courseId, topic, materialId);
  }
  const params = new URLSearchParams({
    courseId,
    topic: topic.trim() || "notes",
  });
  if (materialId?.trim()) params.set("materialId", materialId.trim());
  return `/study/six/${technique}?${params.toString()}`;
}

function decisionForOutcome(
  outcome: AdaptiveOutcome,
  conceptId?: string | null,
): KnowledgeOrchestratorDecision {
  const focus = conceptId ?? null;
  const traceBase = {
    target: focus ?? "unknown",
    focusConceptId: focus,
    exposureCount: 1,
    attemptCount: 1,
    correctCount: 0,
    incorrectCount: 0,
    hasPracticeEvidence: false,
    hasCheckEvidence: false,
    hasRecallEvidence: false,
  };
  if (outcome === "incorrect" || outcome === "partial") {
    return {
      action: "reteach",
      reasonCode: "recent-incorrect",
      conceptId: focus,
      reason: "Recent struggle on this concept.",
      confidence: "medium",
      trace: {
        ...traceBase,
        attemptCount: 2,
        incorrectCount: 2,
        lastOutcome: "incorrect",
      },
    };
  }
  if (outcome === "correct" || outcome === "completed") {
    return {
      action: "practice",
      reasonCode: "needs-practice",
      conceptId: focus,
      reason: "Recognition looks solid — try application.",
      confidence: "medium",
      trace: {
        ...traceBase,
        correctCount: 1,
        lastOutcome: "correct",
        hasCheckEvidence: true,
      },
    };
  }
  return {
    action: "teach",
    reasonCode: "new-concept",
    conceptId: focus,
    reason: "Continue building understanding.",
    confidence: "low",
    trace: traceBase,
  };
}

/**
 * Present meaningful next steps after an evaluation/activity outcome.
 * Recommendation-only — never mutates Learner Model / mastery.
 */
export function presentAdaptiveNextAction(input: {
  outcome: AdaptiveOutcome;
  score?: number | null;
  conceptId?: string | null;
  conceptTitle?: string | null;
  courseId?: string | null;
  materialId?: string | null;
  demonstratedRecognition?: boolean;
}): AdaptiveNextAction {
  const topic = input.conceptTitle?.trim() || "this topic";
  const decision = decisionForOutcome(input.outcome, input.conceptId);
  const six = recommendSixTechnique({
    decision,
    summary:
      input.outcome === "incorrect" || input.outcome === "partial"
        ? {
            conceptId: input.conceptId ?? "unknown",
            exposureCount: 1,
            attemptCount: 2,
            correctCount: 0,
            incorrectCount: 2,
            lastOutcome: "incorrect",
            hasPracticeEvidence: false,
            hasCheckEvidence: false,
            hasRecallEvidence: false,
          }
        : input.demonstratedRecognition
          ? {
              conceptId: input.conceptId ?? "unknown",
              exposureCount: 2,
              attemptCount: 2,
              correctCount: 2,
              incorrectCount: 0,
              lastOutcome: "correct",
              hasPracticeEvidence: false,
              hasCheckEvidence: true,
              hasRecallEvidence: false,
            }
          : null,
    topic,
  });

  const links: AdaptiveNextAction["links"] = [];
  const nextSteps: string[] = [];

  if (input.outcome === "incorrect" || input.outcome === "partial") {
    nextSteps.push(six.reason);
    if (input.courseId) {
      links.push({
        href: sixHref(six.technique, input.courseId, topic, input.materialId),
        label: `Try ${six.technique.replace(/-/g, " ")}`,
      });
      links.push({
        href: luckyQuizHref(input.courseId, input.materialId, topic),
        label: "Review with Lucky",
      });
    }
    const practice = getStudyCapability("practice");
    if (practice) {
      links.push({
        href: buildCapabilityHref(practice, {
          courseId: input.courseId,
          topic,
          conceptId: input.conceptId,
          materialId: input.materialId,
        }),
        label: "Open Practice Hub",
      });
    }
  } else if (input.outcome === "correct" || input.outcome === "completed") {
    nextSteps.push(
      input.demonstratedRecognition
        ? "You recognized this — try applying it in practice."
        : "Solid check — continue to the next curriculum step when ready.",
    );
    nextSteps.push(six.reason);
    const practice = getStudyCapability("practice");
    if (practice) {
      links.push({
        href: buildCapabilityHref(practice, {
          courseId: input.courseId,
          topic,
          conceptId: input.conceptId,
          materialId: input.materialId,
        }),
        label: "Apply in Practice",
      });
    }
    if (input.courseId) {
      links.push({
        href: teachMeHref(input.courseId, input.materialId, topic),
        label: "Continue in Learning Studio",
      });
    }
  } else {
    nextSteps.push("Keep going — submit when you have a response to check.");
    links.push({
      href: teachMeHref(input.courseId, input.materialId, topic),
      label: "Return to Learning Studio",
    });
  }

  return {
    nextSteps,
    links,
    six,
    disclaimer:
      "Suggestions only — path position and completion are not mastery.",
  };
}
