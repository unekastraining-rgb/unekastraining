import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CANONICAL_EVIDENCE_WRITE,
  CANONICAL_MASTERY_APPLY,
  FACET_PRODUCER_COVERAGE,
  LEARNING_ATTEMPT_PRODUCERS,
  PERFORM_COVERAGE_LIMITATION,
  listClosedEvidenceProducers,
  listOutsideEvidenceProducers,
  listPartialEvidenceProducers,
} from "@/lib/learning/learner-model/producers";
import {
  CANONICAL_ULE_MASTERY_SOURCE,
  LEGACY_TOPIC_PROGRESS_SOURCE,
  TOPIC_PROGRESS_LEARNER_COPY,
  resolveLearnerFacingUleMastery,
  resolveLearnerFacingUleMasteryIgnoringTopicProgress,
  masteryTruthBoundarySummary,
} from "@/lib/learning/mastery/mastery-truth";
import { learnerModelProjectionInvariants } from "@/lib/learning/learner-model/project";
import { applyFacetDelta, emptyFacetScores } from "@/lib/learning/mastery/facets";
import { classifyEvidenceSourceKind } from "@/lib/learning/evidence/aggregate";

const root = path.resolve(__dirname, "../../../..");

function readSrc(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2G-79 LearningAttempt producer inventory", () => {
  it("lists CLOSED writers covering quiz through structured activities", () => {
    const closed = listClosedEvidenceProducers().map((p) => p.id);
    expect(closed).toEqual(
      expect.arrayContaining([
        "quiz",
        "flashcard",
        "study_evaluate",
        "tutor",
        "lucky_retention",
        "coding",
        "sql",
        "writing",
        "lab",
        "simulation",
        "game",
        "project",
        "presentation",
      ]),
    );
  });

  it("marks adaptive bind and legacy code-evaluate as PARTIAL", () => {
    const partial = listPartialEvidenceProducers().map((p) => p.id);
    expect(partial).toEqual(
      expect.arrayContaining(["adaptive_bind", "legacy_code_evaluate"]),
    );
  });

  it("marks CORE / Hub / open / browse as INTENTIONALLY_OUTSIDE", () => {
    const outside = listOutsideEvidenceProducers().map((p) => p.id);
    expect(outside).toEqual(
      expect.arrayContaining([
        "core",
        "hub_bridge",
        "public_tutor_api",
        "adaptive_run_cursor",
        "open_activity",
        "open_quiz",
        "browse_assignments",
      ]),
    );
  });

  it("every inventory entry has exactly one closure class", () => {
    for (const p of LEARNING_ATTEMPT_PRODUCERS) {
      expect(["CLOSED", "PARTIAL", "INTENTIONALLY_OUTSIDE"]).toContain(
        p.closure,
      );
    }
  });

  it("canonical write/apply symbols match real modules", () => {
    expect(CANONICAL_EVIDENCE_WRITE).toBe("recordEvidence");
    expect(CANONICAL_MASTERY_APPLY).toBe("applyEvidenceToMastery");
    expect(readSrc("src/lib/learning/evidence/record.ts")).toContain(
      "export async function recordEvidence",
    );
    expect(readSrc("src/lib/learning/mastery/apply.ts")).toContain(
      "export async function applyEvidenceToMastery",
    );
  });

  it("CLOSED producers document facets; OUTSIDE do not invent facets", () => {
    for (const p of listClosedEvidenceProducers()) {
      expect(p.facets.length).toBeGreaterThan(0);
    }
    for (const p of listOutsideEvidenceProducers()) {
      expect(p.facets).toEqual([]);
    }
  });
});

