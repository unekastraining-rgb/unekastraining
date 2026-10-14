import { describe, expect, it } from "vitest";

import { PROBES } from "@/lib/learning/habits/catalog";
import {
  emptyLearningHabitsDocument,
  parseLearningHabitsDocument,
  stripLearningHabitsDocument,
  writeLearningHabitsDocument,
} from "@/lib/learning/habits/document";
import { buildHypotheses, evidenceCharts, sanitizeExperienceIds } from "@/lib/learning/habits/discovery";
import {
  analyticsSummary,
  deriveInsights,
  deriveRecommendations,
  reduceLearningHabits,
  tutorPersonalizationBlock,
} from "@/lib/learning/habits/engine";

const now = new Date("2026-10-12T12:00:00.000Z");

describe("Learning & Habits document", () => {
  it("preserves unrelated settings keys", () => {
    const written = writeLearningHabitsDocument(
      JSON.stringify({ theme: "ink" }),
      emptyLearningHabitsDocument(),
    );
    const parsed = JSON.parse(written) as { theme: string; learningHabits: unknown };
    expect(parsed.theme).toBe("ink");
    expect(parseLearningHabitsDocument(written).settings.trackingEnabled).toBe(false);
    const stripped = stripLearningHabitsDocument(written);
    expect(JSON.parse(stripped)).toEqual({ theme: "ink" });
  });

  it("returns an empty document for malformed JSON", () => {
    expect(parseLearningHabitsDocument("{").version).toBe(1);
  });
});

describe("Learning & Habits assessment", () => {
  it("saves, skips, pauses, and resumes", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "start-assessment" },
      now,
    );
    expect(doc.assessment.status).toBe("in_progress");
    expect(doc.settings.trackingEnabled).toBe(true);
    doc = reduceLearningHabits(doc, { type: "skip-probe", probeId: PROBES[0]!.id }, now);
    expect(doc.assessment.results[0]?.correct).toBeNull();
    expect(doc.assessment.results[0]?.performanceKind).toBe("unknown");
    doc = reduceLearningHabits(doc, { type: "pause-assessment" }, now);
    expect(doc.assessment.status).toBe("paused");
    doc = reduceLearningHabits(doc, { type: "resume-assessment" }, now);
    expect(doc.assessment.status).toBe("in_progress");
  });

  it("scores a probe and raises difficulty after two successes", () => {
    let doc = reduceLearningHabits(emptyLearningHabitsDocument(), { type: "start-assessment" }, now);
    doc = reduceLearningHabits(
      doc,
      {
        type: "save-settings",
        settings: { reviewReminders: true },
      },
      now,
    );
    const first = PROBES.find((p) => p.difficulty === 1)!;
    const second = PROBES.find((p) => p.id !== first.id && p.difficulty === 1)!;
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: first.id, choiceId: first.correctChoiceId },
      now,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: second.id, choiceId: second.correctChoiceId },
      now,
    );
    expect(doc.assessment.difficulty).toBeGreaterThan(1);
    expect(doc.reviews.length).toBeGreaterThan(0);
    expect(analyticsSummary(doc).accuracy).toBe(1);
  });

  it("keeps a wrong transfer answer separate from self-report", () => {
    let doc = reduceLearningHabits(emptyLearningHabitsDocument(), { type: "start-assessment" }, now);
    doc = reduceLearningHabits(
      doc,
      { type: "answer-question", id: "transfer-familiar", value: "no" },
      now,
    );
    const novel = PROBES.find((p) => p.id === "transfer-novel")!;
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: novel.id, choiceId: "bo" },
      now,
    );
    expect(doc.questionnaire.answers["transfer-familiar"]).toBe("no");
    expect(doc.assessment.results[0]?.correct).toBe(false);
    const insight = deriveInsights(doc).find((i) => i.id === "reported-chunks");
    expect(insight).toBeUndefined();
  });

  it("does not treat one miss as a style label", () => {
    let doc = reduceLearningHabits(emptyLearningHabitsDocument(), { type: "start-assessment" }, now);
    const probe = PROBES[0]!;
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: probe.id, choiceId: "wrong" },
      now,
    );
    const text = deriveInsights(doc).map((i) => i.text).join(" ");
    expect(text).not.toMatch(/visual learner/i);
    expect(analyticsSummary(doc).accuracy).toBe(0);
  });

  it("marks skipped reviews unknown and reschedules completed ones", () => {
    let doc = reduceLearningHabits(emptyLearningHabitsDocument(), { type: "start-assessment" }, now);
    doc = reduceLearningHabits(
      doc,
      { type: "save-settings", settings: { reviewReminders: true } },
      now,
    );
    const probe = PROBES[0]!;
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: probe.id, choiceId: probe.correctChoiceId },
      now,
    );
    const reviewId = doc.reviews[0]!.id;
    doc = reduceLearningHabits(doc, { type: "note-session", sessionId: "later-session" }, now);
    const due = new Date(doc.reviews[0]!.dueAt);
    doc = reduceLearningHabits(doc, { type: "skip-review", id: reviewId }, due);
    expect(doc.reviews[0]?.status).toBe("skipped");
    expect(doc.reviews[0]?.outcome).toBeNull();
    expect(deriveInsights(doc).some((i) => i.id === "retention-unknown")).toBe(true);
  });
});

