/**
 * Knowledge Library architecture — §49 acceptance + Phase B/D assembly checks.
 */
import { describe, expect, it } from "vitest";

import { assembleTeachingKnowledge } from "@/lib/learning/knowledge/assemble-teaching-knowledge";
import { isConceptTeachable } from "@/lib/learning/knowledge/coverage";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import { resolveKnowledge } from "@/lib/learning/knowledge/knowledge-library";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { resolveContextualPractice } from "@/lib/study/practice-landscape";
import "@/lib/learning/knowledge/packs";

describe("KL architecture acceptance (§49)", () => {
  it("Marketing — Teach me marketing resolves to a meaningful concept family", () => {
    const ctx = resolveTeachingKnowledgeContext("Teach me marketing", {
      scope: "concept-family",
      activity: "teach",
    });
    expect(ctx).not.toBeNull();
    expect(ctx!.source).toBe("knowledge-library");
    expect(ctx!.assembled).toBeDefined();
    expect(ctx!.assembled!.targetTeachable).toBe(true);
    const ids = new Set(ctx!.concepts.map((c) => c.id));
    // Family should include marketing and related STP/mix concepts when assembled
    expect(
      ids.has("business-marketing") ||
        ctx!.primaryConcept?.id === "business-marketing",
    ).toBe(true);
    for (const id of [
      "business-customer-value",
      "business-segmentation",
      "business-targeting",
      "business-positioning",
      "business-marketing-mix",
    ]) {
      expect(findInstructionalConceptById(id)).not.toBeNull();
    }
  });

  it("Java — inheritance retrieves prerequisites and related teaching knowledge", () => {
    const assembly = assembleTeachingKnowledge({
      target: "inheritance in Java",
      activity: "teach",
      scope: "focused-concept",
    });
    expect(assembly).not.toBeNull();
    expect(assembly!.targetConcept?.id).toBe("java-inheritance");
    expect(assembly!.prerequisites.map((c) => c.id)).toEqual(
      expect.arrayContaining(["java-classes-basics"]),
    );
    expect(assembly!.layersUsed).toEqual(
      expect.arrayContaining([
        "exact",
        "prerequisites",
        "relationships",
        "teaching-resources",
      ]),
    );
    expect(assembly!.misconceptions.length).toBeGreaterThan(0);
    expect(assembly!.practiceForms.length).toBeGreaterThan(0);
    expect(assembly!.relationships.some((r) => r.kind === "leads_to")).toBe(
      true,
    );
  });

  it("Mathematics — linear equations connects variables/expressions/equations/slope", () => {
    const assembly = assembleTeachingKnowledge({
      target: "linear equations",
      activity: "explain",
    });
    expect(assembly).not.toBeNull();
    expect(assembly!.targetConcept?.id).toBe("math-linear-equations");
    expect(assembly!.prerequisites.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "math-algebra-variables",
        "math-expressions",
        "math-equations",
      ]),
    );
    expect(assembly!.vocabulary.join(" ").toLowerCase()).toMatch(/slope|intercept/);
  });

  it("Economics — supply and demand connects scarcity/markets/equilibrium family", () => {
    const assembly = assembleTeachingKnowledge({
      target: "supply and demand",
      activity: "teach",
    });
    expect(assembly).not.toBeNull();
    expect(assembly!.targetConcept?.id).toBe("economics-supply-demand");
    expect(assembly!.prerequisites.some((c) => c.id === "economics-scarcity")).toBe(
      true,
    );
    expect(
      assembly!.relatedConcepts.some(
        (c) =>
          c.id === "economics-equilibrium" || c.id === "economics-elasticity",
      ),
    ).toBe(true);
  });

  it("Psychology — classical conditioning works from canonical Library without a course pack", () => {
    const resolved = resolveKnowledge("classical conditioning");
    expect(resolved).not.toBeNull();
    expect(resolved!.pack.id).toBe("psychology-fundamentals");
    expect(resolved!.matchedConcept?.id).toBe(
      "psychology-classical-conditioning",
    );
    expect(isConceptTeachable(resolved!.matchedConcept!)).toBe(true);
  });

  it("SQL — joins retrieves tables/keys/INNER/LEFT oriented teaching", () => {
    const assembly = assembleTeachingKnowledge({
      target: "SQL joins",
      activity: "practice",
    });
    expect(assembly).not.toBeNull();
    expect(assembly!.targetConcept?.id).toBe("sql-joins");
    expect(assembly!.emphasis).toBe("practice");
    expect(assembly!.prerequisites.map((c) => c.id)).toEqual(
      expect.arrayContaining(["sql-tables", "sql-keys"]),
    );
    expect(assembly!.subconcepts.map((c) => c.id)).toEqual(
      expect.arrayContaining(["sql-inner-join", "sql-left-join"]),
    );
  });

  it("Practice landscape prefers concept practiceForms (sql → sql activity)", () => {
    const item = resolveContextualPractice("SQL joins", ["sql", "query", "code"]);
    expect(item.activityKey).toBe("sql");
  });

  it("I don't understand emphasis surfaces misconception-repair", () => {
    const assembly = assembleTeachingKnowledge({
      target: "Java inheritance",
      struggling: true,
      activity: "explain",
    });
    expect(assembly?.emphasis).toBe("misconception-repair");
    expect(assembly?.misconceptions.length).toBeGreaterThan(0);
  });

  it("Unknown topic does not invent canonical Library knowledge", () => {
    expect(resolveKnowledge("quantum gardening")).toBeNull();
    expect(assembleTeachingKnowledge({ target: "quantum gardening" })).toBeNull();
  });
});