describe("2G-79 facet producer coverage", () => {
  it("RECOGNIZE ≠ EXPLAIN producers", () => {
    expect(FACET_PRODUCER_COVERAGE.RECOGNIZE).not.toEqual(
      FACET_PRODUCER_COVERAGE.EXPLAIN,
    );
  });

  it("APPLY ≠ SOLVE producers", () => {
    expect(FACET_PRODUCER_COVERAGE.APPLY).not.toEqual(
      FACET_PRODUCER_COVERAGE.SOLVE,
    );
  });

  it("PERFORM is not manufactured — real producers only", () => {
    expect(FACET_PRODUCER_COVERAGE.PERFORM).toEqual(
      expect.arrayContaining(["coding", "sql", "lab", "presentation"]),
    );
    expect(PERFORM_COVERAGE_LIMITATION.producersExist).toBe(true);
    expect(PERFORM_COVERAGE_LIMITATION.orchestratorPerformGap).toBe(false);
  });

  it("RETAIN remains separate from performance facets", () => {
    expect(FACET_PRODUCER_COVERAGE.RETAIN).toEqual(
      expect.arrayContaining(["flashcard", "lucky_retention"]),
    );
    expect(FACET_PRODUCER_COVERAGE.RETAIN).not.toContain("coding");
  });

  it("SOLVE coverage includes Tutor and Simulation among CLOSED producers (2P-23)", () => {
    expect([...FACET_PRODUCER_COVERAGE.SOLVE].sort()).toEqual([
      "simulation",
      "tutor",
    ]);
  });
});

