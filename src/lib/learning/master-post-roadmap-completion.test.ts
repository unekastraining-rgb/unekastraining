/**
 * Master post-roadmap completion integrity — continuity polish + content polish.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CONTENT_EXPANSION_CHALLENGES } from "@/lib/learning/activities/content-expansion-queue";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { listProgressionEntriesForConcept } from "@/lib/learning/content-progression/catalog";
import {
  buildDomainCoverageRows,
  contentCoverageMarkdown,
} from "@/lib/learning/content-production/content-coverage-report";
import { writeFileSync } from "node:fs";

describe("master post-roadmap completion", () => {
  it("Lucky continuity strip + draft restored cue are wired", () => {
    const lucky = readFileSync(
      path.join(process.cwd(), "src/components/study/LuckyRetentionReview.tsx"),
      "utf8",
    );
    expect(lucky).toContain("LuckyContinuityStrip");
    const strip = readFileSync(
      path.join(process.cwd(), "src/components/study/LuckyContinuityStrip.tsx"),
      "utf8",
    );
    expect(strip).toContain("data-lucky-return-adaptive");
    expect(strip).toContain("data-lucky-return-growth");
    expect(strip).toContain('"/study"');
    expect(strip).not.toContain('"/dashboard"');
    expect(strip).toContain('"/study"');
    expect(strip).not.toContain('"/dashboard"');

    const ws = readFileSync(
      path.join(process.cwd(), "src/components/study/ActivityWorkspace.tsx"),
      "utf8",
    );
    expect(ws).toContain("data-activity-draft-restored");
    expect(ws).toContain("draftRestored");
  });

  it("finance retain/transfer + career polish challenges resolve", () => {
    expect(getStructuredChallenge("write-diversification-retain")?.domainTag).toBe(
      "finance",
    );
    expect(
      getStructuredChallenge("sim-volatility-transfer-paycheck")?.domainTag,
    ).toBe("finance");
    expect(getStructuredChallenge("game-sql-select-match")?.kind).toBe("game");
    expect(
      getStructuredChallenge("sim-healthcare-admin-hipaa-lite")?.domainTag,
    ).toBe("healthcare administration");

    const div = listProgressionEntriesForConcept("diversification");
    expect(div.some((e) => e.stage === "RETAIN")).toBe(true);
    const vol = listProgressionEntriesForConcept("volatility-risk");
    expect(
      vol.some((e) => (e.contextVariant ?? "").includes("transfer")),
    ).toBe(true);
  });

  it("expansion pack grew; coverage MD regenerates; tutor voice honesty", () => {
    expect(CONTENT_EXPANSION_CHALLENGES.length).toBeGreaterThanOrEqual(130);
    const rows = buildDomainCoverageRows();
    expect(rows.find((r) => r.domain === "Finance")!.retain).toBeGreaterThan(0);
    expect(
      rows.find((r) => r.domain === "Healthcare Admin")!.concepts,
    ).toBeGreaterThan(0);

    const md = contentCoverageMarkdown();
    writeFileSync(path.join(process.cwd(), "CONTENT_COVERAGE.md"), md, "utf8");
    expect(md).toContain("Healthcare Admin");

    const tutorTypes = readFileSync(
      path.join(process.cwd(), "src/lib/learning/tutor/types.ts"),
      "utf8",
    );
    expect(tutorTypes).toContain("does **not** enable Tutor STT/TTS");

    const school = readFileSync(
      path.join(process.cwd(), "src/lib/learning/SCHOOL_WORKFLOW_STATUS.md"),
      "utf8",
    );
    expect(school).toContain("CLOSED");
    expect(school).not.toMatch(/DEFERRED[\s\S]*LMS token encryption at rest/);
  });
});
