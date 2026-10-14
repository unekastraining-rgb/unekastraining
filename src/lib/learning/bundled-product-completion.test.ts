/**
 * Bundled product completion — content + draft integrity (no new engines).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import {
  listProgressionEntriesForConcept,
} from "@/lib/learning/content-progression/catalog";
import { auditContentDepthSparsity } from "@/lib/learning/content-production/content-depth-report";
import { activityLocalDraftTruthSummary } from "@/lib/learning/artifact-persistence/activity-local-draft";

describe("bundled product completion integrity", () => {
  it("HVAC / electrical / auto / chem / physics ladders exist with structured content", () => {
    expect(getStructuredChallenge("lab-hvac-airflow")?.domainTag).toBe("hvac");
    expect(getStructuredChallenge("sim-hvac-comfort")?.domainTag).toBe("hvac");
    expect(getStructuredChallenge("write-research-ethics-scenario")?.kind).toBe(
      "writing",
    );

    const elec = listProgressionEntriesForConcept("circuit-fault-diagnosis");
    expect(elec.some((e) => e.stage === "RETAIN")).toBe(true);

    const auto = listProgressionEntriesForConcept("vehicle-diagnostics");
    expect(auto.some((e) => e.stage === "PRACTICE")).toBe(true);

    const chem = listProgressionEntriesForConcept("density");
    expect(chem.some((e) => e.stage === "UNDERSTAND")).toBe(true);

    const phys = listProgressionEntriesForConcept("net-force-reasoning");
    expect(phys.some((e) => e.stage === "UNDERSTAND")).toBe(true);
    expect(phys.some((e) => e.stage === "RETAIN")).toBe(true);

    const hvac = listProgressionEntriesForConcept("hvac-thermostat-airflow");
    expect(hvac.length).toBeGreaterThanOrEqual(3);
  });

  it("activity draft truth + workspace wiring; RELEASE_NOTES present", () => {
    expect(activityLocalDraftTruthSummary().draftIsNotLearningAttempt).toBe(
      true,
    );
    const ws = readFileSync(
      path.join(process.cwd(), "src/components/study/ActivityWorkspace.tsx"),
      "utf8",
    );
    expect(ws).toContain("writeActivityLocalDraft");
    expect(ws).toContain("readActivityLocalDraft");
    expect(ws).toContain("clearActivityLocalDraft");

    const notes = readFileSync(
      path.join(process.cwd(), "RELEASE_NOTES.md"),
      "utf8",
    );
    expect(notes).toContain("0.2.0-beta.1");
    expect(notes).toContain("CORE → SIX → LUCKY");
    expect(notes).not.toMatch(/sk-live|AIza[0-9A-Za-z_-]{20,}/);
  });

  it("content sparsity audit still runs without forcing identical depth", () => {
    const flags = auditContentDepthSparsity();
    expect(Array.isArray(flags)).toBe(true);
    // HVAC should no longer be a zero-concept sparse_domain after pack add.
    expect(
      flags.some(
        (f) => f.domain === "HVAC" && f.code === "sparse_domain",
      ),
    ).toBe(false);
  });
});
