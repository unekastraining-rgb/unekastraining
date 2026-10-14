import { describe, expect, it } from "vitest";

import { probeById, PROBES } from "@/lib/learning/habits/catalog";
import { reportForResults } from "@/lib/learning/habits/diagnosis";
import { emptyLearningHabitsDocument } from "@/lib/learning/habits/document";
import { reduceLearningHabits } from "@/lib/learning/habits/engine";
import { recommendProgression } from "@/lib/learning/habits/progression";
import { nextTrackProbe, taskTrackComplete } from "@/lib/learning/habits/progression-standard";
import { createTaskDraft } from "@/lib/learning/habits/task-draft";

const at = (minute: number) => new Date(Date.UTC(2026, 9, 12, 12, minute));

function submit(
  doc: ReturnType<typeof emptyLearningHabitsDocument>,
  probeId: string,
  choiceId: string,
  minute: number,
  supportLevel?: "none" | "hint" | "worked-example",
) {
  return reduceLearningHabits(
    doc,
    { type: "submit-probe", probeId, choiceId, supportLevel },
    at(minute),
  );
}

const shuffled = [
  { id: "check", label: "Check the amount" },
  { id: "update", label: "Update the balance" },
  { id: "again", label: "Ask again" },
  { id: "ask", label: "Ask for the amount" },
];

describe("submitted arrangement and support", () => {
  it("keeps the latest order when the same step is moved before the screen repaints", () => {
    const draft = createTaskDraft({ order: shuffled });
    draft.move("ask", -1);
    draft.move("ask", -1);
    draft.move("ask", -1);
    draft.markSupport("worked-example");
    const snap = draft.snapshot();
    expect(snap.order.map((piece) => piece.label).join(" > ")).toBe(
      "Ask for the amount > Check the amount > Update the balance > Ask again",
    );
    expect(snap.orderId).toBe("ask>check>update>again");
    expect(snap.support).toBe("worked-example");
  });

  it("does not treat an available example as a used example", () => {
    const draft = createTaskDraft({ order: shuffled });
    expect(probeById("py-order-supported")?.workedExample).toBeTruthy();
    expect(draft.snapshot().support).toBe("none");
  });

  it("saves the drafted order and the support that was actually opened", () => {
    const draft = createTaskDraft({ order: shuffled });
    draft.move("ask", -1);
    draft.move("ask", -1);
    draft.move("ask", -1);
    draft.markSupport("worked-example");
    const snap = draft.snapshot();
    const doc = submit(emptyLearningHabitsDocument(), "py-order-supported", snap.orderId, 0, snap.support);
    const row = doc.assessment.results[0];
    expect(row?.response).toBe("ask>check>update>again");
    expect(row?.correct).toBe(true);
    expect(row?.supportLevel).toBe("worked-example");
    expect(row?.assisted).toBe(true);
  });

  it("records an independent arrangement as unaided and hides the example on that probe", () => {
    const plain = probeById("py-order-plain");
    expect(plain?.hint).toBeNull();
    expect(plain?.workedExample).toBeNull();
    const doc = submit(emptyLearningHabitsDocument(), "py-order-plain", "ask>check>update>again", 0, "worked-example");
    expect(doc.assessment.results[0]?.supportLevel).toBe("none");
    expect(doc.assessment.results[0]?.correct).toBe(true);
  });

  it("keeps the first attempt when a retry is a new probe", () => {
    let doc = submit(emptyLearningHabitsDocument(), "py-order-make", "check>update>again>ask", 0);
    doc = submit(doc, "py-order-make", "ask>check>update>again", 1);
    doc = submit(doc, "py-order-supported", "ask>check>update>again", 2, "worked-example");
    expect(doc.assessment.results).toHaveLength(2);
    expect(doc.assessment.results[0]?.response).toBe("check>update>again>ask");
    expect(doc.assessment.results[0]?.correct).toBe(false);
    expect(doc.assessment.results[1]?.supportLevel).toBe("worked-example");
  });

  it("changes the next activity after the unaided arrangement is saved", () => {
    let doc = submit(emptyLearningHabitsDocument(), "py-component", "input", 0);
    doc = submit(doc, "py-order-make", "check>update>again>ask", 1);
    expect(recommendProgression(doc).title).toBe("Arrange the steps with the example");
    expect(nextTrackProbe(doc, "python")?.id).toBe("py-order-supported");
    doc = submit(doc, "py-order-supported", "ask>check>update>again", 2, "worked-example");
    doc = submit(doc, "math-order-make", "total>groups>extras", 4);
    expect(nextTrackProbe(doc, "math")?.id).toBe("math-order-supported");
    expect(nextTrackProbe(doc, "python")?.id).toBe("py-order-plain");
    expect(nextTrackProbe(doc, "python")?.workedExample).toBeNull();
    doc = submit(doc, "py-order-plain", "ask>check>update>again", 3);
    expect(recommendProgression(doc).title).toBe("Place each withdrawal line");
    expect(reportForResults(doc)).toBeNull();
    expect(taskTrackComplete(doc, "python")).toBe(false);
    expect(PROBES).toHaveLength(7);
  });

  it("keeps a supported math solution and asks for an unaided problem after an independent miss", () => {
    let doc = submit(emptyLearningHabitsDocument(), "math-build-supported", "groups>extras>total", 0, "worked-example");
    doc = submit(doc, "math-build-independent", "extras>groups>total", 1);
    const advice = recommendProgression(doc);
    expect(advice.title).toBe("Try the build without the example");
    expect(doc.assessment.results.find((row) => row.templateId === "math-build-supported")?.correct).toBe(true);
    expect(nextTrackProbe(doc, "math")?.id).toBe("math-build-plain");
    expect(nextTrackProbe(doc, "math")?.hint).toBeNull();
  });
});
