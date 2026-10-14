import { describe, expect, it } from "vitest";

import { PROBES } from "@/lib/learning/habits/catalog";
import { buildDiagnosticReport, reportForResults } from "@/lib/learning/habits/diagnosis";
import { emptyLearningHabitsDocument } from "@/lib/learning/habits/document";
import { reduceLearningHabits } from "@/lib/learning/habits/engine";
import { recommendProgression } from "@/lib/learning/habits/progression";
import {
  capabilitiesFor,
  PROGRESSION_CAPABILITIES,
  taskTrackComplete,
  trackIds,
} from "@/lib/learning/habits/progression-standard";

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

describe("cross-subject progression cycle", () => {
  it("uses a shared capability list and lets each subject omit stages", () => {
    expect(capabilitiesFor("python").length).toBeLessThan(PROGRESSION_CAPABILITIES.length);
    expect(capabilitiesFor("math")).not.toContain("reduced-support");
    expect(trackIds("math").join(" ")).not.toMatch(/while|indent/);
    expect(trackIds("python")).not.toEqual(trackIds("math"));
    expect(PROBES).toHaveLength(7);
  });

  it("sends a foundation miss to prerequisite instruction", () => {
    const doc = submit(emptyLearningHabitsDocument(), "math-op", "subtract", 0);
    const advice = recommendProgression(doc);
    expect(advice.orchestratorAction).toBe("teach");
    expect(advice.href).toMatch(/\/study\/six\//);
    expect(advice.mastery).toBe(false);
  });

  it("follows a missed arrangement with example practice, then an unaided check", () => {
    let doc = submit(emptyLearningHabitsDocument(), "py-order-make", "update>ask>check>again", 0);
    let advice = recommendProgression(doc);
    expect(advice.title).toBe("Arrange the steps with the example");
    expect(advice.href).toContain("subject=python");
    doc = submit(doc, "py-order-supported", "ask>check>update>again", 1, "worked-example");
    advice = recommendProgression(doc);
    expect(advice.title).toBe("Arrange the steps without the example");
    expect(doc.assessment.results).toHaveLength(2);
    expect(advice.mastery).toBe(false);
  });

  it("does not treat one unaided production as the end of the skill", () => {
    let doc = submit(emptyLearningHabitsDocument(), "py-component", "input", 0);
    doc = submit(doc, "py-order-make", "update>ask>check>again", 1);
    doc = submit(doc, "py-order-supported", "ask>check>update>again", 2, "worked-example");
    doc = submit(doc, "py-order-plain", "ask>check>update>again", 3);
    const plain = doc.assessment.results.find((row) => row.templateId === "py-order-plain");
    expect(plain?.supportLevel).toBe("none");
    expect(plain?.correct).toBe(true);
    const advice = recommendProgression(doc);
    expect(advice.title).toBe("Place each withdrawal line");
    expect(advice.reason.toLowerCase()).toMatch(/one unaided/);
    expect(advice.mastery).toBe(false);
    expect(doc.assessment.results.map((row) => row.templateId)).toEqual([
      "py-component",
      "py-order-make",
      "py-order-supported",
      "py-order-plain",
    ]);
  });

  it("asks for another unaided build when support worked and the unaided build missed", () => {
    let doc = submit(emptyLearningHabitsDocument(), "math-build-supported", "groups>extras>total", 0, "worked-example");
    doc = submit(doc, "math-build-independent", "extras>groups>total", 1);
    const advice = recommendProgression(doc);
    expect(advice.title).toBe("Try the build without the example");
    expect(advice.href).toContain("subject=math");
    doc = submit(doc, "math-build-plain", "groups>extras>total", 2);
    expect(doc.assessment.results.filter((row) => row.templateId === "math-build-plain")).toHaveLength(1);
    expect(recommendProgression(doc).title).not.toBe("Try the build without the example");
  });

  it("keeps a combined miss from erasing correct produced parts", () => {
    let doc = submit(emptyLearningHabitsDocument(), "py-order-make", "ask>check>update>again", 0);
    doc = submit(doc, "py-place-make", "read:loop|reject:bad|update:valid", 1);
    doc = submit(doc, "py-build-supported", "update>ask>stop>reject", 2, "hint");
    const report = buildDiagnosticReport(doc);
    expect(report?.strengths).toMatch(/Arrange the withdrawal steps/);
    expect(report?.strengths).toMatch(/Place each withdrawal line/);
    expect(report?.suggests.toLowerCase()).toMatch(/combining|order and placement/);
    expect(report?.suggests.toLowerCase()).not.toMatch(/does not understand/);
  });

  it("sends a produced transfer miss to changed-situation practice", () => {
    let doc = submit(emptyLearningHabitsDocument(), "math-build-independent", "groups>extras>total", 0);
    doc = submit(doc, "math-transfer-make", "extras>groups>total", 1);
    const advice = recommendProgression(doc);
    expect(advice.href).toBe("/study/practice-hub");
    expect(advice.title.toLowerCase()).toMatch(/familiar/);
  });

  it("does not treat recognition as production and hides a partial track", () => {
    const doc = submit(emptyLearningHabitsDocument(), "py-component", "input", 0);
    const report = buildDiagnosticReport(doc);
    expect(report).toBeNull();
    expect(doc.assessment.results[0]?.performanceKind).toBe("recognition");
    expect(reportForResults(doc)).toBeNull();
    expect(taskTrackComplete(doc, "python")).toBe(false);
    expect(doc.assessment.status).toBe("not_started");
  });

  it("does not blame a learner for a recorded instructional error", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      {
        type: "submit-probe",
        probeId: "py-order-make",
        choiceId: "update>ask>check>again",
        instructionalIssue: "contradictory-explanation",
      },
      at(0),
    );
    expect(recommendProgression(doc).title).toMatch(/earlier explanation/i);
    expect(buildDiagnosticReport(doc)?.suggests.toLowerCase()).toMatch(/not treated as evidence/);
  });

  it("does not count a same-session task success as delayed retention", () => {
    const doc = submit(emptyLearningHabitsDocument(), "py-order-make", "ask>check>update>again", 0);
    expect(doc.reviews.every((row) => row.countsAsDelayed !== true)).toBe(true);
  });

  it("ignores a duplicate production submit", () => {
    let doc = submit(emptyLearningHabitsDocument(), "py-order-make", "ask>check>update>again", 0);
    doc = submit(doc, "py-order-make", "update>ask>check>again", 1);
    expect(doc.assessment.results).toHaveLength(1);
    expect(doc.assessment.results[0]?.correct).toBe(true);
  });
});
