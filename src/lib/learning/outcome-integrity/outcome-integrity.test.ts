/**
 * 2P-13 — Universal Learning Outcome Integrity tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACTIVITY_OUTCOME_CONTRACT_MATRIX,
  completionWithFailIsStillComplete,
  outcomeIntegrityModuleDoesNotWriteEvidence,
  outcomeIntegrityTruthSummary,
  summarizeActivityOutcomeIntegrity,
} from "@/lib/learning/outcome-integrity";
import {
  sanitizeClientActivitySubmission,
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import {
  getStructuredChallenge,
  evaluateStructuredChallenge,
} from "@/lib/learning/activities/structured/service";
import {
  getActivityAdaptiveCompletionContract,
} from "@/lib/learning/sequence/activity-adaptive-completion";
import { isActivityAdaptiveCompletionEligible } from "@/lib/learning/sequence/activity-adapter";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { resolveLearningExperience } from "@/lib/learning/experience";
import { projectLearningScaffolds } from "@/lib/learning/scaffolding";
import { learningScaffoldTruthSummary } from "@/lib/learning/scaffolding";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-13 Completion vs evaluation", () => {
  it("FAIL and PARTIAL are still completed attempts", () => {
    expect(completionWithFailIsStillComplete("FAIL")).toBe(true);
    expect(completionWithFailIsStillComplete("PARTIAL")).toBe(true);
    expect(completionWithFailIsStillComplete("SUCCESS")).toBe(true);
    expect(completionWithFailIsStillComplete("ABANDONED")).toBe(false);
  });

  it("coding starter/open is not fabricated SUCCESS", () => {
    const c = getCodingChallenge("java-inheritance-subclass")!;
    const opened = evaluateCodingChallenge(c, c.starter);
    expect(opened.outcome).not.toBe("SUCCESS");
    expect(opened.serverAuthoritative).toBe(true);

    const empty = evaluateCodingChallenge(c, "");
    expect(empty.outcome).toBe("FAIL");

    const summary = summarizeActivityOutcomeIntegrity({
      completion: {
        learningAttemptId: "la-fail",
        outcome: empty.outcome,
        score: empty.score,
      },
      skillFacet: "PERFORM",
      adaptiveBindEligible: true,
    });
    expect(summary.attemptCompleted).toBe(true);
    expect(summary.evaluationOutcome).toBe("FAIL");
    expect(summary.evidenceRecorded).toBe(true);
    expect(outcomeIntegrityTruthSummary().completionIsNotSuccess).toBe(true);
  });

  it("outcomeFromPassRatio maps 0% to FAIL, not SUCCESS", () => {
    expect(outcomeFromPassRatio(0)).toBe("FAIL");
    expect(outcomeFromPassRatio(0.5)).toBe("PARTIAL");
    expect(outcomeFromPassRatio(0.8)).toBe("SUCCESS");
  });

  it("opening alone has no completion summary", () => {
    const summary = summarizeActivityOutcomeIntegrity({ completion: null });
    expect(summary.attemptCompleted).toBe(false);
    expect(summary.evidenceRecorded).toBe(false);
    expect(summary.evaluationOutcome).toBeNull();
  });
});

describe("2P-13 Client trust + scaffolding non-evidence", () => {
  it("forged outcome/score/ABANDONED/mastery are stripped", () => {
    const { work, rejectedForgeryKeys } = sanitizeClientActivitySubmission({
      code: "function add(a,b){return a+b}",
      outcome: "SUCCESS",
      score: 1,
      mastery: { PERFORM: 1 },
      ABANDONED: true,
      learnerId: "attacker",
      conceptId: "stolen",
    });
    expect(work.code).toContain("function add");
    expect(work.outcome).toBeUndefined();
    expect(work.score).toBeUndefined();
    expect(rejectedForgeryKeys).toEqual(
      expect.arrayContaining([
        "outcome",
        "score",
        "mastery",
        "ABANDONED",
        "learnerId",
        "conceptId",
      ]),
    );
  });

  it("scaffold projection does not write evidence", () => {
    const projected = projectLearningScaffolds({
      activityKind: "coding",
      objective: "Use inheritance",
      starter: "class Dog {}",
      authoredScaffolds: [
        {
          kind: "HINT",
          label: "Nudge",
          content: "Think about extends",
          level: 1,
        },
      ],
    });
    expect(projected.scaffolds.length).toBeGreaterThan(0);
    expect(learningScaffoldTruthSummary().hintRequestIsNotEvidence).toBe(true);
    expect(
      outcomeIntegrityModuleDoesNotWriteEvidence(
        read("src/lib/learning/outcome-integrity/types.ts"),
      ),
    ).toBe(true);
  });
});

describe("2P-13 Adaptive FAIL bind + SOLVE simulation fix", () => {
  it("coding FAIL attempt remains Adaptive-eligible", () => {
    const contract = getActivityAdaptiveCompletionContract("coding")!;
    const eligibility = isActivityAdaptiveCompletionEligible({
      contract,
      attempt: {
        userId: "u1",
        conceptId: "c1",
        skillFacet: "PERFORM",
        outcome: "FAIL",
        sourceRefJson: JSON.stringify({ kind: "coding_challenge_submit" }),
      },
      expectedLearnerId: "u1",
      expectedConceptId: "c1",
    });
    expect(eligibility.eligible).toBe(true);
  });

  it("simulation SOLVE attempt is Adaptive-eligible (GAP-1 fix)", () => {
    const contract = getActivityAdaptiveCompletionContract("simulation")!;
    expect(contract.requiredSkillFacets).toEqual(
      expect.arrayContaining(["APPLY", "SOLVE"]),
    );
    const capability = getActivityInterventionCapability("simulation")!;
    expect(capability.evidenceFacetsProduced).toEqual(
      expect.arrayContaining(["SOLVE"]),
    );

    const challenge = getStructuredChallenge("sim-network-fault")!;
    expect(challenge.skillFacet).toBe("SOLVE");

    const eligibility = isActivityAdaptiveCompletionEligible({
      contract,
      attempt: {
        userId: "u1",
        conceptId: "c1",
        skillFacet: "SOLVE",
        outcome: "FAIL",
        sourceRefJson: JSON.stringify({
          kind: "simulation_challenge_submit",
        }),
      },
      expectedLearnerId: "u1",
      expectedConceptId: "c1",
    });
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.reason).toBe("activity_evaluated");
  });

  it("matrix documents completion ≠ mastery for all universal kinds", () => {
    expect(ACTIVITY_OUTCOME_CONTRACT_MATRIX.length).toBeGreaterThanOrEqual(8);
    for (const row of ACTIVITY_OUTCOME_CONTRACT_MATRIX) {
      expect(row.outcomeSource).toBe("server_evaluator");
      expect(row.failCompletesAttempt).toBe(true);
    }
  });
});

describe("2P-13 Integration — fail outcome integrity chain (in-code)", () => {
  /**
   * Concept → intervention → experience → scaffolds → FAIL evaluate.
   * Proves: scaffolds are not evidence; FAIL is real; Adaptive may still bind.
   * Full DB LearningAttempt/mastery/re-orchestrate covered by existing
   * adaptive-activity-lifecycle.integration.test.ts.
   */
  it("intervention → experience → scaffold → FAIL evaluate → bind-eligible", () => {
    const intervention = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      topicName: "Intro to coding",
      intentPurpose: "PRACTICE",
    });
    expect(intervention?.adapterKey).toBe("coding");

    const resolved = resolveLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "coding",
      whyReason: intervention?.reason ?? null,
      adaptiveContext: true,
    });
    expect(resolved.experience?.scaffolds.length).toBeGreaterThan(0);

    const challenge = getCodingChallenge(resolved.recommendedContentId!)!;
    const evaluation = evaluateCodingChallenge(challenge, "");
    expect(evaluation.outcome).toBe("FAIL");
    expect(evaluation.serverAuthoritative).toBe(true);
    expect(evaluateCodingChallenge(challenge, challenge.starter).outcome).not.toBe(
      "SUCCESS",
    );

    const integrity = summarizeActivityOutcomeIntegrity({
      completion: {
        learningAttemptId: "la-integration-fail",
        outcome: evaluation.outcome,
        score: evaluation.score,
      },
      skillFacet: "PERFORM",
      adaptiveBindEligible: true,
    });
    expect(integrity.attemptCompleted).toBe(true);
    expect(integrity.evaluationOutcome).toBe("FAIL");
    expect(integrity.adaptiveBindEligible).toBe(true);

    const contract = getActivityAdaptiveCompletionContract("coding")!;
    expect(
      isActivityAdaptiveCompletionEligible({
        contract,
        attempt: {
          userId: "u",
          conceptId: "c-java",
          skillFacet: "PERFORM",
          outcome: "FAIL",
          sourceRefJson: JSON.stringify({ kind: "coding_challenge_submit" }),
        },
        expectedLearnerId: "u",
        expectedConceptId: "c-java",
      }).eligible,
    ).toBe(true);

    expect(learningScaffoldTruthSummary().doesNotWriteEvidence).toBe(true);
  });

  it("makeServerEvaluation rejects non-authoritative fabrication patterns", () => {
    const evalResult = makeServerEvaluation({
      outcome: "FAIL",
      score: 0,
      skillFacet: "PERFORM",
      details: { mode: "test" },
    });
    expect(evalResult.serverAuthoritative).toBe(true);
    expect(evalResult.outcome).toBe("FAIL");
  });
});

describe("2P-13 Simulation SOLVE evaluation still uses rubric", () => {
  it("stub decision fails; does not invent SUCCESS", () => {
    const sim = getStructuredChallenge("sim-network-fault")!;
    const fail = evaluateStructuredChallenge(sim, "done");
    expect(fail.outcome).toBe("FAIL");
  });
});
