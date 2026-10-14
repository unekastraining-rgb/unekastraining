/**
 * Phase 2G-59 — Study Hub → Adaptive closed-loop bridge tests.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  hubAdaptiveRunHref,
  resolveHubAdaptivePrimaryCta,
  resolveHubDirectSixSecondaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-59 hub adaptive bridge helpers", () => {
  it("1–2. activeRunId → Continue learning CTA and adaptive route", () => {
    const cta = resolveHubAdaptivePrimaryCta({
      conceptId: "concept-1",
      activeRunId: "run-abc",
    });
    expect(cta).toEqual({
      kind: "resume",
      runId: "run-abc",
      label: "Continue learning",
      href: "/study/adaptive/run-abc",
    });
    expect(hubAdaptiveRunHref("run-abc")).toBe("/study/adaptive/run-abc");
  });

  it("3. conceptId without activeRunId → Start learning CTA", () => {
    const cta = resolveHubAdaptivePrimaryCta({
      conceptId: "concept-1",
      activeRunId: null,
    });
    expect(cta).toEqual({
      kind: "start",
      conceptId: "concept-1",
      label: "Start learning",
    });
  });

  it("6. missing conceptId does not start Adaptive", () => {
    expect(
      resolveHubAdaptivePrimaryCta({
        conceptId: null,
        activeRunId: null,
      }),
    ).toEqual({ kind: "none" });
    expect(
      resolveHubAdaptivePrimaryCta({
        conceptId: "   ",
        activeRunId: "",
      }),
    ).toEqual({ kind: "none" });
  });

  it("9. direct SIX secondary remains when href + label exist", () => {
    expect(
      resolveHubDirectSixSecondaryCta({
        href: "/study/six/feynman",
        actionLabel: "Try it",
      }),
    ).toEqual({ href: "/study/six/feynman", label: "Try it" });
    expect(
      resolveHubDirectSixSecondaryCta({ href: null, actionLabel: "Try it" }),
    ).toBeNull();
  });

  it("preserves concept identity trimming without fabrication", () => {
    const cta = resolveHubAdaptivePrimaryCta({
      conceptId: "  concept-owned  ",
      activeRunId: null,
    });
    expect(cta.kind).toBe("start");
    if (cta.kind === "start") {
      expect(cta.conceptId).toBe("concept-owned");
    }
  });
});

describe("Phase 2G-59 OrchestratorSuggestionCard source contracts", () => {
  const card = read("src/components/study/OrchestratorSuggestionCard.tsx");

  it("4–5. Start invokes existing Adaptive start path and navigates to run", () => {
    expect(card).toContain('"/api/study/adaptive/start"');
    expect(card).toContain("JSON.stringify({ conceptId: primary.conceptId })");
    expect(card).toContain("`/study/adaptive/${data.runId}`");
    expect(card).toContain("router.push(primary.href)");
  });

  it("7–8. start failure safe UI; repeated clicks guarded by starting", () => {
    expect(card).toContain("Could not start adaptive study.");
    expect(card).toContain("role=\"alert\"");
    expect(card).toContain("if (!suggestion || starting) return");
    expect(card).toContain("disabled={starting}");
  });

  it("9. direct SIX remains secondary when Adaptive primary exists", () => {
    expect(card).toContain('data-hub-primary-cta="adaptive"');
    expect(card).toContain('data-hub-secondary-cta="direct-six"');
    expect(card).toContain("data-orchestrator-try-it");
    expect(card).toContain("resolveHubDirectSixSecondaryCta");
  });

  it("10–12. Hub creates no LearningAttempt / mastery / re-orchestration", () => {
    expect(card).not.toMatch(/recordEvidence|LearningAttempt|applyEvidenceToMastery/);
    expect(card).not.toMatch(/recordAdaptiveSequenceCompletion|orchestrateFromLearnerState/);
    expect(card).not.toMatch(/syncLucky|syncWeakMastery/);
  });

  it("CTA hierarchy: Adaptive primary styling before secondary SIX", () => {
    const adaptiveIdx = card.indexOf("data-orchestrator-adaptive-study");
    const sixIdx = card.indexOf('data-hub-secondary-cta="direct-six"');
    expect(adaptiveIdx).toBeGreaterThan(0);
    expect(sixIdx).toBeGreaterThan(adaptiveIdx);
    expect(card).toContain("{primary.label}");
    expect(card).toContain("touch-manipulation");
    expect(card).toContain("min-h-11");
    expect(card).toContain("data-hub-concept-id");

    const bridge = read(
      "src/lib/learning/orchestrator/hub-adaptive-bridge.ts",
    );
    expect(bridge).toContain("Continue learning");
    expect(bridge).toContain("Start learning");
    expect(bridge).not.toContain("Start adaptive study");
    expect(bridge).not.toContain("Resume adaptive study");
  });

  it("uses hub-adaptive-bridge helpers; does not invent start API", () => {
    expect(card).toContain("resolveHubAdaptivePrimaryCta");
    expect(card).not.toContain("createAdaptive");
    expect(card).not.toContain("fakeRun");
  });
});

describe("Phase 2G-59 documentation", () => {
  it("implementation report exists", () => {
    const doc = read(
      "src/lib/learning/UNIVERSAL_LEARNING_LOOP_HUB_BRIDGE.md",
    );
    expect(doc).toContain("2G-59");
    expect(doc).toContain("PRIMARY");
    expect(doc).toContain("SECONDARY");
    expect(doc).toContain("Hub creates ZERO LearningAttempts");
  });
});
