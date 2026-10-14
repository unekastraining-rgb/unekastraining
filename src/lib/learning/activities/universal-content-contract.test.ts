/**
 * 2P-7 — Universal Content + Concept Alignment tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  contentTemplateTruthSummary,
  getActivityContentDescriptor,
  listActivityContentDescriptors,
  listMechanismsWithContentForConceptHints,
  selectActivityContent,
} from "@/lib/learning/activities/content-contract";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
  STRUCTURED_CHALLENGES,
} from "@/lib/learning/activities/structured/service";
import { isActivityAdaptiveCompletionEligible } from "@/lib/learning/sequence/activity-adapter";
import { getActivityAdaptiveCompletionContract } from "@/lib/learning/sequence/activity-adaptive-completion";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-7 Content contract", () => {
  it("exposes objective, task, concept hints, domain, and content identity", () => {
    const coding = getActivityContentDescriptor(
      "coding",
      "java-inheritance-subclass",
    )!;
    expect(coding.contentId).toBe("java-inheritance-subclass");
    expect(coding.objective.toLowerCase()).toContain("inheritance");
    expect(coding.task.length).toBeGreaterThan(20);
    expect(coding.domainContext).toBe("computer science");
    expect(coding.conceptHints).toContain("inheritance");
    expect(coding.evaluationMode).toBe("structural");

    const sql = getActivityContentDescriptor("sql", "sql-high-grades")!;
    expect(sql.objective.toLowerCase()).toMatch(/filter|condition/);
    expect(sql.evaluationMode).toBe("sqljs");

    const truth = contentTemplateTruthSummary();
    expect(truth.contentIdIsNotAttemptId).toBe(true);
    expect(truth.noLlmContentGeneration).toBe(true);
    expect(truth.domainDoesNotChooseMechanism).toBe(true);
  });

  it("rejects empty/generic-looking objectives on representative fixtures", () => {
    const forbidden = [
      /^complete the task/i,
      /^practice this concept/i,
      /^solve the problem/i,
      /^enter your answer/i,
    ];
    for (const kind of [
      "coding",
      "sql",
      "lab",
      "simulation",
      "writing",
      "project",
      "presentation",
      "game",
    ] as const) {
      for (const d of listActivityContentDescriptors(kind)) {
        expect(d.objective.trim().length).toBeGreaterThan(12);
        for (const re of forbidden) {
          expect(d.objective).not.toMatch(re);
        }
      }
    }
  });
});

describe("2P-7 Concept integrity", () => {
  it("A: content identity is preserved on evaluation details / descriptors", () => {
    const lab = getStructuredChallenge("lab-network-connectivity")!;
    const evalResult = evaluateStructuredChallenge(
      lab,
      "I configure the gateway IP, ping times out, and diagnose a misconfigured DHCP lease because the client never got an address.",
    );
    expect(evalResult.details.contentId).toBe("lab-network-connectivity");
    expect(evalResult.details.objective).toContain("configure");
  });

  it("B: Adaptive completion rejects concept mismatch (attempt A vs run B)", () => {
    const contract = getActivityAdaptiveCompletionContract("coding")!;
    const result = isActivityAdaptiveCompletionEligible({
      contract,
      attempt: {
        userId: "u1",
        conceptId: "concept-a",
        skillFacet: "PERFORM",
        outcome: "SUCCESS",
        sourceRefJson: JSON.stringify({ kind: "coding_challenge_submit" }),
      },
      expectedLearnerId: "u1",
      expectedConceptId: "concept-b",
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("concept_mismatch");
  });

  it("C: domain change does not change contentId of explicit selection", () => {
    const a = selectActivityContent({
      activityKind: "lab",
      contentId: "lab-circuit-fault",
      subjectDomain: "networking",
    });
    const b = selectActivityContent({
      activityKind: "lab",
      contentId: "lab-circuit-fault",
      subjectDomain: "chemistry",
    });
    expect(a?.contentId).toBe("lab-circuit-fault");
    expect(b?.contentId).toBe("lab-circuit-fault");
    expect(a?.descriptor.objective).toBe(b?.descriptor.objective);
  });

  it("D: activity type remains a mechanism — same concept hints can map to multiple kinds", () => {
    const mechanisms = listMechanismsWithContentForConceptHints(
      "DHCP network troubleshooting connectivity",
    );
    expect(mechanisms).toContain("lab");
    expect(mechanisms).toContain("simulation");
    expect(mechanisms).not.toContain("coding");
  });

  it("E–F: reusable content — selecting twice does not mutate catalog", () => {
    const before = getStructuredChallenge("sim-network-fault")!;
    const snapshot = JSON.stringify(before);
    selectActivityContent({
      activityKind: "simulation",
      conceptTitle: "DHCP troubleshooting",
    });
    selectActivityContent({
      activityKind: "simulation",
      conceptTitle: "DHCP troubleshooting",
    });
    expect(JSON.stringify(getStructuredChallenge("sim-network-fault"))).toBe(
      snapshot,
    );
  });

  it("G: ownership path still rejects foreign concepts in server-evaluation", () => {
    const src = read("src/lib/learning/activities/server-evaluation.ts");
    expect(src).toContain("assertOwnedConcept");
    expect(src).toContain("foreign_concept");
    expect(src).toContain("userId: input.learnerId");
  });
});

describe("2P-7 Deterministic content selection", () => {
  it("same inputs → same content selection", () => {
    const input = {
      activityKind: "coding" as const,
      conceptTitle: "Java inheritance subclass",
    };
    expect(selectActivityContent(input)).toEqual(selectActivityContent(input));
    expect(selectActivityContent(input)?.contentId).toBe(
      "java-inheritance-subclass",
    );
  });

  it("SQL filtering concept selects filter challenge", () => {
    const selected = selectActivityContent({
      activityKind: "sql",
      conceptTitle: "SQL filtering with WHERE conditions",
    });
    expect(selected?.contentId).toBe("sql-high-grades");
  });

  it("explicit contentId wins", () => {
    const selected = selectActivityContent({
      activityKind: "writing",
      contentId: "write-business-proposal",
      conceptTitle: "photosynthesis essay",
    });
    expect(selected?.reason).toBe("explicit_content_id");
    expect(selected?.contentId).toBe("write-business-proposal");
  });

  it("unknown explicit contentId returns null (no fabricate)", () => {
    expect(
      selectActivityContent({
        activityKind: "lab",
        contentId: "does-not-exist",
      }),
    ).toBeNull();
  });
});

describe("2P-7 Domain-general multi-context fixtures", () => {
  it("Lab chemistry / networking / electrical / physics (+ expansion domains)", () => {
    const labs = STRUCTURED_CHALLENGES.filter((c) => c.kind === "lab");
    expect(labs.map((l) => l.domainTag)).toEqual(
      expect.arrayContaining([
        "chemistry",
        "electrical",
        "networking",
        "physics",
      ]),
    );
  });

  it("Simulation nursing / networking / automotive / finance (+ expansion domains)", () => {
    const sims = STRUCTURED_CHALLENGES.filter((c) => c.kind === "simulation");
    const tags = new Set(sims.map((s) => s.domainTag));
    for (const required of [
      "nursing",
      "networking",
      "automotive",
      "finance",
    ]) {
      expect(tags.has(required)).toBe(true);
    }
  });

  it("Writing english + business + history + mathematics; Project programming + business; Presentation history + technical", () => {
    expect(
      STRUCTURED_CHALLENGES.filter((c) => c.kind === "writing").map(
        (c) => c.domainTag,
      ),
    ).toEqual(
      expect.arrayContaining(["english", "business", "history", "mathematics"]),
    );
    expect(
      STRUCTURED_CHALLENGES.filter((c) => c.kind === "project").map(
        (c) => c.domainTag,
      ),
    ).toEqual(expect.arrayContaining(["computer science", "business"]));
    expect(
      STRUCTURED_CHALLENGES.filter((c) => c.kind === "presentation").map(
        (c) => c.domainTag,
      ),
    ).toEqual(expect.arrayContaining(["history", "technical"]));
  });

  it("Game has at least two concept contexts", () => {
    const games = STRUCTURED_CHALLENGES.filter((c) => c.kind === "game");
    expect(games.length).toBeGreaterThanOrEqual(2);
    expect(new Set(games.map((g) => g.domainTag)).size).toBeGreaterThanOrEqual(
      2,
    );
  });
});

describe("2P-7 Representative evaluations", () => {
  it("Coding Java inheritance structural evaluation", () => {
    const c = getCodingChallenge("java-inheritance-subclass")!;
    const fail = evaluateCodingChallenge(c, "class Dog {}");
    expect(fail.outcome).not.toBe("SUCCESS");
    const pass = evaluateCodingChallenge(
      c,
      'class Dog extends Animal {\n  public String bark() { return "woof"; }\n}\n',
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("PERFORM");
  });

  it("SQL filtering challenge still present", () => {
    expect(getSqlChallenge("sql-high-grades")?.objective).toMatch(/filter/i);
  });
});

describe("2P-7 Cross-architecture proofs", () => {
  it("domain does not independently choose intervention (2P-5 preserved)", () => {
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

  it("SIX / Assessment / Adaptive paths remain separate modules", () => {
    expect(
      read("src/lib/learning/activities/adaptive-concept-guard.ts"),
    ).toContain("concept_mismatch");
    expect(read("src/lib/learning/assessment/workflow.ts")).toMatch(
      /Assessment/,
    );
    expect(
      read("src/lib/learning/orchestrator/activity-intervention-policy.ts"),
    ).not.toMatch(/selectActivityContent/);
  });

  it("content selection is not wired as Orchestrator diagnosis", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).not.toContain("selectActivityContent");
  });
});
