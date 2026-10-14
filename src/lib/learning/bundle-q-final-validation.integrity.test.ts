/**
 * Bundle Q — Final product validation (journeys, evidence, capability, adaptive).
 * Not a feature bundle: proves the product behaves as one coherent system.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import "@/lib/learning/knowledge/packs";
import { presentAdaptiveNextAction } from "@/lib/learning/adaptive-next-action";
import { buildIdempotentEvaluateEvidenceKey } from "@/lib/learning/activity/framework/evaluate-evidence-key";
import { listStructuredChallenges } from "@/lib/learning/activities/structured/service";
import { preferredGameChallengeIdForConcept } from "@/lib/learning/activities/structured/concept-game-challenge";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import { recommendSixTechnique } from "@/lib/learning/orchestrator/knowledge-loop/six-intelligence";
import { curriculumStatusForIndex } from "@/lib/learning/studio/curriculum-position";
import {
  buildCapabilityHref,
  getStudyCapability,
  listStudyCapabilities,
} from "@/lib/study/capability-registry";
import { teachMeHref } from "@/lib/study/loop-hrefs";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function appPathExists(relFromApp: string): boolean {
  const candidates = [
    join(root, "app", relFromApp, "page.tsx"),
    join(root, "app", `${relFromApp}.tsx`),
    join(root, "app", relFromApp, "route.ts"),
  ];
  return candidates.some((p) => existsSync(p));
}

describe("Bundle Q — New-user / course / assignment journeys", () => {
  it("Dashboard → Locker → Learning → Practice → evidence path exists", () => {
    expect(existsSync(join(root, "app/dashboard/page.tsx"))).toBe(true);
    expect(getStudyCapability("learn")?.directPath).toBe("/study/teach-me");
    expect(getStudyCapability("practice")?.directPath).toBe(
      "/study/practice-hub",
    );
    expect(teachMeHref("course-1", "ArrayList")).toContain("/study/teach-me");
    expect(read("src/components/study/TeachFirstLearnActivity.tsx")).toContain(
      "presentAdaptiveNextAction",
    );
    expect(read("app/api/study/evaluate/route.ts")).toContain(
      "buildIdempotentEvaluateEvidenceKey",
    );
  });

  it("curriculum position is not mastery", () => {
    expect(curriculumStatusForIndex(0, 1)).toBe("visited");
    expect(curriculumStatusForIndex(1, 1)).toBe("current");
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("curriculumStatusForIndex");
    expect(teach).not.toMatch(/curriculumStatusForIndex\([^)]*\)\s*=\s*["']mastered/);
    const pos = read("src/lib/learning/studio/curriculum-position.ts");
    expect(pos).toContain("Path position ≠ mastery");
    expect(pos).toContain('return "Visited"');
    expect(pos).not.toContain('return "Mastered"');
  });

  it("assignment work can reach Planner via canonical capability", () => {
    const planner = getStudyCapability("planner")!;
    expect(planner.directPath).toBe("/planner");
    expect(buildCapabilityHref(planner, {})).toContain("/planner");
    expect(existsSync(join(root, "app/planner/page.tsx"))).toBe(true);
  });
});

describe("Bundle Q — Study tools converge on canonical engines", () => {
  const tools: Array<{ id: string; pathFragment: string }> = [
    { id: "quizzes", pathFragment: "/quizzes" },
    { id: "flashcards", pathFragment: "/flashcards" },
    { id: "games", pathFragment: "/study/games" },
    { id: "practice", pathFragment: "/study/practice-hub" },
    { id: "six", pathFragment: "/study/six" },
    { id: "retention", pathFragment: "/study/lucky" },
  ];

  it("Locker study tools resolve through Capability Registry only", () => {
    for (const t of tools) {
      const cap = getStudyCapability(t.id as Parameters<typeof getStudyCapability>[0]);
      expect(cap, t.id).toBeTruthy();
      expect(cap!.directPath).toContain(t.pathFragment);
      expect(buildCapabilityHref(cap!, {})).toContain(t.pathFragment);
    }
    expect(read("src/components/hub/HubSectionsMenu.tsx")).toContain(
      "getStudyCapability",
    );
  });

  it("games deep-link uses real structured challenge ids", () => {
    const games = listStructuredChallenges("game");
    expect(games.length).toBeGreaterThan(0);
    const preferred = preferredGameChallengeIdForConcept("biology-photosynthesis");
    expect(preferred).toBeTruthy();
    expect(games.some((g) => g.id === preferred)).toBe(true);
  });
});

describe("Bundle Q — Writing / coding / SQL / lab / presentation journeys", () => {
  it("Haul preserves LEARN→PLAN→WRITE→FEEDBACK→REVISE→FINISH phase language", () => {
    const phases = read("src/lib/haul/writing/loop-phases.ts");
    expect(phases).toContain('"learn"');
    expect(phases).toContain('"plan"');
    expect(phases).toContain('"write"');
    expect(phases).toContain('"feedback"');
    expect(phases).toContain('"revise"');
    expect(phases).toContain('"finish"');
    expect(phases).toContain("doc.mode");
    expect(phases).toContain("HaulWritingPhase");
    const haul = read("src/components/haul/HaulWritingWorkspace.tsx");
    expect(haul).toContain("HaulWritingPhaseStrip");
    expect(haul).toContain("/api/haul/writing/evidence");
    expect(getStudyCapability("haul")?.directPath).toBe("/haul");
  });

  it("Coding and SQL declare honesty; no fake execution claims", () => {
    expect(read("src/components/study/CodingWorkspacePanel.tsx")).toContain(
      "data-coding-honesty",
    );
    expect(read("src/components/study/SqlWorkspacePanel.tsx")).toContain(
      "data-sql-honesty",
    );
    expect(read("src/components/study/activities/ActivityRuntime.tsx")).toContain(
      "data-sql-honesty",
    );
  });

  it("presentations deny PPTX generation claims", () => {
    const p = read("src/components/study/PresentationWorkspacePanel.tsx");
    expect(p).toMatch(/not PowerPoint|guided draft/i);
    expect(p).not.toMatch(/export.*\.pptx|generate PPTX|download PowerPoint/i);
  });

  it("labs and projects keep guided workflow panels", () => {
    expect(existsSync(join(root, "src/components/study/LabWorkspacePanel.tsx"))).toBe(
      true,
    );
    expect(
      existsSync(join(root, "src/components/study/ProjectWorkspacePanel.tsx")),
    ).toBe(true);
    const lab = read("src/components/study/LabWorkspacePanel.tsx");
    expect(lab).toMatch(/objective|procedure|observation|conclusion/i);
  });
});

describe("Bundle Q — Core journey", () => {
  it("Core remains canvas workspace with learning destinations", () => {
    expect(getStudyCapability("notes")?.directPath).toBe("/core");
    const core = read("app/core/page.tsx");
    expect(core.length).toBeGreaterThan(0);
    // Core should not be a centered phone-only shell
    expect(core).not.toMatch(/max-w-3xl mx-auto/);
  });
});

describe("Bundle Q — Adaptive scenarios A–E", () => {
  it("A: repeated struggle → reteach/Six/practice oriented next", () => {
    const next = presentAdaptiveNextAction({
      outcome: "incorrect",
      score: 20,
      conceptId: "java-arraylist",
      conceptTitle: "ArrayList in Java",
      courseId: "c1",
    });
    expect(next.nextSteps.join(" ")).not.toMatch(/Great job/i);
    expect(next.links.some((l) => /six|practice|lucky|teach/i.test(l.href))).toBe(
      true,
    );
  });

  it("B: strong success → application/practice, not beginner reteach-only", () => {
    const next = presentAdaptiveNextAction({
      outcome: "correct",
      score: 100,
      conceptId: "java-arraylist",
      conceptTitle: "ArrayList in Java",
      courseId: "c1",
      demonstratedRecognition: true,
    });
    expect(next.nextSteps.some((s) => /apply|practice|next/i.test(s))).toBe(true);
    expect(next.disclaimer).toMatch(/not mastery/i);
  });

  it("C: explain-but-not-apply → Hands-on / practice relevant", () => {
    const rec = recommendSixTechnique({
      decision: {
        action: "practice",
        reasonCode: "needs-practice",
        conceptId: "java-arraylist",
        reason: "Can explain but not apply",
        confidence: "medium",
        trace: {
          target: "ArrayList",
          focusConceptId: "java-arraylist",
          exposureCount: 3,
          attemptCount: 2,
          correctCount: 1,
          incorrectCount: 1,
          lastOutcome: "partial",
          hasPracticeEvidence: false,
          hasCheckEvidence: true,
          hasRecallEvidence: false,
        },
      },
      summary: {
        conceptId: "java-arraylist",
        exposureCount: 3,
        attemptCount: 2,
        correctCount: 1,
        incorrectCount: 1,
        lastOutcome: "partial",
        hasPracticeEvidence: false,
        hasCheckEvidence: true,
        hasRecallEvidence: false,
      },
    });
    expect(rec.technique).toBe("hands-on-practice");
    expect(rec.reasonCode).toBe("explain-without-apply");
  });

  it("D: weak retention → Lucky/review oriented", () => {
    const next = presentAdaptiveNextAction({
      outcome: "incorrect",
      score: 40,
      conceptId: "java-arraylist",
      conceptTitle: "ArrayList in Java",
      courseId: "c1",
    });
    expect(
      next.links.some((l) => /lucky|quiz|retention|six/i.test(l.href + l.label)),
    ).toBe(true);
  });

  it("E: unknown concept stays honest (no fabricated KL teaching context)", () => {
    const ctx = resolveTeachingKnowledgeContext(
      "zz-nonexistent-concept-xyz-99999",
    );
    expect(ctx).toBeNull();
  });
});

describe("Bundle Q — Evidence integrity", () => {
  it("duplicate logical submissions share evidence keys; distinct fingerprints differ", () => {
    const a = buildIdempotentEvaluateEvidenceKey({
      userId: "u1",
      mode: "check",
      conceptId: "java-arraylist",
      submissionFingerprint: "answer:42",
    });
    const b = buildIdempotentEvaluateEvidenceKey({
      userId: "u1",
      mode: "check",
      conceptId: "java-arraylist",
      submissionFingerprint: "answer:42",
    });
    const c = buildIdempotentEvaluateEvidenceKey({
      userId: "u1",
      mode: "check",
      conceptId: "java-arraylist",
      submissionFingerprint: "answer:43",
      attemptId: "round-2",
    });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toMatch(/\d{13}/); // not timestamp-only
  });

  it("Orchestrator decide path does not write mastery", () => {
    const decide = read(
      "src/lib/learning/orchestrator/knowledge-loop/decide.ts",
    );
    expect(decide).not.toContain("conceptMastery.update");
    expect(decide).not.toContain("db.conceptMastery");
    const d = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(d.action).toBeTruthy();
  });
});

describe("Bundle Q — Capability integrity", () => {
  it("every registry capability has a non-empty directPath and unique id", () => {
    const caps = listStudyCapabilities();
    expect(caps.length).toBeGreaterThan(8);
    const ids = new Set<string>();
    for (const c of caps) {
      expect(c.id.trim().length).toBeGreaterThan(0);
      expect(c.directPath.startsWith("/")).toBe(true);
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
    }
  });

  it("major app destinations exist on disk", () => {
    const paths = [
      "study/teach-me",
      "study/practice-hub",
      "study/six",
      "study/lucky",
      "study/games",
      "haul",
      "core",
      "planner",
      "flashcards",
      "quizzes",
      "courses",
    ];
    for (const p of paths) {
      expect(appPathExists(p), p).toBe(true);
    }
  });

  it("Hub menu is registry-driven (no duplicate navigation catalog)", () => {
    const menu = read("src/components/hub/HubSectionsMenu.tsx");
    expect(menu).toContain("getStudyCapability");
    expect(menu).toContain('cap("games")');
    expect(menu).toContain('cap("practice"');
    expect(menu).not.toContain("HARDCODED_STUDY_NAV");
  });
});

describe("Bundle Q — Spatial / polish regressions", () => {
  it("ActivityWorkspace and Lucky use wide workspace shells", () => {
    expect(read("src/components/study/ActivityWorkspace.tsx")).toContain(
      "max-w-6xl",
    );
    expect(read("app/study/lucky/lucky-engine-view.tsx")).toContain(
      "data-lucky-workspace",
    );
  });

  it("Bundle N/O/P integrity suites remain present", () => {
    expect(
      existsSync(
        join(root, "src/lib/learning/bundle-n-experience-depth.integrity.test.ts"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(root, "src/lib/learning/bundle-o-intelligence.integrity.test.ts"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          root,
          "src/lib/learning/bundle-p-production-polish.integrity.test.ts",
        ),
      ),
    ).toBe(true);
  });
});
