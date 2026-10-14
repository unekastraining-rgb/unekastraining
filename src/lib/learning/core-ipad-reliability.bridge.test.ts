import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  coreAdaptiveRunHrefWithReturn,
  coreNotebookReturnHref,
  resolveCoreAdaptivePrimaryCta,
} from "@/lib/learning/orchestrator/core-adaptive-bridge";

const root = path.resolve(__dirname, "../../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-2 CORE → Knowledge → Adaptive", () => {
  it("TEST G — Continue Learning uses adaptive start + flush hook", () => {
    const panel = read("src/components/core/CoreKnowledgeBridgePanel.tsx");
    expect(panel).toContain("/api/study/adaptive/start");
    expect(panel).toContain("onBeforeLeaveToAdaptive");
    expect(panel).toContain("coreAdaptiveRunHrefWithReturn");
    expect(panel).toContain("studyhaul:coreReturnNoteId");
  });

  it("TEST H — CORE notes APIs do not write mastery", () => {
    const notes = read("app/api/notes/[id]/route.ts");
    expect(notes).not.toContain("recordEvidence");
    expect(notes).not.toContain("applyEvidenceToMastery");
    expect(notes).not.toContain("ConceptMastery");
    const bridge = read("src/lib/learning/orchestrator/core-adaptive-bridge.ts");
    expect(bridge).not.toContain("recordEvidence");
    expect(bridge).not.toContain("applyEvidenceToMastery");
  });

  it("TEST I — foreign concept cannot start Adaptive CTA without conceptId", () => {
    expect(resolveCoreAdaptivePrimaryCta({ conceptId: null }).kind).toBe(
      "none",
    );
    expect(resolveCoreAdaptivePrimaryCta({ conceptId: "" }).kind).toBe("none");
    expect(
      resolveCoreAdaptivePrimaryCta({ conceptId: "concept_owned" }).kind,
    ).toBe("start");
  });

  it("TEST J — CORE ↔ Adaptive return href preserves noteId", () => {
    expect(coreNotebookReturnHref("note_abc")).toBe("/core?noteId=note_abc");
    expect(coreAdaptiveRunHrefWithReturn("run_1", "note_abc")).toContain(
      "fromNote=note_abc",
    );
    expect(coreAdaptiveRunHrefWithReturn("run_1", null)).toBe(
      "/study/adaptive/run_1",
    );
  });

  it("workspace save uses prepareNoteDocumentForSave + save generation", () => {
    const ws = read("src/components/core/CoreNotesWorkspace.tsx");
    expect(ws).toContain("prepareNoteDocumentForSave");
    expect(ws).toContain("shouldApplySaveResult");
    expect(ws).toContain("flushNoteBeforeAdaptive");
    expect(ws).toContain("docRef");
    expect(ws).toContain("data-core-save-error");
  });

  it("SketchLayer and InfiniteCanvas use canvas buffer helpers", () => {
    expect(read("src/components/core/SketchLayer.tsx")).toContain(
      "resolveCanvasCssSize",
    );
    expect(read("src/components/core/InfiniteCanvas.tsx")).toContain(
      "ResizeObserver",
    );
    expect(read("src/components/core/InfiniteCanvas.tsx")).toContain(
      "resolveCanvasCssSize",
    );
  });

  it("Adaptive shell offers Back to notebook when fromNote present", () => {
    const shell = read("src/components/study/AdaptiveSequenceRunShell.tsx");
    expect(shell).toContain("data-adaptive-return-core");
    expect(shell).toContain("Back to notebook");
    expect(shell).toContain("coreNotebookReturnHref");
  });
});
