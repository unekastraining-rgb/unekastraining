/**
 * 2P-32 — Universal content depth & learning quality tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  auditCatalogIntegrity,
  catalogIntegrityOk,
  contentQualityFieldContract,
  contentQualityApplicabilityForKind,
  contentQualityContractTruthSummary,
  validateContentQualityItem,
  isMeaningfulSuccessLooksLike,
  isActionableMisconception,
  buildContentDepthDensityReport,
  auditContentDepthSparsity,
  buildContentDensityMatrix,
  buildAdaptiveCatalogDepthMatrix,
  getDesignTimeContentPack,
} from "@/lib/learning/content-production";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
} from "@/lib/learning/activities/structured/service";
import {
  getProgressionEntry,
  listProgressionEntriesForConcept,
  selectProgressionContent,
} from "@/lib/learning/content-progression";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-32 content quality contract", () => {
  it("distinguishes required / optional / N/A fields", () => {
    const fields = contentQualityFieldContract();
    expect(fields.some((f) => f.field === "purpose" && f.adaptiveDefault === "required")).toBe(
      true,
    );
    expect(
      fields.some((f) => f.field === "misconceptions" && f.adaptiveDefault === "optional"),
    ).toBe(true);
    expect(contentQualityApplicabilityForKind("coding", "successCriteria")).toBe(
      "required",
    );
    expect(contentQualityContractTruthSummary().misconceptionsAreTargetsNotDiagnoses).toBe(
      true,
    );
  });

  it("rejects placeholder successLooksLike and vague misconceptions", () => {
    expect(isMeaningfulSuccessLooksLike("Complete the activity successfully.")).toBe(
      false,
    );
    expect(
      isMeaningfulSuccessLooksLike(
        "Your INNER JOIN should project name and course for matching enrollments.",
      ),
    ).toBe(true);
    expect(isActionableMisconception("Learner may misunderstand this.")).toBe(false);
    expect(
      isActionableMisconception(
        "Subclass automatically inherits private fields directly.",
      ),
    ).toBe(true);
  });

  it("validates representative Adaptive depth items", () => {
    const issues = validateContentQualityItem({
      activityKind: "coding",
      contentId: "java-polymorphism-challenge",
      requireAdaptiveDepth: true,
    });
    expect(issues).toEqual([]);

    const sqlIssues = validateContentQualityItem({
      activityKind: "sql",
      contentId: "sql-join-customers-orders",
      requireAdaptiveDepth: true,
    });
    expect(sqlIssues).toEqual([]);
  });
});

describe("2P-32 catalog integrity + depth", () => {
  it("keeps catalog integrity clean after depth pack merge", () => {
    const issues = auditCatalogIntegrity();
    expect(issues).toEqual([]);
    expect(catalogIntegrityOk()).toBe(true);
  });

  it("deepens java-inheritance with distinct APPLY/CHALLENGE contentIds", () => {
    const apply = getProgressionEntry("cs-inheritance-apply")!;
    const challenge = getProgressionEntry("cs-inheritance-challenge")!;
    const retain = getProgressionEntry("cs-inheritance-retain")!;
    expect(apply.contentId).toBe("java-inheritance-vehicle");
    expect(challenge.contentId).toBe("java-polymorphism-challenge");
    expect(retain.stage).toBe("RETAIN");
    expect(apply.contentId).not.toBe(challenge.contentId);
    expect(getCodingChallenge("java-inheritance-vehicle")?.misconceptionTargets?.length).toBeGreaterThan(
      0,
    );
  });

  it("provides meaningful SQL JOIN variation (students vs customers)", () => {
    const a = getSqlChallenge("sql-join-enrollments")!;
    const b = getSqlChallenge("sql-join-customers-orders")!;
    expect(a.prompt).not.toEqual(b.prompt);
    expect(a.seedSql).not.toEqual(b.seedSql);
    expect(b.misconceptionTargets?.length).toBeGreaterThan(0);
    const apply = getProgressionEntry("sql-join-customers-orders")!;
    expect(apply.contextVariant).toMatch(/customers/i);
  });

  it("reports honest cybersecurity density (not NONE)", () => {
    const rows = buildContentDensityMatrix();
    const cyber = rows.find((r) => r.domain === "Cybersecurity")!;
    expect(cyber.depth).not.toBe("NONE");
    expect(cyber.existingContent).not.toMatch(/^0 dedicated/);

    const adaptive = buildAdaptiveCatalogDepthMatrix();
    expect(adaptive.some((r) => r.domain === "Cybersecurity")).toBe(true);
    expect(adaptive.some((r) => r.domain === "Business")).toBe(true);
  });

  it("builds concept×stage×activity density report without fabrication", () => {
    const report = buildContentDepthDensityReport();
    expect(report.length).toBeGreaterThanOrEqual(10);
    const cs = report.find((r) => r.domain === "CS")!;
    expect(cs.concepts).toBeGreaterThan(0);
    expect(cs.stages).toBeGreaterThan(1);
    expect(cs.variants).toBeGreaterThan(1);
    const cyber = report.find((r) => r.domain === "Cybersecurity")!;
    expect(cyber.activities).toBeGreaterThan(0);
  });

  it("sparsity audit does not require identical depth across domains", () => {
    const flags = auditContentDepthSparsity();
    // Sparse concept flags are informational; cybersecurity must not be empty-domain
    expect(
      flags.some(
        (f) => f.code === "sparse_domain" && f.domain === "Cybersecurity",
      ),
    ).toBe(false);
  });
});

describe("2P-32 representative evaluation still authoritative", () => {
  it("evaluates nursing/business/writing/game/project depth items via rubric", () => {
    const nurse = getStructuredChallenge("sim-nursing-sepsis-challenge")!;
    const nurseEval = evaluateStructuredChallenge(
      nurse,
      "Patient is hypotensive and unstable with possible sepsis; assess vitals first then escalate/notify the provider before routine charting.",
    );
    expect(nurseEval.outcome).not.toBe("FAIL");

    const biz = getStructuredChallenge("sim-price-ceiling-challenge")!;
    const bizEval = evaluateStructuredChallenge(
      biz,
      "A binding ceiling below equilibrium creates a shortage; queues and maintenance quality drop are unintended consequences.",
    );
    expect(bizEval.outcome).not.toBe("FAIL");

    const write = getStructuredChallenge("write-evidence-transfer-challenge")!;
    const writeEval = evaluateStructuredChallenge(
      write,
      "Cities should expand protected bike lanes. A hypothetical survey shows a 20 percent drop in injury rates on protected corridors because safer infrastructure supports ridership without mixing traffic.",
    );
    expect(writeEval.outcome).not.toBe("FAIL");

    const game = getStructuredChallenge("game-security-terms-challenge")!;
    expect(game.criteria.length).toBeGreaterThan(0);
    expect(isAdaptiveReadyActivityAdapterKey("game")).toBe(true);
    expect(isAdaptiveReadyActivityAdapterKey("project")).toBe(true);
  });

  it("variation selection can avoid prior contextVariant", () => {
    const first = selectProgressionContent({
      conceptKey: "sql-joins",
      preferredStages: ["APPLY", "PRACTICE", "CHALLENGE"],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = selectProgressionContent({
      conceptKey: "sql-joins",
      preferredStages: ["APPLY", "PRACTICE", "CHALLENGE"],
      avoidContextVariant: first.entry.contextVariant,
      excludeContentKeys: [first.entry.contentKey],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.entry.contentKey).not.toBe(first.entry.contentKey);
  });

  it("content metadata does not declare learner diagnosis", () => {
    const src = read("src/lib/learning/content-production/enrichment.ts");
    expect(src).toMatch(/not Orchestrator diagnoses/i);
    const contract = read(
      "src/lib/learning/content-production/content-quality-contract.ts",
    );
    expect(contract).toMatch(/never learner diagnosis/i);
  });

  it("design-time depth pack is registered", () => {
    expect(getDesignTimeContentPack("pack-content-depth-2p32")?.packVersion).toBe(
      "depth-v1",
    );
  });

  it("java-inheritance ladder spans introduce→retain stages", () => {
    const stages = new Set(
      listProgressionEntriesForConcept("java-inheritance").map((e) => e.stage),
    );
    expect(stages.has("INTRODUCE")).toBe(true);
    expect(stages.has("PRACTICE")).toBe(true);
    expect(stages.has("APPLY")).toBe(true);
    expect(stages.has("CHALLENGE")).toBe(true);
    expect(stages.has("RETAIN")).toBe(true);
  });
});
