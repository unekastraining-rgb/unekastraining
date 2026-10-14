/**
 * Phase 2G-81 — Universal Learning Activity Coverage metadata (read-only).
 *
 * Not a second activity registry. Not a second evidence pipeline.
 * Composes existing producer / Adaptive / entry inventories into a coverage view.
 */

import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
} from "@/lib/learning/decision-loop";
import {
  FACET_PRODUCER_COVERAGE,
  LEARNING_ATTEMPT_PRODUCERS,
  PERFORM_COVERAGE_LIMITATION,
  type EvidenceProducerId,
} from "@/lib/learning/learner-model/producers";

/** Primary coverage status (exactly one). */
export type ActivityCoverageStatus =
  | "A_FULL_ULE_LOOP"
  | "B_EVIDENCE_CLOSED_NOT_ORCHESTRATED"
  | "C_ADAPTIVE_CLOSED"
  | "D_PARTIAL"
  | "E_INTENTIONALLY_OUTSIDE"
  | "F_LEGACY_COMPATIBILITY";

export type ActivityCoverageEntry = {
  id: string;
  label: string;
  status: ActivityCoverageStatus;
  /** Facets written when evidence-producing. */
  facets: readonly string[];
  evidenceClosed: boolean;
  conceptMastery: boolean;
  orchestratorConsumesMastery: boolean;
  /** Selectable as Orchestrator activityIntervention (Adaptive-ready universal). */
  orchestratorSelectable: boolean;
  adaptiveReady: boolean;
  conceptAware: "required" | "optional" | "via_topic" | "n/a";
  notes: string;
};

/**
 * Truthful coverage inventory — implementation-aligned, not aspirational.
 * Prefer documenting intentional non-closure over declaring everything FULL.
 */
