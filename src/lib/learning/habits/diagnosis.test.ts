import { describe, expect, it } from "vitest";

import { buildDiagnosticReport, reportForResults } from "@/lib/learning/habits/diagnosis";
import { emptyLearningHabitsDocument } from "@/lib/learning/habits/document";
import { deriveRecommendations, reduceLearningHabits } from "@/lib/learning/habits/engine";
import { recommendProgression } from "@/lib/learning/habits/progression";

const t0 = new Date("2026-10-12T12:00:00.000Z");
const t1 = new Date("2026-10-12T12:05:00.000Z");
const t2 = new Date("2026-10-12T12:10:00.000Z");
const t3 = new Date("2026-10-12T12:15:00.000Z");
const t4 = new Date("2026-10-12T12:20:00.000Z");

describe("evidence-based diagnosis", () => {
  it("does not name a difficulty from one miss beside a success", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "0" },
      t0,
    );
    doc = reduceLearningHabits(doc, { type: "submit-probe", probeId: "chunk-steps", choiceId: "1" }, t1);
    const report = buildDiagnosticReport(doc);
    expect(report?.confidence).toBe("insufficient");
    expect(report?.suggests.toLowerCase()).not.toMatch(/learning style|does not understand python/);
    expect(report?.approach).toBeTruthy();
  });

  it("keeps competing results on the same focus unresolved", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "1" },
      t0,
    );
    doc = reduceLearningHabits(doc, { type: "submit-probe", probeId: "chunk-steps", choiceId: "0" }, t1);
    const report = buildDiagnosticReport(doc);
    expect(report?.confidence).toBe("insufficient");
    expect(report?.noticing.toLowerCase()).toMatch(/disagree/);
  });

  it("does not treat an instructional error as a learner difficulty", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      {
        type: "submit-probe",
        probeId: "chunk-dense",
        choiceId: "0",
        instructionalIssue: "contradictory-explanation",
      },
      t0,
    );
    const advice = recommendProgression(doc);
    const report = buildDiagnosticReport(doc);
    expect(advice.href).toBe("/study/six/detailed-explanation");
    expect(advice.title).toMatch(/earlier explanation/i);
    expect(report?.suggests.toLowerCase()).toMatch(/not treated as evidence/);
    expect(report?.approach).toContain(advice.title);
  });

  it("routes a coordination gap to assembling familiar parts", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-steps", choiceId: "1" },
      t0,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "detail-symbol", choiceId: "second" },
      t1,
    );
    doc = reduceLearningHabits(
      doc,
      {
        type: "submit-probe",
        probeId: "rule-adapt",
        choiceId: "same",
        difficultyFocus: "coordination",
        explanation: "I multiplied the width.",
      },
      t2,
    );
    const advice = recommendProgression(doc);
    const report = buildDiagnosticReport(doc);
    expect(advice.href).toBe("/study/learning-habits?section=task");
    expect(advice.title).toBe("Check order on a short program");
    expect(advice.mastery).toBe(false);
    expect(report?.confidence).toBe("emerging");
    expect(report?.strengths).toMatch(/without a hint/);
    expect(report?.strengths).toMatch(/Chunked explanation/);
    expect(report?.strengths).toMatch(/Meaningful symbol change/);
    expect(report?.suggests.toLowerCase()).toMatch(/order of the steps/);
    expect(report?.suggests.toLowerCase()).not.toMatch(/does not understand python|indentation/);
    expect(report?.approach).toContain(advice.title);
    expect(report?.steps[0]?.href).toBe(advice.href);
    expect(report?.steps.map((step) => step.title)).toEqual([
      "Check order on a short program",
      "Place each part in the structure",
      "Assemble familiar parts",
    ]);
    expect(deriveRecommendations(doc)[0]?.href).toBe(advice.href);
    expect(reportForResults(doc)).toBeNull();
    expect(reportForResults({ ...doc, assessment: { ...doc.assessment, status: "completed" } })?.steps[0]?.href).toBe(
      "/study/learning-habits?section=task",
    );
  });

  it("assembles parts only after order and placement were each correct", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "1", difficultyFocus: "sequence" },
      t0,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "chunk-steps", choiceId: "1", difficultyFocus: "structure" },
      t1,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "rule-adapt", choiceId: "same", difficultyFocus: "coordination" },
      t2,
    );
    const advice = recommendProgression(doc);
    const report = buildDiagnosticReport(doc);
    expect(advice.href).toBe("/study/six/hands-on-practice");
    expect(advice.title).toBe("Assemble familiar parts");
    expect(report?.suggests.toLowerCase()).toMatch(/combining/);
    expect(report?.steps[0]?.title).toBe(advice.title);
  });

  it("does not invent a sequence difficulty from one general miss", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "0" },
      t0,
    );
    expect(buildDiagnosticReport(doc)).toBeNull();
    expect(recommendProgression(doc).title.toLowerCase()).not.toMatch(/order|structure|indentation/);
  });

  it("treats a conflicting explanation as a reasoning problem", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      {
        type: "submit-probe",
        probeId: "transfer-novel",
        choiceId: "ana",
        explanation: "The last person is served.",
      },
      t0,
    );
    const report = buildDiagnosticReport(doc);
    expect(report?.suggests.toLowerCase()).toMatch(/not treated as understanding/);
    expect(recommendProgression(doc).href).toBe("/study/six/feynman");
    expect(report?.approach).toContain(recommendProgression(doc).title);
  });

  it("keeps a coordination gap open after one later independent success", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-steps", choiceId: "1" },
      t0,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "rule-adapt", choiceId: "same", difficultyFocus: "coordination" },
      t1,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "transfer-novel", choiceId: "ana", difficultyFocus: "coordination" },
      t2,
    );
    expect(recommendProgression(doc).title).toBe("Check order on a short program");
    expect(buildDiagnosticReport(doc)?.noticing.toLowerCase()).toMatch(/does not close/);
  });

  it("weakens a coordination hypothesis after two later independent successes", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-steps", choiceId: "1" },
      t0,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "rule-adapt", choiceId: "same", difficultyFocus: "coordination" },
      t1,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "transfer-novel", choiceId: "ana", difficultyFocus: "coordination" },
      t2,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "recall-delay", choiceId: "1", difficultyFocus: "coordination" },
      t3,
    );
    const advice = recommendProgression(doc);
    const report = buildDiagnosticReport(doc);
    expect(advice.title).not.toBe("Assemble familiar parts");
    expect(report?.confidence).toBe("revised");
    expect(doc.assessment.results.filter((row) => row.correct === false)).toHaveLength(1);
    expect(report?.breakdown).toMatch(/Adapt the rule/);
  });

  it("sends sequence and structure misses to different activities", () => {
    const sequence = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "0", difficultyFocus: "sequence" },
      t0,
    );
    const structure = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "0", difficultyFocus: "structure" },
      t4,
    );
    expect(recommendProgression(sequence).href).toBe("/study/six/chunking");
    expect(recommendProgression(sequence).title).toMatch(/order/i);
    expect(buildDiagnosticReport(sequence)?.suggests.toLowerCase()).toMatch(/order/);
    expect(buildDiagnosticReport(sequence)?.suggests.toLowerCase()).not.toMatch(/where a part belongs/);
    expect(recommendProgression(structure).href).toBe("/study/six/hands-on-practice");
    expect(recommendProgression(structure).title).toMatch(/structure/i);
    expect(buildDiagnosticReport(structure)?.suggests.toLowerCase()).toMatch(/where a part belongs/);
    expect(buildDiagnosticReport(structure)?.approach).not.toContain("Order the steps");
    const differentiation = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "0", difficultyFocus: "differentiation" },
      t0,
    );
    expect(recommendProgression(differentiation).href).toBe("/study/six/detailed-explanation");
  });
});
