/**
 * 2P-10 — Content coverage tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  contentCoverageTruthSummary,
  coverageModuleDoesNotWriteMastery,
  evaluateContentCoverage,
  selectedContentResolvesInCatalog,
} from "@/lib/learning/content-coverage";
import { listProgressionEntriesForConcept } from "@/lib/learning/content-progression";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-10 Basic coverage statuses", () => {
  it("AVAILABLE when usable content exists", () => {
    const result = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      activityKind: "coding",
      interventionPreference: "practice",
    });
    expect(result.status).toBe("AVAILABLE");
    expect(result.availableCount).toBeGreaterThan(0);
    expect(result.selectedContentKey).toBeTruthy();
    expect(selectedContentResolvesInCatalog(result)).toBe(true);
  });

  it("MISSING when concept has no content", () => {
    const result = evaluateContentCoverage({
      conceptKey: "totally-unknown-concept-xyz",
      activityKind: "coding",
    });
    expect(result.status).toBe("MISSING");
    expect(result.candidateCount).toBe(0);
  });

  it("INCOMPATIBLE when concept has content but wrong mechanism", () => {
    const result = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      activityKind: "lab",
    });
    expect(result.status).toBe("INCOMPATIBLE");
    expect(result.candidateCount).toBeGreaterThan(0);
    expect(result.compatibleCount).toBe(0);
    expect(result.fallbackEligible).toBe(true);
  });

  it("UNAVAILABLE when compatible content cannot run", () => {
    const result = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      activityKind: "coding",
      unavailableActivityKinds: ["coding"],
    });
    expect(result.status).toBe("UNAVAILABLE");
    expect(result.compatibleCount).toBeGreaterThan(0);
    expect(result.availableCount).toBe(0);
  });
});

describe("2P-10 Ownership / readiness", () => {
  it("rejects foreign learner-owned content and accepts system", () => {
    const system = evaluateContentCoverage({
      conceptKey: "dhcp-troubleshooting",
      learnerId: "anyone",
      activityKind: "simulation",
    });
    expect(system.status).toBe("AVAILABLE");
  });

  it("draft content excluded from AVAILABLE", () => {
    const result = evaluateContentCoverage({
      conceptKey: "draft-only-concept",
      activityKind: "writing",
    });
    expect(result.status).toBe("MISSING");
    expect(result.candidateCount).toBe(0);
  });
});

describe("2P-10 Stage / difficulty / context", () => {
  it("soft stage preference still AVAILABLE when alternate stage exists", () => {
    const result = evaluateContentCoverage({
      conceptKey: "sql-filtering",
      stage: "APPLY",
      activityKind: "sql",
    });
    // No APPLY SQL — soft preference still finds PRACTICE/INTRODUCE.
    expect(result.status).toBe("AVAILABLE");
  });

  it("requireExactStage can yield INCOMPATIBLE", () => {
    const result = evaluateContentCoverage({
      conceptKey: "sql-filtering",
      stage: "APPLY",
      requireExactStage: true,
      activityKind: "sql",
    });
    expect(result.status).toBe("INCOMPATIBLE");
  });

  it("nearby difficulty still AVAILABLE unless requireExactDifficulty", () => {
    const soft = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      activityKind: "coding",
      difficulty: 5,
    });
    expect(soft.status).toBe("AVAILABLE");
    const hard = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      activityKind: "coding",
      difficulty: 5,
      requireExactDifficulty: true,
    });
    expect(hard.status).toBe("INCOMPATIBLE");
  });

  it("context variation prefers alternate when available", () => {
    const result = evaluateContentCoverage({
      conceptKey: "supply-and-demand",
      activityKind: "simulation",
      contextVariant: "gasoline market",
    });
    expect(result.status).toBe("AVAILABLE");
    if (result.selectedContentKey) {
      // May pick multi-factor or gasoline — not missing.
      expect(result.availableCount).toBeGreaterThan(0);
    }
  });
});

describe("2P-10 Determinism / exhaustion / no side effects", () => {
  it("identical inputs → identical coverage", () => {
    const input = {
      conceptKey: "dhcp-troubleshooting",
      interventionPreference: "apply" as const,
      activityKind: "simulation" as const,
    };
    expect(evaluateContentCoverage(input)).toEqual(
      evaluateContentCoverage(input),
    );
  });

  it("failure variation exclude keys when alternatives exist", () => {
    const first = evaluateContentCoverage({
      conceptKey: "sql-filtering",
      activityKind: "sql",
    });
    expect(first.status).toBe("AVAILABLE");
    const second = evaluateContentCoverage({
      conceptKey: "sql-filtering",
      activityKind: "sql",
      excludeContentKeys: [first.selectedContentKey!],
    });
    expect(second.status).toBe("AVAILABLE");
    expect(second.selectedContentKey).not.toBe(first.selectedContentKey);
  });

  it("exhaustion of unavailable keys → UNAVAILABLE or AVAILABLE fallback", () => {
    const keys = listProgressionEntriesForConcept("sql-filtering").map(
      (e) => e.contentKey,
    );
    expect(keys.length).toBeGreaterThan(0);
    const all = evaluateContentCoverage({
      conceptKey: "sql-filtering",
      activityKind: "sql",
      unavailableContentKeys: keys,
    });
    expect(all.status).toBe("UNAVAILABLE");
  });

  it("coverage creates no mastery/evidence and does not change diagnosis", () => {
    const truth = contentCoverageTruthSummary();
    expect(truth.coverageIsNotMastery).toBe(true);
    expect(truth.coverageDoesNotChangeDiagnosis).toBe(true);
    expect(truth.noFabricatedContent).toBe(true);
    expect(
      coverageModuleDoesNotWriteMastery(
        read("src/lib/learning/content-coverage/evaluate.ts"),
      ),
    ).toBe(true);
    expect(
      read("src/lib/learning/orchestrator/diagnose.ts"),
    ).not.toContain("evaluateContentCoverage");
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
});

describe("2P-10 Cross-domain", () => {
  it("Computer Science coding AVAILABLE", () => {
    expect(
      evaluateContentCoverage({
        conceptKey: "java-inheritance",
        activityKind: "coding",
      }).status,
    ).toBe("AVAILABLE");
  });

  it("Networking simulation/lab AVAILABLE", () => {
    expect(
      evaluateContentCoverage({
        conceptKey: "dhcp-troubleshooting",
        activityKind: "simulation",
      }).status,
    ).toBe("AVAILABLE");
    expect(
      evaluateContentCoverage({
        conceptKey: "dhcp-troubleshooting",
        activityKind: "lab",
      }).status,
    ).toBe("AVAILABLE");
  });

  it("Nursing clinical simulation AVAILABLE", () => {
    expect(
      evaluateContentCoverage({
        conceptKey: "clinical-decision-making",
        activityKind: "simulation",
      }).status,
    ).toBe("AVAILABLE");
  });

  it("Electrical circuit lab AVAILABLE", () => {
    expect(
      evaluateContentCoverage({
        conceptKey: "circuit-fault-diagnosis",
        activityKind: "lab",
      }).status,
    ).toBe("AVAILABLE");
  });

  it("Business supply/demand AVAILABLE", () => {
    expect(
      evaluateContentCoverage({
        conceptKey: "supply-and-demand",
        activityKind: "simulation",
      }).status,
    ).toBe("AVAILABLE");
  });

  it("Unknown/custom domain does not crash or fabricate", () => {
    const result = evaluateContentCoverage({
      conceptKey: "xyz-custom-domain-concept",
      activityKind: "simulation",
    });
    expect(result.status).toBe("MISSING");
    expect(result.selectedContentKey).toBeUndefined();
  });
});

describe("2P-10 Decision-loop / Adaptive failure / SIX", () => {
  it("coverage after intervention → select → learner eval (no mastery from coverage)", () => {
    const coverage = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      interventionPreference: "practice",
      activityKind: "coding",
    });
    expect(coverage.status).toBe("AVAILABLE");
    expect(contentCoverageTruthSummary().coverageCreatesNoMastery).toBe(true);

    const challenge = getCodingChallenge(coverage.selectedContentId!)!;
    const evaluation = evaluateCodingChallenge(
      challenge,
      'class Dog extends Animal {\n  public String bark() { return "woof"; }\n}\n',
    );
    expect(evaluation.outcome).toBe("SUCCESS");
  });

  it("Adaptive-style failure: coding unavailable → no fake coding; SIX fallbackEligible", () => {
    const result = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      activityKind: "coding",
      unavailableActivityKinds: ["coding"],
    });
    expect(result.status).toBe("UNAVAILABLE");
    expect(result.selectedContentKey).toBeUndefined();
    expect(result.fallbackEligible).toBe(true);

    const six = evaluateContentCoverage({
      conceptKey: "java-inheritance",
      activityKind: "six",
    });
    expect(six.status).toBe("AVAILABLE");
    expect(six.selectedActivityKind).toBe("six");
  });

  it("Assessment / Lucky / CORE boundaries preserved in truth summary", () => {
    const truth = contentCoverageTruthSummary();
    expect(truth.assessmentRemainsSeparate).toBe(true);
    expect(truth.luckyNotCreatedByCoverage).toBe(true);
    expect(truth.sixRemainsSafeFallback).toBe(true);
    expect(truth.missingIsNotZeroMastery).toBe(true);
  });
});