export const ACTIVITY_COVERAGE_INVENTORY: readonly ActivityCoverageEntry[] = [
  {
    id: "coding",
    label: "Coding",
    status: "A_FULL_ULE_LOOP",
    facets: ["PERFORM"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "recordAuthoritativeActivityEvidence → Adaptive bind.",
  },
  {
    id: "sql",
    label: "SQL",
    status: "A_FULL_ULE_LOOP",
    facets: ["PERFORM"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "Same spine as Coding.",
  },
  {
    id: "math",
    label: "Math workspace",
    status: "A_FULL_ULE_LOOP",
    facets: ["SOLVE"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "2P-39 — Constrained linear-equation workspace; math_workspace_submit → SOLVE.",
  },
  {
    id: "networking",
    label: "Network workspace",
    status: "A_FULL_ULE_LOOP",
    facets: ["APPLY", "SOLVE", "PERFORM"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes:
      "2P-40 — Constrained topology troubleshooting; network_workspace_submit.",
  },
  {
    id: "language",
    label: "Language workspace",
    status: "A_FULL_ULE_LOOP",
    facets: ["RECOGNIZE", "APPLY", "SOLVE", "PERFORM", "RETAIN"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes:
      "2P-41 — Speak/listen/conversation; language_workspace_submit (phrase match, not phoneme scoring).",
  },
  {
    id: "lab",
    label: "Lab",
    status: "A_FULL_ULE_LOOP",
    facets: ["PERFORM"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "Structured PERFORM + Adaptive-ready.",
  },
  {
    id: "simulation",
    label: "Simulation",
    status: "A_FULL_ULE_LOOP",
    facets: ["APPLY", "SOLVE", "EXPLAIN"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes:
      "2P-23 — Structured simulation (+ educational market) may write APPLY/SOLVE/EXPLAIN; Adaptive-ready.",
  },
  {
    id: "presentation",
    label: "Presentation",
    status: "A_FULL_ULE_LOOP",
    facets: ["PERFORM"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "Structured PERFORM + Adaptive-ready.",
  },
  {
    id: "writing",
    label: "Writing",
    status: "A_FULL_ULE_LOOP",
    facets: ["EXPLAIN"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "2P-18 — Structured EXPLAIN + Adaptive-ready (universal bind).",
  },
  {
    id: "study_evaluate",
    label: "SIX / Study Evaluate",
    status: "A_FULL_ULE_LOOP",
    facets: ["RECOGNIZE", "EXPLAIN", "APPLY", "RETAIN"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: false,
    adaptiveReady: true,
    conceptAware: "via_topic",
    notes: "SIX remains first-class baseline; six-adapter Adaptive.",
  },
  {
    id: "quiz",
    label: "Quiz",
    status: "C_ADAPTIVE_CLOSED",
    facets: ["RECOGNIZE"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: false,
    adaptiveReady: true,
    conceptAware: "via_topic",
    notes: "Assessment adapter / QuizTaker; dual-writes TopicMastery.",
  },
  {
    id: "flashcard",
    label: "Flashcard",
    status: "C_ADAPTIVE_CLOSED",
    facets: ["RETAIN"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: false,
    adaptiveReady: true,
    conceptAware: "via_topic",
    notes: "PRACTICE_CHECK / review; dual-writes TopicMastery.",
  },
  {
    id: "game",
    label: "Game",
    status: "A_FULL_ULE_LOOP",
    facets: ["RECOGNIZE"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "2P-30 — Structured RECOGNIZE + Adaptive-ready (points ignored).",
  },
  {
    id: "project",
    label: "Project",
    status: "A_FULL_ULE_LOOP",
    facets: ["APPLY"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: true,
    adaptiveReady: true,
    conceptAware: "required",
    notes: "2P-30 — Structured APPLY plan artifact + Adaptive-ready.",
  },
  {
    id: "tutor",
    label: "Tutor (authorized)",
    status: "B_EVIDENCE_CLOSED_NOT_ORCHESTRATED",
    facets: ["EXPLAIN", "APPLY", "SOLVE"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "required",
    notes: "Server authorization required; SOLVE producer (with Simulation).",
  },
  {
    id: "lucky_retention",
    label: "Lucky retention review",
    status: "B_EVIDENCE_CLOSED_NOT_ORCHESTRATED",
    facets: ["RETAIN"],
    evidenceClosed: true,
    conceptMastery: true,
    orchestratorConsumesMastery: true,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "optional",
    notes: "Mastery only when RetentionItem.conceptId present.",
  },
  {
    id: "adaptive_bind",
    label: "Adaptive bind adapters",
    status: "D_PARTIAL",
    facets: [],
    evidenceClosed: false,
    conceptMastery: false,
    orchestratorConsumesMastery: false,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "n/a",
    notes: "Consumes existing Attempt; never creates evidence.",
  },
  {
    id: "core",
    label: "CORE (notes / bridge / Assist / Continue learning)",
    status: "E_INTENTIONALLY_OUTSIDE",
    facets: [],
    evidenceClosed: false,
    conceptMastery: false,
    orchestratorConsumesMastery: false,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "n/a",
    notes: "Knowledge entry / Adaptive CTA; not an evidence writer.",
  },
  {
    id: "hub_study_now_assignments",
    label: "Hub / Study Now / Assignments surfaces",
    status: "E_INTENTIONALLY_OUTSIDE",
    facets: [],
    evidenceClosed: false,
    conceptMastery: false,
    orchestratorConsumesMastery: false,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "n/a",
    notes: "Entry / browse / direct access; Adaptive CTAs use /api/study/adaptive/start.",
  },
  {
    id: "public_tutor_api",
    label: "Public Tutor API",
    status: "E_INTENTIONALLY_OUTSIDE",
    facets: [],
    evidenceClosed: false,
    conceptMastery: false,
    orchestratorConsumesMastery: false,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "n/a",
    notes: "Forces evidenceIntent none.",
  },
  {
    id: "open_launch_browse",
    label: "Open / launch / browse",
    status: "E_INTENTIONALLY_OUTSIDE",
    facets: [],
    evidenceClosed: false,
    conceptMastery: false,
    orchestratorConsumesMastery: false,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "n/a",
    notes: "Launch ≠ evidence.",
  },
  {
    id: "mastery_tree_topic_progress",
    label: "MasteryTree / Topic progress chrome",
    status: "E_INTENTIONALLY_OUTSIDE",
    facets: [],
    evidenceClosed: false,
    conceptMastery: false,
    orchestratorConsumesMastery: false,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "n/a",
    notes: "Displays TopicMastery; labeled Topic progress.",
  },
  {
    id: "legacy_code_evaluate",
    label: "Legacy code-evaluate",
    status: "F_LEGACY_COMPATIBILITY",
    facets: [],
    evidenceClosed: false,
    conceptMastery: false,
    orchestratorConsumesMastery: false,
    orchestratorSelectable: false,
    adaptiveReady: false,
    conceptAware: "n/a",
    notes: "TopicMastery only — parallel to ULE Coding PERFORM.",
  },
] as const;

export type FacetCoverageRow = {
  activityId: string;
  RECOGNIZE: boolean;
  EXPLAIN: boolean;
  APPLY: boolean;
  SOLVE: boolean;
  PERFORM: boolean;
  RETAIN: boolean;
};

export function buildFacetCoverageMatrix(): FacetCoverageRow[] {
  return ACTIVITY_COVERAGE_INVENTORY.filter((e) => e.evidenceClosed).map(
    (e) => ({
      activityId: e.id,
      RECOGNIZE: e.facets.includes("RECOGNIZE"),
      EXPLAIN: e.facets.includes("EXPLAIN"),
      APPLY: e.facets.includes("APPLY"),
      SOLVE: e.facets.includes("SOLVE"),
      PERFORM: e.facets.includes("PERFORM"),
      RETAIN: e.facets.includes("RETAIN"),
    }),
  );
}

export function listCoverageByStatus(
  status: ActivityCoverageStatus,
): ActivityCoverageEntry[] {
  return ACTIVITY_COVERAGE_INVENTORY.filter((e) => e.status === status);
}

export function getActivityCoverage(
  id: string,
): ActivityCoverageEntry | undefined {
  return ACTIVITY_COVERAGE_INVENTORY.find((e) => e.id === id);
}

export function activityCoverageSummary(): {
  total: number;
  byStatus: Record<ActivityCoverageStatus, number>;
  adaptiveReadyUniversal: readonly string[];
  productReadyNotAdaptive: readonly string[];
  performLimitation: typeof PERFORM_COVERAGE_LIMITATION;
  closedProducerCount: number;
} {
  const byStatus = {
    A_FULL_ULE_LOOP: 0,
    B_EVIDENCE_CLOSED_NOT_ORCHESTRATED: 0,
    C_ADAPTIVE_CLOSED: 0,
    D_PARTIAL: 0,
    E_INTENTIONALLY_OUTSIDE: 0,
    F_LEGACY_COMPATIBILITY: 0,
  } satisfies Record<ActivityCoverageStatus, number>;

  for (const entry of ACTIVITY_COVERAGE_INVENTORY) {
    byStatus[entry.status] += 1;
  }

  return {
    total: ACTIVITY_COVERAGE_INVENTORY.length,
    byStatus,
    adaptiveReadyUniversal: ADAPTIVE_READY_ACTIVITY_KEYS,
    productReadyNotAdaptive: PRODUCT_READY_NOT_ADAPTIVE_KEYS,
    performLimitation: PERFORM_COVERAGE_LIMITATION,
    closedProducerCount: LEARNING_ATTEMPT_PRODUCERS.filter(
      (p) => p.closure === "CLOSED",
    ).length,
  };
}

/** Guard: coverage Adaptive-ready keys match decision-loop contract. */
export function assertCoverageAdaptiveKeysAligned(): boolean {
  const ready = new Set(
    ACTIVITY_COVERAGE_INVENTORY.filter((e) => e.adaptiveReady && e.orchestratorSelectable).map(
      (e) => e.id,
    ),
  );
  for (const key of ADAPTIVE_READY_ACTIVITY_KEYS) {
    if (!ready.has(key)) return false;
  }
  for (const key of PRODUCT_READY_NOT_ADAPTIVE_KEYS) {
    const entry = getActivityCoverage(key);
    if (!entry || entry.adaptiveReady) return false;
  }
  return true;
}

/** Facet producers from 2G-79 inventory — reused, not duplicated. */
export function facetProducerCoverage() {
  return FACET_PRODUCER_COVERAGE;
}

export function isEvidenceClosedProducerId(id: EvidenceProducerId): boolean {
  return LEARNING_ATTEMPT_PRODUCERS.some(
    (p) => p.id === id && p.closure === "CLOSED",
  );
}