describe("2G-79 canonical truth boundaries", () => {
  it("ConceptMastery is canonical ULE mastery", () => {
    expect(CANONICAL_ULE_MASTERY_SOURCE).toBe("ConceptMastery");
    expect(masteryTruthBoundarySummary().uleMastery).toBe("ConceptMastery");
    expect(masteryTruthBoundarySummary().mayMerge).toBe(false);
  });

  it("TopicMastery is legacy and not learner-facing ULE fallback", () => {
    expect(LEGACY_TOPIC_PROGRESS_SOURCE).toBe("TopicMastery");
    expect(
      masteryTruthBoundarySummary().learnerFacingUleFallsBackToTopicMastery,
    ).toBe(false);
  });

  it("UI/Topic progress cannot become ULE mastery via resolve helpers", () => {
    const ignored = resolveLearnerFacingUleMasteryIgnoringTopicProgress({
      conceptMastery: null,
      topicMastery: {
        proficiency: 0.99,
        understanding: 0.99,
        recall: 0.99,
        application: 0.99,
        confidence: 0.99,
        reviewCount: 50,
      },
    });
    expect(ignored.status).toBe("unavailable");
    expect(ignored.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
  });

  it("Adaptive / Lucky / evidence summary are not mastery (projection invariants)", () => {
    const inv = learnerModelProjectionInvariants();
    expect(inv.projectionIsSourceOfTruth).toBe(false);
    expect(inv.adaptiveRunIsMastery).toBe(false);
    expect(inv.retentionIsMastery).toBe(false);
    expect(inv.topicMasteryIsUleMastery).toBe(false);
    expect(inv.evidenceSummaryIsMastery).toBe(false);
  });

  it("empty ConceptMastery reviewCount → unavailable, not fabricated mastery", () => {
    const view = resolveLearnerFacingUleMastery({
      ...emptyFacetScores(),
      reviewCount: 0,
    });
    expect(view.status).toBe("unavailable");
  });

  it("dashboard Topic progress label exists for legacy overallMastery pills", () => {
    expect(TOPIC_PROGRESS_LEARNER_COPY.dashboardMetricLabel).toBe(
      "Topic progress",
    );
    const academic = readSrc("src/components/csl/AcademicDashboard.tsx");
    const ecosystem = readSrc("src/components/csl/EcosystemDashboard.tsx");
    expect(academic).toContain("TOPIC_PROGRESS_LEARNER_COPY.dashboardMetricLabel");
    expect(ecosystem).toContain(
      "TOPIC_PROGRESS_LEARNER_COPY.dashboardMetricLabel",
    );
    expect(academic).not.toMatch(/label=["']Mastery["']/);
  });
});

describe("2G-79 facet separation math", () => {
  it("RECOGNIZE SUCCESS does not equal EXPLAIN bump", () => {
    const base = emptyFacetScores();
    const next = applyFacetDelta(base, "RECOGNIZE", "SUCCESS");
    expect(next.recognize).toBeGreaterThan(base.recognize);
    expect(next.explain).toBe(base.explain);
  });

  it("APPLY FAIL does not collapse into SOLVE", () => {
    const base = { ...emptyFacetScores(), apply: 0.5, solve: 0.5 };
    const next = applyFacetDelta(base, "APPLY", "FAIL");
    expect(next.apply).toBeLessThan(base.apply);
    expect(next.solve).toBe(base.solve);
  });

  it("PERFORM remains independent", () => {
    const base = emptyFacetScores();
    const next = applyFacetDelta(base, "PERFORM", "SUCCESS");
    expect(next.perform).toBeGreaterThan(0);
    expect(next.recognize).toBe(0);
    expect(next.solve).toBe(0);
  });

  it("RETAIN SUCCESS updates retain without inventing PERFORM", () => {
    const next = applyFacetDelta(emptyFacetScores(), "RETAIN", "SUCCESS");
    expect(next.retain).toBeGreaterThan(0);
    expect(next.perform).toBe(0);
  });

  it("missing confidence on empty facets starts at 0 only for ConceptMastery seed", () => {
    expect(emptyFacetScores().confidence).toBe(0);
  });
});

describe("2G-79 evidence source classification (cross-activity)", () => {
  it("classifies quiz / flashcard / study_evaluate / tutor / lucky", () => {
    expect(
      classifyEvidenceSourceKind(JSON.stringify({ kind: "quiz_attempt" })),
    ).toBe("quiz");
    expect(
      classifyEvidenceSourceKind(JSON.stringify({ kind: "flashcard_review" })),
    ).toBe("flashcard");
    expect(
      classifyEvidenceSourceKind(JSON.stringify({ kind: "study_evaluate" })),
    ).toBe("study_evaluate");
    expect(
      classifyEvidenceSourceKind(JSON.stringify({ kind: "tutor_interaction" })),
    ).toBe("tutor");
    expect(
      classifyEvidenceSourceKind(
        JSON.stringify({ kind: "lucky_retention_review" }),
      ),
    ).toBe("lucky");
  });

  it("classifies coding/SQL/structured submits as activity", () => {
    expect(
      classifyEvidenceSourceKind(
        JSON.stringify({ kind: "coding_challenge_submit" }),
      ),
    ).toBe("activity");
    expect(
      classifyEvidenceSourceKind(
        JSON.stringify({ kind: "sql_challenge_submit" }),
      ),
    ).toBe("activity");
    expect(
      classifyEvidenceSourceKind(
        JSON.stringify({ kind: "lab_challenge_submit" }),
      ),
    ).toBe("activity");
  });

  it("learner-model read reuses classifyEvidenceSourceKind", () => {
    expect(readSrc("src/lib/learning/learner-model/read.ts")).toContain(
      "classifyEvidenceSourceKind",
    );
  });
});

describe("2G-79 security & non-write surfaces", () => {
  it("recordEvidence does not accept client mastery fields", () => {
    const record = readSrc("src/lib/learning/evidence/record.ts");
    expect(record).not.toMatch(/recognize|proficiency|topicMastery/);
    expect(record).toContain("envelope.learnerId");
  });

  it("applyEvidenceToMastery ignores envelope.confidence as mastery confidence source", () => {
    const apply = readSrc("src/lib/learning/mastery/apply.ts");
    expect(apply).toContain("applyFacetDelta");
    expect(apply).not.toMatch(/envelope\.confidence/);
  });

  it("CORE bridge does not call recordEvidence", () => {
    const core = readSrc(
      "src/lib/learning/orchestrator/core-adaptive-bridge.ts",
    );
    expect(core).not.toContain("recordEvidence");
    expect(core).not.toContain("applyEvidenceToMastery");
  });

  it("Hub adaptive bridge does not write evidence", () => {
    const hub = readSrc("src/lib/learning/orchestrator/hub-adaptive-bridge.ts");
    expect(hub).not.toContain("recordEvidence");
  });

  it("AdaptiveSequenceRun service does not create LearningAttempts", () => {
    const seq = readSrc("src/lib/learning/sequence/service.ts");
    expect(seq).not.toContain("learningAttempt.create");
    expect(seq).not.toContain("recordEvidence");
  });

  it("MasteryTree remains TopicMastery-labeled", () => {
    const tree = readSrc("src/components/csl/MasteryTree.tsx");
    expect(tree).toContain("TOPIC_PROGRESS_LEARNER_COPY");
    expect(tree).not.toContain("getLearnerConceptMastery");
  });

  it("Learner Model panel uses ConceptMastery source attribute", () => {
    const panel = readSrc("src/components/study/LearnerGrowthCenterPanel.tsx");
    expect(panel).toContain("data-mastery-source");
  });

  it("exactly one Learner Model read helper + one projection (no second model)", () => {
    const read = readSrc("src/lib/learning/learner-model/read.ts");
    const project = readSrc("src/lib/learning/learner-model/project.ts");
    expect(read).toContain("export async function getLearnerConceptMastery");
    expect(project).toContain("export async function projectLearnerConceptState");
    expect(project).toContain("projectionIsSourceOfTruth: false");
  });

  it("architecture docs assert CORE → SIX → LUCKY", () => {
    const doc = readSrc(
      "src/lib/learning/LEARNER_MODEL_TRUTH_AND_STATE.md",
    );
    expect(doc).toContain("CORE → SIX → LUCKY");
    expect(doc).toContain("Exactly one");
  });

  it("study evaluate facet map keeps chunking as RECOGNIZE and active-recall as RETAIN", () => {
    const bridge = readSrc(
      "src/lib/learning/assessment/evaluate-bridge.ts",
    );
    expect(bridge).toContain('skillFacet: "RECOGNIZE"');
    expect(bridge).toContain('skillFacet: "RETAIN"');
    expect(bridge).toContain('skillFacet: "EXPLAIN"');
    expect(bridge).toContain('skillFacet: "APPLY"');
  });

  it("legacy code-evaluate stays outside ULE LearningAttempt write", () => {
    const route = readSrc("app/api/study/code-evaluate/route.ts");
    expect(route).not.toContain("recordEvidence");
    expect(route).not.toContain("applyEvidenceToMastery");
  });

  it("progress snapshot builder is TopicMastery aggregate only", () => {
    const progress = readSrc("src/lib/csl/progress.ts");
    expect(progress).toContain("overallMastery");
    expect(progress).not.toContain("ConceptMastery");
    expect(progress).not.toContain("getLearnerConceptMastery");
  });
});

describe("2G-79 producer path integrity (source inspection)", () => {
  it("quiz / flashcard / evaluate bridges call recordEvidence + applyEvidenceToMastery", () => {
    for (const file of [
      "src/lib/learning/assessment/quiz-bridge.ts",
      "src/lib/learning/assessment/flashcard-bridge.ts",
      "src/lib/learning/assessment/evaluate-bridge.ts",
    ]) {
      const src = readSrc(file);
      expect(src).toContain("recordEvidence");
      expect(src).toContain("applyEvidenceToMastery");
    }
  });

  it("coding / sql / structured use authoritative activity spine", () => {
    expect(readSrc("src/lib/learning/activities/coding/service.ts")).toContain(
      "recordAuthoritativeActivityEvidence",
    );
    expect(readSrc("src/lib/learning/activities/sql/service.ts")).toContain(
      "recordAuthoritativeActivityEvidence",
    );
    expect(
      readSrc("src/lib/learning/activities/structured/service.ts"),
    ).toContain("recordAuthoritativeActivityEvidence");
    expect(
      readSrc("src/lib/learning/activities/server-evaluation.ts"),
    ).toContain("recordEvidence");
  });

  it("tutor evidence and lucky retention write through recordEvidence", () => {
    expect(readSrc("src/lib/learning/tutor/evidence.ts")).toContain(
      "recordEvidence",
    );
    expect(readSrc("src/lib/learning/retention/review.ts")).toContain(
      "recordEvidence",
    );
  });

  it("only one learningAttempt.create site in evidence/record.ts", () => {
    const record = readSrc("src/lib/learning/evidence/record.ts");
    expect(record).toContain("db.learningAttempt.create");
    const matches = record.match(/learningAttempt\.create/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("public tutor API stays outside evidence writes", () => {
    const route = readSrc("app/api/study/tutor/route.ts");
    expect(route).toMatch(/evidenceIntent:\s*["']none["']/);
    expect(route).toMatch(/evidenceAuthorizedByServer:\s*false/);
  });

  it("docs exist and name ConceptMastery as canonical", () => {
    const doc = readSrc(
      "src/lib/learning/LEARNER_MODEL_TRUTH_AND_STATE.md",
    );
    expect(doc).toContain("ConceptMastery");
    expect(doc).toContain("TopicMastery");
    expect(doc).toContain("PERFORM coverage limitation");
    expect(doc).toContain("projectLearnerConceptState");
  });
});
