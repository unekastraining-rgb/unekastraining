import { describe, expect, it } from "vitest";

import { formatColdStartSyncMessage } from "@/lib/lms/cold-start-sync-message";

describe("formatColdStartSyncMessage", () => {
  it("lists seeded courses and next steps for Blurt / Core", () => {
    const message = formatColdStartSyncMessage("Synced 2 Canvas courses.", {
      syllabiImported: 2,
      topicsCreated: 8,
      courseTitles: ["CS 201 — Data Structures", "ENG 110 — Composition"],
    });

    expect(message).toMatch(/seeded 2 syllabuses and 8 topics/);
    expect(message).toMatch(/CS 201 — Data Structures/);
    expect(message).toMatch(/Blurt/);
    expect(message).toMatch(/Study from topics/);
  });

  it("returns base message when nothing was seeded", () => {
    expect(
      formatColdStartSyncMessage("Synced 0 Canvas courses.", {
        syllabiImported: 0,
        topicsCreated: 0,
        courseTitles: [],
      }),
    ).toBe("Synced 0 Canvas courses.");
  });
});
