/**
 * Phase 2G-3 preservation — coordinator must not wire into product surfaces.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-3 AdaptiveSequenceCoordinator preservation", () => {
  it("38–40. does not connect coordinator to CORE / SIX / LUCKY UI", () => {
    expect(read("app/core/page.tsx")).not.toMatch(
      /startAdaptiveSequenceRun|AdaptiveSequenceCoordinator/,
    );
    expect(read("app/study/six/[component]/page.tsx")).not.toMatch(
      /startAdaptiveSequenceRun|recordAdaptiveSequenceCompletion/,
    );
    expect(read("app/study/lucky/lucky-engine-view.tsx")).not.toMatch(
      /startAdaptiveSequenceRun|AdaptiveSequenceCoordinator/,
    );
    expect(read("app/study/study-hub-view.tsx")).not.toMatch(
      /startAdaptiveSequenceRun|recordAdaptiveSequenceCompletion/,
    );
  });

  it("41. Orchestrator diagnosis enums unchanged by coordinator", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain('"UNDERSTANDING_GAP"');
    expect(diagnose).toContain('"NO_INTERVENTION"');
    expect(diagnose).not.toMatch(/AdaptiveSequence|sequence\/coordinator/);
  });

  it("42–43. LearningAttempt producer and ConceptMastery apply untouched", () => {
    const record = read("src/lib/learning/evidence/record.ts");
    expect(record).toContain("learningAttempt.create");
    expect(record).not.toMatch(/AdaptiveSequence|coordinator/);

    const apply = read("src/lib/learning/mastery/apply.ts");
    expect(apply).not.toMatch(/AdaptiveSequence|coordinator/);
  });

  it("coordinator does not create evidence/mastery/retention or launch activities", () => {
    const coord = read("src/lib/learning/sequence/coordinator.ts");
    expect(coord).toContain("orchestrateForConcept");
    expect(coord).not.toMatch(
      /recordEvidence|applyEvidenceToMastery|upsertRetentionItem|router\.push|createStudySession/,
    );
    expect(coord).toContain("Does not launch");
  });

  it("no public sequence API routes in 2G-3", () => {
    expect(
      existsSync(path.join(process.cwd(), "app/api/learning/sequence/route.ts")),
    ).toBe(false);
    expect(
      existsSync(
        path.join(process.cwd(), "app/api/study/adaptive-sequence/route.ts"),
      ),
    ).toBe(false);
  });
});
