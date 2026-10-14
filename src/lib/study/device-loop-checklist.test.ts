import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { demoColdStartCourseEntry } from "@/lib/lms/demo-cold-start";

function readDeviceLoopSource() {
  return readFileSync(join(process.cwd(), "scripts/smoke-device-loop.ts"), "utf8");
}

function extractStepLabels(source: string): string[] {
  const labels: string[] = [];
  const pattern = /label:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    labels.push(match[1]!);
  }
  return labels;
}

describe("device loop checklist", () => {
  it("defines 43 manual iPad verification steps", () => {
    const labels = extractStepLabels(readDeviceLoopSource());
    expect(labels).toHaveLength(43);
    expect(labels[0]).toMatch(/Hub → Import demo courses/i);
    expect(labels.at(-1)).toMatch(/Flashcards loop/i);
  });

  it("anchors cold-start steps on demo course topic (not Intro)", () => {
    const entry = demoColdStartCourseEntry("demo-cs201", "CS 201 — Data Structures", "CS201");
    expect(entry.focusTopic).toBeTruthy();
    expect(entry.focusTopic!.toLowerCase()).not.toMatch(/^intro(duction)?$/);

    const source = readDeviceLoopSource();
    expect(source).toContain("demoColdStartCourseEntry");
    expect(source).toContain("coreStudyPackHref");
    expect(source).toContain("teachMeHref");
  });
});
