import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

vi.mock("@/lib/db", () => ({
  db: {
    learningSpace: { findFirst: vi.fn().mockResolvedValue(null) },
    concept: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}));

import { toTutorRequestFromCoreAssist } from "@/lib/learning/tutor/core-adapter";
import { isCoreKnowledgeBridgeEnabled } from "@/lib/learning/knowledge/core-bridge-flag";

describe("CORE Assist + Knowledge bridge", () => {
  beforeEach(() => {
    delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
  });

  it("passes confirmed conceptIds into TutorRequest when provided", async () => {
    const req = await toTutorRequestFromCoreAssist({
      learnerId: "user-1",
      message: "Explain inheritance",
      rawSourceBlock: "source",
      studyBlock: "",
      aiSourceInstruction: "x",
      conceptIds: ["c1", "c2"],
    });
    expect(req.conceptIds).toEqual(["c1", "c2"]);
    expect(req.evidenceIntent).toBe("none");
  });

  it("omits conceptIds when none supplied (legacy Assist)", async () => {
    const req = await toTutorRequestFromCoreAssist({
      learnerId: "user-1",
      message: "Explain inheritance",
      rawSourceBlock: "source",
      studyBlock: "",
      aiSourceInstruction: "x",
    });
    expect(req.conceptIds).toBeUndefined();
  });
});

describe("Phase 2E-1 preservation", () => {
  const root = path.resolve(__dirname, "../../../..");
  function read(rel: string): string {
    return readFileSync(path.join(root, rel), "utf8");
  }

  it("does not add Prisma Note→Concept FK or join table", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toContain("model Note");
    expect(schema).toMatch(/model Note \{[\s\S]*?contentJson/);
    // Note model should not gain conceptId / concepts relation in 2E-1
    const noteBlock = schema.slice(
      schema.indexOf("model Note {"),
      schema.indexOf("model TopicMastery {"),
    );
    expect(noteBlock).not.toMatch(/conceptId/);
    expect(noteBlock).not.toMatch(/concepts\s+/);
  });

  it("does not redesign CORE Assist UI or Studio extraction", () => {
    expect(read("src/components/core/CoreSourceChat.tsx")).toMatch(
      /fetch\("\/api\/core\/chat"/,
    );
    expect(read("app/api/core/studio/route.ts")).toMatch(/CHAPTER_JSON_SCHEMA/);
    expect(read("src/lib/core/run-chapter-study.ts")).toMatch(
      /runChapterStudyPipeline/,
    );
  });

  it("does not modify Orchestrator / LUCKY / SIX Tutor for this phase", () => {
    expect(read("src/lib/learning/orchestrator/diagnose.ts")).not.toMatch(
      /core-bridge|learningKnowledge/,
    );
    expect(read("src/lib/learning/retention/review.ts")).not.toMatch(
      /core-bridge|learningKnowledge/,
    );
    expect(read("app/api/study/six-tutor/route.ts")).not.toMatch(
      /core-bridge|isCoreKnowledgeBridgeEnabled/,
    );
  });

  it("knowledge bridge flag defaults off", () => {
    delete process.env.STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE;
    expect(isCoreKnowledgeBridgeEnabled()).toBe(false);
  });

  it("exposes additive Studio panel without removing Studio items", () => {
    const studio = read("src/components/core/CoreStudioPanel.tsx");
    expect(studio).toMatch(/CoreKnowledgeBridgePanel/);
    expect(studio).toMatch(/Study this chapter/);
    expect(studio).toMatch(/STUDIO_ITEMS/);
  });
});
