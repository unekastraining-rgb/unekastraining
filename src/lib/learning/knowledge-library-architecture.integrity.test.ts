/**
 * Knowledge Library architecture — Phase A coverage + teachable-bar integrity.
 */
import { describe, expect, it } from "vitest";

import {
  isConceptTeachable,
  reportConceptCoverageById,
  reportPackCoverage,
} from "@/lib/learning/knowledge/coverage";
import { resolveKnowledge } from "@/lib/learning/knowledge/knowledge-library";
import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import "@/lib/learning/knowledge/packs";

describe("KL Phase A — coverage & teachable bar", () => {
  it("does not treat a bare name+thin explanation as teachable without instructional facets", () => {
    const thin = {
      id: "fake-thin",
      title: "Thin Topic",
      explanation: "This is a short note about Thin Topic for naming only.",
    };
    expect(isConceptTeachable(thin)).toBe(false);
  });

  it("java-inheritance meets teachable/rich coverage with relationships and misconceptions", () => {
    const report = reportConceptCoverageById("java-inheritance");
    expect(report).not.toBeNull();
    expect(report!.teachable).toBe(true);
    expect(report!.facets.identity).toBe(true);
    expect(report!.facets.definition).toBe(true);
    expect(report!.facets.prerequisites).toBe(true);
    expect(report!.facets.relationships).toBe(true);
    expect(report!.facets.examples).toBe(true);
    expect(report!.facets.misconceptions).toBe(true);
    expect(report!.facets.practiceForms).toBe(true);
    expect(report!.facets.assessmentForms).toBe(true);
    expect(
      report!.derivedCompleteness === "rich" ||
        report!.declaredCompleteness === "rich" ||
        report!.derivedCompleteness === "curriculum-mapped" ||
        report!.declaredCompleteness === "curriculum-mapped",
    ).toBe(true);

    const hit = findInstructionalConceptById("java-inheritance");
    expect(hit?.concept.relationships?.some((r) => r.kind === "prerequisite")).toBe(
      true,
    );
    expect(hit?.concept.misconceptionDetails?.length).toBeGreaterThan(0);
  });

  it("business-marketing meets teachable bar and resolves Teach me marketing", () => {
    const report = reportConceptCoverageById("business-marketing");
    expect(report).not.toBeNull();
    expect(report!.teachable).toBe(true);
    expect(report!.facets.relationships).toBe(true);
    expect(report!.facets.examples).toBe(true);

    const resolved = resolveKnowledge("Teach me marketing");
    expect(resolved).not.toBeNull();
    const concept =
      resolved!.matchedConcept ??
      resolved!.pack.concepts.find((c) => c.id === "business-marketing");
    expect(concept?.id).toBe("business-marketing");
  });

  it("marketing family concepts are registered (segmentation, targeting, positioning, mix)", () => {
    for (const id of [
      "business-customer-value",
      "business-segmentation",
      "business-targeting",
      "business-positioning",
      "business-marketing-mix",
    ]) {
      expect(findInstructionalConceptById(id)).not.toBeNull();
      expect(reportConceptCoverageById(id)?.teachable).toBe(true);
    }
  });

  it("pack coverage reports are available for java and business", () => {
    const java = reportPackCoverage("java-fundamentals");
    const business = reportPackCoverage("business-fundamentals");
    expect(java?.teachableCount).toBeGreaterThan(0);
    expect(business?.teachableCount).toBeGreaterThan(0);
  });
});
