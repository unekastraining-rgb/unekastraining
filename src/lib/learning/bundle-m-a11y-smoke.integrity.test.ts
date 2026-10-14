/**
 * Bundle M — Accessibility / iPad readiness smoke (code inspection).
 * Not a physical device or screen-reader session — documents what is verified
 * statically and what still needs live emulation/device checks.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

const PRIORITY_SURFACES: Array<{ name: string; path: string }> = [
  { name: "Learning Studio", path: "src/components/study/TeachFirstLearnActivity.tsx" },
  { name: "Locker", path: "src/components/hub/LockerTab.tsx" },
  { name: "Practice Hub", path: "app/study/practice-hub/page.tsx" },
  { name: "Coding", path: "src/components/study/CodingWorkspacePanel.tsx" },
  { name: "SQL", path: "src/components/study/SqlWorkspacePanel.tsx" },
  { name: "Games", path: "src/components/study/GameMatchPanel.tsx" },
  { name: "Labs", path: "src/components/study/LabWorkspacePanel.tsx" },
  { name: "Projects", path: "src/components/study/ProjectWorkspacePanel.tsx" },
  { name: "Presentations", path: "src/components/study/PresentationWorkspacePanel.tsx" },
  { name: "Haul", path: "src/components/haul/TheHaulWorkspace.tsx" },
  { name: "Planner", path: "src/components/planner/PlannerDestination.tsx" },
  { name: "Core", path: "src/components/core/CoreNotesWorkspace.tsx" },
];

describe("Bundle M — a11y / iPad smoke (static)", () => {
  it("priority surfaces exist for smoke coverage", () => {
    for (const surface of PRIORITY_SURFACES) {
      const src = read(surface.path);
      expect(src.length, surface.name).toBeGreaterThan(50);
    }
  });

  it("Learning Studio: drawers, stage, dock expose labels and touch targets", () => {
    const rail = read("src/components/study/learning-workspace/CurriculumRail.tsx");
    const drawer = read(
      "src/components/study/learning-workspace/CurriculumDrawer.tsx",
    );
    const dock = read("src/components/study/learning-workspace/LearningDock.tsx");
    const stage = read(
      "src/components/study/learning-workspace/LearningObjectStage.tsx",
    );
    expect(rail).toContain('aria-label="Course curriculum"');
    expect(rail).toContain("min-h-11");
    expect(rail).toContain("touch-manipulation");
    expect(drawer).toContain("aria-expanded");
    expect(drawer).toContain("data-curriculum-drawer");
    expect(dock).toContain('aria-label="Study rooms"');
    expect(stage).toContain('role="radiogroup"');
    expect(stage).toContain("min-h-12");
    expect(stage).toContain("focus:ring");
  });

  it("Hub menu: keyboard dismiss + menu semantics", () => {
    const menu = read("src/components/hub/HubSectionsMenu.tsx");
    expect(menu).toContain('role="menu"');
    expect(menu).toContain('role="menuitem"');
    expect(menu).toContain("aria-expanded");
    expect(menu).toContain('Escape');
    expect(menu).toContain("min-h-11");
    expect(menu).toContain("touch-manipulation");
  });

  it("Activity workspaces: game/coding/sql expose workspace markers and touch-friendly controls", () => {
    expect(read("src/components/study/GameMatchPanel.tsx")).toContain(
      "data-game-workspace",
    );
    expect(read("src/components/study/CodingWorkspacePanel.tsx")).toContain(
      "data-coding-workspace",
    );
    expect(read("src/components/study/SqlWorkspacePanel.tsx")).toContain(
      "data-sql-workspace",
    );
    const activity = read("src/components/study/ActivityWorkspace.tsx");
    expect(activity).toContain("WIDE_WORKSPACE_KINDS");
    expect(activity).toContain("max-w-6xl");
  });

  it("documents emulation limitation (no physical iPad claimed)", () => {
    // This test file is the static smoke gate. Live VoiceOver/TalkBack/iPad
    // verification remains an environment-dependent release checklist item.
    expect(true).toBe(true);
  });
});
