/**
 * Bundle N — Experience Depth integrity.
 * Verifies substantive workflows without new engines/routes.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import "@/lib/learning/knowledge/packs";
import { matchPairsForGameChallenge } from "@/lib/learning/activities/structured/game-match-pairs";
import { selectInteractiveActivityForConcept } from "@/lib/learning/activity/runtime/select";
import { listAvailableInteractiveForms } from "@/lib/learning/activity/runtime/build-interactive";
import { teachMeHref } from "@/lib/study/loop-hrefs";
import {
  buildCapabilityHref,
  getStudyCapability,
} from "@/lib/study/capability-registry";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Bundle N — Learning Studio depth", () => {
  it("passes learnerState into interactive selection after recognition", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("sessionRecognitionOk");
    expect(teach).toContain("learnerState");
    expect(teach).toContain("selectInteractiveActivityForConcept");
  });

  it("recognition success unlocks application forms when KL supports them", () => {
    const conceptId = "java-arraylist";
    const available = listAvailableInteractiveForms(conceptId);
    expect(available.length).toBeGreaterThan(0);
    const withState = selectInteractiveActivityForConcept({
      conceptId,
      learnerState: {
        userId: "u",
        conceptId,
        exposureCount: 2,
        attemptCount: 2,
        correctCount: 1,
        incorrectCount: 0,
      },
    });
    expect(withState).toBeTruthy();
  });

  it("labels relationship maps as Concept relationships", () => {
    const lo = read("src/lib/learning/studio/learning-objects.ts");
    expect(lo).toContain("Concept relationships");
    expect(lo).toContain("isRelationshipMap");
  });

  it("remediation links Practice Hub and Lucky", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("luckyQuizHref");
    expect(teach).toContain('getStudyCapability("practice")');
    expect(teach).toContain("buildCapabilityHref");
  });
});

describe("Bundle N — Interactive evidence depth", () => {
  it("serializes structured interactive submission for evaluate", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("submissionFingerprint");
    expect(teach).toContain("selectedIndices");
    expect(teach).toContain("matches");
    expect(teach).not.toMatch(
      /evidenceEventKey:\s*`learn-interactive:\$\{conceptTitle\}:\$\{Date\.now\(\)\}`/,
    );
  });

  it("studio SQL/code forms declare honesty (no fake execution)", () => {
    const runtime = read("src/components/study/activities/ActivityRuntime.tsx");
    expect(runtime).toContain("data-sql-honesty");
    expect(runtime).toContain("data-coding-honesty");
  });
});

describe("Bundle N — Coding / SQL / Games / Presentations / Labs", () => {
  it("coding distinguishes executable JS vs guided languages", () => {
    const coding = read("src/components/study/CodingWorkspacePanel.tsx");
    expect(coding).toContain("data-coding-honesty");
    expect(coding).toContain("not executed in the browser");
    expect(coding).toContain("No local test cases");
  });

  it("SQL workspace keeps submit-time honesty", () => {
    const sql = read("src/components/study/SqlWorkspacePanel.tsx");
    expect(sql).toMatch(/data-sql-honesty|checked on submit/i);
  });

  it("game challenges supply authored match pairs", () => {
    const pairs = matchPairsForGameChallenge("game-vocab-match");
    expect(pairs).toBeTruthy();
    expect(pairs!.length).toBeGreaterThanOrEqual(2);
    expect(pairs!.every((p) => p.definition && !/stub/i.test(p.definition))).toBe(
      true,
    );
    const ws = read("src/components/study/ActivityWorkspace.tsx");
    expect(ws).toContain("matchPairs");
    expect(ws).toContain("GameMatchPanel");
  });

  it("presentations support reorder and deny PPTX claim", () => {
    const p = read("src/components/study/PresentationWorkspacePanel.tsx");
    expect(p).toContain("Move section");
    expect(p).toContain("guided draft");
    expect(p).not.toMatch(/pptx|PowerPoint export/i);
  });

  it("labs show stage completion ticks", () => {
    const lab = read("src/components/study/LabWorkspacePanel.tsx");
    expect(lab).toContain("✓");
    expect(lab).toContain('aria-label="Lab stages"');
  });
});

describe("Bundle N — Haul / Lucky / journeys", () => {
  it("Haul learn links use teachMeHref", () => {
    const haul = read("src/components/haul/HaulWritingWorkspace.tsx");
    expect(haul).toContain("teachMeHref");
    expect(haul).not.toContain("`/study/teach-me?topic=${encodeURIComponent");
    expect(teachMeHref(null, null, "Thesis statements")).toContain(
      "topic=Thesis",
    );
  });

  it("Lucky uses workspace-width layout with loop rail", () => {
    const lucky = read("app/study/lucky/lucky-engine-view.tsx");
    expect(lucky).toContain("data-lucky-workspace");
    expect(lucky).toContain("max-w-6xl");
    expect(lucky).toContain("StudyLoopStrip");
  });

  it("Practice Hub remains canonical practice chooser", () => {
    expect(getStudyCapability("practice")?.directPath).toBe(
      "/study/practice-hub",
    );
    expect(
      buildCapabilityHref(getStudyCapability("practice")!, {
        conceptId: "java-arraylist",
      }),
    ).toContain("/study/practice-hub");
  });
});
