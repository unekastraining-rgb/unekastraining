/**
 * 2P-36 — Domain experience pack integrity + evaluation smoke.
 */

import { describe, expect, it } from "vitest";

import {
  DOMAIN_EXPERIENCE_CHALLENGES,
  DOMAIN_EXPERIENCE_PROGRESSION_ENTRIES,
} from "@/lib/learning/activities/domain-experience";
import {
  evaluateStructuredChallenge,
  getStructuredChallenge,
} from "@/lib/learning/activities/structured/service";
import { getProgressionEntry } from "@/lib/learning/content-progression/catalog";
import {
  catalogIntegrityOk,
} from "@/lib/learning/content-production/catalog-integrity";
import { assessAdaptiveReadyCatalogItem } from "@/lib/learning/content-production/adaptive-ready-contract";

describe("2P-36 domain experience pack", () => {
  it("adds a focused high-quality set (not a content flood)", () => {
    expect(DOMAIN_EXPERIENCE_CHALLENGES.length).toBeGreaterThanOrEqual(15);
    expect(DOMAIN_EXPERIENCE_CHALLENGES.length).toBeLessThanOrEqual(30);
    expect(DOMAIN_EXPERIENCE_PROGRESSION_ENTRIES.length).toBe(
      DOMAIN_EXPERIENCE_CHALLENGES.length,
    );
  });

  it("every challenge is registered and evaluable via shared structured path", () => {
    for (const challenge of DOMAIN_EXPERIENCE_CHALLENGES) {
      expect(getStructuredChallenge(challenge.id)?.id).toBe(challenge.id);
      const fail = evaluateStructuredChallenge(challenge, "too short");
      expect(fail.outcome).toBe("FAIL");
    }
  });

  it("progression contentKeys resolve and point at registered contentIds", () => {
    for (const row of DOMAIN_EXPERIENCE_PROGRESSION_ENTRIES) {
      expect(getProgressionEntry(row.contentKey)?.contentKey).toBe(row.contentKey);
      expect(row.contentId).toBeTruthy();
      expect(getStructuredChallenge(row.contentId!)?.id).toBe(row.contentId);
    }
  });

  it("covers priority thin domains without subject engines", () => {
    const domains = new Set(
      DOMAIN_EXPERIENCE_PROGRESSION_ENTRIES.map((e) => e.domainContext),
    );
    for (const d of [
      "mathematics",
      "physics",
      "chemistry",
      "biology",
      "cybersecurity",
      "networking",
      "nursing",
      "business",
      "electrical",
      "automotive",
      "languages",
    ]) {
      expect(domains.has(d)).toBe(true);
    }
    expect(domains.has("MathEngine")).toBe(false);
  });

  it("sample math / cyber / language answers pass deterministic rubric", () => {
    const mathCh = getStructuredChallenge("lab-math-solve-linear")!;
    const math = evaluateStructuredChallenge(
      mathCh,
      "Add 7 to both sides: 3x = 18. Divide both sides by 3: x = 6. Check: 3(6) − 7 = 11. Verified by substitution.",
    );
    expect(math.outcome).not.toBe("FAIL");

    const cyberCh = getStructuredChallenge("lab-cyber-authn-vs-authz")!;
    const cyber = evaluateStructuredChallenge(
      cyberCh,
      "This is an authorization failure. Authentication proved identity at login; authorization permissions/roles decide payroll access. Fix: grant the payroll role via RBAC — not just reset the password.",
    );
    expect(cyber.outcome).not.toBe("FAIL");

    const langCh = getStructuredChallenge("write-lang-grammar-agreement")!;
    const lang = evaluateStructuredChallenge(
      langCh,
      "Corrected: The list of required readings is on the portal. The subject is the singular head noun list, not readings.",
    );
    expect(lang.outcome).not.toBe("FAIL");
  });

  it("catalog integrity remains ok with pack merged", () => {
    expect(catalogIntegrityOk()).toBe(true);
  });

  it("Adaptive-ready contract can assess a representative new item", () => {
    const item = {
      contentId: "lab-math-solve-linear",
      activityKind: "lab" as const,
      conceptKey: "linear-equation-solving",
      domainTag: "mathematics",
    };
    const assessed = assessAdaptiveReadyCatalogItem(item);
    expect(assessed.mechanismAdaptiveReady).toBe(true);
  });

  it("does not invent specialized engines in source", () => {
    const src = DOMAIN_EXPERIENCE_CHALLENGES.map((c) => c.id).join(" ");
    expect(src).not.toMatch(/MathEngine|NursingEngine|CyberEngine/i);
  });
});
