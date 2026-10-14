/**
 * 2P-16 — Adaptive-ready universal catalog depth tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  assessAdaptiveReadyCatalogItem,
  buildAdaptiveCatalogDepthMatrix,
  catalogDepthFieldTiers,
  catalogIntegrityOk,
  educationalMarketSeedIsNotBrokerage,
  listAdaptiveReadySeedAssessments,
  listSeedItems,
  validateAiContentCandidate,
} from "@/lib/learning/content-production";
import { evaluateContentCoverage } from "@/lib/learning/content-coverage";
import {
  selectProgressionContent,
  getProgressionEntry,
} from "@/lib/learning/content-progression";
import { resolveLearningExperience } from "@/lib/learning/experience";
import {
  getActivityContentDescriptor,
  selectActivityContent,
  listMechanismsWithContentForConceptHints,
} from "@/lib/learning/activities/content-contract";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
} from "@/lib/learning/activities/structured/service";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { FIXTURE_CS_JAVA_INHERITANCE } from "@/lib/learning/content-pipeline";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-16 catalog depth contract", () => {
  it("defines required / activity / recommended / optional tiers", () => {
    const tiers = catalogDepthFieldTiers();
    expect(tiers.requiredUniversal).toContain("objective");
    expect(tiers.requiredByActivity.coding).toContain("starter");
    expect(tiers.recommendedDomain).toContain("scaffolds");
    expect(tiers.optionalEnrichment).toContain("accessibility");
  });

  it("seed catalog integrity remains clean", () => {
    expect(catalogIntegrityOk()).toBe(true);
  });
});

describe("2P-16 seed catalog quality", () => {
  it("covers multiple domain families without subject engines", () => {
    const seeds = listSeedItems();
    const families = new Set(seeds.map((s) => s.domainFamily));
    expect(families.has("computer_science")).toBe(true);
    expect(families.has("networking")).toBe(true);
    expect(families.has("nursing")).toBe(true);
    expect(families.has("finance")).toBe(true);
    expect(families.has("electrical")).toBe(true);
    expect(families.has("automotive")).toBe(true);
    expect(families.has("history")).toBe(true);
    expect(families.has("math_science")).toBe(true);
    expect(seeds.length).toBeGreaterThanOrEqual(15);
    expect(seeds.length).toBeLessThan(40);
  });

  it("rejects placeholder objectives on seed items", () => {
    const forbidden = [
      /^explain java\.?$/i,
      /^study networking/i,
      /^answer this question/i,
    ];
    for (const seed of listSeedItems()) {
      const d = getActivityContentDescriptor(seed.activityKind, seed.contentId)!;
      expect(d).toBeTruthy();
      expect(d.objective.trim().length).toBeGreaterThan(20);
      expect(d.task.trim().length).toBeGreaterThan(30);
      for (const re of forbidden) {
        expect(d.objective).not.toMatch(re);
      }
    }
  });

  it("educational market seed is fake-money only", () => {
    expect(educationalMarketSeedIsNotBrokerage()).toBe(true);
    const market = getStructuredChallenge("sim-market-order-edu")!;
    expect(market.prompt.toLowerCase()).toMatch(/fake/);
    expect(market.rules?.realMoney).toBe(false);
    expect(market.rules?.brokerage).toBe(false);
    expect(market.domainTag).toBe("finance");
  });
});

describe("2P-16 cross-domain capability matching", () => {
  it("does not hard-code subject → engine routing in content-production", () => {
    for (const rel of [
      "src/lib/learning/content-production/seed-catalog.ts",
      "src/lib/learning/content-production/adaptive-ready-contract.ts",
      "src/lib/learning/content-production/density-matrix.ts",
    ]) {
      const src = read(rel);
      expect(src).not.toMatch(/if\s*\(\s*subject\s*===/);
      expect(src).not.toMatch(/useClinicalEngine|useElectricalEngine/);
    }
  });

  it("domain alone does not choose Universal Activity intervention", () => {
    expect(
      selectActivityIntervention({
        diagnosis: "APPLICATION_GAP",
        conceptId: "c1",
        conceptTitle: "Clinical prioritization",
        topicName: null,
        subjectDomain: "nursing",
        intentPurpose: "PRACTICE",
      }),
    ).toBeNull();
  });

  it("concept hints map to mechanisms without subject switch", () => {
    expect(
      listMechanismsWithContentForConceptHints("Java exception handling try catch"),
    ).toContain("coding");
    expect(
      listMechanismsWithContentForConceptHints("DNS name resolution troubleshooting"),
    ).toContain("simulation");
    expect(
      listMechanismsWithContentForConceptHints("clinical prioritization acuity nursing"),
    ).toContain("simulation");
    expect(
      listMechanismsWithContentForConceptHints("market order limit order trading finance"),
    ).toContain("simulation");
    expect(
      listMechanismsWithContentForConceptHints("circuit fault voltage electrical"),
    ).toContain("lab");
  });
});

describe("2P-16 progression variation", () => {
  it("same concept supports multiple stages/context variants", () => {
    const a = selectProgressionContent({
      conceptKey: "market-orders",
      preferredStages: ["APPLY"],
    });
    const b = selectProgressionContent({
      conceptKey: "market-orders",
      preferredStages: ["CHALLENGE"],
      avoidContextVariant: a.ok ? a.entry.contextVariant : null,
    });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.entry.contentId).toBe("sim-market-order-edu");
      expect(b.entry.contentId).toBe("sim-market-order-edu");
      expect(a.entry.stage).not.toBe(b.entry.stage);
    }
  });

  it("failure variation excludes content keys when alternatives exist", () => {
    const first = selectProgressionContent({
      conceptKey: "java-exception-handling",
      eligibleActivityKinds: ["coding"],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = selectProgressionContent({
      conceptKey: "java-exception-handling",
      eligibleActivityKinds: ["coding"],
      excludeContentKeys: [first.entry.contentKey],
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.entry.contentKey).not.toBe(first.entry.contentKey);
    }
  });
});

describe("2P-16 coverage + experience", () => {
  it("coverage AVAILABLE for seed concepts with Adaptive-ready activities", () => {
    const coverage = evaluateContentCoverage({
      conceptKey: "market-orders",
      activityKind: "simulation",
    });
    expect(coverage.status).toBe("AVAILABLE");
    expect(coverage.selectedContentId).toBe("sim-market-order-edu");
  });

  it("experience projects for Adaptive-ready coding seed", () => {
    const resolved = resolveLearningExperience({
      conceptId: "concept-java-ex",
      conceptTitle: "Java exception handling",
      activityKind: "coding",
      contentId: "java-exception-try-catch",
    });
    expect(resolved.coverageStatus).toBe("AVAILABLE");
    expect(resolved.experience?.objective.toLowerCase()).toMatch(/try|catch|exception/);
    expect(resolved.experience?.scaffolds.length).toBeGreaterThan(0);
  });
});

describe("2P-16 Adaptive readiness", () => {
  it("Adaptive-ready mechanism seeds pass contract + progression", () => {
    const assessments = listAdaptiveReadySeedAssessments().filter(
      (a) => a.assessment.mechanismAdaptiveReady,
    );
    expect(assessments.length).toBeGreaterThan(8);
    for (const row of assessments) {
      expect(row.assessment.contractComplete).toBe(true);
      expect(row.assessment.progressionPresent).toBe(true);
      expect(row.assessment.adaptiveReadySeed).toBe(true);
    }
  });

  it("Writing seeds are Adaptive-ready after 2P-18", () => {
    const writing = assessAdaptiveReadyCatalogItem({
      activityKind: "writing",
      contentId: "write-history-cause-effect",
    });
    expect(writing.mechanismAdaptiveReady).toBe(true);
    expect(writing.adaptiveReadySeed).toBe(true);
    expect(isAdaptiveReadyActivityAdapterKey("writing")).toBe(true);
  });

  it("coding seed evaluates without fabricating success", () => {
    const c = getCodingChallenge("js-debug-off-by-one")!;
    const fail = evaluateCodingChallenge(c, c.starter);
    expect(fail.outcome).not.toBe("SUCCESS");
    const pass = evaluateCodingChallenge(
      c,
      "function sumTo(n) {\n  let total = 0;\n  for (let i = 0; i < n; i++) total += i;\n  return total;\n}\n",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.skillFacet).toBe("PERFORM");
  });

  it("simulation seed evaluates via rubric evidence path fields", () => {
    const sim = getStructuredChallenge("sim-patient-priority")!;
    const fail = evaluateStructuredChallenge(sim, "ok");
    expect(fail.outcome).not.toBe("SUCCESS");
    const pass = evaluateStructuredChallenge(
      sim,
      "I prioritize Patient B with shortness of breath and low oxygen. I assess airway and give oxygen, then escalate because acuity is higher. Wrong order risks a worsen outcome.",
    );
    expect(pass.outcome).toBe("SUCCESS");
    expect(pass.details.contentId).toBe("sim-patient-priority");
  });
});

describe("2P-16 density matrix derived from live data", () => {
  it("builds domain matrix with non-fabricated counts", () => {
    const matrix = buildAdaptiveCatalogDepthMatrix();
    expect(matrix.find((r) => r.domain === "Computer Science")?.content).toBeGreaterThan(
      0,
    );
    expect(matrix.find((r) => r.domain === "Finance")?.adaptiveReady).toBeGreaterThan(0);
    expect(matrix.find((r) => r.domain === "History")?.content).toBeGreaterThan(0);
    for (const row of matrix) {
      expect(row.concepts).toBeGreaterThanOrEqual(0);
      expect(row.content).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("2P-16 enrichment + authoring + AI", () => {
  it("seed items may carry optional misconception and accessibility metadata", () => {
    const ex = getCodingChallenge("java-exception-try-catch")!;
    expect(ex.misconceptionTargets?.length).toBeGreaterThan(0);
    expect(ex.accessibility?.altDescription).toBeTruthy();
  });

  it("authoring path: add catalog row + progression entry without new engine", () => {
    const entry = getProgressionEntry("fin-market-order-apply");
    expect(entry?.contentId).toBe("sim-market-order-edu");
    const selected = selectActivityContent({
      activityKind: "simulation",
      contentId: "sim-market-order-edu",
    });
    expect(selected?.reason).toBe("explicit_content_id");
  });

  it("AI candidate still cannot write mastery", async () => {
    const result = await validateAiContentCandidate({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      confirmed: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.doesNotWriteMastery).toBe(true);
      expect(result.doesNotWriteEvidence).toBe(true);
    }
  });
});
