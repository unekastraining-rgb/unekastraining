/**
 * 2P-12 — Universal Learning Scaffolding tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  activityScaffoldSourceFromContent,
  learningScaffoldTruthSummary,
  normalizeLearningScaffold,
  normalizeLearningScaffolds,
  orderLearningScaffolds,
  projectLearningScaffolds,
  projectSuccessLooksLike,
  scaffoldModuleDoesNotWriteEvidence,
} from "@/lib/learning/scaffolding";
import {
  projectLearningExperience,
  resolveLearningExperience,
} from "@/lib/learning/experience";
import { selectActivityIntervention } from "@/lib/learning/orchestrator/activity-intervention-policy";
import { evaluateCodingChallenge } from "@/lib/learning/activities/coding/evaluate";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-12 Scaffold contract", () => {
  it("accepts valid scaffold and preserves level / reveal policy", () => {
    const s = normalizeLearningScaffold({
      kind: "HINT",
      label: "Nudge",
      content: "Think about the superclass first.",
      level: 2,
      revealPolicy: "ON_REQUEST",
      doesNotRevealAnswer: true,
    });
    expect(s).toEqual({
      kind: "HINT",
      label: "Nudge",
      content: "Think about the superclass first.",
      level: 2,
      revealPolicy: "ON_REQUEST",
      doesNotRevealAnswer: true,
    });
  });

  it("rejects invalid scaffolds instead of inventing", () => {
    expect(normalizeLearningScaffold({ kind: "HINT" })).toBeNull();
    expect(
      normalizeLearningScaffold({
        kind: "NOT_A_KIND",
        label: "x",
        content: "y",
      }),
    ).toBeNull();
    expect(
      normalizeLearningScaffolds([
        { kind: "HINT", label: "ok", content: "yes" },
        { kind: "HINT", label: "", content: "no" },
      ]),
    ).toHaveLength(1);
  });

  it("drops answer-revealing non-EXAMPLE scaffolds", () => {
    expect(
      normalizeLearningScaffold({
        kind: "HINT",
        label: "Answer",
        content: "return woof",
        doesNotRevealAnswer: false,
      }),
    ).toBeNull();
  });

  it("orders by level then reveal policy", () => {
    const ordered = orderLearningScaffolds([
      {
        kind: "HINT",
        label: "L2",
        content: "b",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
      {
        kind: "STEP",
        label: "L1 always",
        content: "a",
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
      {
        kind: "CONSTRAINT",
        label: "L1 req",
        content: "c",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ]);
    expect(ordered.map((s) => s.label)).toEqual([
      "L1 always",
      "L1 req",
      "L2",
    ]);
  });
});

describe("2P-12 Projection", () => {
  it("projects authored scaffolds for java inheritance without mutating source", () => {
    const source = activityScaffoldSourceFromContent({
      activityKind: "coding",
      contentId: "java-inheritance-subclass",
    });
    const before = JSON.stringify(source.authoredScaffolds);
    const result = projectLearningScaffolds(source);
    expect(JSON.stringify(source.authoredScaffolds)).toBe(before);
    expect(result.scaffolds.some((s) => s.kind === "HINT")).toBe(true);
    expect(result.scaffolds.some((s) => s.level === 3)).toBe(true);
    expect(result.successLooksLike?.toLowerCase()).toContain("subclass");
    expect(
      result.scaffolds.every((s) => s.doesNotRevealAnswer !== false || s.kind === "EXAMPLE"),
    ).toBe(true);
  });

  it("does not fabricate scaffolds when no content metadata exists", () => {
    const result = projectLearningScaffolds({
      activityKind: "coding",
      objective: null,
      starter: null,
      authoredScaffolds: null,
    });
    expect(result.scaffolds).toEqual([]);
    expect(result.successLooksLike).toBeNull();
  });

  it("projects rubric labels as checklist without exposing needles", () => {
    const result = projectLearningScaffolds({
      activityKind: "writing",
      objective: "Explain photosynthesis",
      rubricLabels: ["Energy / sunlight", "Inputs", "Outputs"],
      minChars: 40,
      evaluationMode: "rubric",
    });
    const checklist = result.scaffolds.find((s) => s.kind === "CHECKLIST");
    expect(checklist?.content).toContain("Energy / sunlight");
    expect(checklist?.content.toLowerCase()).not.toContain("mustinclude");
    expect(result.successLooksLike).toContain("Energy / sunlight");
  });

  it("success criteria use authored line when present", () => {
    expect(
      projectSuccessLooksLike({
        activityKind: "sql",
        objective: "Filter rows",
        authoredSuccessLooksLike: "Return only matching grades.",
      }),
    ).toBe("Return only matching grades.");
  });
});

describe("2P-12 Evidence boundary + integration", () => {
  it("scaffold modules do not write evidence or mastery", () => {
    expect(
      scaffoldModuleDoesNotWriteEvidence(
        read("src/lib/learning/scaffolding/project.ts"),
      ),
    ).toBe(true);
    expect(
      scaffoldModuleDoesNotWriteEvidence(
        read("src/lib/learning/scaffolding/from-content.ts"),
      ),
    ).toBe(true);
    expect(learningScaffoldTruthSummary().hintRequestIsNotEvidence).toBe(true);
    expect(learningScaffoldTruthSummary().doesNotWriteEvidence).toBe(true);
  });

  it("intervention → experience scaffolds → evaluate; scaffolds are not evidence", () => {
    const intervention = selectActivityIntervention({
      diagnosis: "APPLICATION_GAP",
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      topicName: "Intro to coding",
      intentPurpose: "PRACTICE",
    });
    expect(intervention?.adapterKey).toBe("coding");

    const resolved = resolveLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "coding",
      whyReason: intervention?.reason ?? null,
      adaptiveContext: true,
    });
    expect(resolved.coverageStatus).toBe("AVAILABLE");
    expect(resolved.experience?.scaffolds.length).toBeGreaterThan(0);
    expect(resolved.experience?.successLooksLike).toBeTruthy();

    // Projecting / having scaffolds does not evaluate or write evidence.
    expect(learningScaffoldTruthSummary().doesNotWriteEvidence).toBe(true);

    const challenge = getCodingChallenge(resolved.recommendedContentId!)!;
    const evaluation = evaluateCodingChallenge(
      challenge,
      'class Dog extends Animal {\n  public String bark() { return "woof"; }\n}\n',
    );
    expect(evaluation.outcome).toBe("SUCCESS");
  });

  it("experience projection includes scaffolds for inheritance", () => {
    const view = projectLearningExperience({
      conceptId: "c-java",
      conceptTitle: "Java inheritance",
      activityKind: "coding",
      scaffoldSource: activityScaffoldSourceFromContent({
        activityKind: "coding",
        contentId: "java-inheritance-subclass",
        objective: "Use inheritance",
      }),
    });
    expect(view.scaffolds.some((s) => s.revealPolicy === "ON_REQUEST")).toBe(
      true,
    );
    expect(view.hint).toBeTruthy();
  });

  it("ActivityWorkspace supports progressive scaffold reveal without evidence write", () => {
    const src = read("src/components/study/ActivityWorkspace.tsx");
    expect(src).toContain("data-learning-scaffolds");
    expect(src).toContain("data-scaffold-request");
    expect(src).toContain("data-scaffold-not-evidence");
    expect(src).toContain("data-success-looks-like");
    expect(src).not.toContain("applyEvidenceToMastery");
    expect(src).not.toContain("recordAuthoritativeActivityEvidence");
  });
});
