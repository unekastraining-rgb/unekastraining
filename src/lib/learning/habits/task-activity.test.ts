import { describe, expect, it } from "vitest";

import { nextProbe, PROBES, probeById, TASK_PROBES } from "@/lib/learning/habits/catalog";
import { trackIds } from "@/lib/learning/habits/progression-standard";
import { buildDiagnosticReport, reportForResults, taskActivityComplete } from "@/lib/learning/habits/diagnosis";
import { emptyLearningHabitsDocument } from "@/lib/learning/habits/document";
import { reduceLearningHabits } from "@/lib/learning/habits/engine";
import { recommendProgression, successfulDiagnosticStages } from "@/lib/learning/habits/progression";

const times = [0, 1, 2, 3, 4, 5].map((n) => new Date(Date.UTC(2026, 9, 12, 12, n)));

function submit(
  doc: ReturnType<typeof emptyLearningHabitsDocument>,
  probeId: string,
  choiceId: string,
  at: Date,
) {
  return reduceLearningHabits(doc, { type: "submit-probe", probeId, choiceId }, at);
}

describe("program task evidence", () => {
  it("keeps the task out of the seven-challenge lab", () => {
    expect(PROBES).toHaveLength(7);
    expect(TASK_PROBES.length).toBeGreaterThan(5);
    expect(trackIds("python")).toHaveLength(6);
    expect(trackIds("math").some((id) => id.includes("while"))).toBe(false);
    expect(probeById("py-structure")?.difficultyFocus).toBe("structure");
    expect(nextProbe({ completedIds: [], difficulty: 1 })?.id).toBe("chunk-dense");
    expect(successfulDiagnosticStages()).toHaveLength(7);
    const doc = submit(emptyLearningHabitsDocument(), "py-component", "input", times[0]!);
    expect(doc.assessment.status).toBe("not_started");
    expect(doc.assessment.results).toHaveLength(1);
  });

  it("does not treat a combined miss as missing every underlying concept", () => {
    let doc = emptyLearningHabitsDocument();
    doc = submit(doc, "py-component", "input", times[0]!);
    doc = submit(doc, "py-sequence", "ask-check", times[1]!);
    doc = submit(doc, "py-structure", "valid-branch", times[2]!);
    doc = submit(doc, "py-integrate", "update-first", times[3]!);
    const advice = recommendProgression(doc);
    const report = buildDiagnosticReport(doc);
    expect(advice.href).toBe("/study/six/hands-on-practice");
    expect(advice.title).toBe("Assemble familiar parts");
    expect(advice.mastery).toBe(false);
    expect(report?.strengths).toMatch(/Read the next amount/);
    expect(report?.strengths).toMatch(/Order the withdrawal steps/);
    expect(report?.strengths).toMatch(/Place the balance update/);
    expect(report?.suggests.toLowerCase()).toMatch(/combining/);
    expect(report?.suggests.toLowerCase()).not.toMatch(/does not understand|indentation/);
  });

  it("sends a sequence miss and a placement miss to different activities", () => {
    const sequence = submit(
      submit(emptyLearningHabitsDocument(), "py-component", "input", times[0]!),
      "py-sequence",
      "update-first",
      times[1]!,
    );
    const structure = submit(
      submit(
        submit(emptyLearningHabitsDocument(), "py-component", "input", times[0]!),
        "py-sequence",
        "ask-check",
        times[1]!,
      ),
      "py-structure",
      "before",
      times[2]!,
    );
    expect(recommendProgression(sequence).href).toBe("/study/six/chunking");
    expect(recommendProgression(sequence).title).toMatch(/order/i);
    expect(recommendProgression(structure).href).toBe("/study/six/hands-on-practice");
    expect(recommendProgression(structure).title).toMatch(/structure/i);
    expect(buildDiagnosticReport(sequence)?.suggests.toLowerCase()).toMatch(/order/);
    expect(buildDiagnosticReport(structure)?.suggests.toLowerCase()).toMatch(/where a part belongs/);
  });

  it("treats a changed stop value as transfer when the full program was correct", () => {
    let doc = emptyLearningHabitsDocument();
    doc = submit(doc, "py-component", "input", times[0]!);
    doc = submit(doc, "py-sequence", "ask-check", times[1]!);
    doc = submit(doc, "py-structure", "valid-branch", times[2]!);
    doc = submit(doc, "py-integrate", "full", times[3]!);
    doc = submit(doc, "py-transfer", "before", times[4]!);
    const advice = recommendProgression(doc);
    expect(advice.href).toBe("/study/practice-hub");
    expect(advice.title).toMatch(/familiar/i);
    expect(buildDiagnosticReport(doc)?.suggests.toLowerCase()).toMatch(/familiar/);
    expect(taskActivityComplete(doc)).toBe(false);
    expect(reportForResults(doc)).toBeNull();
  });

  it("hides the report until the program task is finished and ignores a duplicate", () => {
    let doc = emptyLearningHabitsDocument();
    for (const [index, probe] of TASK_PROBES.slice(0, 4).entries()) {
      doc = submit(doc, probe.id, probe.correctChoiceId, times[index]!);
    }
    expect(reportForResults(doc)).toBeNull();
    const again = submit(doc, "py-component", "print", times[5]!);
    expect(again.assessment.results.filter((row) => row.templateId === "py-component")).toHaveLength(1);
    doc = submit(doc, "py-transfer", "before", times[4]!);
    expect(taskActivityComplete(doc)).toBe(false);
    expect(reportForResults(doc)).toBeNull();
  });
});
