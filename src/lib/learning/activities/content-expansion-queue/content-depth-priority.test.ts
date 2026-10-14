/**
 * Content depth + product breadth integrity (Priority A/B/C).
 */
import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import path from "node:path";

import { CONTENT_EXPANSION_CHALLENGES } from "@/lib/learning/activities/content-expansion-queue";
import { CONTENT_DEPTH_PRIORITY_A_CHALLENGES } from "@/lib/learning/activities/content-expansion-queue/catalog-depth-priority-a";
import { CONTENT_DEPTH_PRIORITY_B_CHALLENGES } from "@/lib/learning/activities/content-expansion-queue/catalog-depth-priority-b";
import { CONTENT_DEPTH_PRIORITY_C_CHALLENGES } from "@/lib/learning/activities/content-expansion-queue/catalog-depth-priority-c";
import { CONTENT_DEPTH_PRIORITY_PROGRESSION_ENTRIES } from "@/lib/learning/activities/content-expansion-queue/progression-depth-priority";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import {
  buildDomainCoverageRows,
  buildActivityKindCoverage,
  buildLearningLoopCoverage,
  contentCoverageMarkdown,
} from "@/lib/learning/content-production/content-coverage-report";

describe("content depth priority packs", () => {
  it("adds Priority A/B/C challenges with unique resolveable ids", () => {
    const pack = [
      ...CONTENT_DEPTH_PRIORITY_A_CHALLENGES,
      ...CONTENT_DEPTH_PRIORITY_B_CHALLENGES,
      ...CONTENT_DEPTH_PRIORITY_C_CHALLENGES,
    ];
    expect(pack.length).toBeGreaterThanOrEqual(70);
    const ids = pack.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const c of pack) {
      expect(getStructuredChallenge(c.id)?.id).toBe(c.id);
      expect(c.misconceptionTargets?.length ?? 0).toBeGreaterThan(0);
      expect(c.scaffolds?.length ?? 0).toBeGreaterThan(0);
      expect(c.learningObjectType).not.toBe("WRITING" as never);
    }
    expect(CONTENT_EXPANSION_CHALLENGES.length).toBeGreaterThanOrEqual(200);
  });

  it("progression contentIds resolve; Priority A domains leave THIN", () => {
    for (const e of CONTENT_DEPTH_PRIORITY_PROGRESSION_ENTRIES) {
      if (!e.contentId || e.activityKind === "six") continue;
      expect(getStructuredChallenge(e.contentId)?.id).toBe(e.contentId);
    }

    const md = contentCoverageMarkdown();
    writeFileSync(path.join(process.cwd(), "CONTENT_COVERAGE.md"), md, "utf8");

    const rows = buildDomainCoverageRows();
    for (const name of [
      "Healthcare Admin",
      "Construction",
      "Education",
      "Hospitality",
    ]) {
      const row = rows.find((r) => r.domain === name)!;
      expect(row.concepts).toBeGreaterThanOrEqual(4);
      expect(row.status).not.toBe("THIN");
    }
    expect(rows.find((r) => r.domain === "Finance")!.concepts).toBeGreaterThanOrEqual(
      7,
    );
    expect(rows.find((r) => r.domain === "Art")!.concepts).toBeGreaterThanOrEqual(5);
    expect(rows.find((r) => r.domain === "Cloud")!.concepts).toBeGreaterThanOrEqual(5);

    const loops = buildLearningLoopCoverage();
    expect(loops.UNDERSTAND).toBeGreaterThan(180);
    expect(loops.RETAIN).toBeGreaterThan(80);

    const acts = buildActivityKindCoverage();
    expect(acts.lab + acts.simulation + acts.writing).toBeGreaterThan(200);
  });
});
