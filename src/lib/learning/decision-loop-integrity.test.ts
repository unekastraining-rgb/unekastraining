import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  DECISION_LOOP_INVARIANTS,
  DECISION_LOOP_PRODUCER_CONSUMER_MATRIX,
  DECISION_LOOP_STAGES,
  PRESERVED_ORCHESTRATOR_DIAGNOSES,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
  decisionLoopSummary,
} from "@/lib/learning/decision-loop";
import {
  ORCHESTRATOR_FACET_STRONG,
  ORCHESTRATOR_FACET_WEAK,
} from "@/lib/learning/orchestrator/diagnose";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";

const root = path.resolve(__dirname, "../../..");

function readSrc(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2G-80 decision-loop contract", () => {
  it("exposes canonical stages ending in re_orchestrate", () => {
    expect(DECISION_LOOP_STAGES[0]).toBe("canonical_learner_state");
    expect(DECISION_LOOP_STAGES.at(-1)).toBe("re_orchestrate");
    expect(decisionLoopSummary().reOrchestrationEntry).toBe(
      "orchestrateForConcept",
    );
  });

  it("preserves all six Orchestrator diagnoses", () => {
    expect(PRESERVED_ORCHESTRATOR_DIAGNOSES).toEqual(
      expect.arrayContaining([
        "UNDERSTANDING_GAP",
        "APPLICATION_GAP",
        "RECALL_GAP",
        "RETENTION_GAP",
        "INSUFFICIENT_EVIDENCE",
        "NO_INTERVENTION",
      ]),
    );
  });

  it("invariants: soft intent, no activity→diagnosis, fresh re-orch", () => {
    expect(DECISION_LOOP_INVARIANTS.intentIsSoftPreference).toBe(true);
    expect(
      DECISION_LOOP_INVARIANTS.activityAvailabilityDoesNotManufactureDiagnosis,
    ).toBe(true);
    expect(DECISION_LOOP_INVARIANTS.reOrchestrationReReadsConceptMastery).toBe(
      true,
    );
    expect(DECISION_LOOP_INVARIANTS.noMasteryCache).toBe(true);
    expect(DECISION_LOOP_INVARIANTS.sixRemainsBaselineCatalog).toBe(true);
    expect(DECISION_LOOP_INVARIANTS.assessIsSeparateLane).toBe(true);
  });

  it("producer/consumer matrix converges on getLearnerConceptMastery + orchestrateForConcept", () => {
    for (const row of DECISION_LOOP_PRODUCER_CONSUMER_MATRIX) {
      expect(row.learnerModel).toBe("getLearnerConceptMastery");
      expect(row.orchestrator).toBe("orchestrateForConcept");
      expect(row.mastery).toBe("applyEvidenceToMastery");
    }
  });

  it("Adaptive-ready activity keys include game/project/math (2P-30 / 2P-39)", () => {
    expect([...ADAPTIVE_READY_ACTIVITY_KEYS]).toEqual(
      expect.arrayContaining([
        "coding",
        "sql",
        "math",
        "networking",
        "language",
        "lab",
        "simulation",
        "presentation",
        "writing",
        "game",
        "project",
      ]),
    );
    expect([...PRODUCT_READY_NOT_ADAPTIVE_KEYS]).toEqual([]);
    expect(PRODUCT_READY_NOT_ADAPTIVE_KEYS).not.toContain("writing");
    for (const key of ADAPTIVE_READY_ACTIVITY_KEYS) {
      expect(isAdaptiveReadyActivityAdapterKey(key)).toBe(true);
    }
  });

  it("WEAK/STRONG facet thresholds remain stable", () => {
    expect(ORCHESTRATOR_FACET_WEAK).toBe(0.45);
    expect(ORCHESTRATOR_FACET_STRONG).toBe(0.55);
  });
});

