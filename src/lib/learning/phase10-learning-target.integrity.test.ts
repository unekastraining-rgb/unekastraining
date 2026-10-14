/**
 * Bundle A Phase 10 — Learning Target Understanding integrity.
 */
import { describe, expect, it } from "vitest";
import {
  detectLearningActivity,
  isMateriallyAmbiguousTopic,
  normalizeLearningTarget,
  understandLearningTarget,
} from "@/lib/learning/knowledge/retrieval";
import { isProtectedSpecializedTopic } from "@/lib/learning/knowledge/retrieval/normalize-target";

describe("Phase 10 — Learning Target Understanding", () => {
  it("normal teaching request", () => {
    const t = understandLearningTarget("Teach me Java exceptions.")!;
    expect(t.activity).toBe("teach");
    expect(t.resolution).toBe("resolved");
    expect(t.topic.toLowerCase()).toContain("java");
    expect(t.topic.toLowerCase()).toContain("exception");
  });

  it("explanation request", () => {
    const t = understandLearningTarget(
      "Explain why this Java code throws an exception.",
    )!;
    expect(t.activity).toBe("explain");
    expect(t.resolution).toBe("resolved");
  });

  it("practice request", () => {
    const t = understandLearningTarget(
      "Give me practice problems on Java exceptions.",
    )!;
    expect(t.activity).toBe("practice");
    expect(t.topic.toLowerCase()).toMatch(/java/);
  });

  it("recall request", () => {
    const t = understandLearningTarget("Help me remember Java exceptions.")!;
    expect(t.activity).toBe("recall");
  });

  it("broad topic resolves without forced clarification", () => {
    const t = understandLearningTarget("Teach me psychology.")!;
    expect(t.resolution).toBe("resolved");
    expect(t.topic.toLowerCase()).toBe("psychology");
    expect(isMateriallyAmbiguousTopic("psychology")).toBe(false);
  });

  it("ambiguous topic marked needs-clarification", () => {
    const t = understandLearningTarget("Teach me 1900s biblical times.")!;
    expect(t.resolution).toBe("needs-clarification");
    expect(t.clarificationPrompt).toBeTruthy();
  });

  it("existing Phase 7 normalization preserved", () => {
    const n = normalizeLearningTarget("Teach me psychology.")!;
    const u = understandLearningTarget("Teach me psychology.")!;
    expect(u.normalizedTitle).toBe(n.normalizedTitle);
    expect(u.slug).toBe(n.slug);
  });

  it("OOD / specialized target preservation", () => {
    expect(isProtectedSpecializedTopic("Classes & Objects")).toBe(true);
    const t = understandLearningTarget("Teach me Classes & Objects")!;
    expect(t.resolution).toBe("protected-specialized");
  });

  it("source preference from my notes", () => {
    const t = understandLearningTarget(
      "Teach me Java exceptions from my notes.",
    )!;
    expect(t.sourcePreference).toBe("user-note");
    expect(detectLearningActivity(t.rawRequest)).toBe("teach");
  });
});
