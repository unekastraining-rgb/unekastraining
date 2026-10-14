import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Phase 2E-2 preservation surfaces", () => {
  it("keeps existing Concept create helpers intact", () => {
    const concept = readFileSync(
      path.join(process.cwd(), "src/lib/learning/knowledge/concept.ts"),
      "utf8",
    );
    expect(concept).toContain("export async function createConcept");
    expect(concept).toContain("export async function ensureConceptForTopic");
    expect(concept).not.toMatch(/createConceptRelationship/);
  });

  it("keeps CORE knowledge bridge metadata contract", () => {
    const types = readFileSync(
      path.join(process.cwd(), "src/lib/learning/knowledge/core-bridge-types.ts"),
      "utf8",
    );
    expect(types).toContain("linkedConceptIds");
    expect(types).toContain("candidateConcepts");
    expect(types).toContain("LearningKnowledgeMeta");
    const bridge = readFileSync(
      path.join(process.cwd(), "src/lib/learning/knowledge/core-bridge.ts"),
      "utf8",
    );
    expect(bridge).toContain("learningKnowledge");
  });

  it("keeps Unified Tutor / SIX / LUCKY entrypoints untouched by relationships", () => {
    const tutorIndex = readFileSync(
      path.join(process.cwd(), "src/lib/learning/tutor/index.ts"),
      "utf8",
    );
    expect(tutorIndex).not.toMatch(/ConceptRelationship|getPrerequisiteConceptIds/);

    const retention = readFileSync(
      path.join(process.cwd(), "src/lib/learning/retention/index.ts"),
      "utf8",
    );
    expect(retention).not.toMatch(/ConceptRelationship/);
  });

  it("API route is additive under learning/concepts/relationships", () => {
    const route = readFileSync(
      path.join(
        process.cwd(),
        "app/api/learning/concepts/relationships/route.ts",
      ),
      "utf8",
    );
    expect(route).toContain("getOrCreateDefaultUser");
    expect(route).toContain("isConceptRelationshipsEnabled");
    expect(route).not.toMatch(/userId:\s*body\.userId/);
    expect(route).toContain("userId: user.id");
  });

  it("does not project relationships into LearningObject.prerequisiteConceptIdsJson", () => {
    const helper = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/knowledge/concept-relationship.ts",
      ),
      "utf8",
    );
    expect(helper).not.toMatch(/prerequisiteConceptIdsJson|learningObject/);
    const ensure = readFileSync(
      path.join(process.cwd(), "src/lib/learning/learning-object/ensure.ts"),
      "utf8",
    );
    expect(ensure).toContain("prerequisiteConceptIdsJson");
    expect(ensure).not.toMatch(/ConceptRelationship|getPrerequisiteConceptIds/);
  });

  it("feature flag OFF does not alter createConcept helper source", () => {
    const concept = readFileSync(
      path.join(process.cwd(), "src/lib/learning/knowledge/concept.ts"),
      "utf8",
    );
    expect(concept).toContain("export async function createConcept");
    expect(concept).not.toMatch(/isConceptRelationshipsEnabled|STUDY_HAUL_CONCEPT_RELATIONSHIPS/);
  });

  it("migration SQL is additive only", () => {
    const migration = readFileSync(
      path.join(
        process.cwd(),
        "prisma/migrations/20260915180000_concept_relationship/migration.sql",
      ),
      "utf8",
    );
    expect(migration).toContain('CREATE TABLE "ConceptRelationship"');
    expect(migration).not.toMatch(/DROP TABLE|ALTER TABLE \"Concept\"|ALTER TABLE \"LearningObject\"|ALTER TABLE \"Topic\"|ALTER TABLE \"Note\"/i);
  });
});
