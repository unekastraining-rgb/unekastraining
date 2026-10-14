/**
 * Bundle P — Production polish integrity (loading / empty / error / a11y / save).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Bundle P — Loading / empty / error states", () => {
  it("catalog empty state is actionable", () => {
    const catalog = read("src/components/study/CapabilityCatalogView.tsx");
    expect(catalog).toContain("data-catalog-empty");
    expect(catalog).toContain("Open Learning Studio");
    expect(catalog).toContain("/dashboard");
  });

  it("planner has loading, empty, and actionable error states", () => {
    const planner = read("src/components/planner/PlannerDestination.tsx");
    expect(planner).toContain('aria-label="Loading planner"');
    expect(planner).toContain("data-planner-empty");
    expect(planner).toContain("data-planner-error");
    expect(planner).toContain("Practice Hub");
  });

  it("ActivityWorkspace exposes loading and draft recovery", () => {
    const ws = read("src/components/study/ActivityWorkspace.tsx");
    expect(ws).toContain('data-activity-state="LOADING"');
    expect(ws).toContain("data-activity-draft-restored");
    expect(ws).toContain("learnerFacingActivityError");
  });

  it("LMS empty connection stays honest", () => {
    const settings = read("src/components/hub/settings/SettingsPanel.tsx");
    expect(settings).toContain("data-lms-environment-notice");
    expect(settings).toContain("never pretends");
  });

  it("Locker empty state routes to Practice Hub", () => {
    const empty = read("src/components/hub/EmptyStates.tsx");
    expect(empty).toContain("/study/practice-hub");
    expect(empty).toContain("Open Practice Hub");
  });
});

describe("Bundle P — Accessibility / touch / spatial", () => {
  it("Learning Studio keeps rail/drawer/dock touch targets", () => {
    expect(
      read("src/components/study/learning-workspace/CurriculumRail.tsx"),
    ).toContain("min-h-11");
    expect(
      read("src/components/study/learning-workspace/LearningDock.tsx"),
    ).toContain('aria-label="Study rooms"');
    expect(read("src/components/hub/HubSectionsMenu.tsx")).toContain(
      'role="menu"',
    );
  });

  it("wide activity workspaces use max-w-6xl; Lucky workspace is not phone-only", () => {
    expect(read("src/components/study/ActivityWorkspace.tsx")).toContain(
      "max-w-6xl",
    );
    expect(read("app/study/lucky/lucky-engine-view.tsx")).toContain(
      "data-lucky-workspace",
    );
  });
});

describe("Bundle P — Save / navigation consistency", () => {
  it("Haul and Core preserve autosave / evidence best-effort paths", () => {
    expect(read("src/components/haul/HaulWritingWorkspace.tsx")).toContain(
      "/api/haul/writing/evidence",
    );
    expect(read("src/components/study/ActivityWorkspace.tsx")).toContain(
      "writeActivityLocalDraft",
    );
  });

  it("does not weaken React Compiler rules globally", () => {
    const eslint = read("eslint.config.mjs");
    expect(eslint).not.toContain('"react-hooks/set-state-in-effect": "warn"');
    expect(eslint).not.toContain('"react-hooks/set-state-in-effect": "off"');
  });
});
