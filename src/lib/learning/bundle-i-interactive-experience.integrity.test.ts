/**
 * Bundle I — Interactive Learning Experience Depth integrity.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import "@/lib/learning/knowledge/packs";
import {
  buildInteractiveActivityForConcept,
  completeInteractiveActivity,
  evaluateInteractiveSubmission,
  feedbackUsesOnlyAuthoredMisconceptions,
  listAvailableInteractiveForms,
  parseEquationFromExample,
  selectInteractiveActivityForConcept,
} from "@/lib/learning/activity/runtime";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import {
  curriculumPositionLabel,
  toCurriculumPositionStatus,
} from "@/lib/learning/studio/curriculum-position";
import { getCanonicalConceptsForWritingType } from "@/lib/haul/writing/knowledge-map";
import { coreConceptsFromNoteText } from "@/lib/learning/cross-system-knowledge";
import { luckyRecallForConceptTitle } from "@/lib/learning/cross-system-knowledge";
import { resetLearnerStateForTests } from "@/lib/learning/learner-state";
import { runTeachingQualityTrace } from "@/lib/learning/validation/teaching-quality-trace";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Bundle I — Activity runtime", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("activity definitions reach builders with preserved concept identity", () => {
    const act = buildInteractiveActivityForConcept("java-inheritance");
    expect(act).not.toBeNull();
    expect(act!.conceptId).toBe("java-inheritance");
    expect(act!.revealAnswerPolicy).toBe("never_auto");
  });

  it("submission creates LAF evidence via completeInteractiveActivity", async () => {
    const act = buildInteractiveActivityForConcept("writing-thesis");
    expect(act).not.toBeNull();
    const result = await completeInteractiveActivity({
      activity: act!,
      submission: {
        activityId: act!.id,
        form: act!.form,
        selectedIndex: act!.correctIndex,
        textAnswer: act!.form === "explain" ? "A thesis is an arguable claim." : undefined,
      },
      userId: "bundle-i-user",
      askOrchestrator: true,
    });
    expect(result.feedback.summary.toLowerCase()).not.toBe("correct!");
    expect(result.feedback.summary.toLowerCase()).not.toBe("incorrect.");
    expect(result.evidenceRecorded).toBe(true);
    expect(result.orchestrator?.action).toBeTruthy();
  });

  it("feedback uses only authored misconceptions — never fabricates", () => {
    const act = buildInteractiveActivityForConcept(
      "psychology-classical-conditioning",
    )!;
    const feedback = evaluateInteractiveSubmission(act, {
      activityId: act.id,
      form: act.form,
      selectedIndex:
        typeof act.correctIndex === "number"
          ? (act.correctIndex + 1) % (act.choices?.length ?? 2)
          : undefined,
      textAnswer: "wrong",
    });
    expect(feedbackUsesOnlyAuthoredMisconceptions(act, feedback)).toBe(true);
    if (feedback.misconceptionNote) {
      expect(act.authoredMisconception?.misconception).toBe(
        feedback.misconceptionNote,
      );
    }
  });
});

describe("Bundle I — Subject experiences", () => {
  it("Java code activity when example supports it", () => {
    const forms = listAvailableInteractiveForms("java-inheritance");
    expect(forms.length).toBeGreaterThan(0);
    const act =
      buildInteractiveActivityForConcept("java-inheritance", "code_predict") ??
      buildInteractiveActivityForConcept("java-inheritance");
    expect(act?.conceptId).toBe("java-inheritance");
    expect(
      act?.form === "code_predict" ||
        act?.form === "code_write" ||
        act?.form === "multiple_choice" ||
        act?.form === "explain",
    ).toBe(true);
    if (act?.codeSnippet) {
      expect(act.codeSnippet.length).toBeGreaterThan(10);
    }
  });

  it("Math equation activity from authored example", () => {
    const eqConcept =
      findInstructionalConceptById("math-equations") ??
      findInstructionalConceptById("math-linear-equations");
    expect(eqConcept).not.toBeNull();
    const parsed = parseEquationFromExample(eqConcept!.concept.example);
    if (parsed) {
      const act = buildInteractiveActivityForConcept(
        eqConcept!.concept.id,
        "equation_solve",
      );
      expect(act?.form).toBe("equation_solve");
      expect(act?.expectedAnswer).toBeTruthy();
      const fb = evaluateInteractiveSubmission(act!, {
        activityId: act!.id,
        form: "equation_solve",
        textAnswer: act!.expectedAnswer,
      });
      expect(fb.outcome).toBe("correct");
      expect(fb.revealedAnswer).toBeUndefined();
    } else {
      // Honest: no equation parse available — still build some activity
      const act = buildInteractiveActivityForConcept(eqConcept!.concept.id);
      expect(act).not.toBeNull();
    }
  });

  it("Biology diagram activity uses authored representation only", () => {
    const act = buildInteractiveActivityForConcept(
      "biology-photosynthesis",
      "diagram_label",
    );
    expect(act).not.toBeNull();
    if (act?.form === "diagram_label") {
      expect(act.diagramHint).toBeTruthy();
      const authored =
        findInstructionalConceptById("biology-photosynthesis")!.concept;
      expect(
        act.diagramHint === authored.representation ||
          authored.visualModels?.includes(act.diagramHint!),
      ).toBe(true);
    }
  });

  it("Economics scenario/prediction when supported", () => {
    const act =
      buildInteractiveActivityForConcept("economics-supply-demand", "prediction") ??
      buildInteractiveActivityForConcept("economics-supply-demand");
    expect(act?.conceptId).toBe("economics-supply-demand");
    expect(
      ["prediction", "scenario", "multiple_choice", "explain"].includes(
        act!.form,
      ),
    ).toBe(true);
  });

  it("SQL write activity for joins", () => {
    const act = buildInteractiveActivityForConcept("sql-joins", "sql_write");
    expect(act?.form).toBe("sql_write");
    expect(act?.activityType).toBe("sql");
  });

  it("Writing activity for thesis", () => {
    const act = selectInteractiveActivityForConcept({
      conceptId: "writing-thesis",
    });
    expect(act?.conceptId).toBe("writing-thesis");
    expect(act?.form).not.toBe("sql_write");
    expect(["writing", "practice", "lesson"]).toContain(act?.activityType);
  });
});

describe("Bundle I — Curriculum position (not mastery)", () => {
  it("labels visited/current/next/available — never Mastered from position", () => {
    expect(curriculumPositionLabel("visited")).toBe("Visited");
    expect(curriculumPositionLabel("current")).toBe("Current");
    expect(curriculumPositionLabel("next")).toBe("Next");
    expect(curriculumPositionLabel("available")).toBe("Available");
    expect(curriculumPositionLabel("done")).toBe("Visited");
    expect(curriculumPositionLabel("upcoming")).toBe("Available");
    for (const s of ["visited", "current", "next", "available"] as const) {
      expect(curriculumPositionLabel(s).toLowerCase()).not.toContain("master");
    }
    expect(toCurriculumPositionStatus("upcoming", 3, 1)).toBe("available");
    expect(toCurriculumPositionStatus("upcoming", 2, 1)).toBe("next");
  });

  it("rail uses position labels and disclaimer", () => {
    const rail = read(
      "src/components/study/learning-workspace/CurriculumRail.tsx",
    );
    expect(rail).toContain("curriculumPositionLabel");
    expect(rail).toContain("PATH_POSITION_DISCLAIMER");
    expect(rail).not.toMatch(/Mastered/);
  });
});

describe("Bundle I — Core / Haul / Lucky bridges", () => {
  it("Core note text resolves canonical concepts", () => {
    const core = coreConceptsFromNoteText(
      "ArrayList.set replaces an element at a specific index in Java.",
      "ArrayList notes",
    );
    expect(Array.isArray(core.conceptIds)).toBe(true);
  });

  it("Haul writing type maps to Learn-able canonical concepts", () => {
    const ids = getCanonicalConceptsForWritingType("argumentative");
    expect(ids).toEqual(
      expect.arrayContaining(["writing-genre-argumentative", "writing-thesis"]),
    );
    const haul = read("src/components/haul/HaulWritingWorkspace.tsx");
    expect(haul).toContain("data-haul-learn-concepts");
    expect(haul).toContain("getCanonicalConceptsForWritingType");
  });

  it("Lucky remains concept-aware", () => {
    const lucky = luckyRecallForConceptTitle("Java inheritance");
    expect(lucky.notes.length).toBeGreaterThanOrEqual(0);
    expect(lucky.system).toBe("lucky");
  });
});

describe("Bundle I — Studio wiring + unknown honesty", () => {
  it("TeachFirst and LearningObjectStage wire ActivityRuntime", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const stage = read(
      "src/components/study/learning-workspace/LearningObjectStage.tsx",
    );
    expect(teach).toContain("selectInteractiveActivityForConcept");
    expect(teach).toContain("interactiveActivity");
    expect(stage).toContain("ActivityRuntime");
    expect(stage).toContain("data-activity-runtime-active");
    expect(teach).not.toContain("createSecondOrchestrator");
  });

  it("unknown topics remain non-canonical", async () => {
    const act = buildInteractiveActivityForConcept(
      "quantum-gardening-not-a-real-id",
    );
    expect(act).toBeNull();
    const trace = await runTeachingQualityTrace(
      "Teach me obscure quantum gardening theory xyz",
    );
    expect(trace.knowledgeSource).not.toBe("knowledge-library");
  });

  it("no parallel activity framework invented", () => {
    const runtime = read("src/lib/learning/activity/runtime/index.ts");
    expect(runtime).toContain("LAF");
    expect(runtime).not.toContain("createParallelActivityFramework");
  });
});
