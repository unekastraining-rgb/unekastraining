import { describe, expect, it } from "vitest";
import {
  personaAccessibilityTruthSummary,
  resolvePersonaPresentationHooks,
} from "./persona-accessibility-hooks";

describe("persona-accessibility-hooks", () => {
  it("parses safe structural prefs only", () => {
    const hooks = resolvePersonaPresentationHooks({
      modalityPreferencesJson: JSON.stringify({ visual: true, age: 12 }),
      accessibilityPreferencesJson: JSON.stringify({
        preferReducedMotion: true,
        medicalDiagnosis: "secret",
      }),
    });
    expect(hooks.modalityKeys).toEqual(["visual"]);
    expect(hooks.accessibility.preferReducedMotion).toBe(true);
    expect(JSON.stringify(hooks)).not.toContain("medical");
    expect(JSON.stringify(hooks)).not.toContain("age");
  });

  it("does not create a second learning engine", () => {
    const t = personaAccessibilityTruthSummary();
    expect(t.createsSecondLearningEngine).toBe(false);
    expect(t.infersSensitiveAttributes).toBe(false);
    expect(t.affectsDiagnosis).toBe(false);
  });
});
