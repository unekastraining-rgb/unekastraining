import { describe, expect, it } from "vitest";

import {
  createDeskItem,
  deskFilter,
  mergeDeskFromExtract,
  pinDeskItemToPage,
  upsertDeskItem,
} from "@/lib/core/notebook-desk";
import { emptyDocument } from "@/lib/core/note-types";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";

function extract(partial: Partial<ChapterStudyExtract>): ChapterStudyExtract {
  return {
    title: "Chapter 1",
    chapterOverview: "",
    learningObjectives: [],
    definitions: [],
    frameworks: [],
    comparisons: [],
    mustKnow: [],
    studyToRemember: [],
    testYourself: [],
    processesOrSteps: [],
    recommendedFormats: [],
    ...partial,
  };
}

describe("notebook desk", () => {
  it("stores quick notes, reminders, and important concepts without dropping existing cards", () => {
    const note = createDeskItem({ kind: "quick", title: "Buy highlighters" });
    const reminder = createDeskItem({
      kind: "reminder",
      title: "Review loops",
      reminderAt: "2026-09-09T12:00:00.000Z",
    });
    let desk = upsertDeskItem(undefined, note);
    desk = upsertDeskItem(desk, reminder);
    expect(desk.items).toHaveLength(2);
    expect(deskFilter(desk.items, "reminder")[0]?.title).toBe("Review loops");
  });

  it("seeds important concepts from a chapter extract without duplicating terms", () => {
    const first = mergeDeskFromExtract(
      undefined,
      extract({
        definitions: [{ term: "Object", definition: "An instance of a class." }],
        mustKnow: ["Encapsulation hides internals."],
      }),
    );
    const second = mergeDeskFromExtract(
      first,
      extract({
        definitions: [{ term: "Object", definition: "An instance of a class." }],
        mustKnow: ["Encapsulation hides internals."],
      }),
    );
    expect(first.items.filter((item) => item.kind === "concept")).toHaveLength(2);
    expect(second.items.filter((item) => item.kind === "concept")).toHaveLength(2);
  });

  it("pins a desk card onto the page as a sticky without removing other decorations", () => {
    const doc = emptyDocument();
    doc.decorations = [
      {
        id: "keep",
        kind: "sticky",
        x: 10,
        y: 10,
        w: 80,
        h: 80,
        color: "#fff",
        text: "keep me",
      },
    ];
    const next = pinDeskItemToPage(
      doc,
      createDeskItem({ kind: "quick", title: "New sticky", body: "From desk" }),
    );
    expect(next.decorations?.some((item) => item.id === "keep")).toBe(true);
    expect(next.decorations?.some((item) => item.text?.includes("New sticky"))).toBe(true);
  });
});
