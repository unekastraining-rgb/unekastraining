/**
 * Phase 2G-68 — CORE → Orchestrator/Adaptive closed-loop bridge tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  pickCoreBridgeFocusConceptId,
  resolveCoreAdaptivePrimaryCta,
} from "@/lib/learning/orchestrator/core-adaptive-bridge";
import { detectCoreStudyIntent } from "@/lib/core/study-intent";
import { projectCoreStudyIntentToLearningIntent } from "@/lib/learning/intent/project";
import { buildCoreNotebookActionContext } from "@/lib/core/notebook-action-context";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-68 CORE adaptive bridge helpers", () => {
  it("T1/T10 — owned concept yields Start learning → Adaptive start shape", () => {
    const cta = resolveCoreAdaptivePrimaryCta({ conceptId: "concept-owned-1" });
    expect(cta).toEqual({
      kind: "start",
      conceptId: "concept-owned-1",
      label: "Start learning",
    });
  });

  it("T2 — missing concept cannot produce Adaptive CTA", () => {
    expect(resolveCoreAdaptivePrimaryCta({})).toEqual({ kind: "none" });
    expect(resolveCoreAdaptivePrimaryCta({ conceptId: "  " })).toEqual({
      kind: "none",
    });
    expect(pickCoreBridgeFocusConceptId({})).toBeNull();
  });

  it("T9 — active run prefers resume over start", () => {
    const cta = resolveCoreAdaptivePrimaryCta({
      conceptId: "concept-1",
      activeRunId: "run-abc",
    });
    expect(cta).toEqual({
      kind: "resume",
      runId: "run-abc",
      label: "Continue learning",
      href: "/study/adaptive/run-abc",
    });
  });

  it("prefers confirmed concept over linked list", () => {
    expect(
      pickCoreBridgeFocusConceptId({
        confirmedConceptId: "c-new",
        linkedConceptIds: ["c-old", "c-other"],
      }),
    ).toBe("c-new");
    expect(
      pickCoreBridgeFocusConceptId({
        linkedConceptIds: ["c-first", "c-second"],
      }),
    ).toBe("c-first");
  });
});

describe("Phase 2G-68 CORE intent + architecture contracts", () => {
  it("T5 — CoreStudyIntent mappings unchanged", () => {
    expect(projectCoreStudyIntentToLearningIntent("practice")?.purpose).toBe(
      "PRACTICE",
    );
    expect(projectCoreStudyIntentToLearningIntent("explain")?.purpose).toBe(
      "UNDERSTAND",
    );
    expect(projectCoreStudyIntentToLearningIntent("quiz")?.purpose).toBe(
      "CREATE",
    );
    expect(projectCoreStudyIntentToLearningIntent("flashcards")?.purpose).toBe(
      "CREATE",
    );
    expect(projectCoreStudyIntentToLearningIntent("learning-plan")?.purpose).toBe(
      "CREATE",
    );
    expect(projectCoreStudyIntentToLearningIntent("study-guide")).toBeNull();
    expect(detectCoreStudyIntent("Quiz me on exceptions")).toBeNull();
  });

  it("T6 — LearningIntent remains contextual metadata on notebook actions", () => {
    const ctx = buildCoreNotebookActionContext("practice");
    expect(ctx.learningIntent?.purpose).toBe("PRACTICE");
    const workspace = read("src/components/core/CoreNotesWorkspace.tsx");
    expect(workspace).toContain("void ctx.learningIntent");
  });

  it("T3/T4 — Adaptive start ignores client identity; ownership server-side", () => {
    const start = read("app/api/study/adaptive/start/route.ts");
    expect(start).toContain("getOrCreateDefaultUser");
    expect(start).toContain("void body?.userId");
    expect(start).toContain("void body?.learnerId");
    expect(start).toContain("startOrResumeAdaptiveSequenceForConcept");

    const panel = read("src/components/core/CoreKnowledgeBridgePanel.tsx");
    expect(panel).toContain("/api/study/adaptive/start");
    expect(panel).not.toMatch(/learnerId|userId/);
    expect(panel).toContain("JSON.stringify({ conceptId: primary.conceptId })");
  });

  it("T7/T8 — CORE bridge panel does not write LearningAttempt or ConceptMastery", () => {
    const panel = read("src/components/core/CoreKnowledgeBridgePanel.tsx");
    expect(panel).not.toMatch(
      /recordEvidence|applyEvidenceToMastery|LearningAttempt|conceptMastery/,
    );
    const bridge = read(
      "src/lib/learning/orchestrator/core-adaptive-bridge.ts",
    );
    expect(bridge).not.toMatch(
      /recordEvidence|applyEvidenceToMastery|db\.|orchestrateForConcept/,
    );
    expect(bridge).toContain("Does not diagnose, write evidence, update mastery");
  });

  it("T11/T15 — Adaptive start still orchestrates; LUCKY still COMPLETE-only", () => {
    const coordinator = read("src/lib/learning/sequence/coordinator.ts");
    expect(coordinator).toContain("orchestrateForConcept");
    expect(coordinator).toContain("syncLuckyRetentionAfterSequenceComplete");

    const startHelper = read("src/lib/learning/sequence/start-or-resume.ts");
    expect(startHelper).toContain("listActiveAdaptiveSequenceRuns");
    expect(startHelper).toContain("startAdaptiveSequenceRun");
  });

  it("T12 — CORE Studio still mounts knowledge panel; propose CTA preserved", () => {
    const studio = read("src/components/core/CoreStudioPanel.tsx");
    expect(studio).toContain("CoreKnowledgeBridgePanel");
    const panel = read("src/components/core/CoreKnowledgeBridgePanel.tsx");
    expect(panel).toContain("Propose concepts from extract");
    expect(panel).toContain("Confirm");
    expect(panel).toContain("Skip");
  });

  it("T13 — Orchestrator diagnose still has no Quiz intervention", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).not.toMatch(/intervention.*[Qq]uiz|[Qq]uiz.*intervention/);
    expect(diagnose).toContain("Never emits Quiz");
  });

  it("T14 — no second evidence/mastery system in CORE bridge", () => {
    const bridge = read(
      "src/lib/learning/orchestrator/core-adaptive-bridge.ts",
    );
    expect(bridge).toContain("Reuses the same Adaptive entry contract as Study Hub");
    expect(bridge).not.toMatch(/createTable|model ConceptMastery|new mastery/i);
  });

  it("T1 UI — Start/Continue learning CTA wired only with focus concept", () => {
    const panel = read("src/components/core/CoreKnowledgeBridgePanel.tsx");
    expect(panel).toContain("resolveCoreAdaptivePrimaryCta");
    expect(panel).toContain("pickCoreBridgeFocusConceptId");
    expect(panel).toContain("adaptiveCta.label");
    expect(panel).toContain("data-core-continue-learning");
    expect(panel).toContain("data-core-adaptive-cta");
  });
});
