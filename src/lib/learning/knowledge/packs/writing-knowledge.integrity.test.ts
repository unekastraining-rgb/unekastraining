/**
 * Writing Knowledge Library — canonical pack integrity + retrieval + Haul mapping.
 */
import { describe, expect, it } from "vitest";

import "@/lib/learning/knowledge/packs";
import {
  findInstructionalConceptById,
  getInstructionalPackById,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import { matchKnowledgeLearningPath } from "@/lib/learning/knowledge/learning-paths";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { WRITING_FUNDAMENTALS_CONCEPT_IDS } from "@/lib/learning/knowledge/packs/writing-fundamentals";
import {
  getCanonicalConceptsForWritingType,
  getCanonicalConceptsForAiAction,
} from "@/lib/haul/writing/knowledge-map";
import { resolveHaulWritingEvidenceConceptId } from "@/lib/haul/writing/evidence";
import { generalConceptId } from "@/lib/learning/knowledge/retrieval/general-identity";
import { isRegisteredKnowledgeConceptId } from "@/lib/learning/learner-state/concept-identity";

const MAJOR = [
  "writing-thesis",
  "writing-body-paragraph",
  "writing-analysis",
  "writing-evidence",
  "writing-paraphrase",
  "writing-revision",
  "writing-argument",
  "writing-counterargument",
  "writing-introduction",
  "writing-conclusion",
] as const;

describe("Writing Knowledge Library pack", () => {
  it("registers writing-fundamentals with domain writing", () => {
    const pack = getInstructionalPackById("writing-fundamentals");
    expect(pack).not.toBeNull();
    expect(pack!.domain).toBe("writing");
    expect(pack!.subject).toBe("writing");
    expect(pack!.concepts.length).toBe(WRITING_FUNDAMENTALS_CONCEPT_IDS.length);
  });

  it("registers every exported concept id exactly once", () => {
    const seen = new Set<string>();
    for (const id of WRITING_FUNDAMENTALS_CONCEPT_IDS) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
      const hit = findInstructionalConceptById(id);
      expect(hit, id).not.toBeNull();
      expect(hit!.pack.id).toBe("writing-fundamentals");
    }
  });

  it("major concepts have structured instructional depth", () => {
    for (const id of MAJOR) {
      const c = findInstructionalConceptById(id)!.concept;
      expect(c.definition?.trim().length, id).toBeGreaterThan(20);
      expect(c.explanation.trim().length, id).toBeGreaterThan(40);
      expect(
        (c.examples?.length ?? 0) + (c.example ? 1 : 0),
        `${id} examples`,
      ).toBeGreaterThan(0);
      expect(
        (c.misconceptionDetails?.length ?? 0) +
          (c.misconceptions?.length ?? 0) +
          (c.misconception ? 1 : 0),
        `${id} misconceptions`,
      ).toBeGreaterThan(0);
      expect(
        (c.relationships?.length ?? 0) + (c.prerequisites?.length ?? 0),
        `${id} relationships/prereqs`,
      ).toBeGreaterThan(0);
      expect(
        (c.practiceForms?.length ?? 0) +
          (c.assessmentForms?.length ?? 0) +
          (c.transferPrompts?.length ?? 0) +
          (c.checkPrompt ? 1 : 0),
        `${id} practice/transfer`,
      ).toBeGreaterThan(0);
      expect(c.completeness === "rich" || c.completeness === "teachable").toBe(
        true,
      );
    }
  });

  it("relationship targets resolve inside the writing pack", () => {
    for (const id of WRITING_FUNDAMENTALS_CONCEPT_IDS) {
      const c = findInstructionalConceptById(id)!.concept;
      for (const rel of c.relationships ?? []) {
        expect(
          findInstructionalConceptById(rel.targetConceptId),
          `${id} → ${rel.targetConceptId}`,
        ).not.toBeNull();
      }
      for (const pre of c.prerequisites ?? []) {
        expect(findInstructionalConceptById(pre), `${id} prereq ${pre}`).not.toBeNull();
      }
    }
  });

  it("thesis contrasts topic misconceptions with structured details", () => {
    const thesis = findInstructionalConceptById("writing-thesis")!.concept;
    expect(thesis.misconceptionDetails?.length).toBeGreaterThanOrEqual(2);
    const blob = JSON.stringify(thesis.misconceptionDetails).toLowerCase();
    expect(blob).toMatch(/topic/);
  });

  it("analysis-vs-summary contrasts analysis and summary", () => {
    const c = findInstructionalConceptById("writing-analysis-vs-summary")!.concept;
    const kinds = (c.relationships ?? []).map((r) => r.kind);
    expect(kinds).toContain("contrasts_with");
    const targets = (c.relationships ?? []).map((r) => r.targetConceptId);
    expect(targets).toEqual(
      expect.arrayContaining(["writing-analysis", "writing-summary"]),
    );
  });
});

