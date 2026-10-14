/**
 * 2P-15 — Content production readiness tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  aiContentCandidateTruthSummary,
  assessAuthoringContractFields,
  auditCatalogIntegrity,
  buildContentDensityMatrix,
  catalogIntegrityOk,
  contentLifecycleTruthSummary,
  contentProductionTruthSummary,
  DESIGN_TIME_CONTENT_PACKS,
  isLearnerFacingLifecyclePhase,
  listDesignTimeContentPacks,
  resolveContentLifecyclePhase,
  validateAiContentCandidate,
} from "@/lib/learning/content-production";
import { FIXTURE_CS_JAVA_INHERITANCE } from "@/lib/learning/content-pipeline";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-15 content production readiness", () => {
  it("truth summary preserves architecture safety", () => {
    const t = contentProductionTruthSummary();
    expect(t.doesNotCreateSecondContentSystem).toBe(true);
    expect(t.educationalMarketIsNotBrokerage).toBe(true);
    expect(t.noMassContentProductionInThisPhase).toBe(true);
  });

  it("lifecycle maps existing statuses without new persistence", () => {
    expect(
      resolveContentLifecyclePhase({
        pipelineStatus: "DRAFT",
        progressionReadiness: "READY",
      }),
    ).toBe("DRAFT");
    expect(
      resolveContentLifecyclePhase({
        pipelineStatus: "READY",
        progressionReadiness: "READY",
        catalogResolvable: true,
        coverageAvailable: true,
      }),
    ).toBe("AVAILABLE");
    expect(isLearnerFacingLifecyclePhase("AVAILABLE")).toBe(true);
    expect(contentLifecycleTruthSummary().validateIsNotPersistedStatus).toBe(true);
  });

  it("catalog integrity audit passes on current fixtures", () => {
    expect(catalogIntegrityOk()).toBe(true);
    expect(auditCatalogIntegrity()).toEqual([]);
  });

  it("density matrix includes trading education seed (fake money)", () => {
    const rows = buildContentDensityMatrix();
    const trading = rows.find((r) => r.domain.includes("Stock Market"));
    expect(trading).toBeDefined();
    expect(trading!.depth).not.toBe("NONE");
    expect(trading!.majorGap.toLowerCase()).toMatch(/fake|brokerage|real money/);
  });

  it("design-time packs exist without authoring mass content", () => {
    expect(listDesignTimeContentPacks().length).toBeGreaterThanOrEqual(5);
    const finance = DESIGN_TIME_CONTENT_PACKS.find((p) =>
      p.packId.includes("finance"),
    );
    expect(finance?.primaryActivities).toContain("simulation");
    expect(finance?.domainLabel.toLowerCase()).toMatch(/fake money|trading/i);
  });

  it("authoring contract assessment marks known gaps only", () => {
    const fields = assessAuthoringContractFields();
    expect(fields.find((f) => f.field.startsWith("identity"))?.status).toBe(
      "EXISTING",
    );
    const gaps = fields.filter(
      (f) => f.status === "MISSING" || f.status === "PARTIAL",
    );
    expect(gaps.map((g) => g.field)).toEqual(
      expect.arrayContaining([
        "scaffolds",
        "misconceptions",
        "accessibility metadata",
      ]),
    );
    expect(
      fields.find((f) => f.field === "accessibility metadata")?.status,
    ).toBe("PARTIAL");
  });

  it("AI candidate validation uses pipeline and rejects unconfirmed draft", async () => {
    const truth = aiContentCandidateTruthSummary();
    expect(truth.candidateIsNotMastery).toBe(true);

    const result = await validateAiContentCandidate({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      confirmed: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.doesNotWriteMastery).toBe(true);
      expect(result.issues.some((i) => i.code === "unconfirmed")).toBe(true);
    }
  });

  it("AI candidate validation succeeds when confirmed", async () => {
    const result = await validateAiContentCandidate({
      ...FIXTURE_CS_JAVA_INHERITANCE,
      confirmed: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.doesNotWriteEvidence).toBe(true);
      expect(result.contentId).toBeTruthy();
    }
  });

  it("content-production modules do not import mastery writers", () => {
    for (const rel of [
      "src/lib/learning/content-production/lifecycle.ts",
      "src/lib/learning/content-production/catalog-integrity.ts",
      "src/lib/learning/content-production/ai-candidate.ts",
      "src/lib/learning/content-production/density-matrix.ts",
    ]) {
      const src = read(rel);
      expect(src).not.toMatch(/applyEvidenceToMastery|recordEvidence\(/);
    }
  });
});
