import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOPIC_PROGRESS_LEARNER_COPY } from "./mastery/mastery-truth";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("WS2 mastery truth learner surface labels", () => {
  it("Hub Insights labels Topic progress, not Overall mastery", () => {
    const hub = read("src/components/hub/HubInsightsPanel.tsx");
    expect(hub).toContain("Topic progress");
    expect(hub).not.toContain("Overall mastery");
  });

  it("Locker StatPill uses Topic progress for legacy %", () => {
    const locker = read("src/components/hub/LockerTab.tsx");
    expect(locker).toContain("Topic progress");
  });

  it("ULE claims still use ConceptMastery helpers", () => {
    const present = read(
      "src/lib/learning/orchestrator/present-mastery-summary.ts",
    );
    expect(present).toContain("CANONICAL_ULE_MASTERY_SOURCE");
    expect(present).toContain("ConceptMastery");
    expect(TOPIC_PROGRESS_LEARNER_COPY.shortLabel).toBe("Topic progress");
  });

  it("no silent ConceptMastery → TopicMastery fallback in present-concept-progress", () => {
    const src = read("src/lib/learning/mastery/present-concept-progress.ts");
    expect(src).toContain("resolveLearnerFacingUleMasteryIgnoringTopicProgress");
    expect(src).not.toMatch(/resolveTopicCourseProgress/);
  });
});
