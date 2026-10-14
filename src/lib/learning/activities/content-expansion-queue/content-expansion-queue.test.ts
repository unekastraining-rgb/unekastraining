/**
 * Content expansion queue integrity — no parallel engines; IDs resolve.
 */
import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import path from "node:path";

import { CONTENT_EXPANSION_CHALLENGES } from "@/lib/learning/activities/content-expansion-queue";
import { CONTENT_EXPANSION_PROGRESSION_ENTRIES } from "@/lib/learning/activities/content-expansion-queue/progression";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import {
  buildActivityKindCoverage,
  buildDomainCoverageRows,
  buildLearningLoopCoverage,
  contentCoverageMarkdown,
} from "@/lib/learning/content-production/content-coverage-report";
import { CONTENT_PROGRESSION_CATALOG } from "@/lib/learning/content-progression/catalog";

describe("content expansion queue", () => {
  it("adds a substantial structured pack with unique ids", () => {
    expect(CONTENT_EXPANSION_CHALLENGES.length).toBeGreaterThanOrEqual(100);
    const ids = CONTENT_EXPANSION_CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every expansion challenge resolves and has enrichment", () => {
    for (const c of CONTENT_EXPANSION_CHALLENGES) {
      expect(getStructuredChallenge(c.id)?.id).toBe(c.id);
      expect(c.criteria.length).toBeGreaterThanOrEqual(2);
      expect(c.conceptHints?.length ?? 0).toBeGreaterThan(0);
      expect(c.misconceptionTargets?.length ?? 0).toBeGreaterThan(0);
      expect(c.scaffolds?.some((s) => s.doesNotRevealAnswer !== false)).toBe(
        true,
      );
      expect(c.learningObjectType).not.toBe("WRITING" as never);
    }
  });

  it("progression contentIds resolve when set; contentKeys unique", () => {
    const keys = CONTENT_EXPANSION_PROGRESSION_ENTRIES.map((e) => e.contentKey);
    expect(new Set(keys).size).toBe(keys.length);

    for (const e of CONTENT_EXPANSION_PROGRESSION_ENTRIES) {
      if (!e.contentId) continue;
      if (e.activityKind === "coding") {
        expect(getCodingChallenge(e.contentId)?.id).toBe(e.contentId);
      } else if (e.activityKind === "sql") {
        expect(getSqlChallenge(e.contentId)?.id).toBe(e.contentId);
      } else if (e.activityKind !== "six") {
        expect(getStructuredChallenge(e.contentId)?.id).toBe(e.contentId);
      }
    }
  });

  it("new coding/sql challenges exist", () => {
    expect(getCodingChallenge("java-interface-drawable")).toBeTruthy();
    expect(getCodingChallenge("java-recursion-factorial")).toBeTruthy();
    expect(getSqlChallenge("sql-inner-join-orders")).toBeTruthy();
  });

  it("coverage report reflects multi-domain expansion", () => {
    const rows = buildDomainCoverageRows();
    expect(rows.find((r) => r.domain === "HVAC")!.concepts).toBeGreaterThanOrEqual(2);
    expect(rows.find((r) => r.domain === "Art")!.concepts).toBeGreaterThanOrEqual(2);
    expect(rows.find((r) => r.domain === "Cloud")!.concepts).toBeGreaterThanOrEqual(2);
    expect(
      rows.find((r) => r.domain === "Computer Science")!.concepts,
    ).toBeGreaterThanOrEqual(10);

    const loops = buildLearningLoopCoverage();
    expect(loops.UNDERSTAND).toBeGreaterThan(50);
    expect(loops.RETAIN).toBeGreaterThan(20);
    expect(loops.TRANSFER_VARIANTS).toBeGreaterThan(50);

    const activities = buildActivityKindCoverage();
    expect(activities.lab).toBeGreaterThan(40);
    expect(activities.simulation).toBeGreaterThan(50);
  });

  it("writes CONTENT_COVERAGE.md from live data", () => {
    const md = contentCoverageMarkdown();
    expect(md).toContain("| Domain | Concepts |");
    expect(md).toContain("CORE -> SIX -> LUCKY");
    writeFileSync(path.join(process.cwd(), "CONTENT_COVERAGE.md"), md, "utf8");
    expect(CONTENT_PROGRESSION_CATALOG.length).toBeGreaterThan(400);
  });
});
