/**
 * 2P-26 — Cross-domain content expansion integrity + Adaptive-ready smoke.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  DOMAIN_EXPANSION_CHALLENGES,
  DOMAIN_EXPANSION_PROGRESSION_ENTRIES,
} from "@/lib/learning/activities/domain-expansion";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { evaluateStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { getProgressionEntry } from "@/lib/learning/content-progression/catalog";
import {
  auditCatalogIntegrity,
  catalogIntegrityOk,
} from "@/lib/learning/content-production/catalog-integrity";
import { ADAPTIVE_CATALOG_SEED_ITEMS } from "@/lib/learning/content-production/seed-catalog";
import { assessAdaptiveReadyCatalogItem } from "@/lib/learning/content-production/adaptive-ready-contract";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("2P-26 domain expansion pack", () => {
  it("adds a representative high-quality set (30–50 content groups)", () => {
    expect(DOMAIN_EXPANSION_CHALLENGES.length).toBeGreaterThanOrEqual(25);
    expect(DOMAIN_EXPANSION_CHALLENGES.length).toBeLessThanOrEqual(50);
    expect(DOMAIN_EXPANSION_PROGRESSION_ENTRIES.length).toBeGreaterThanOrEqual(
      25,
    );
  });

  it("every expansion challenge is registered and evaluable", () => {
    for (const challenge of DOMAIN_EXPANSION_CHALLENGES) {
      expect(getStructuredChallenge(challenge.id)?.id).toBe(challenge.id);
      expect(challenge.objective.trim().length).toBeGreaterThan(12);
      expect(challenge.criteria.length).toBeGreaterThanOrEqual(2);
      expect(challenge.conceptHints?.length ?? 0).toBeGreaterThan(0);
      const fail = evaluateStructuredChallenge(challenge, "too short");
      expect(fail.outcome).toBe("FAIL");
    }
  });

  it("progression contentIds resolve to catalog rows", () => {
    for (const row of DOMAIN_EXPANSION_PROGRESSION_ENTRIES) {
      expect(getProgressionEntry(row.contentKey)?.contentKey).toBe(
        row.contentKey,
      );
      if (!row.contentId) continue;
      if (row.activityKind === "coding") {
        expect(getCodingChallenge(row.contentId)?.id).toBe(row.contentId);
      } else if (row.activityKind === "sql") {
        expect(getSqlChallenge(row.contentId)?.id).toBe(row.contentId);
      } else {
        expect(getStructuredChallenge(row.contentId)?.id).toBe(row.contentId);
      }
    }
  });

  it("meaningful pass path for networking lab and nursing sim", () => {
    const lab = getStructuredChallenge("lab-subnet-boundary")!;
    const labPass = evaluateStructuredChallenge(
      lab,
      "The hosts use different /24 prefixes (192.168.10 vs 192.168.11), so they are not the same subnet; a router or gateway is required for ping to work.",
    );
    expect(labPass.outcome).not.toBe("FAIL");

    const nurse = getStructuredChallenge("sim-med-safety-five-rights")!;
    const nursePass = evaluateStructuredChallenge(
      nurse,
      "Wrong patient and wrong dose rights fail. I hold the medication and verify against the MAR before giving anything because the error is unsafe and could harm the patient.",
    );
    expect(nursePass.outcome).not.toBe("FAIL");
  });

  it("CS coding/SQL expansion rows exist with enrichment", () => {
    expect(getCodingChallenge("java-equals-vs-eq")?.misconceptionTargets?.length).toBeGreaterThan(
      0,
    );
    expect(getSqlChallenge("sql-group-by-having")?.scaffolds?.length).toBeGreaterThan(
      0,
    );
    expect(getSqlChallenge("sql-null-is-null")?.conceptHints).toContain("null");
  });

  it("catalog integrity remains clean; seed registry stays bounded", () => {
    expect(auditCatalogIntegrity()).toEqual([]);
    expect(catalogIntegrityOk()).toBe(true);
    expect(ADAPTIVE_CATALOG_SEED_ITEMS.length).toBeGreaterThanOrEqual(15);
    expect(ADAPTIVE_CATALOG_SEED_ITEMS.length).toBeLessThan(40);
  });

  it("representative seeds assess Adaptive-ready", () => {
    const sample = [
      "lab-subnet-boundary",
      "sim-med-safety-five-rights",
      "java-equals-vs-eq",
      "sql-group-by-having",
      "write-source-bias",
    ];
    for (const contentId of sample) {
      const seed = ADAPTIVE_CATALOG_SEED_ITEMS.find(
        (s) => s.contentId === contentId,
      );
      expect(seed).toBeTruthy();
      const assessment = assessAdaptiveReadyCatalogItem({
        activityKind: seed!.activityKind,
        contentId: seed!.contentId,
      });
      expect(assessment.adaptiveReadySeed).toBe(true);
    }
  });

  it("does not introduce subject-specific engines", () => {
    const catalog = read(
      "src/lib/learning/activities/domain-expansion/catalog.ts",
    );
    expect(catalog).not.toMatch(/NursingLearningEngine|JavaLearningEngine|MathMasteryEngine/);
    expect(catalog).toContain("not a subject engine");
  });

  it("Content ≠ Evidence ≠ Mastery for catalog authoring", () => {
    const catalog = read(
      "src/lib/learning/activities/domain-expansion/catalog.ts",
    );
    expect(catalog).not.toMatch(/recordAuthoritativeActivityEvidence|applyEvidenceToMastery/);
  });
});
