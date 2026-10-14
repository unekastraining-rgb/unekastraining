/**
 * Bundle L — Consolidation & architectural hardening integrity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import "@/lib/learning/knowledge/packs";
import {
  listRetentionVariantsForConcept,
} from "@/lib/learning/retention/variants";
import { listRetentionVariantsForKnowledgeConcept } from "@/lib/learning/retention/knowledge-library-variants";
import { PATH_POSITION_DISCLAIMER } from "@/lib/learning/unified-experience";
import {
  curriculumStatusForIndex,
  curriculumPositionLabel,
  toCurriculumPositionStatus,
} from "@/lib/learning/studio/curriculum-position";
import { buildCourseOverviewFromPath } from "@/lib/learning/studio/course-overview";
import {
  listStudyCapabilities,
  practiceLandscapeAlignsWithRegistry,
} from "@/lib/study/capability-registry";
import {
  conceptIdForStructuredChallenge,
  structuredChallengeIdsForConcept,
} from "@/lib/learning/activities/structured/kl-concept-bridge";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { getMathChallenge } from "@/lib/learning/activities/math/challenges";
import { completeInteractiveActivityForStudio } from "@/lib/learning/activity/runtime/studio-complete";
import { buildTrueFalseFromConcept } from "@/lib/learning/activity/runtime";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Bundle L — Retention + path disclaimer", () => {
  it("KL retention resolver uses canonical RETENTION_VARIANTS only", () => {
    const klFile = read(
      "src/lib/learning/retention/knowledge-library-variants.ts",
    );
    expect(klFile).not.toContain("KL_RETENTION_VARIANTS");
    expect(klFile).not.toContain("allRetentionVariants");
    expect(klFile).toContain("listRetentionVariantsForConcept");
    const sql = listRetentionVariantsForKnowledgeConcept("sql-joins");
    expect(sql.length).toBeGreaterThan(0);
    expect(sql.every((v) => v.id.startsWith("retain-"))).toBe(true);
    // Same ids as base catalog — no duplicate rows
    const base = listRetentionVariantsForConcept("sql-joins");
    expect(new Set(sql.map((v) => v.id)).size).toBe(sql.length);
    expect(sql.map((v) => v.id).sort()).toEqual(base.map((v) => v.id).sort());
  });

  it("PATH_POSITION_DISCLAIMER is single-sourced", () => {
    expect(PATH_POSITION_DISCLAIMER).toMatch(/path position/i);
    expect(PATH_POSITION_DISCLAIMER).toMatch(/not.*mastered/i);
    const overview = read("src/lib/learning/studio/course-overview.ts");
    expect(overview).toContain("PATH_POSITION_DISCLAIMER");
    expect(overview).not.toContain(
      '"Path position shows where you are in the sequence',
    );
    const overviewBuilt = buildCourseOverviewFromPath({
      pathTitle: "Test",
      conceptTitles: ["A", "B"],
      currentIndex: 0,
    });
    expect(overviewBuilt.positionDisclaimer).toBe(PATH_POSITION_DISCLAIMER);
  });
});

describe("Bundle L — Curriculum vocabulary", () => {
  it("canonical statuses are visited/current/next/available", () => {
    expect(curriculumStatusForIndex(0, 1)).toBe("visited");
    expect(curriculumStatusForIndex(1, 1)).toBe("current");
    expect(curriculumStatusForIndex(2, 1)).toBe("next");
    expect(curriculumStatusForIndex(3, 1)).toBe("available");
    expect(curriculumPositionLabel("visited")).toBe("Visited");
    // Legacy aliases still map
    expect(toCurriculumPositionStatus("done", 0, 2)).toBe("visited");
    expect(toCurriculumPositionStatus("upcoming", 3, 1)).toBe("available");
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    // Bundle M — TeachFirst uses canonical helper (no inlined status literals).
    expect(teach).toContain("curriculumStatusForIndex");
    expect(teach).not.toContain('("done" as const)');
  });
});

describe("Bundle L — Evidence authority", () => {
  it("TeachFirst does not record evidence with undefined userId", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain('/api/study/evaluate');
    expect(teach).not.toContain("userId: undefined");
    expect(teach).not.toContain("completeInteractiveActivityForStudio");
  });

  it("studio-complete without userId never claims evidence", async () => {
    const activity = buildTrueFalseFromConcept(
      "psychology-classical-conditioning",
    );
    expect(activity).toBeTruthy();
    const result = await completeInteractiveActivityForStudio({
      activity: activity!,
      submission: {
        activityId: activity!.id,
        form: "true_false",
        selectedIndex: 0,
      },
      userId: undefined,
    });
    expect(result.evidenceRecorded).toBe(false);
    expect(result.orchestrator).toBeNull();
  });
});

describe("Bundle L — Capability + challenge authority", () => {
  it("registry aligns with practice landscape; no parallel engines", () => {
    expect(practiceLandscapeAlignsWithRegistry()).toBe(true);
    expect(listStudyCapabilities().length).toBeGreaterThan(12);
    const locker = read("src/components/hub/LockerTab.tsx");
    expect(locker).toContain("listLockerCapabilities");
    const planner = read("app/planner/page.tsx");
    expect(planner).not.toContain("redirect(");
    expect(planner).toContain("PlannerDestination");
  });

  it("no phantom structured challenge ids", () => {
    expect(conceptIdForStructuredChallenge("sql-joins-lab")).toBeNull();
    for (const id of structuredChallengeIdsForConcept("sql-joins")) {
      expect(
        getStructuredChallenge(id) ||
          getCodingChallenge(id) ||
          getSqlChallenge(id) ||
          getMathChallenge(id),
      ).toBeTruthy();
    }
  });
});

describe("Bundle L — MC presentation + Haul/Studio boundaries", () => {
  it("ActivityRuntime uses InteractiveFormControls for choice forms", () => {
    const runtime = read("src/components/study/activities/ActivityRuntime.tsx");
    expect(runtime).toContain("InteractiveFormControls");
    expect(runtime).not.toContain("selectMode");
    expect(runtime).toContain("usesFormControls");
  });

  it("Haul mode vs phase and Studio width documented in source", () => {
    const phases = read("src/lib/haul/writing/loop-phases.ts");
    expect(phases).toContain("doc.mode");
    expect(phases).toContain("HaulWritingPhase");
    expect(phases).not.toContain("haulPhaseIndex");
    const stage = read(
      "src/components/study/learning-workspace/LearningObjectStage.tsx",
    );
    expect(stage).toContain("max-w-5xl");
    expect(stage).toContain("xl:max-w-6xl");
  });

  it("interactionRequiresFormative and dead retention helpers are gone", () => {
    expect(read("src/lib/learning/studio/index.ts")).not.toContain(
      "interactionRequiresFormative",
    );
    expect(
      read("src/lib/learning/retention/knowledge-library-variants.ts"),
    ).not.toContain("allRetentionVariants");
  });
});
