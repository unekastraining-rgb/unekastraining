/**
 * Beta journey & product reality — integrity of continuity + terminology fixes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { listProgressionEntriesForConcept } from "@/lib/learning/content-progression/catalog";

describe("beta journey product reality", () => {
  it("Lucky Study Hub return targets /study not Academic Hub /dashboard", () => {
    const strip = readFileSync(
      path.join(process.cwd(), "src/components/study/LuckyContinuityStrip.tsx"),
      "utf8",
    );
    expect(strip).toMatch(/hubHref[\s\S]*\/study/);
    expect(strip).not.toMatch(/hubHref[\s\S]*\/dashboard/);
    expect(strip).toContain("Study Hub");
  });

  it("Locker does not label TopicMastery telemetry as Mastery", () => {
    const locker = readFileSync(
      path.join(process.cwd(), "src/components/hub/LockerTab.tsx"),
      "utf8",
    );
    expect(locker).toContain('label: "Topic progress"');
    expect(locker).not.toMatch(/label:\s*"Mastery"/);
  });

  it("Healthcare Admin UNDERSTAND rows are concept-specific (not template filler)", () => {
    const roles = listProgressionEntriesForConcept("hc-admin-roles-explain");
    const understand = roles.find((e) => e.stage === "UNDERSTAND");
    expect(understand?.objective).toMatch(/front-desk|billing|clinical/i);
    expect(understand?.objective).not.toMatch(/^Explain the core idea of:/);

    const transfer = roles.find((e) =>
      (e.contextVariant ?? "").includes("specialty"),
    );
    expect(transfer?.objective).toMatch(/specialty clinic/i);
  });
});
