import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACTIVITY_COVERAGE_INVENTORY,
  activityCoverageSummary,
  assertCoverageAdaptiveKeysAligned,
  buildFacetCoverageMatrix,
  getActivityCoverage,
  listCoverageByStatus,
} from "@/lib/learning/activity-coverage";
import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
} from "@/lib/learning/decision-loop";
import { ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS } from "@/lib/learning/sequence/activity-adaptive-completion";
import { listClosedEvidenceProducers } from "@/lib/learning/learner-model/producers";

const root = path.resolve(__dirname, "../../..");

function readSrc(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2G-81 activity coverage inventory", () => {
  it("classifies every entry with exactly one A–F status", () => {
    const allowed = new Set([
      "A_FULL_ULE_LOOP",
      "B_EVIDENCE_CLOSED_NOT_ORCHESTRATED",
      "C_ADAPTIVE_CLOSED",
      "D_PARTIAL",
      "E_INTENTIONALLY_OUTSIDE",
      "F_LEGACY_COMPATIBILITY",
    ]);
    for (const entry of ACTIVITY_COVERAGE_INVENTORY) {
      expect(allowed.has(entry.status)).toBe(true);
    }
  });

  it("FULL loop includes Coding/SQL/Lab/Simulation/Presentation/Writing/SIX", () => {
    const full = listCoverageByStatus("A_FULL_ULE_LOOP").map((e) => e.id);
    expect(full).toEqual(
      expect.arrayContaining([
        "coding",
        "sql",
        "lab",
        "simulation",
        "presentation",
        "writing",
        "study_evaluate",
      ]),
    );
  });

  it("Game/Project/Writing are Adaptive-ready full ULE loop (2P-18 / 2P-30)", () => {
    for (const id of ["game", "project", "writing"] as const) {
      const e = getActivityCoverage(id)!;
      expect(e.status).toBe("A_FULL_ULE_LOOP");
      expect(e.evidenceClosed).toBe(true);
      expect(e.adaptiveReady).toBe(true);
      expect(e.orchestratorSelectable).toBe(true);
    }
  });

  it("Quiz and Flashcard are Adaptive-closed Assessment paths", () => {
    expect(getActivityCoverage("quiz")?.status).toBe("C_ADAPTIVE_CLOSED");
    expect(getActivityCoverage("flashcard")?.status).toBe("C_ADAPTIVE_CLOSED");
  });

  it("legacy code-evaluate is F; CORE/Hub/public Tutor are E", () => {
    expect(getActivityCoverage("legacy_code_evaluate")?.status).toBe(
      "F_LEGACY_COMPATIBILITY",
    );
    expect(getActivityCoverage("core")?.status).toBe("E_INTENTIONALLY_OUTSIDE");
    expect(getActivityCoverage("public_tutor_api")?.status).toBe(
      "E_INTENTIONALLY_OUTSIDE",
    );
  });

  it("Adaptive-ready keys align with decision-loop + completion contracts", () => {
    expect(assertCoverageAdaptiveKeysAligned()).toBe(true);
    const contractKeys = ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS.map(
      (c) => c.adapterKey,
    );
    expect(contractKeys.sort()).toEqual([...ADAPTIVE_READY_ACTIVITY_KEYS].sort());
    for (const key of PRODUCT_READY_NOT_ADAPTIVE_KEYS) {
      expect(contractKeys).not.toContain(key);
    }
  });

  it("facet matrix matches inventory writers (no invented facets)", () => {
    const matrix = buildFacetCoverageMatrix();
    const coding = matrix.find((r) => r.activityId === "coding")!;
    expect(coding.PERFORM).toBe(true);
    expect(coding.RECOGNIZE).toBe(false);
    const tutor = matrix.find((r) => r.activityId === "tutor")!;
    expect(tutor.SOLVE).toBe(true);
    const quiz = matrix.find((r) => r.activityId === "quiz")!;
    expect(quiz.RECOGNIZE).toBe(true);
    expect(quiz.PERFORM).toBe(false);
    const writing = matrix.find((r) => r.activityId === "writing")!;
    expect(writing.EXPLAIN).toBe(true);
    expect(writing.PERFORM).toBe(false);
  });

  it("SOLVE has no coding/sql/lab/writing/game/project producer in coverage", () => {
    const matrix = buildFacetCoverageMatrix();
    const solveUniversal = matrix.filter(
      (r) =>
        r.SOLVE &&
        ["coding", "sql", "lab", "writing", "game", "project"].includes(
          r.activityId,
        ),
    );
    expect(solveUniversal).toHaveLength(0);
  });

  it("PERFORM producers include Coding/SQL/Lab/Presentation/Networking among activities", () => {
    const perform = buildFacetCoverageMatrix()
      .filter((r) => r.PERFORM)
      .map((r) => r.activityId)
      .sort();
    expect(perform).toEqual([
      "coding",
      "lab",
      "language",
      "networking",
      "presentation",
      "sql",
    ]);
  });

  it("summary counts and closed producers stay coherent", () => {
    const summary = activityCoverageSummary();
    expect(summary.total).toBe(ACTIVITY_COVERAGE_INVENTORY.length);
    expect(summary.byStatus.A_FULL_ULE_LOOP).toBeGreaterThanOrEqual(5);
    expect(summary.byStatus.F_LEGACY_COMPATIBILITY).toBe(1);
    expect(summary.closedProducerCount).toBe(
      listClosedEvidenceProducers().length,
    );
    expect(summary.performLimitation.orchestratorPerformGap).toBe(false);
  });

  it("evidence-closed entries claim conceptMastery when concept-aware", () => {
    for (const e of ACTIVITY_COVERAGE_INVENTORY) {
      if (!e.evidenceClosed) continue;
      if (e.conceptAware === "n/a") continue;
      expect(e.conceptMastery).toBe(true);
      expect(e.orchestratorConsumesMastery).toBe(true);
    }
  });
});

