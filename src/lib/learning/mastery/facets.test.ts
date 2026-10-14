import { describe, expect, it } from "vitest";

import {
  applyFacetDelta,
  computeFacetDelta,
  emptyFacetScores,
  facetKey,
} from "@/lib/learning/mastery/facets";
import {
  LEARNING_SPACE_KINDS,
  MASTERY_FACETS,
  buildEvidenceEnvelope,
  outcomeFromCorrect,
} from "@/lib/learning";

describe("ULE foundational contracts", () => {
  it("defines six mastery facets including Recognize≠Perform≠Retain", () => {
    expect(MASTERY_FACETS).toEqual([
      "RECOGNIZE",
      "EXPLAIN",
      "APPLY",
      "SOLVE",
      "PERFORM",
      "RETAIN",
    ]);
    expect(facetKey("RECOGNIZE")).toBe("recognize");
    expect(facetKey("PERFORM")).toBe("perform");
  });

  it("supports LearningSpace kinds without requiring Course", () => {
    expect(LEARNING_SPACE_KINDS).toContain("SELF_DIRECTED");
    expect(LEARNING_SPACE_KINDS).toContain("COURSE");
    expect(LEARNING_SPACE_KINDS).toContain("HOBBY");
  });

  it("maps correct/incorrect to evidence outcomes", () => {
    expect(outcomeFromCorrect(true)).toBe("SUCCESS");
    expect(outcomeFromCorrect(false)).toBe("FAIL");
    expect(computeFacetDelta("SUCCESS")).toBeGreaterThan(0);
    expect(computeFacetDelta("FAIL")).toBeLessThan(0);
  });

  it("updates one mastery facet without forcing others equal", () => {
    const start = emptyFacetScores();
    const afterRecognize = applyFacetDelta(start, "RECOGNIZE", "SUCCESS");
    expect(afterRecognize.recognize).toBeGreaterThan(0);
    expect(afterRecognize.perform).toBe(0);
    expect(afterRecognize.explain).toBe(0);

    const withPerform = applyFacetDelta(afterRecognize, "PERFORM", "SUCCESS");
    expect(withPerform.perform).toBeGreaterThan(0);
    expect(withPerform.recognize).toBe(afterRecognize.recognize);

    const afterFailPerform = applyFacetDelta(withPerform, "PERFORM", "FAIL");
    expect(afterFailPerform.recognize).toBe(withPerform.recognize);
    expect(afterFailPerform.perform).toBeLessThan(withPerform.perform);
  });

  it("builds an EvidenceEnvelope with sourceRef (no domain internals required)", () => {
    const envelope = buildEvidenceEnvelope({
      learnerId: "u1",
      learningObjectId: "lo1",
      conceptId: "c1",
      skillFacet: "RECOGNIZE",
      outcome: "SUCCESS",
      score: 1,
      sourceRef: { kind: "quiz_attempt", quizId: "q1", questionId: "qq1" },
    });
    expect(envelope.learningObjectId).toBe("lo1");
    expect(envelope.sourceRef.kind).toBe("quiz_attempt");
    expect(envelope.misconceptionSignals).toEqual([]);
  });
});