describe("Writing learning paths", () => {
  it("matches essay / argumentative / research / improvement paths", () => {
    expect(matchKnowledgeLearningPath("how to write an essay")?.id).toBe(
      "academic-essay-writing-path",
    );
    expect(
      matchKnowledgeLearningPath("how to write an argumentative paper")?.id,
    ).toBe("argumentative-writing-path");
    expect(matchKnowledgeLearningPath("how to write a research paper")?.id).toBe(
      "research-paper-writing-path",
    );
    expect(matchKnowledgeLearningPath("improve my writing")?.id).toBe(
      "writing-improvement-path",
    );
  });

  it("path concept ids all exist in writing-fundamentals", () => {
    for (const phrase of [
      "how to write an essay",
      "argumentative writing",
      "research paper writing",
      "writing improvement",
    ]) {
      const path = matchKnowledgeLearningPath(phrase)!;
      expect(path.packId).toBe("writing-fundamentals");
      for (const id of path.conceptIds) {
        expect(findInstructionalConceptById(id)).not.toBeNull();
      }
    }
  });
});

describe("Writing retrieval scenarios", () => {
  const cases: Array<{ query: string; expectId?: string; expectAnyOf?: string[] }> = [
    { query: "how to write a thesis", expectId: "writing-thesis" },
    { query: "thesis statement", expectId: "writing-thesis" },
    { query: "how to paraphrase", expectId: "writing-paraphrase" },
    { query: "analysis vs summary", expectId: "writing-analysis-vs-summary" },
    {
      query: "how do I analyze evidence?",
      expectAnyOf: ["writing-analysis", "writing-evidence", "writing-evidence-integration"],
    },
    {
      query: "how to revise my paper",
      expectAnyOf: ["writing-revision", "writing-organization"],
    },
    {
      query: "lab report writing",
      expectAnyOf: ["writing-hypothesis", "writing-research-question"],
    },
  ];

  for (const c of cases) {
    it(`retrieves canonical writing knowledge for: ${c.query}`, () => {
      const resolved = resolveInstructionalKnowledge(c.query);
      expect(resolved, c.query).not.toBeNull();
      expect(resolved!.domain).toBe("writing");
      const ids = [
        ...(resolved!.matchedConcept ? [resolved!.matchedConcept.id] : []),
        ...resolved!.pack.concepts.map((x) => x.id),
      ];
      if (c.expectId) {
        expect(ids).toContain(c.expectId);
      }
      if (c.expectAnyOf) {
        expect(c.expectAnyOf.some((id) => ids.includes(id))).toBe(true);
      }
      // Prefer KL over fabricating general:writing for these targets
      expect(ids.every((id) => !id.startsWith("general:"))).toBe(true);
    });
  }

  it("teaching context for essay path scopes multiple essay concepts", () => {
    const ctx = resolveTeachingKnowledgeContext("how to write an essay");
    expect(ctx).not.toBeNull();
    expect(ctx!.domain).toBe("writing");
    expect(ctx!.resolution).toBe("learning-path");
    const ids = ctx!.concepts.map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "writing-thesis",
        "writing-body-paragraph",
        "writing-evidence",
        "writing-analysis",
        "writing-revision",
      ]),
    );
  });

  it("argumentative path teaches claim→evidence→counterargument family", () => {
    const ctx = resolveTeachingKnowledgeContext(
      "how to write an argumentative paper",
    );
    expect(ctx).not.toBeNull();
    const ids = ctx!.concepts.map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "writing-argument",
        "writing-claim",
        "writing-evidence",
        "writing-counterargument",
        "writing-rebuttal",
      ]),
    );
  });
});

describe("Haul ↔ writing KL integration", () => {
  it("prefers canonical writing-thesis over general:writing:thesis", () => {
    expect(isRegisteredKnowledgeConceptId("writing-thesis")).toBe(true);
    const resolved = resolveHaulWritingEvidenceConceptId(["writing-thesis"]);
    expect(resolved).toBe("writing-thesis");
    expect(resolved).not.toBe(generalConceptId("writing", "thesis"));
  });

  it("essay / argumentative / lab type maps resolve to registered concepts", () => {
    for (const typeId of ["essay", "argumentative", "lab-report", "research-paper"]) {
      const ids = getCanonicalConceptsForWritingType(typeId);
      expect(ids.length, typeId).toBeGreaterThan(3);
      for (const id of ids) {
        expect(findInstructionalConceptById(id), id).not.toBeNull();
      }
    }
  });

  it("generate-thesis and paraphrase AI actions ground in KL concepts", () => {
    const thesis = getCanonicalConceptsForAiAction("generate-thesis", "essay", "introduction");
    expect(thesis).toContain("writing-thesis");
    const paraphrase = getCanonicalConceptsForAiAction("paraphrase", "essay");
    expect(paraphrase).toContain("writing-paraphrase");
  });

  it("general:writing:* remains a valid fallback identity when preferred id missing", () => {
    const generalId = generalConceptId("writing", "unknown-concept-xyz");
    expect(isRegisteredKnowledgeConceptId(generalId)).toBe(true);
    const resolved = resolveHaulWritingEvidenceConceptId([
      "writing-does-not-exist-xyz",
    ]);
    expect(resolved).toBe(generalConceptId("writing", "does-not-exist-xyz"));
  });
});