describe("Learning & Habits habits, experiments, tutor", () => {
  it("creates, pauses, completes, and deletes a habit without shaming copy", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "create-habit", title: "Review after class", frequencyPerWeek: 3 },
      now,
    );
    const id = doc.habits[0]!.id;
    doc = reduceLearningHabits(doc, { type: "complete-habit", id }, now);
    doc = reduceLearningHabits(doc, { type: "toggle-habit-pause", id }, now);
    expect(doc.habits[0]?.paused).toBe(true);
    expect(doc.habits[0]?.completions).toHaveLength(1);
    doc = reduceLearningHabits(doc, { type: "delete-habit", id }, now);
    expect(doc.habits).toHaveLength(0);
    expect(deriveRecommendations(doc).some((r) => r.href === "/planner" || r.href.startsWith("/study"))).toBe(
      true,
    );
  });

  it("runs an experiment lifecycle and ignores check-ins when disabled", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "start-experiment", templateId: "chunk-vs-dense" },
      now,
    );
    const id = doc.experiments[0]!.id;
    doc = reduceLearningHabits(doc, { type: "set-experiment-status", id, status: "paused" }, now);
    doc = reduceLearningHabits(doc, { type: "set-experiment-status", id, status: "canceled" }, now);
    expect(doc.experiments[0]?.status).toBe("canceled");
    doc = reduceLearningHabits(
      doc,
      { type: "check-in", environment: "library", note: "quiet" },
      now,
    );
    expect(doc.checkIns).toHaveLength(0);
  });

  it("omits tutor context when personalization is off and includes it when on", () => {
    const off = emptyLearningHabitsDocument();
    expect(tutorPersonalizationBlock(off)).toBe("");
    const on = reduceLearningHabits(
      off,
      {
        type: "save-onboarding",
        complete: true,
        onboarding: {
          improve: ["retention"],
          approaches: ["step-by-step"],
          tutorUsesOutcomes: true,
        },
      },
      now,
    );
    expect(on.settings.tutorPersonalization).toBe(true);
    expect(tutorPersonalizationBlock(on)).toMatch(/retention/);
    expect(tutorPersonalizationBlock(on)).toMatch(/not mastery/i);
  });

  it("delete clears the feature document only", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "answer-question", id: "load-chunks", value: "yes" },
      now,
    );
    doc = reduceLearningHabits(doc, { type: "delete-feature-data" }, now);
    expect(doc.questionnaire.answers).toEqual({});
    expect(doc.settings.trackingEnabled).toBe(false);
  });

  it("saves several experiences and a note without calling them performance", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      {
        type: "save-discovery",
        selectedIds: ["examples", "familiar-not-new", "not-real"],
        note: "I forget the steps the next day.",
      },
      now,
    );
    expect(sanitizeExperienceIds(doc.discovery.selectedIds)).toEqual([
      "examples",
      "familiar-not-new",
    ]);
    expect(doc.discovery.note).toMatch(/next day/);
    const hypothesis = buildHypotheses(doc).find((item) => item.id === "examples-transfer");
    expect(hypothesis?.label).toBe("Early hypothesis");
    expect(hypothesis?.why).toMatch(/may indicate/);
    expect(hypothesis?.why).not.toMatch(/proves|visual learner|definitely/i);
    expect(evidenceCharts(doc).every((chart) => chart.ready === false)).toBe(true);
    expect(tutorPersonalizationBlock(doc)).toBe("");
  });

  it("upgrades a hypothesis only after relevant scored checks", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "save-discovery", selectedIds: ["overwhelm"], note: "" },
      now,
    );
    expect(buildHypotheses(doc)[0]?.label).toBe("Early hypothesis");
    doc = reduceLearningHabits(doc, { type: "start-assessment" }, now);
    for (const id of ["chunk-dense", "chunk-steps", "detail-symbol"]) {
      const probe = PROBES.find((item) => item.id === id)!;
      doc = reduceLearningHabits(
        doc,
        { type: "submit-probe", probeId: probe.id, choiceId: probe.correctChoiceId },
        now,
      );
    }
    const chunk = buildHypotheses(doc).find((item) => item.id === "chunking");
    expect(chunk?.label).toBe("Needs more testing");
    expect(evidenceCharts(doc).find((chart) => chart.id === "timeline")?.ready).toBe(true);
    expect(evidenceCharts(doc).find((chart) => chart.id === "transfer")?.ready).toBe(false);
    expect(evidenceCharts(doc).find((chart) => chart.id === "delay")?.ready).toBe(false);
  });

  it("does not store a second attempt for a probe that is already recorded", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "1" },
      now,
    );
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "chunk-dense", choiceId: "0" },
      now,
    );
    doc = reduceLearningHabits(doc, { type: "skip-probe", probeId: "chunk-dense" }, now);
    expect(doc.assessment.results).toHaveLength(1);
    expect(doc.assessment.results[0]?.response).toBe("1");
  });

  it("does not treat a same-session recall probe as delayed retention", () => {
    let doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "save-settings", settings: { reviewReminders: true } },
      now,
    );
    doc = reduceLearningHabits(doc, { type: "note-session", sessionId: "session-a" }, now);
    doc = reduceLearningHabits(
      doc,
      { type: "submit-probe", probeId: "recall-delay", choiceId: "1" },
      now,
    );
    expect(evidenceCharts(doc).find((chart) => chart.id === "delay")?.ready).toBe(false);
    const scheduled = doc.reviews.find((review) => review.status === "scheduled");
    expect(scheduled).toBeTruthy();
    const sameSession = reduceLearningHabits(
      doc,
      { type: "complete-review", id: scheduled!.id, outcome: "SUCCESS", performanceKind: "recall", sessionId: "session-a" },
      new Date(now.getTime() + 24 * 60 * 60 * 1000),
    );
    expect(sameSession.reviews.find((review) => review.id === scheduled!.id)?.status).toBe("scheduled");
    doc = reduceLearningHabits(
      doc,
      { type: "complete-review", id: scheduled!.id, outcome: "SUCCESS", performanceKind: "recall", sessionId: "session-b" },
      new Date(now.getTime() + 24 * 60 * 60 * 1000),
    );
    const delay = evidenceCharts(doc).find((chart) => chart.id === "delay");
    expect(delay?.ready).toBe(true);
    expect(delay?.rows.find((row) => row.label === "Later review")?.filled).toBe(1);
  });

  it("dismisses a recommendation", () => {
    const doc = reduceLearningHabits(
      emptyLearningHabitsDocument(),
      { type: "dismiss-recommendation", id: "start-onboarding" },
      now,
    );
    expect(deriveRecommendations(doc).some((r) => r.id === "start-onboarding")).toBe(false);
  });
});