describe("2G-81 coverage docs & source boundaries", () => {
  it("coverage markdown documents A–F and facet matrix", () => {
    const doc = readSrc("src/lib/learning/UNIVERSAL_ACTIVITY_COVERAGE.md");
    expect(doc).toContain("**A**");
    expect(doc).toContain("**F**");
    expect(doc).toContain("PERFORM");
    expect(doc).toContain("SOLVE");
    expect(doc).toContain("code-evaluate");
    expect(doc).toContain("PRODUCT-READY");
    expect(doc).toContain("Launch ≠ Evidence");
  });

  it("helper is metadata-only (no db / no orchestrate)", () => {
    const src = readSrc("src/lib/learning/activity-coverage.ts");
    expect(src).not.toContain("db.");
    expect(src).not.toContain("orchestrateFromLearnerState");
    expect(src).toContain("Not a second activity registry");
  });

  it("missing conceptId: applyEvidenceToMastery no-ops; activities require concept", () => {
    const apply = readSrc("src/lib/learning/mastery/apply.ts");
    expect(apply).toContain("if (!envelope.conceptId) return null");
    const route = readSrc("app/api/study/activities/[kind]/route.ts");
    expect(route).toMatch(/conceptId/);
  });

  it("availability does not write evidence or mastery", () => {
    const policy = readSrc(
      "src/lib/learning/orchestrator/activity-intervention-policy.ts",
    );
    expect(policy).not.toContain("recordEvidence");
    expect(policy).not.toContain("applyEvidenceToMastery");
  });

  it("intent preference remains soft (not diagnosis)", () => {
    const intent = readSrc(
      "src/lib/learning/orchestrator/intent-preference.ts",
    );
    expect(intent).toContain("applySoftIntentPreference");
  });

  it("public Tutor stays outside; authorized Tutor can write", () => {
    const route = readSrc("app/api/study/tutor/route.ts");
    expect(route).toMatch(/evidenceIntent:\s*["']none["']/);
    const tutor = readSrc("src/lib/learning/tutor/evidence.ts");
    expect(tutor).toContain("recordEvidence");
  });

  it("CORE does not write mastery; Continue learning is Adaptive entry", () => {
    const core = readSrc(
      "src/lib/learning/orchestrator/core-adaptive-bridge.ts",
    );
    expect(core).not.toContain("recordEvidence");
    expect(core).not.toContain("applyEvidenceToMastery");
  });

  it("Lucky review writes RETAIN; handoff remains coordinator-owned", () => {
    const review = readSrc("src/lib/learning/retention/review.ts");
    expect(review).toContain("recordEvidence");
    expect(review).toContain("RETAIN");
    const coord = readSrc("src/lib/learning/sequence/coordinator.ts");
    expect(coord).toContain("syncLuckyRetentionAfterSequenceComplete");
  });

  it("legacy code-evaluate remains TopicMastery-only", () => {
    const route = readSrc("app/api/study/code-evaluate/route.ts");
    expect(route).not.toContain("recordEvidence");
    expect(route).not.toContain("applyEvidenceToMastery");
  });

  it("SIX adapter + quiz/flashcard adapters plan-next after evidence", () => {
    for (const file of [
      "src/lib/learning/sequence/six-adapter.ts",
      "src/lib/learning/sequence/quiz-adapter.ts",
      "src/lib/learning/sequence/flashcard-adapter.ts",
    ]) {
      expect(readSrc(file)).toContain(
        "recordAdaptiveSequenceCompletionAndPlanNext",
      );
    }
  });

  it("structured facets match coverage inventory", () => {
    const structured = readSrc(
      "src/lib/learning/activities/structured/service.ts",
    );
    expect(structured).toContain('skillFacet: "EXPLAIN"');
    expect(structured).toContain('skillFacet: "PERFORM"');
    expect(structured).toContain('skillFacet: "APPLY"');
    expect(structured).toContain('skillFacet: "RECOGNIZE"');
  });

  it("entry-point direct access remains classified", () => {
    const entry = readSrc("src/lib/learning/entry-point.ts");
    expect(entry).toContain("DIRECT_ACTIVITY");
    expect(entry).toContain("ADAPTIVE_LEARNING");
    expect(entry).toContain("CONTENT_MANAGEMENT");
  });

  it("INSUFFICIENT_EVIDENCE remains a preserved diagnosis", () => {
    const diagnose = readSrc("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("INSUFFICIENT_EVIDENCE");
  });

  it("exactly one LearningAttempt create site", () => {
    const record = readSrc("src/lib/learning/evidence/record.ts");
    expect(record.match(/learningAttempt\.create/g)).toHaveLength(1);
  });

  it("SIX evaluate facet mapping covers chunking/feynman/hands-on/active-recall", () => {
    const bridge = readSrc(
      "src/lib/learning/assessment/evaluate-bridge.ts",
    );
    expect(bridge).toContain("mapStudyEvaluateToLearningSignals");
    expect(bridge).toContain('skillFacet: "RECOGNIZE"');
    expect(bridge).toContain('skillFacet: "EXPLAIN"');
    expect(bridge).toContain('skillFacet: "APPLY"');
    expect(bridge).toContain('skillFacet: "RETAIN"');
  });

  it("quiz bridge writes RECOGNIZE only", () => {
    const quiz = readSrc("src/lib/learning/assessment/quiz-bridge.ts");
    expect(quiz).toContain('skillFacet: "RECOGNIZE"');
    expect(quiz).toContain("recordEvidence");
    expect(quiz).toContain("applyEvidenceToMastery");
  });

  it("flashcard bridge writes RETAIN", () => {
    const flash = readSrc("src/lib/learning/assessment/flashcard-bridge.ts");
    expect(flash).toContain('skillFacet: "RETAIN"');
    expect(flash).toContain("recordEvidence");
  });

  it("coding and sql write PERFORM via authoritative spine", () => {
    expect(readSrc("src/lib/learning/activities/coding/service.ts")).toContain(
      'skillFacet: "PERFORM"',
    );
    expect(readSrc("src/lib/learning/activities/sql/service.ts")).toContain(
      'skillFacet: "PERFORM"',
    );
    expect(
      readSrc("src/lib/learning/activities/server-evaluation.ts"),
    ).toContain("recordEvidence");
  });

  it("Adaptive completion contracts include game/project/writing (2P-18 / 2P-30)", () => {
    const completion = readSrc(
      "src/lib/learning/sequence/activity-adaptive-completion.ts",
    );
    expect(completion).toContain("Game / Project Adaptive-ready in 2P-30");
    expect(completion).toContain('"coding"');
    expect(completion).toMatch(/adapterKey:\s*"writing"/);
    expect(completion).toMatch(/adapterKey:\s*"game"/);
    expect(completion).toMatch(/adapterKey:\s*"project"/);
  });

  it("activity capability selection cannot manufacture diagnosis", () => {
    const diagnose = readSrc("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("withActivityInterventionSuggestion");
    // Diagnosis assigned before activity suggestion wiring
    expect(diagnose).toContain('diagnosis = "APPLICATION_GAP"');
    expect(diagnose).toContain('diagnosis = "UNDERSTANDING_GAP"');
  });

  it("compatibility matcher uses phrase/token rules (2G-77)", () => {
    const compat = readSrc(
      "src/lib/learning/orchestrator/activity-intervention-compatibility.ts",
    );
    expect(compat).toContain("evaluateActivityCompatibility");
    expect(compat.length).toBeGreaterThan(200);
  });

  it("Assessment workflow is separate from Orchestrator diagnose", () => {
    const workflow = readSrc("src/lib/learning/assessment/workflow.ts");
    expect(workflow).toContain("runAssessmentWorkflow");
    expect(workflow).not.toContain("orchestrateFromLearnerState");
    const handoff = readSrc(
      "src/lib/learning/orchestrator/assessment-handoff.ts",
    );
    expect(handoff).toContain("ASSESS");
  });

  it("MasteryTree remains Topic progress labeled", () => {
    const tree = readSrc("src/components/csl/MasteryTree.tsx");
    expect(tree).toContain("TOPIC_PROGRESS_LEARNER_COPY");
  });

  it("Learner Model panel uses ConceptMastery source", () => {
    const panel = readSrc("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("data-mastery-source");
  });
  it("Adaptive coordinator never writes evidence or mastery", () => {
    const coord = readSrc("src/lib/learning/sequence/coordinator.ts");
    expect(coord).not.toContain("recordEvidence");
    expect(coord).not.toContain("applyEvidenceToMastery");
    expect(coord).toContain("orchestrateForConcept");
  });

  it("adaptive start API remains canonical entry", () => {
    const route = readSrc("app/api/study/adaptive/start/route.ts");
    expect(route).toMatch(/startOrResume|conceptId/);
  });

  it("launch-is-not-evidence invariant on activity foundations", () => {
    const foundations = readSrc("src/lib/learning/activity-foundations.ts");
    expect(foundations).toContain("launchIsNotEvidence");
    expect(foundations).toContain("pointsAreNotMastery");
  });

  it("coverage inventory upgrades Game/Project/Writing to A (2P-18 / 2P-30)", () => {
    for (const id of ["game", "project", "writing"]) {
      expect(getActivityCoverage(id)?.status).toBe("A_FULL_ULE_LOOP");
    }
  });

  it("Tutor, Simulation, Math, Networking, and Language are SOLVE coverage entries among inventory (2P-23 / 2P-39 / 2P-40 / 2P-41)", () => {
    const solve = ACTIVITY_COVERAGE_INVENTORY.filter((e) =>
      e.facets.includes("SOLVE"),
    );
    expect(solve.map((e) => e.id).sort()).toEqual([
      "language",
      "math",
      "networking",
      "simulation",
      "tutor",
    ]);
  });

  it("architecture still asserts CORE → SIX → LUCKY in coverage doc", () => {
    const doc = readSrc("src/lib/learning/UNIVERSAL_ACTIVITY_COVERAGE.md");
    expect(doc).toContain("CORE → SIX → LUCKY");
    expect(doc).toContain("TopicMastery ≠ ConceptMastery");
    expect(doc).toContain("SIX remains first-class");
  });

  it("no second evidence pipeline introduced", () => {
    const coverage = readSrc("src/lib/learning/activity-coverage.ts");
    expect(coverage).not.toContain("learningAttempt.create");
    expect(coverage).not.toContain("conceptMastery.upsert");
  });
});
