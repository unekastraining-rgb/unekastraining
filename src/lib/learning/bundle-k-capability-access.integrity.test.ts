/**
 * Bundle K — Capability Access + Experience Completion integrity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import "@/lib/learning/knowledge/packs";
import {
  buildCapabilityHref,
  getStudyCapability,
  listContextualCapabilities,
  listLockerCapabilities,
  listStudyCapabilities,
  practiceLandscapeAlignsWithRegistry,
} from "@/lib/study/capability-registry";
import {
  buildPracticeItemHref,
  listSupportedPracticeLandscape,
} from "@/lib/study/practice-landscape";
import { listInteractiveChooserOptions } from "@/lib/study/interactive-chooser";
import {
  conceptIdForStructuredChallenge,
  structuredChallengeIdsForConcept,
} from "@/lib/learning/activities/structured/kl-concept-bridge";
import {
  getStructuredChallenge,
  listStructuredChallenges,
} from "@/lib/learning/activities/structured/service";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { getMathChallenge } from "@/lib/learning/activities/math/challenges";
import { SIX_ACTIVITIES } from "@/lib/csl/six";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Bundle K — Capability registry + direct access", () => {
  it("registry covers major learner-facing capabilities with direct paths", () => {
    const ids = listStudyCapabilities().map((c) => c.id);
    for (const id of [
      "learn",
      "practice",
      "quizzes",
      "flashcards",
      "games",
      "coding",
      "sql",
      "math",
      "labs",
      "simulations",
      "projects",
      "presentations",
      "haul",
      "six",
      "planner",
      "retention",
      "notes",
    ]) {
      expect(ids).toContain(id);
      const cap = getStudyCapability(id);
      expect(cap?.directPath).toBeTruthy();
      expect(cap?.label).not.toMatch(/ActivityRuntime|LAF|Orchestrator/i);
    }
    expect(practiceLandscapeAlignsWithRegistry()).toBe(true);
  });

  it("Locker exposes study tools + activities from the registry", () => {
    const locker = read("src/components/hub/LockerTab.tsx");
    expect(locker).toContain("listLockerCapabilities");
    expect(locker).toContain("data-locker-tab");
    expect(locker).toContain("Study tools");
    expect(locker).toContain("Activities");
    expect(listLockerCapabilities("activities").some((c) => c.id === "games")).toBe(
      true,
    );
    expect(listLockerCapabilities("study-tools").some((c) => c.id === "quizzes")).toBe(
      true,
    );
  });

  it("Games / Practice / Six / Planner destinations exist and reuse engines", () => {
    expect(read("app/study/games/page.tsx")).toContain("listStructuredChallenges");
    expect(read("app/study/games/page.tsx")).toContain("/study/activities/game");
    expect(read("app/study/practice-hub/page.tsx")).toContain(
      "listSupportedPracticeLandscape",
    );
    expect(read("app/study/six/page.tsx")).toContain("SIX_ACTIVITIES");
    expect(SIX_ACTIVITIES).toHaveLength(6);
    const planner = read("app/planner/page.tsx");
    expect(planner).not.toContain('redirect("/dashboard")');
    expect(planner).toContain("PlannerDestination");
    expect(read("src/components/planner/PlannerDestination.tsx")).toContain(
      "/api/planner",
    );
  });
});

describe("Bundle K — Canonical implementation (no duplicate engines)", () => {
  it("direct and contextual paths resolve to the same activity routes", () => {
    const coding = getStudyCapability("coding")!;
    const fromRegistry = buildCapabilityHref(coding, { conceptId: "c1" });
    const landscape = listSupportedPracticeLandscape().find(
      (i) => i.activityKey === "coding",
    )!;
    const fromLandscape = buildPracticeItemHref(landscape, { conceptId: "c1" });
    expect(fromRegistry).toContain("/study/activities/coding");
    expect(fromLandscape).toContain("/study/activities/coding");
  });

  it("specialized workspaces are not textarea-only shells", () => {
    const workspace = read("src/components/study/ActivityWorkspace.tsx");
    expect(workspace).toContain("CodingWorkspacePanel");
    expect(workspace).toContain("SqlWorkspacePanel");
    expect(workspace).toContain("LabWorkspacePanel");
    expect(workspace).toContain("ProjectWorkspacePanel");
    expect(workspace).toContain("PresentationWorkspacePanel");
    expect(workspace).toContain("GameMatchPanel");
    expect(read("src/components/study/CodingWorkspacePanel.tsx")).toContain(
      "data-coding-workspace",
    );
    expect(read("src/components/study/SqlWorkspacePanel.tsx")).toContain(
      "data-sql-workspace",
    );
    expect(read("src/components/study/GameMatchPanel.tsx")).toContain(
      "data-game-workspace",
    );
    expect(read("src/components/study/LabWorkspacePanel.tsx")).toContain(
      "data-lab-workspace",
    );
    expect(read("src/components/study/ProjectWorkspacePanel.tsx")).toContain(
      "data-project-workspace",
    );
    expect(read("src/components/study/PresentationWorkspacePanel.tsx")).toContain(
      "data-presentation-workspace",
    );
  });

  it("no parallel quiz/flashcard/game/coding engines introduced", () => {
    const registry = read("src/lib/study/capability-registry.ts");
    expect(registry).not.toContain("createSecondQuizEngine");
    expect(registry).not.toContain("NewGameEngine");
    expect(registry).toContain('directPath: "/quizzes"');
    expect(registry).toContain('directPath: "/flashcards"');
    expect(registry).toContain('directPath: "/study/games"');
    expect(registry).toContain("/study/activities/coding");
  });
});

describe("Bundle K — Concept-less entry + phantom challenges", () => {
  it("activity page uses ConceptEntryPicker instead of conceptId dead-end copy", () => {
    const page = read("app/study/activities/[kind]/page.tsx");
    expect(page).toContain("ConceptEntryPicker");
    expect(page).not.toContain("Link a concept first");
    expect(page).toContain("conceptId={conceptId}");
  });

  it("KL challenge bridge returns only real catalog ids", () => {
    for (const conceptId of [
      "java-inheritance",
      "sql-joins",
      "math-equations",
      "economics-supply-demand",
      "biology-photosynthesis",
      "python-variables",
    ]) {
      const ids = structuredChallengeIdsForConcept(conceptId);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(
          getStructuredChallenge(id) ||
            getCodingChallenge(id) ||
            getSqlChallenge(id) ||
            getMathChallenge(id),
        ).toBeTruthy();
      }
    }
    expect(conceptIdForStructuredChallenge("sql-joins-lab")).toBeNull();
    expect(conceptIdForStructuredChallenge("java-inheritance-lab")).toBeNull();
    expect(listStructuredChallenges("game").length).toBeGreaterThan(0);
  });
});

describe("Bundle K — Learning + interactive chooser + Haul", () => {
  it("Learning Studio launches contextual capabilities", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("ContextualCapabilityStrip");
    expect(teach).toContain("data-learn-capability-launches");
    const javaCaps = listContextualCapabilities({
      topicOrSubject: "Java Classes and Objects",
      practiceForms: ["code", "explain"],
    });
    expect(javaCaps.some((c) => c.id === "coding" || c.id === "practice")).toBe(
      true,
    );
    const writingCaps = listContextualCapabilities({
      topicOrSubject: "Writing thesis statements",
      practiceForms: ["write", "revise"],
    });
    expect(writingCaps.some((c) => c.id === "haul")).toBe(true);
  });

  it("interactive chooser uses KL-backed forms only", () => {
    const options = listInteractiveChooserOptions("java-inheritance");
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.label && !/ActivityRuntime|LAF/i.test(o.label))).toBe(
      true,
    );
    const empty = listInteractiveChooserOptions("not-a-real-concept-xyz");
    expect(empty.length).toBe(0);
  });

  it("Haul direct access preserved; Learning can offer Haul", () => {
    expect(getStudyCapability("haul")?.directPath).toBe("/haul");
    expect(read("src/components/hub/HubSectionsMenu.tsx")).toContain("The Haul");
    expect(read("src/lib/study/capability-registry.ts")).toContain('id: "haul"');
  });
});

describe("Bundle K — Hub menu discoverability", () => {
  it("menu exposes Games, Practice, Six, Planner", () => {
    const menu = read("src/components/hub/HubSectionsMenu.tsx");
    // Bundle M — paths come from capability registry (not hardcoded hrefs).
    expect(menu).toContain("getStudyCapability");
    expect(menu).toContain('cap("games")');
    expect(menu).toContain('cap("practice"');
    expect(menu).toContain('cap("six"');
    expect(menu).toContain('cap("planner")');
    expect(getStudyCapability("games")?.directPath).toBe("/study/games");
    expect(getStudyCapability("practice")?.directPath).toBe(
      "/study/practice-hub",
    );
    expect(getStudyCapability("six")?.directPath).toBe("/study/six");
    expect(getStudyCapability("planner")?.directPath).toBe("/planner");
  });
});
