import { describe, expect, it } from "vitest";
import {
  enrichStudyNowFocusTopicsWithUleBridge,
  resolvePlannerAdaptiveEntry,
  studyNowUleBridgeTruthSummary,
} from "./study-now-ule-bridge";
import type { StudyNowTopicPick } from "@/lib/csl/study-now";

const basePick = (topicId: string): StudyNowTopicPick => ({
  topicId,
  topicName: "Cell division",
  courseId: "course-1",
  courseTitle: "Bio 101",
  component: "chunking",
  componentTitle: "Chunking",
  href: "/study/six/chunking",
  reason: "Weak topic progress",
  proficiency: 40,
});

describe("study-now-ule-bridge", () => {
  it("attaches Adaptive CTA only when conceptId exists", () => {
    const map = new Map<string, string | null>([
      ["t1", "concept-owned"],
      ["t2", null],
    ]);
    const enriched = enrichStudyNowFocusTopicsWithUleBridge(
      [basePick("t1"), basePick("t2")],
      map,
    );
    expect(enriched[0].conceptId).toBe("concept-owned");
    expect(enriched[0].adaptiveCta.kind).toBe("start");
    expect(enriched[1].conceptId).toBeNull();
    expect(enriched[1].adaptiveCta.kind).toBe("none");
  });

  it("never invents concepts for missing map entries", () => {
    const enriched = enrichStudyNowFocusTopicsWithUleBridge(
      [basePick("unknown")],
      new Map(),
    );
    expect(enriched[0].conceptId).toBeNull();
    expect(enriched[0].adaptiveCta.kind).toBe("none");
  });

  it("planner entry reuses Hub Adaptive resolver", () => {
    expect(resolvePlannerAdaptiveEntry({ conceptId: null }).kind).toBe("none");
    expect(
      resolvePlannerAdaptiveEntry({ conceptId: "c1" }).kind,
    ).toBe("start");
    expect(
      resolvePlannerAdaptiveEntry({ conceptId: "c1", activeRunId: "run-1" })
        .kind,
    ).toBe("resume");
  });

  it("truth summary: does not replace planner or write evidence", () => {
    const t = studyNowUleBridgeTruthSummary();
    expect(t.replacesPlanner).toBe(false);
    expect(t.inventsConcepts).toBe(false);
    expect(t.diagnosesMastery).toBe(false);
    expect(t.viewingWritesEvidence).toBe(false);
    expect(t.viewingWritesMastery).toBe(false);
  });
});
