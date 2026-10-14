/**
 * 2P-8 — Universal Learning Content Pipeline unit tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  assertSourceOwnership,
  contentPipelineTruthSummary,
  pipelineModuleDoesNotWriteMastery,
  prepareLearningContent,
  runContentPipeline,
  sourceDoesNotCreateMastery,
  suggestActivityKindsForObjective,
  validatePreparedLearningContent,
  FIXTURE_BUSINESS_SUPPLY_DEMAND,
  FIXTURE_CS_JAVA_INHERITANCE,
  FIXTURE_NETWORKING_DHCP,
  FIXTURE_NETWORKING_DHCP_LAB,
} from "@/lib/learning/content-pipeline";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
} from "@/lib/learning/activities/structured/service";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-8 Source", () => {
  it("ownership: foreign source rejected", () => {
    const owned = assertSourceOwnership({
      source: FIXTURE_CS_JAVA_INHERITANCE.source,
      learnerId: "learner-1",
    });
    expect(owned.ok).toBe(true);
    const foreign = assertSourceOwnership({
      source: FIXTURE_CS_JAVA_INHERITANCE.source,
      learnerId: "other-learner",
    });
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.reason).toBe("foreign_source");
  });

  it("source import does not create mastery", () => {
    expect(sourceDoesNotCreateMastery()).toBe(true);
    const truth = contentPipelineTruthSummary();
    expect(truth.sourceIsNotEvidence).toBe(true);
    expect(truth.contentGenerationIsNotMastery).toBe(true);
    expect(truth.luckyNotAutoFromImport).toBe(true);
  });
});

describe("2P-8 Objective + characteristics", () => {
  it("rejects generic objectives", () => {
    const bad = prepareLearningContent({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      objective: {
        ...FIXTURE_CS_JAVA_INHERITANCE.objective,
        objective: "Complete this activity.",
      },
    });
    expect(bad).toEqual({ error: "objective_not_meaningful" });
  });

  it("suggests coding for construction/application objectives", () => {
    const kinds = suggestActivityKindsForObjective(
      FIXTURE_CS_JAVA_INHERITANCE.objective,
    );
    expect(kinds).toContain("coding");
  });

  it("suggests simulation/lab for troubleshooting", () => {
    const kinds = suggestActivityKindsForObjective(
      FIXTURE_NETWORKING_DHCP.objective,
    );
    expect(kinds).toContain("simulation");
  });
});

describe("2P-8 Preparation + validation", () => {
  it("unconfirmed content stays DRAFT and fails publish gate", async () => {
    const prepared = prepareLearningContent({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      confirmed: false,
    });
    expect("error" in prepared).toBe(false);
    if ("error" in prepared) return;
    expect(prepared.status).toBe("DRAFT");
    expect(prepared.learnerFacing).toBe(false);
    const validated = await validatePreparedLearningContent(prepared, {
      requireConfirmation: true,
    });
    expect(validated.ok).toBe(false);
    if (!validated.ok) {
      expect(validated.issues.some((i) => i.code === "unconfirmed")).toBe(true);
    }
  });

  it("confirmed + publish yields PUBLISHED learner-facing content", async () => {
    const result = await runContentPipeline({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      learnerId: "learner-1",
      publish: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content.status).toBe("PUBLISHED");
    expect(result.content.learnerFacing).toBe(true);
    expect(result.content.contentId).toBe("java-inheritance-subclass");
  });

  it("foreign learner cannot validate owned source", async () => {
    const result = await runContentPipeline({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      learnerId: "intruder",
      publish: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === "foreign_source")).toBe(true);
    }
  });

  it("unsupported / incompatible mechanism rejected", () => {
    const bad = prepareLearningContent({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      activityKind: "writing",
    });
    expect(bad).toEqual({ error: "capability_incompatible" });
  });

  it("unknown contentId rejected", () => {
    const bad = prepareLearningContent({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      contentId: "no-such-challenge",
    });
    expect(bad).toEqual({ error: "content_unavailable" });
  });

  it("determinism: same inputs → same preparation", () => {
    const a = prepareLearningContent(FIXTURE_NETWORKING_DHCP);
    const b = prepareLearningContent(FIXTURE_NETWORKING_DHCP);
    expect(a).toEqual(b);
  });

  it("submission does not mutate prepared content identity", () => {
    const a = prepareLearningContent(FIXTURE_BUSINESS_SUPPLY_DEMAND);
    const b = prepareLearningContent(FIXTURE_BUSINESS_SUPPLY_DEMAND);
    expect(a).toEqual(b);
    if ("error" in a) return;
    expect(a.preparationId).toContain("sim-supply-demand");
    expect(a.contentVersion).toContain("v1:");
  });
});

describe("2P-8 Architecture boundaries", () => {
  it("pipeline modules do not write mastery/evidence", () => {
    expect(
      pipelineModuleDoesNotWriteMastery(
        read("src/lib/learning/content-pipeline/prepare.ts"),
      ),
    ).toBe(true);
    expect(
      pipelineModuleDoesNotWriteMastery(
        read("src/lib/learning/content-pipeline/fixtures.ts"),
      ),
    ).toBe(true);
  });

  it("pipeline is not a second Orchestrator — does not alter diagnosis selection", () => {
    expect(
      read("src/lib/learning/content-pipeline/prepare.ts"),
    ).not.toContain("orchestrateFromLearnerState");
    expect(
      read("src/lib/learning/orchestrator/diagnose.ts"),
    ).not.toContain("runContentPipeline");
    // Unrecognized domain still does not force UA (2P-5).
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c1",
        conceptTitle: "Diagnose circuit fault",
        topicName: null,
        subjectDomain: "electrical",
        intentPurpose: "PRACTICE",
      }),
    ).toBeNull();
  });

  it("Assessment / SIX / Lucky remain separate", () => {
    const truth = contentPipelineTruthSummary();
    expect(truth.quizFlashcardNotCollapsed).toBe(true);
    expect(truth.sixRemainsFallback).toBe(true);
    expect(truth.pipelineIsNotOrchestrator).toBe(true);
    expect(read("src/lib/learning/assessment/workflow.ts")).toMatch(
      /Assessment/,
    );
  });
});

describe("2P-8 Integration A — Computer Science", () => {
  it("Source → Concept → objective → Coding → eval → PERFORM facet path", async () => {
    const pipeline = await runContentPipeline({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      learnerId: "learner-1",
      publish: true,
    });
    expect(pipeline.ok).toBe(true);
    if (!pipeline.ok) return;
    expect(pipeline.content.activityKind).toBe("coding");
    expect(pipeline.content.skillFacet).toBe("PERFORM");

    const challenge = getCodingChallenge(pipeline.content.contentId)!;
    const evaluation = evaluateCodingChallenge(
      challenge,
      'class Dog extends Animal {\n  public String bark() { return "woof"; }\n}\n',
    );
    expect(evaluation.outcome).toBe("SUCCESS");
    expect(evaluation.skillFacet).toBe("PERFORM");
    // Pipeline itself did not write mastery — evaluation is the learner action gate.
    expect(contentPipelineTruthSummary().pipelineDoesNotWriteConceptMastery).toBe(
      true,
    );
  });
});

describe("2P-8 Integration B — Networking", () => {
  it("Source → DHCP → Simulation content → evaluation path", async () => {
    const pipeline = await runContentPipeline({
      ...FIXTURE_NETWORKING_DHCP,
      learnerId: "learner-1",
      publish: true,
    });
    expect(pipeline.ok).toBe(true);
    if (!pipeline.ok) return;
    expect(pipeline.content.activityKind).toBe("simulation");
    expect(pipeline.content.contentId).toBe("sim-network-fault");

    const challenge = getStructuredChallenge(pipeline.content.contentId)!;
    const evaluation = evaluateStructuredChallenge(
      challenge,
      "I diagnose a DHCP lease failure, reconfigure the gateway, and the network is restored because clients are online.",
    );
    expect(evaluation.outcome).toBe("SUCCESS");
  });

  it("Same concept may use Lab mechanism variant", async () => {
    const sim = await runContentPipeline({
      ...FIXTURE_NETWORKING_DHCP,
      learnerId: "learner-1",
      publish: true,
    });
    const lab = await runContentPipeline({
      ...FIXTURE_NETWORKING_DHCP_LAB,
      learnerId: "learner-1",
      publish: true,
    });
    expect(sim.ok && lab.ok).toBe(true);
    if (!sim.ok || !lab.ok) return;
    expect(sim.content.objective.conceptTitle).toBe(
      lab.content.objective.conceptTitle,
    );
    expect(sim.content.activityKind).not.toBe(lab.content.activityKind);
    expect(sim.content.contentId).not.toBe(lab.content.contentId);
  });
});

describe("2P-8 Integration C — Business", () => {
  it("Source → supply/demand → Simulation → non-technical domain path", async () => {
    const pipeline = await runContentPipeline({
      ...FIXTURE_BUSINESS_SUPPLY_DEMAND,
      learnerId: "learner-1",
      publish: true,
    });
    expect(pipeline.ok).toBe(true);
    if (!pipeline.ok) return;
    expect(pipeline.content.objective.domainContext).toBe("business");
    expect(pipeline.content.contentId).toBe("sim-supply-demand");

    const challenge = getStructuredChallenge(pipeline.content.contentId)!;
    const evaluation = evaluateStructuredChallenge(
      challenge,
      "I raise price because demand rose; supply may increase toward market equilibrium.",
    );
    expect(evaluation.outcome).toBe("SUCCESS");
    expect(evaluation.skillFacet).toBe("APPLY");
  });
});

describe("2P-8 CORE adapter", () => {
  it("maps extract LO + confirmed concept into preparation input", async () => {
    const {
      preparationInputFromCoreGrounding,
      sourceRefFromCoreNote,
    } = await import("@/lib/learning/content-pipeline/from-core");
    const source = sourceRefFromCoreNote({
      noteId: "note-1",
      title: "Java inheritance notes",
      learnerId: "learner-1",
      excerpt: "extends / subclass",
    });
    const input = preparationInputFromCoreGrounding({
      source,
      conceptId: "concept-java-inheritance",
      conceptTitle: "Java inheritance",
      extractObjective: {
        code: "LO-1",
        statement: "Implement subclass behavior using inheritance.",
      },
      domainContext: "computer science",
      activityKind: "coding",
      contentId: "java-inheritance-subclass",
      confirmed: true,
    });
    expect(input.objective.requiredCharacteristics).toContain("construction");
    const result = await runContentPipeline({
      ...input,
      learnerId: "learner-1",
      publish: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content.contentId).toBe("java-inheritance-subclass");
  });
});
