import { describe, expect, it } from "vitest";

import { evidenceCharts } from "@/lib/learning/habits/discovery";
import { emptyLearningHabitsDocument } from "@/lib/learning/habits/document";
import { deriveRecommendations, reduceLearningHabits } from "@/lib/learning/habits/engine";
import {
  classifyReasoning,
  recommendProgression,
  stageAdvancesGradually,
  successfulDiagnosticStages,
} from "@/lib/learning/habits/progression";

const now = new Date("2026-10-12T12:00:00.000Z");
const later = new Date(now.getTime() + 24 * 60 * 60 * 1000);

describe("gradual progression", () => {
  it("sends a foundational miss to a prerequisite activity and keeps earlier progress", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "0" },
      now,
    );
    const advice = recommendProgression(doc);
    expect(advice.orchestratorAction).toBe("teach");
    expect(advice.mastery).toBe(false);
    expect(advice.href).toMatch(/\/study\/six\//);
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "chunk-steps", choiceId: "1" },
      now,
    );
    expect(doc.assessment.results.map((row) => row.templateId)).toEqual(["chunk-dense", "chunk-steps"]);
    expect(recommendProgression(doc).orchestratorAction).not.toBe("complete");
  });

  it("increases diagnostic stages one step at a time and keeps variation separate from transfer", () => {
    const stages = successfulDiagnosticStages();
    expect(stageAdvancesGradually(stages)).toBe(true);
    expect(stages.indexOf("variation")).toBeLessThan(stages.indexOf("transfer"));
    expect(stages.indexOf("supported")).toBeLessThan(stages.indexOf("variation"));
  });

  it("does not treat one correct answer as mastery", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "1" },
      now,
    );
    const advice = recommendProgression(doc);
    expect(advice.mastery).toBe(false);
    expect(advice.orchestratorAction).not.toBe("advance");
    expect(advice.orchestratorAction).not.toBe("complete");
  });

  it("keeps independent success separate from supported success", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "1", supportLevel: "hint" },
      now,
    );
    expect(doc.assessment.results[0]?.assisted).toBe(true);
    expect(doc.assessment.results[0]?.correct).toBe(true);
    expect(recommendProgression(doc).title).toMatch(/without a hint/);
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "chunk-steps", choiceId: "1", supportLevel: "none" },
      now,
    );
    const independent = doc.assessment.results.filter((row) => row.supportLevel === "none" && row.correct);
    expect(independent).toHaveLength(1);
    expect(recommendProgression(doc).title).not.toMatch(/without a hint/);
  });
});

describe("evidence-driven next activity", () => {
  function withProbe(
    doc: ReturnType<typeof emptyLearningHabitsDocument>,
    probeId: string,
    choiceId: string,
    extra?: { explanation?: string; supportLevel?: "none" | "hint" | "worked-example" },
  ) {
    return reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId, choiceId, ...extra },
      now,
    );
  }

  it("covers the nine learning situations with a real activity link", () => {
    const gap = recommendProgression(withProbe(emptyLearningHabitsDocument(), "chunk-dense", "0"));
    expect(gap.href).toBe("/study/six/chunking");
    expect(gap.orchestratorAction).toBe("teach");

    const unknown = recommendProgression(
      withProbe(emptyLearningHabitsDocument(), "rule-adapt", "double"),
    );
    expect(unknown.title).toMatch(/reason/i);
    expect(unknown.href).toBe("/study/six/feynman");
    expect(unknown.mastery).toBe(false);

    const contradictory = recommendProgression(
      withProbe(emptyLearningHabitsDocument(), "transfer-novel", "ana", {
        explanation: "The last person is served.",
      }),
    );
    expect(contradictory.href).toBe("/study/six/feynman");
    expect(contradictory.orchestratorAction).toBe("reteach");

    const partial = recommendProgression(
      withProbe(emptyLearningHabitsDocument(), "rule-adapt", "half", {
        explanation: "The width doubles, so the area uses that rule.",
      }),
    );
    expect(partial.reason).toMatch(/missing piece/i);
    expect(partial.href).toBe("/study/six/detailed-explanation");

    const hinted = recommendProgression(
      withProbe(emptyLearningHabitsDocument(), "chunk-dense", "1", { supportLevel: "hint" }),
    );
    expect(hinted.title).toMatch(/without a hint/);
    expect(hinted.orchestratorAction).not.toBe("advance");

    let repeated = emptyLearningHabitsDocument();
    repeated = withProbe(repeated, "chunk-steps", "1");
    repeated = withProbe(repeated, "transfer-familiar", "1");
    const grew = recommendProgression(repeated);
    expect(grew.title).toMatch(/one step/i);
    expect(grew.href.startsWith("/study/six/")).toBe(true);
    expect(grew.orchestratorAction).toBe("practice");

    let transfer = emptyLearningHabitsDocument();
    transfer = withProbe(transfer, "transfer-familiar", "1");
    transfer = withProbe(transfer, "transfer-novel", "bo");
    const moved = recommendProgression(transfer);
    expect(moved.href).toBe("/study/practice-hub");
    expect(moved.stage).toBe("transfer");

    const detail = recommendProgression(
      withProbe(emptyLearningHabitsDocument(), "detail-symbol", "same"),
    );
    expect(detail.href).toBe("/study/six/hands-on-practice");
    expect(detail.reason).toMatch(/does not require reteaching/i);

    const pending = recommendProgression(
      withProbe(emptyLearningHabitsDocument(), "recall-delay", "1"),
    );
    expect(pending.href).toBe("/study/lucky");
    expect(pending.reason).toMatch(/not a later review/i);
    expect(pending.mastery).toBe(false);
  });
});

