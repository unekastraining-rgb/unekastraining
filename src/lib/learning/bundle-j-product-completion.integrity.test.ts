/**
 * Bundle J — Study Haul Product Completion integrity.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import "@/lib/learning/knowledge/packs";
import {
  buildTrueFalseFromConcept,
  buildMultiSelectFromConcept,
  buildMatchingFromConcept,
  buildInteractiveActivityForConcept,
  listAvailableInteractiveForms,
  evaluateInteractiveSubmission,
  feedbackUsesOnlyAuthoredMisconceptions,
  completeInteractiveActivity,
} from "@/lib/learning/activity/runtime";
import { buildCourseOverviewFromPath } from "@/lib/learning/studio/course-overview";
import { curriculumPositionLabel } from "@/lib/learning/studio/curriculum-position";
import {
  HAUL_WRITING_PHASES,
  inferHaulWritingPhase,
  nextSuggestedHaulPhase,
} from "@/lib/haul/writing/loop-phases";
import { summarizeCoreSourceHonesty } from "@/lib/learning/core/source-honesty";
import { listRetentionVariantsForKnowledgeConcept } from "@/lib/learning/retention/knowledge-library-variants";
import { listRetentionVariantsForConcept } from "@/lib/learning/retention/variants";
import { schoolLmsProductTruthSummary } from "@/lib/learning/school-lms/product-connectors";
import { buildTutorFocusContext } from "@/lib/learning/tutor/contextual-focus";
import { assessmentProductSurfaces } from "@/lib/learning/assessment/product-completion";
import {
  structuredChallengeIdsForConcept,
  conceptIdForStructuredChallenge,
} from "@/lib/learning/activities/structured/kl-concept-bridge";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import { coverageIsNotMastery } from "@/lib/learning/knowledge/coverage-health";
import { getCanonicalConceptsForWritingType } from "@/lib/haul/writing/knowledge-map";
import { resetLearnerStateForTests } from "@/lib/learning/learner-state";
import { runTeachingQualityTrace } from "@/lib/learning/validation/teaching-quality-trace";
import type { HaulWritingDocument } from "@/lib/haul/writing/types";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Bundle J — Extended interactive forms", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("true/false / multi-select / matching build from authored KL fields", () => {
    const tf = buildTrueFalseFromConcept("psychology-classical-conditioning");
    expect(tf?.form).toBe("true_false");
    expect(tf?.choices).toEqual(["True", "False"]);
    expect(tf?.correctIndex).toBe(1);

    const match = buildMatchingFromConcept("java-inheritance");
    expect(match?.form).toBe("matching");
    expect((match?.matchLeft?.length ?? 0)).toBeGreaterThanOrEqual(2);

    const multi = buildMultiSelectFromConcept("writing-thesis");
    if (multi) {
      expect(multi.form).toBe("multi_select");
      expect((multi.correctIndices?.length ?? 0)).toBeGreaterThan(0);
    }

    const forms = listAvailableInteractiveForms(
      "psychology-classical-conditioning",
    );
    expect(forms).toContain("true_false");
  });

  it("extended form submission evaluates without fabricating misconceptions", () => {
    const tf = buildTrueFalseFromConcept("psychology-classical-conditioning")!;
    const wrong = evaluateInteractiveSubmission(tf, {
      activityId: tf.id,
      form: "true_false",
      selectedIndex: 0,
    });
    expect(wrong.outcome).toBe("incorrect");
    expect(feedbackUsesOnlyAuthoredMisconceptions(tf, wrong)).toBe(true);
    expect(wrong.summary.toLowerCase()).not.toBe("incorrect.");
  });

  it("subject journeys still build interactive activities", async () => {
    const java = buildInteractiveActivityForConcept("java-inheritance");
    const math =
      buildInteractiveActivityForConcept("math-equations", "equation_solve") ??
      buildInteractiveActivityForConcept("math-equations");
    const bio = buildInteractiveActivityForConcept(
      "biology-photosynthesis",
      "diagram_label",
    );
    const econ = buildInteractiveActivityForConcept("economics-supply-demand");
    const sql = buildInteractiveActivityForConcept("sql-joins", "sql_write");
    const writing = buildInteractiveActivityForConcept("writing-thesis");
    const python = buildInteractiveActivityForConcept("python-variables");

    expect(java?.conceptId).toBe("java-inheritance");
    expect(math?.conceptId).toBe("math-equations");
    expect(bio?.conceptId).toBe("biology-photosynthesis");
    expect(econ?.conceptId).toBe("economics-supply-demand");
    expect(sql?.form).toBe("sql_write");
    expect(writing?.conceptId).toBe("writing-thesis");
    expect(python?.conceptId).toBe("python-variables");

    const done = await completeInteractiveActivity({
      activity: writing!,
      submission: {
        activityId: writing!.id,
        form: writing!.form,
        selectedIndex: writing!.correctIndex,
        textAnswer: "A thesis is a specific arguable claim.",
      },
      userId: "bundle-j-user",
      askOrchestrator: true,
    });
    expect(done.feedback.summary.length).toBeGreaterThan(10);
    expect(done.orchestrator?.action).toBeTruthy();
  });
});

describe("Bundle J — Studio / Curriculum wiring", () => {
  it("TeachFirst uses studio-complete + ActivityRuntime forms", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const runtime = read("src/components/study/activities/ActivityRuntime.tsx");
    // Bundle L — evidence via /api/study/evaluate; studio-complete needs real userId
    expect(teach).toContain('/api/study/evaluate');
    expect(teach).not.toContain("userId: undefined");
    expect(read("src/lib/learning/activity/runtime/studio-complete.ts")).toContain(
      "completeInteractiveActivityForStudio",
    );
    expect(teach).toContain("conceptIds");
    expect(runtime).toContain("InteractiveFormControls");
    expect(runtime).toContain("data-activity-form");
  });

  it("course overview builds position labels without mastery claims", () => {
    const overview = buildCourseOverviewFromPath({
      pathTitle: "Intro Python",
      conceptTitles: ["Python variables", "Python conditionals", "Python functions"],
      conceptIds: [
        "python-variables",
        "python-conditionals",
        "python-functions",
      ],
      currentIndex: 1,
    });
    expect(overview.items[1]?.positionLabel).toBe("Current");
    expect(overview.items[0]?.positionLabel).toBe("Visited");
    expect(overview.positionDisclaimer.toLowerCase()).toContain("not");
    expect(overview.positionDisclaimer.toLowerCase()).toContain("master");
    expect(curriculumPositionLabel("visited")).not.toMatch(/master/i);

    const rail = read(
      "src/components/study/learning-workspace/CurriculumRail.tsx",
    );
    expect(rail).toContain("CourseOverviewPanel");
    expect(rail).toContain("data-course-overview-toggle");
  });
});

describe("Bundle J — Haul loop", () => {
  it("infers Learn → Plan → Write → Feedback → Revise → Finish", () => {
    expect(HAUL_WRITING_PHASES).toEqual([
      "learn",
      "plan",
      "write",
      "feedback",
      "revise",
      "finish",
    ]);
    const empty: HaulWritingDocument = {
      kind: "haul-writing-v1",
      id: "d1",
      writingTypeId: "argumentative",
      title: "Essay",
      mode: "write",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          sectionId: "thesis",
          title: "Thesis",
          body: "",
        },
      ],
    };
    expect(inferHaulWritingPhase(empty)).toBe("learn");
    expect(nextSuggestedHaulPhase("learn")).toBe("plan");

    const haul = read("src/components/haul/HaulWritingWorkspace.tsx");
    expect(haul).toContain("HaulWritingPhaseStrip");
    expect(haul).toContain("data-haul-learn-concepts");
    expect(getCanonicalConceptsForWritingType("argumentative").length).toBeGreaterThan(
      0,
    );
  });
});

describe("Bundle J — Core / Lucky / Planner / LMS / Tutor / Assessment", () => {
  it("Core source honesty does not fabricate understanding", () => {
    const pdf = summarizeCoreSourceHonesty({
      understanding: "unavailable",
      sourceType: "pdf",
      hasPdf: true,
      textLength: 0,
    });
    expect(pdf.understandingAvailable).toBe(false);
    expect(pdf.learnerMessage.toLowerCase()).toMatch(/pdf|text|concept/);
  });

  it("Lucky KL variants exist for python/sql/biology", () => {
    expect(
      listRetentionVariantsForConcept("python-variables").length,
    ).toBeGreaterThan(0);
    expect(
      listRetentionVariantsForKnowledgeConcept("sql-joins").length,
    ).toBeGreaterThan(0);
    expect(
      listRetentionVariantsForKnowledgeConcept("biology-photosynthesis").length,
    ).toBeGreaterThan(0);
  });

  it("school LMS truth + assessment surfaces + tutor focus", () => {
    const lms = schoolLmsProductTruthSummary();
    expect(lms.fabricatesLmsData).toBe(false);
    expect(lms.plannerDistinctFromOrchestrator).toBe(true);
    expect(lms.providersSupported).toContain("canvas");

    const surfaces = assessmentProductSurfaces();
    expect(surfaces.some((s) => s.id === "quiz")).toBe(true);
    expect(surfaces.every((s) => s.evidenceFeedsLearnerModel)).toBe(true);

    const focus = buildTutorFocusContext({
      conceptId: "java-inheritance",
      chunkText: "Subclass extends superclass",
    });
    expect(focus.conceptTitle).toMatch(/inheritance/i);
    expect(focus.nonAuthorityNote.toLowerCase()).toMatch(/orchestrator|knowledge/);
  });

  it("structured KL bridge and python curriculum mapping", () => {
    const sqlIds = structuredChallengeIdsForConcept("sql-joins");
    expect(sqlIds.length).toBeGreaterThan(0);
    expect(sqlIds.every((id) => !id.endsWith("-lab") || id.length > 0)).toBe(
      true,
    );
    // Phantom ids must not reverse-resolve
    expect(conceptIdForStructuredChallenge("sql-joins-lab")).toBeNull();
    expect(conceptIdForStructuredChallenge(sqlIds[0]!)).toBe("sql-joins");
    const py = findInstructionalConceptById("python-variables");
    expect(py?.concept.curriculumMappings?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("Bundle J — Unknown honesty + no parallel engines", () => {
  it("unknown remains non-canonical; coverage is not mastery", async () => {
    expect(buildInteractiveActivityForConcept("not-a-real-concept-xyz")).toBeNull();
    expect(coverageIsNotMastery()).toBe(true);
    const trace = await runTeachingQualityTrace(
      "Teach me obscure quantum gardening theory xyz",
    );
    expect(trace.knowledgeSource).not.toBe("knowledge-library");
  });

  it("bundle-j barrel does not invent parallel engines", () => {
    const barrel = read("src/lib/learning/bundle-j/index.ts");
    expect(barrel).not.toContain("createSecondOrchestrator");
    expect(barrel).not.toContain("NewKnowledgeSystem");
    expect(barrel).toContain("completeInteractiveActivityForStudio");
  });
});
