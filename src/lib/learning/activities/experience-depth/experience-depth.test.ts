/**
 * 2P-37 — Experience depth integrity + authentic interaction smokes.
 */

import { describe, expect, it } from "vitest";

import {
  EXPERIENCE_DEPTH_CHALLENGES,
  EXPERIENCE_DEPTH_PROGRESSION_ENTRIES,
} from "@/lib/learning/activities/experience-depth";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
} from "@/lib/learning/activities/structured/service";
import {
  getProgressionEntry,
  listProgressionEntriesForConcept,
} from "@/lib/learning/content-progression/catalog";
import { catalogIntegrityOk } from "@/lib/learning/content-production/catalog-integrity";

describe("2P-37 experience depth pack", () => {
  it("adds a focused depth set (companions, not content flood)", () => {
    expect(EXPERIENCE_DEPTH_CHALLENGES.length).toBeGreaterThanOrEqual(12);
    expect(EXPERIENCE_DEPTH_CHALLENGES.length).toBeLessThanOrEqual(24);
    expect(EXPERIENCE_DEPTH_PROGRESSION_ENTRIES.length).toBe(
      EXPERIENCE_DEPTH_CHALLENGES.length,
    );
  });

  it("every challenge evaluates via shared structured path", () => {
    for (const challenge of EXPERIENCE_DEPTH_CHALLENGES) {
      expect(getStructuredChallenge(challenge.id)?.id).toBe(challenge.id);
      expect(challenge.criteria.length).toBeGreaterThanOrEqual(3);
      expect(challenge.misconceptionTargets?.length ?? 0).toBeGreaterThan(0);
      const fail = evaluateStructuredChallenge(challenge, "nope");
      expect(fail.outcome).toBe("FAIL");
    }
  });

  it("scaffolds never reveal answers and include multi-level guidance where authored", () => {
    const withScaffolds = EXPERIENCE_DEPTH_CHALLENGES.filter(
      (c) => (c.scaffolds?.length ?? 0) > 0,
    );
    expect(withScaffolds.length).toBeGreaterThan(8);
    for (const c of withScaffolds) {
      for (const s of c.scaffolds ?? []) {
        expect(s.doesNotRevealAnswer).not.toBe(false);
        expect(s.content.toLowerCase()).not.toMatch(
          /the answer is|x\s*=\s*-?4\b|password is/,
        );
      }
    }
  });

  it("linear-equation-solving gains UNDERSTAND / PRACTICE / CHALLENGE / RETAIN coverage", () => {
    const stages = new Set(
      listProgressionEntriesForConcept("linear-equation-solving").map(
        (e) => e.stage,
      ),
    );
    for (const s of ["UNDERSTAND", "PRACTICE", "CHALLENGE", "RETAIN"] as const) {
      expect(stages.has(s)).toBe(true);
    }
  });

  it("progression rows resolve and deepen existing conceptKeys", () => {
    for (const row of EXPERIENCE_DEPTH_PROGRESSION_ENTRIES) {
      expect(getProgressionEntry(row.contentKey)?.contentKey).toBe(row.contentKey);
      expect(getStructuredChallenge(row.contentId!)?.id).toBe(row.contentId);
    }
  });

  it("sample authentic answers pass (math challenge, cyber practice, nurse reassess)", () => {
    const math = evaluateStructuredChallenge(
      getStructuredChallenge("lab-math-solve-challenge")!,
      "Subtract 2x from both sides: 3x + 4 = -8. Subtract 4: 3x = -12. Divide both sides: x = -4. Negative as estimated. Check: 5(-4)+4=-20+4=-16 and 2(-4)-8=-8-8=-16. Verified by substitution.",
    );
    expect(math.outcome).not.toBe("FAIL");

    const cyber = evaluateStructuredChallenge(
      getStructuredChallenge("lab-cyber-authz-practice")!,
      "Authorization failure: authentication already succeeded at login. Revoke the expired project role and grant a temporary least-privilege finance group if still needed — do not reset the password.",
    );
    expect(cyber.outcome).not.toBe("FAIL");

    const nurse = evaluateStructuredChallenge(
      getStructuredChallenge("sim-nurse-vitals-reassess")!,
      "SpO2 and RR improved after oxygen. BP remains hypotensive and restlessness continues — perfusion still concerning. Reassess perfusion and escalate/notify again. Educational scenario only.",
    );
    expect(nurse.outcome).not.toBe("FAIL");
  });

  it("catalog integrity remains ok", () => {
    expect(catalogIntegrityOk()).toBe(true);
  });

  it("does not introduce specialized engines", () => {
    const blob = EXPERIENCE_DEPTH_CHALLENGES.map((c) => c.id + c.title).join(" ");
    expect(blob).not.toMatch(/MathEngine|CASEngine|SpeakingEngine|NursingEngine/i);
  });
});