describe("reasoning evidence", () => {
  it("stores a correct choice and a sound explanation separately", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      {
        type: "submit-probe",
        probeId: "rule-adapt",
        choiceId: "double",
        explanation: "Width is doubled, so the area doubles.",
      },
      now,
    );
    const row = doc.assessment.results[0]!;
    expect(row.correct).toBe(true);
    expect(row.reasoningQuality).toBe("sound");
  });

  it("records a missing explanation as unknown", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "rule-adapt", choiceId: "double" },
      now,
    );
    expect(doc.assessment.results[0]?.correct).toBe(true);
    expect(doc.assessment.results[0]?.reasoningQuality).toBe("unknown");
  });

  it("keeps partial reasoning when the choice is wrong", () => {
    expect(
      classifyReasoning({
        explanation: "Width is multiplied, so it doubles",
        correct: false,
        soundPhrases: ["width", "double"],
        unsoundPhrases: ["same", "half"],
      }),
    ).toBe("partial");
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      {
        type: "submit-probe",
        probeId: "rule-adapt",
        choiceId: "half",
        explanation: "The width doubles, so I used the area rule.",
      },
      now,
    );
    expect(doc.assessment.results[0]?.correct).toBe(false);
    expect(doc.assessment.results[0]?.reasoningQuality).toBe("partial");
  });
});

describe("delayed retention", () => {
  it("reuses one scheduled review and does not count a skip or a same-session recall as failure", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "save-settings", settings: { reviewReminders: true, trackingEnabled: true } },
      now,
    );
    doc = reduceLearningHabits(doc, { type: "note-session", sessionId: "session-a" }, now);
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "1" },
      now,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "chunk-steps", choiceId: "1" },
      now,
    );
    const scheduled = doc.reviews.filter((row) => row.status === "scheduled");
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]?.conceptLabel).toBe("Ordered list index");
    const early = reduceLearningHabits(
      doc,
      { type: "skip-review", id: scheduled[0]!.id },
      now,
    );
    expect(early.reviews[0]?.status).toBe("scheduled");
    expect(early.reviews[0]?.outcome).toBeNull();
    doc = reduceLearningHabits(doc, { type: "note-session", sessionId: "session-b" }, later);
    doc = reduceLearningHabits(doc, { type: "skip-review", id: scheduled[0]!.id }, later);
    expect(doc.reviews[0]?.status).toBe("skipped");
    expect(doc.reviews[0]?.outcome).toBeNull();
    expect(doc.reviews[0]?.countsAsDelayed).toBe(false);
    expect(evidenceCharts(doc).find((chart) => chart.id === "delay")?.ready).toBe(false);
    expect(deriveRecommendations(doc).some((row) => row.reason.match(/mastery/i))).toBe(false);
  });

  it("does not schedule a review when reminders are off", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "1" },
      now,
    );
    expect(doc.reviews).toHaveLength(0);
  });

  it("does not clear unrelated settings when learning habits data is deleted", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "save-settings", settings: { reviewReminders: true, tutorPersonalization: true } },
      now,
    );
    const cleared = reduceLearningHabits(doc, { type: "delete-feature-data" }, now);
    expect(cleared.assessment.results).toEqual([]);
    expect(cleared.reviews).toEqual([]);
    expect(cleared.settings.tutorPersonalization).toBe(false);
    expect(cleared.settings.reviewReminders).toBe(false);
  });
});