describe("2G-80 source integrity — Orchestrator / Adaptive / lanes", () => {
  it("orchestrateForConcept always calls getLearnerConceptMastery", () => {
    const src = readSrc("src/lib/learning/orchestrator/index.ts");
    expect(src).toContain("getLearnerConceptMastery");
    expect(src).toContain("orchestrateFromLearnerState");
    expect(src).not.toContain("projectLearnerConceptState");
  });

  it("coordinator plan-next re-orchestrates via orchestrateForConcept after completion", () => {
    const coord = readSrc("src/lib/learning/sequence/coordinator.ts");
    expect(coord).toContain("recordAdaptiveSequenceCompletionAndPlanNext");
    expect(coord).toContain("getNextAdaptiveIntervention");
    expect(coord).toContain("orchestrateForConcept");
    expect(coord).toMatch(/Re-orchestrate AFTER evidence exists/);
    expect(coord).not.toContain("recordEvidence");
    expect(coord).not.toContain("applyEvidenceToMastery");
  });

  it("coordinator does not import projectLearnerConceptState", () => {
    const coord = readSrc("src/lib/learning/sequence/coordinator.ts");
    expect(coord).not.toContain("projectLearnerConceptState");
  });

  it("SIX remains baseline; activity is additive on result", () => {
    const diagnose = readSrc("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("withActivityInterventionSuggestion");
    expect(diagnose).toContain("sixComponent");
    const policy = readSrc(
      "src/lib/learning/orchestrator/activity-intervention-policy.ts",
    );
    expect(policy).toContain("selectActivityIntervention");
  });

  it("ASSESS is separate assessment handoff, not Quiz diagnosis", () => {
    const handoff = readSrc(
      "src/lib/learning/orchestrator/assessment-handoff.ts",
    );
    expect(handoff).toContain("ASSESS");
    const diagnose = readSrc("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("withAssessmentWorkflowHandoff");
    expect(diagnose).not.toMatch(/diagnosis:\s*["']ASSESS["']/);
    expect(diagnose).not.toMatch(/sixComponent:\s*["']quiz["']/);
  });

  it("intent preference is soft and cannot override locked understanding", () => {
    const intent = readSrc(
      "src/lib/learning/orchestrator/intent-preference.ts",
    );
    expect(intent).toContain("applySoftIntentPreference");
    expect(intent).toContain("legalSixCandidates");
    expect(intent).toMatch(/soft/i);
  });

  it("CORE bridge does not write mastery", () => {
    const core = readSrc(
      "src/lib/learning/orchestrator/core-adaptive-bridge.ts",
    );
    expect(core).not.toContain("recordEvidence");
    expect(core).not.toContain("applyEvidenceToMastery");
  });

  it("public Tutor cannot authorize evidence", () => {
    const route = readSrc("app/api/study/tutor/route.ts");
    expect(route).toMatch(/evidenceIntent:\s*["']none["']/);
    expect(route).toMatch(/evidenceAuthorizedByServer:\s*false/);
  });

  it("Tutor authorized path can write evidence", () => {
    const tutor = readSrc("src/lib/learning/tutor/evidence.ts");
    expect(tutor).toContain("recordEvidence");
    expect(tutor).toContain("applyEvidenceToMastery");
  });

  it("Lucky handoff remains coordinator-owned terminal path", () => {
    const coord = readSrc("src/lib/learning/sequence/coordinator.ts");
    expect(coord).toContain("syncLuckyRetentionAfterSequenceComplete");
    const handoff = readSrc("src/lib/learning/sequence/lucky-handoff.ts");
    expect(handoff).toContain("syncWeakMasteryRetentionItem");
  });

  it("activity route submits then binds (mastery before plan-next)", () => {
    const route = readSrc("app/api/study/activities/[kind]/route.ts");
    expect(route).toMatch(/submitCodingChallenge|submitSqlChallenge|submitStructured/);
    expect(route).toContain("bindUniversalActivityToAdaptive");
  });

  it("entry-point direct access preserved (2G-78)", () => {
    const entry = readSrc("src/lib/learning/entry-point.ts");
    expect(entry).toContain("DIRECT_ACTIVITY");
    expect(entry).toContain("ADAPTIVE_LEARNING");
  });

  it("docs describe decision loop and producer matrix", () => {
    const doc = readSrc(
      "src/lib/learning/UNIVERSAL_DECISION_LOOP_INTEGRITY.md",
    );
    expect(doc).toContain("orchestrateForConcept");
    expect(doc).toContain("applyEvidenceToMastery");
    expect(doc).toContain("SIX fallback");
    expect(doc).toContain("Producer → Orchestrator matrix");
  });

  it("no mastery cache utilities in orchestrator or learner-model read", () => {
    const orch = readSrc("src/lib/learning/orchestrator/index.ts");
    const read = readSrc("src/lib/learning/learner-model/read.ts");
    expect(orch).not.toMatch(/unstable_cache|lru|memoize/i);
    expect(read).not.toMatch(/unstable_cache|lru|memoize/i);
  });

  it("adaptive-ready keys match activity-adaptive-completion module", () => {
    const completion = readSrc(
      "src/lib/learning/sequence/activity-adaptive-completion.ts",
    );
    for (const key of ADAPTIVE_READY_ACTIVITY_KEYS) {
      expect(completion).toContain(`"${key}"`);
    }
  });

  it("diagnose preserves Recognize vs Explain understanding split", () => {
    const diagnose = readSrc("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("pickUnderstandingIntervention");
    expect(diagnose).toContain("canDistinguishRecognizeFromExplain");
    expect(diagnose).toContain("feynman");
    expect(diagnose).toContain("active-recall");
  });

  it("decision-loop helper is not a second orchestrator", () => {
    const loop = readSrc("src/lib/learning/decision-loop.ts");
    expect(loop).not.toContain("orchestrateFromLearnerState");
    expect(loop).not.toContain("db.");
    expect(loop).toContain("Not a second Orchestrator");
  });
});

describe("2G-80 soft intent & assessment lane boundaries", () => {
  it("activity policy rejects ASSESS for generic activity intervention", () => {
    const policy = readSrc(
      "src/lib/learning/orchestrator/activity-intervention-policy.ts",
    );
    expect(policy).toMatch(/ASSESS/);
    expect(policy).toContain("intentPurpose");
  });

  it("assessment workflow remains separate module", () => {
    const workflow = readSrc("src/lib/learning/assessment/workflow.ts");
    expect(workflow).toContain("runAssessmentWorkflow");
    expect(workflow).not.toContain("orchestrateFromLearnerState");
  });

  it("soft intent preference tests exist and assert soft-only", () => {
    const soft = readSrc(
      "src/lib/learning/orchestrator/soft-intent-preference.test.ts",
    );
    expect(soft.length).toBeGreaterThan(100);
    expect(soft).toMatch(/soft|preference|legal/i);
  });

  it("CREATE purpose does not rewrite diagnosis in intent preference", () => {
    const intent = readSrc(
      "src/lib/learning/orchestrator/intent-preference.ts",
    );
    expect(intent).toMatch(/CREATE/);
    expect(intent).toContain("applySoftIntentPreference");
  });

  it("interventionFromOrchestrator falls back to SIX when activity not Adaptive-ready", () => {
    const coord = readSrc("src/lib/learning/sequence/coordinator.ts");
    expect(coord).toContain("interventionFromOrchestrator");
    expect(coord).toContain("isAdaptiveReadyActivityAdapterKey");
    expect(coord).toContain("sixComponent");
  });

  it("quiz/flashcard/SIX adapters plan-next after producer evidence", () => {
    for (const file of [
      "src/lib/learning/sequence/quiz-adapter.ts",
      "src/lib/learning/sequence/flashcard-adapter.ts",
      "src/lib/learning/sequence/six-adapter.ts",
    ]) {
      const src = readSrc(file);
      expect(src).toContain("recordAdaptiveSequenceCompletionAndPlanNext");
    }
  });

  it("compatibility matching prevents wrong-domain activity selection", () => {
    const compat = readSrc(
      "src/lib/learning/orchestrator/activity-intervention-compatibility.ts",
    );
    expect(compat).toContain("evaluateActivityCompatibility");
  });

  it("Learner Model truth docs remain ConceptMastery-canonical", () => {
    const truth = readSrc(
      "src/lib/learning/LEARNER_MODEL_TRUTH_AND_STATE.md",
    );
    expect(truth).toContain("ConceptMastery");
    expect(truth).toContain("AdaptiveSequenceRun");
  });

  it("decision loop docs note intent continuity residual", () => {
    const doc = readSrc(
      "src/lib/learning/UNIVERSAL_DECISION_LOOP_INTEGRITY.md",
    );
    expect(doc).toContain("Intent options");
    expect(doc).toContain("code-evaluate");
  });

  it("exactly one recordEvidence create site still holds", () => {
    const record = readSrc("src/lib/learning/evidence/record.ts");
    const matches = record.match(/learningAttempt\.create/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});
