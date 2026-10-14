/**
 * Phase 2G-26 — CORE notebook-action LearningIntent propagation.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { detectCoreStudyIntent } from "@/lib/core/study-intent";
import {
  buildCoreNotebookActionContext,
  type CoreNotebookActionContext,
} from "@/lib/core/notebook-action-context";

describe("Phase 2G-26 CORE notebook-action LearningIntent", () => {
  it("1. practice / test myself → PRACTICE EXPLICIT user_utterance", () => {
    const core = detectCoreStudyIntent("Let me test myself on this chapter");
    expect(core).toBe("practice");
    const ctx = buildCoreNotebookActionContext(core!);
    expect(ctx.learningIntent).toEqual({
      purpose: "PRACTICE",
      source: "EXPLICIT",
      provenance: "user_utterance",
      scope: "request",
    });
    expect(ctx.coreStudyIntent).toBe("practice");
  });

  it("2. explain layout → UNDERSTAND", () => {
    const core = detectCoreStudyIntent("Generate explanations on the page");
    expect(core).toBe("explain");
    expect(buildCoreNotebookActionContext(core!).learningIntent).toMatchObject({
      purpose: "UNDERSTAND",
      source: "EXPLICIT",
      provenance: "user_utterance",
    });
  });

  it("3. generate quiz / flashcards / learning-plan → CREATE (not ASSESS)", () => {
    expect(
      buildCoreNotebookActionContext(
        detectCoreStudyIntent("Generate a quiz")!,
      ).learningIntent?.purpose,
    ).toBe("CREATE");
    expect(
      buildCoreNotebookActionContext(
        detectCoreStudyIntent("Make flashcards from this")!,
      ).learningIntent?.purpose,
    ).toBe("CREATE");
    expect(
      buildCoreNotebookActionContext("learning-plan").learningIntent?.purpose,
    ).toBe("CREATE");
  });

  it("4. study-guide remains ambiguous → learningIntent null", () => {
    expect(detectCoreStudyIntent("Create study guide")).toBe("study-guide");
    expect(
      buildCoreNotebookActionContext("study-guide").learningIntent,
    ).toBeNull();
    expect(
      buildCoreNotebookActionContext(
        detectCoreStudyIntent("Help me study this")!,
      ).learningIntent,
    ).toBeNull();
  });

  it("5. conversational Quiz me stays null (no CoreStudyIntent, no ASSESS)", () => {
    expect(detectCoreStudyIntent("Quiz me on exceptions")).toBeNull();
  });

  it("6. context always preserves coreStudyIntent for unchanged CORE behavior", () => {
    const intents = [
      "practice",
      "explain",
      "quiz",
      "flashcards",
      "learning-plan",
      "study-guide",
    ] as const;
    for (const core of intents) {
      const ctx = buildCoreNotebookActionContext(core);
      expect(ctx.coreStudyIntent).toBe(core);
    }
  });

  it("7. LearningIntent does not replace CoreStudyIntent", () => {
    const ctx: CoreNotebookActionContext =
      buildCoreNotebookActionContext("quiz");
    expect(ctx.coreStudyIntent).toBe("quiz");
    expect(ctx.learningIntent?.purpose).toBe("CREATE");
    expect(ctx.learningIntent?.purpose).not.toBe("ASSESS");
  });

  it("8. no persistence — context is ephemeral request metadata only", () => {
    const mod = readFileSync(
      path.join(process.cwd(), "src/lib/core/notebook-action-context.ts"),
      "utf8",
    );
    expect(mod).not.toMatch(/prisma|db\.|LearningAttempt|ConceptMastery/i);
    expect(mod).toMatch(/ephemeral/i);
  });

  it("9. CoreSourceChat builds context; ownership remains session-side", () => {
    const chat = readFileSync(
      path.join(process.cwd(), "src/components/core/CoreSourceChat.tsx"),
      "utf8",
    );
    const workspace = readFileSync(
      path.join(process.cwd(), "src/components/core/CoreNotesWorkspace.tsx"),
      "utf8",
    );
    expect(chat).toContain("buildCoreNotebookActionContext");
    expect(chat).toContain("onNotebookAction(ctx)");
    expect(workspace).toContain("coreStudyIntent");
    expect(workspace).toContain("void ctx.learningIntent");
  });

  it("10. Orchestrator does not consume CORE LearningIntent", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toContain("buildCoreNotebookActionContext");
    expect(diagnose).not.toContain("CoreNotebookActionContext");
  });
});
