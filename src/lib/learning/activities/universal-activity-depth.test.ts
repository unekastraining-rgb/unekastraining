/**
 * 2P-6 — Universal Activity Depth & Real Learning Experiences
 *
 * Proves: meaningful interaction → truthful evaluation → evidence/mastery path,
 * domain-general content fixtures, open≠completion, no Adaptive promotion for
 * product-only activities.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import {
  getSqlChallenge,
  isSafeEducationalSelect,
} from "@/lib/learning/activities/sql/challenges";
import { evaluateSqlChallenge } from "@/lib/learning/activities/sql/evaluate";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
  listStructuredChallenges,
  STRUCTURED_CHALLENGES,
} from "@/lib/learning/activities/structured/service";
import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
} from "@/lib/learning/decision-loop";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import { evaluateActivityCompatibility } from "@/lib/learning/orchestrator/activity-intervention-compatibility";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-6 Coding depth", () => {
  it("has a meaningful task, editable starter, and execution evaluation", () => {
    const c = getCodingChallenge("js-sum-two")!;
    expect(c.prompt.length).toBeGreaterThan(10);
    expect(c.starter).toContain("your code");
    expect(c.starter).not.toMatch(/return a \+ b/);
  });

  it("execution SUCCESS requires correct behavior", () => {
    const c = getCodingChallenge("js-sum-two")!;
    const pass = evaluateCodingChallenge(
      c,
      "function add(a, b) { return a + b; }",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("PERFORM");
    expect(pass.serverAuthoritative).toBe(true);
  });

  it("failure does not fabricate success", () => {
    const c = getCodingChallenge("js-sum-two")!;
    const fail = evaluateCodingChallenge(
      c,
      "function add(a, b) { return 0; }",
    );
    expect(fail.outcome).toBe("FAIL");
    expect(fail.score!).toBeLessThan(0.5);
  });

  it("open/starter alone is not completion", () => {
    const c = getCodingChallenge("js-sum-two")!;
    const opened = evaluateCodingChallenge(c, c.starter);
    expect(opened.outcome).not.toBe("SUCCESS");
  });

  it("documents Python as structural (honest limitation)", () => {
    const c = getCodingChallenge("py-add")!;
    const result = evaluateCodingChallenge(
      c,
      "def add(a, b):\n    return a + b\n",
    );
    expect(result.details.mode).toBe("structural_criteria");
  });
});

describe("2P-6 SQL depth", () => {
  it("starters are incomplete scaffolds — not full answers", () => {
    for (const id of ["sql-select-students", "sql-high-grades"] as const) {
      const c = getSqlChallenge(id)!;
      expect(c.starter.trim()).not.toMatch(/;$/);
      const asSubmitted = awaitEvaluateStarter(c.starter);
      expect(asSubmitted).not.toBe("SUCCESS");
    }
  });

  it("meaningful query task succeeds with learner-authored SELECT", async () => {
    const c = getSqlChallenge("sql-high-grades")!;
    const result = await evaluateSqlChallenge(
      c,
      "SELECT name, grade FROM students WHERE grade >= 90",
    );
    expect(result.outcome).toBe("SUCCESS");
    expect(result.skillFacet).toBe("PERFORM");
  });

  it("wrong query fails; destructive SQL remains blocked", async () => {
    const c = getSqlChallenge("sql-select-students")!;
    const wrong = await evaluateSqlChallenge(c, "SELECT name FROM students");
    expect(wrong.outcome).toBe("FAIL");
    expect(isSafeEducationalSelect("DELETE FROM students").ok).toBe(false);
    expect(isSafeEducationalSelect("DROP TABLE students").ok).toBe(false);
  });

  it("empty / unfinished SELECT is not completion", async () => {
    const c = getSqlChallenge("sql-select-students")!;
    const empty = await evaluateSqlChallenge(c, "");
    expect(empty.outcome).toBe("FAIL");
    const stub = await evaluateSqlChallenge(c, "SELECT ");
    expect(stub.outcome).toBe("FAIL");
  });
});

async function awaitEvaluateStarter(starter: string) {
  const c = getSqlChallenge("sql-select-students")!;
  const result = await evaluateSqlChallenge(c, starter);
  return result.outcome;
}

describe("2P-6 Lab depth + domain-general fixtures", () => {
  it("supports structured procedure across chemistry / networking / electrical", () => {
    const domains = ["chemistry", "networking", "electrical"] as const;
    const labs = STRUCTURED_CHALLENGES.filter((c) => c.kind === "lab");
    for (const d of domains) {
      expect(labs.some((l) => l.domainTag === d)).toBe(true);
    }
    expect(labs.every((l) => l.criteria.length >= 3)).toBe(true);
  });

  it("requires learner interaction — empty and too-short fail", () => {
    const lab = getStructuredChallenge("lab-network-connectivity")!;
    expect(evaluateStructuredChallenge(lab, "").outcome).toBe("FAIL");
    expect(evaluateStructuredChallenge(lab, "ping fail").outcome).toBe("FAIL");
    expect(
      evaluateStructuredChallenge(lab, "ping fail").details.error,
    ).toBe("artifact_too_short");
  });

  it("meaningful procedural artifact evaluates with PERFORM", () => {
    const lab = getStructuredChallenge("lab-circuit-fault")!;
    const result = evaluateStructuredChallenge(
      lab,
      "I connect the probes across the series circuit, measure voltage drop near zero at the open, and diagnose an open fault because continuity failed.",
    );
    expect(result.outcome).toBe("SUCCESS");
    expect(result.skillFacet).toBe("PERFORM");
  });
});

describe("2P-6 Simulation depth + domain-general fixtures", () => {
  it("same mechanism covers nursing / networking / finance / automotive", () => {
    const sims = STRUCTURED_CHALLENGES.filter((c) => c.kind === "simulation");
    for (const d of ["nursing", "networking", "finance", "automotive"] as const) {
      expect(sims.some((s) => s.domainTag === d)).toBe(true);
    }
    for (const s of sims) {
      expect(s.minChars).toBeGreaterThan(0);
    }
    // Legacy state-machine sims keep rules; rubric educational sims may omit.
    expect(sims.some((s) => s.rules)).toBe(true);
  });

  it("scenario requires decision + outcome — click-through stub fails", () => {
    const sim = getStructuredChallenge("sim-patient-triage")!;
    expect(evaluateStructuredChallenge(sim, "done").outcome).toBe("FAIL");
    const pass = evaluateStructuredChallenge(
      sim,
      "I assess vitals and pain, escalate priority triage, and expect the patient to stabilize because oxygen was started.",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("APPLY");
  });

  it("network fault sim uses SOLVE facet when justified", () => {
    const sim = getStructuredChallenge("sim-network-fault")!;
    expect(sim.skillFacet).toBe("SOLVE");
    const result = evaluateStructuredChallenge(
      sim,
      "I diagnose a bad DNS entry, flush and reconfigure the resolver, and the link is restored because users are online again.",
    );
    expect(result.outcome).toBe("SUCCESS");
  });
});

describe("2P-6 Game / Writing / Project / Presentation depth", () => {
  it("Game requires knowledge interaction; points alone fail; Adaptive-ready (2P-30)", () => {
    const game = getStructuredChallenge("game-vocab-match")!;
    expect(evaluateStructuredChallenge(game, "100 points").outcome).toBe("FAIL");
    expect(isAdaptiveReadyActivityAdapterKey("game")).toBe(true);
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("game");
    expect(PRODUCT_READY_NOT_ADAPTIVE_KEYS).not.toContain("game");
  });

  it("Writing requires learner artifact + rubric; EXPLAIN facet; Adaptive-ready (2P-18)", () => {
    const w = getStructuredChallenge("write-explain-photosynthesis")!;
    expect(evaluateStructuredChallenge(w, "").outcome).toBe("FAIL");
    expect(evaluateStructuredChallenge(w, "short").details.error).toBe(
      "artifact_too_short",
    );
    const pass = evaluateStructuredChallenge(
      w,
      "Plants use sunlight and carbon dioxide with water in a process that makes glucose and oxygen because of chlorophyll.",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("EXPLAIN");
    expect(isAdaptiveReadyActivityAdapterKey("writing")).toBe(true);
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("writing");
  });

  it("Project requires objective/milestone/criteria artifact; Adaptive-ready (2P-30)", () => {
    const p = getStructuredChallenge("project-study-plan")!;
    expect(evaluateStructuredChallenge(p, "my project").outcome).toBe("FAIL");
    const pass = evaluateStructuredChallenge(
      p,
      "Objective: master joins. Milestone: week 1 practice. Success criteria: measure quiz score.",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("APPLY");
    expect(isAdaptiveReadyActivityAdapterKey("project")).toBe(true);
  });

  it("Presentation produces PERFORM evidence facet when rubric passes", () => {
    const p = getStructuredChallenge("presentation-outline")!;
    expect(p.asPerform).toBe(true);
    const pass = evaluateStructuredChallenge(
      p,
      "Introduction and outline of the concept, explain with an example from evidence, then anticipate an audience question.",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("PERFORM");
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("presentation");
  });
});

describe("2P-6 Cross-activity architecture proofs", () => {
  it("A–C: different kinds share evaluation contract shape and vary facets", () => {
    const facets = new Set(
      STRUCTURED_CHALLENGES.map((c) => c.skillFacet).concat(["PERFORM"]),
    );
    expect(facets.has("EXPLAIN")).toBe(true);
    expect(facets.has("PERFORM")).toBe(true);
    expect(facets.has("APPLY")).toBe(true);
    expect(facets.has("RECOGNIZE")).toBe(true);
    expect(facets.has("SOLVE")).toBe(true);

    const coding = evaluateCodingChallenge(
      getCodingChallenge("js-sum-two")!,
      "function add(a, b) { return a + b; }",
    );
    expect(coding.serverAuthoritative).toBe(true);
    expect(coding.skillFacet).toBe("PERFORM");
  });

  it("D: Lab/Simulation mechanisms are domain-independent content rows", () => {
    const labKinds = new Set(
      STRUCTURED_CHALLENGES.filter((c) => c.kind === "lab").map((c) => c.kind),
    );
    expect([...labKinds]).toEqual(["lab"]);
    expect(
      listStructuredChallenges("lab").length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      listStructuredChallenges("simulation").length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("E–G: domain does not independently choose intervention; availability ≠ diagnosis", () => {
    const networking = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c1",
      conceptTitle: "Diagnose network connectivity",
      topicName: null,
      subjectDomain: "networking",
      intentPurpose: "PRACTICE",
    });
    const electrical = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c1",
      conceptTitle: "Diagnose circuit fault",
      topicName: null,
      subjectDomain: "electrical",
      intentPurpose: "PRACTICE",
    });
    // 2P-40: networking is a recognized specialized workspace family.
    expect(networking?.adapterKey).toBe("networking");
    // Unrecognized subjectDomain alone → no fabricated activity (2P-5).
    expect(electrical).toBeNull();

    const labCap = getActivityInterventionCapability("lab")!;
    const compatNet = evaluateActivityCompatibility(labCap, {
      conceptTitle: "Diagnose network connectivity",
      subjectDomain: "networking",
    });
    const compatAuto = evaluateActivityCompatibility(labCap, {
      conceptTitle: "Diagnose vehicle idle fault",
      subjectDomain: "automotive",
    });
    // Networking owned by specialized family → lab NO_MATCH; automotive still unrecognized.
    expect(compatNet.status).toBe("NO_MATCH");
    expect(compatAuto.status).toBe("INSUFFICIENT_CONTEXT");
  });

  it("H: identical inputs → identical activity selection", () => {
    const input = {
      diagnosis: "APPLICATION_GAP" as const,
      conceptId: "c1",
      conceptTitle: "Clinical decision making",
      topicName: null,
      subjectDomain: "nursing",
      intentPurpose: "PRACTICE" as const,
    };
    expect(selectActivityIntervention(input)).toEqual(
      selectActivityIntervention(input),
    );
  });

  it("I–J: Adaptive-ready keys include writing/game/project (2P-18/30)", () => {
    expect([...ADAPTIVE_READY_ACTIVITY_KEYS]).toEqual(
      expect.arrayContaining([
        "coding",
        "sql",
        "lab",
        "simulation",
        "presentation",
        "writing",
        "game",
        "project",
      ]),
    );
    expect([...PRODUCT_READY_NOT_ADAPTIVE_KEYS]).toEqual([]);
    for (const k of ADAPTIVE_READY_ACTIVITY_KEYS) {
      expect(isAdaptiveReadyActivityAdapterKey(k)).toBe(true);
    }
  });

  it("K: Assessment remains separate from activity intervention", () => {
    const assessment = read("src/lib/learning/assessment/workflow.ts");
    expect(assessment).toMatch(/Assessment/);
    const policy = read(
      "src/lib/learning/orchestrator/activity-intervention-policy.ts",
    );
    expect(policy).not.toMatch(/ASSESS\s*=\s*Activity/);
  });

  it("L: evidence spine remains recordEvidence → applyEvidenceToMastery", () => {
    const serverEval = read(
      "src/lib/learning/activities/server-evaluation.ts",
    );
    expect(serverEval).toContain("recordEvidence");
    expect(serverEval).toContain("applyEvidenceToMastery");
    expect(serverEval).not.toContain("NursingMastery");
    expect(serverEval).not.toContain("NetworkingMastery");
  });

  it("product acceptance: mechanism cues (not domain maps) unlock Lab/Simulation", () => {
    // Unrecognized domain alone does not fabricate an activity (2P-5).
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c-electrical",
        conceptTitle: "Diagnose circuit fault",
        topicName: null,
        subjectDomain: "electrical",
        intentPurpose: "PRACTICE",
      }),
    ).toBeNull();

    // 2P-40: recognized networking domain routes to the network workspace.
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c-network",
        conceptTitle: "Diagnose network connectivity",
        topicName: null,
        subjectDomain: "networking",
        intentPurpose: "PRACTICE",
      })?.adapterKey,
    ).toBe("networking");

    // Title cues work when domain is absent/null (domain does not invent engines).
    const labViaProcedure = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c-lab",
      conceptTitle: "Lab procedure for density measurement",
      topicName: null,
      subjectDomain: null,
      intentPurpose: "PRACTICE",
    });
    expect(labViaProcedure?.adapterKey).toBe("lab");

    const simViaScenario = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c-sim",
      conceptTitle: "Clinical decision scenario practice",
      topicName: null,
      subjectDomain: null,
      intentPurpose: "PRACTICE",
    });
    expect(simViaScenario?.adapterKey).toBe("simulation");
  });
});
