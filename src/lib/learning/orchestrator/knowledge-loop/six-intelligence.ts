/**
 * Phase 12 — Six Intelligence (deterministic technique recommendation).
 *
 * Separate from Knowledge Loop Orchestrator:
 * - Orchestrator decides WHAT action (teach/practice/reteach/recall/…)
 * - Six Intelligence recommends HOW to instruct (chunking/feynman/…)
 *
 * Does not replace recommendSixForMastery (TopicMastery hub panel).
 * Does not override learner choice. Falls back safely when unavailable.
 */

import type { SixComponent } from "@/lib/csl/six";
import type {
  KnowledgeLearningAction,
  KnowledgeOrchestratorDecision,
} from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { ConceptEvidenceSummary } from "@/lib/learning/orchestrator/knowledge-loop/decide";

export type KnowledgeSixRecommendation = {
  technique: SixComponent;
  reasonCode: string;
  reason: string;
  confidence: "low" | "medium" | "high";
  conceptId?: string | null;
  /** Orchestrator action this recommendation accompanies. */
  orchestratorAction?: KnowledgeLearningAction;
};

const VISUAL_HINT =
  /\b(diagram|graph|geometry|circuit|uml|tree|map|spatial|shape|angle|triangle|visualize|visualization)\b/i;

/**
 * Deterministic Six technique recommendation from orchestrator + evidence.
 */
export function recommendSixTechnique(input: {
  decision: KnowledgeOrchestratorDecision;
  summary?: ConceptEvidenceSummary | null;
  topic?: string | null;
}): KnowledgeSixRecommendation {
  const { decision, summary, topic } = input;
  const conceptId = decision.conceptId;

  try {
    // New / teach → chunking then detailed explanation preference.
    if (decision.action === "teach" || decision.reasonCode === "new-concept") {
      return {
        technique: "chunking",
        reasonCode: "new-concept-chunking",
        reason: "New concept — start by breaking it into clear chunks.",
        confidence: "high",
        conceptId,
        orchestratorAction: decision.action,
      };
    }

    // Recent incorrect → reteach with explanation / Feynman.
    if (
      decision.action === "reteach" ||
      decision.reasonCode === "recent-incorrect" ||
      summary?.lastOutcome === "incorrect"
    ) {
      const preferFeynman =
        (summary?.incorrectCount ?? 0) >= 2 ||
        (summary?.attemptCount ?? 0) >= 2;
      return {
        technique: preferFeynman ? "feynman" : "detailed-explanation",
        reasonCode: preferFeynman
          ? "incorrect-feynman"
          : "incorrect-explanation",
        reason: preferFeynman
          ? "Recent misses — explain the idea in plain language and spot gaps."
          : "Recent incorrect attempt — clarify with a detailed explanation.",
        confidence: "high",
        conceptId,
        orchestratorAction: decision.action,
      };
    }

    // Recall action → active recall.
    if (decision.action === "recall" || decision.reasonCode === "needs-recall") {
      return {
        technique: "active-recall",
        reasonCode: "needs-recall",
        reason: "Practice exists but recall evidence is missing.",
        confidence: "high",
        conceptId,
        orchestratorAction: decision.action,
      };
    }

    // Practice — application vs visualization.
    if (decision.action === "practice") {
      const explained =
        summary?.hasCheckEvidence ||
        (summary?.attemptCount ?? 0) > 0;
      const applied = summary?.hasPracticeEvidence;
      if (explained && !applied) {
        return {
          technique: "hands-on-practice",
          reasonCode: "explain-without-apply",
          reason: "Can engage the idea but needs hands-on application.",
          confidence: "high",
          conceptId,
          orchestratorAction: decision.action,
        };
      }
      if (topic && VISUAL_HINT.test(topic)) {
        return {
          technique: "visualization",
          reasonCode: "spatial-topic",
          reason: "This topic benefits from a visual/spatial representation.",
          confidence: "medium",
          conceptId,
          orchestratorAction: decision.action,
        };
      }
      return {
        technique: "hands-on-practice",
        reasonCode: "needs-practice",
        reason: "Practice applying the concept next.",
        confidence: "medium",
        conceptId,
        orchestratorAction: decision.action,
      };
    }

    // Advance / complete → light explanation refresh optional.
    if (decision.action === "advance") {
      return {
        technique: "detailed-explanation",
        reasonCode: "advance-next-concept",
        reason: "Moving to the next concept with a clear explanation.",
        confidence: "medium",
        conceptId: decision.nextConceptId ?? conceptId,
        orchestratorAction: decision.action,
      };
    }

    // Repeated exposure without strong evidence → Feynman + practice bias.
    if (
      summary &&
      summary.exposureCount >= 2 &&
      summary.correctCount === 0
    ) {
      return {
        technique: "feynman",
        reasonCode: "repeated-without-demonstration",
        reason:
          "Repeated exposure without demonstrated understanding — explain it simply.",
        confidence: "medium",
        conceptId,
        orchestratorAction: decision.action,
      };
    }

    return {
      technique: "detailed-explanation",
      reasonCode: "default-explanation",
      reason: "Continue with a clear instructional explanation.",
      confidence: "low",
      conceptId,
      orchestratorAction: decision.action,
    };
  } catch {
    // Safe fallback — never block learning.
    return {
      technique: "detailed-explanation",
      reasonCode: "recommendation-fallback",
      reason: "Using the default explanation technique.",
      confidence: "low",
      conceptId,
      orchestratorAction: decision.action,
    };
  }
}

/** Map orchestrator action → primary Six technique (simple alias). */
export function mapKnowledgeActionToSixComponent(
  action: KnowledgeLearningAction,
): SixComponent {
  switch (action) {
    case "teach":
      return "chunking";
    case "reteach":
      return "detailed-explanation";
    case "practice":
      return "hands-on-practice";
    case "recall":
      return "active-recall";
    case "advance":
      return "detailed-explanation";
    case "complete":
      return "detailed-explanation";
  }
}
