/**
 * 2P-42 — Cross-modal variety helpers (no new engine).
 * Soft demotion / alternate picks within existing Orchestrator + Adaptive contracts.
 */

import type { SixComponent } from "@/lib/csl/six";
import { SIX_ACTIVITIES } from "@/lib/csl/six";
import { sixGuideHref } from "@/lib/csl/six-guides";
import {
  isUnderstandingFacetLocked,
  type OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { legalSixCandidates } from "@/lib/learning/orchestrator/intent-preference";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";

/**
 * Recent Adaptive-ready activity adapter keys from intervention history
 * (most recent last). Deterministic; ignores SIX component strings.
 */
export function extractRecentActivityAdapterKeys(
  interventionHistory: readonly { intervention: string }[],
  limit = 3,
): string[] {
  const keys: string[] = [];
  for (let i = interventionHistory.length - 1; i >= 0; i--) {
    const raw = interventionHistory[i]?.intervention?.trim() ?? "";
    if (!raw) continue;
    if (!isAdaptiveReadyActivityAdapterKey(raw)) continue;
    if (!keys.includes(raw)) keys.push(raw);
    if (keys.length >= limit) break;
  }
  return keys.reverse();
}

/**
 * Pick an alternate SIX technique among already-legal candidates.
 * Returns null when facet-locked singleton or no alternate exists.
 */
export function pickAlternateLegalSixComponent(input: {
  diagnosis: OrchestratorResult["diagnosis"];
  baseline: SixComponent | null;
  facetLocked: boolean;
  exclude: SixComponent | string | null;
}): SixComponent | null {
  const legal = legalSixCandidates(
    input.diagnosis,
    input.baseline,
    input.facetLocked,
  );
  const exclude = (input.exclude ?? "").toString();
  const alternate = legal.find((c) => c !== exclude);
  return alternate ?? null;
}

/**
 * When Adaptive would stop on immediate repeat, try one evidence-legal alternate.
 * Never invents interventions outside existing activity ranking / legal SIX sets.
 * Returns null when no alternate exists (caller keeps STOP_IMMEDIATE_REPEAT).
 */
export function resolveImmediateRepeatAlternate(
  orchestrator: OrchestratorResult,
  lastIntervention: string,
  extras?: {
    subjectDomain?: string | null;
    topicName?: string | null;
  },
): OrchestratorResult | null {
  const last = lastIntervention.trim();
  if (!last) return null;

  if (isAdaptiveReadyActivityAdapterKey(last)) {
    const purpose =
      orchestrator.decisionContext?.intent?.purpose ?? "PRACTICE";
    const alternate = selectActivityIntervention({
      diagnosis: orchestrator.diagnosis,
      conceptId: orchestrator.conceptId,
      conceptTitle: orchestrator.conceptTitle,
      topicName: extras?.topicName ?? orchestrator.conceptTitle,
      subjectDomain: extras?.subjectDomain ?? null,
      intentPurpose: purpose,
      excludeAdapterKeys: [last],
      recentAdapterKeys: [last],
      preferSolveProducers: orchestrator.diagnosis === "APPLICATION_GAP",
      preferPerformProducers: orchestrator.diagnosis === "APPLICATION_GAP",
      preferCreationProducers: orchestrator.diagnosis === "APPLICATION_GAP",
    });
    if (alternate && alternate.adapterKey !== last) {
      return {
        ...orchestrator,
        activityIntervention: alternate,
        reason: `${orchestrator.reason} Let's try a different practice format.`,
      };
    }
    return null;
  }

  if (orchestrator.intervention?.kind !== "six") return null;
  if (orchestrator.intervention.sixComponent !== last) return null;

  const facetLocked = isUnderstandingFacetLocked(
    orchestrator.signals.facets,
    orchestrator.signals.usedTopicMasteryFallback,
  );
  const alternate = pickAlternateLegalSixComponent({
    diagnosis: orchestrator.diagnosis,
    baseline: orchestrator.intervention.sixComponent,
    facetLocked,
    exclude: last,
  });
  if (!alternate) return null;

  const meta = SIX_ACTIVITIES.find((a) => a.id === alternate);
  return {
    ...orchestrator,
    activityIntervention: undefined,
    intervention: {
      kind: "six",
      sixComponent: alternate,
      title: meta?.title ?? alternate,
      emoji: meta?.emoji ?? "📚",
      href: sixGuideHref(alternate, {}),
    },
    reason: `${orchestrator.reason} Let's try a different approach to the same need.`,
  };
}

export function crossModalVarietyTruthSummary(): {
  inventsEngines: false;
  forcesVariety: false;
  mutatesDiagnosis: false;
  demotesRecentOnly: true;
  immediateRepeatMayPickAlternate: true;
  stopWhenNoAlternate: true;
} {
  return {
    inventsEngines: false,
    forcesVariety: false,
    mutatesDiagnosis: false,
    demotesRecentOnly: true,
    immediateRepeatMayPickAlternate: true,
    stopWhenNoAlternate: true,
  };
}
