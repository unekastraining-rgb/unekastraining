/**
 * Haul writing experience — registry, essay structure, AI proposal contract.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildHaulWritingAiMessages } from "@/lib/haul/writing/ai-actions";
import {
  createHaulWritingDocument,
  exportHaulWritingAsPlainText,
  sectionHasContent,
} from "@/lib/haul/writing/document";
import { isSubstantialHaulWriting } from "@/lib/haul/writing/evidence";
import {
  buildHaulWritingEvidenceNote,
  resolveHaulWritingEvidenceConceptId,
} from "@/lib/haul/writing/evidence";
import {
  ARGUMENTATIVE_WRITING_TYPE,
  ESSAY_WRITING_TYPE,
  LAB_REPORT_WRITING_TYPE,
  getHaulWritingType,
  listHaulWritingTypes,
  suggestHaulWritingTypeFromAssignment,
} from "@/lib/haul/writing/registry";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Haul writing type registry", () => {
  it("has unique ids and valid sections for every type", () => {
    const types = listHaulWritingTypes();
    expect(types.length).toBeGreaterThanOrEqual(12);
    const ids = new Set<string>();
    for (const type of types) {
      expect(type.id).toBeTruthy();
      expect(ids.has(type.id)).toBe(false);
      ids.add(type.id);
      expect(type.sections.length).toBeGreaterThan(0);
      const sectionIds = new Set<string>();
      for (const section of type.sections) {
        expect(section.id).toBeTruthy();
        expect(sectionIds.has(section.id)).toBe(false);
        sectionIds.add(section.id);
        expect(section.title.trim().length).toBeGreaterThan(0);
        expect(section.purpose.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("Essay has introduction fields, body structure, and conclusion", () => {
    const essay = ESSAY_WRITING_TYPE;
    const intro = essay.sections.find((s) => s.id === "introduction");
    expect(intro?.fields?.some((f) => f.id === "thesis")).toBe(true);
    expect(intro?.fields?.some((f) => f.id === "hook")).toBe(true);
    expect(essay.sections.some((s) => s.id === "body-1")).toBe(true);
    expect(essay.sections.some((s) => s.id === "body-2")).toBe(true);
    expect(essay.sections.some((s) => s.id === "conclusion")).toBe(true);
    expect(essay.specialization).toBe("full");
  });

  it("Argumentative is not a renamed Essay template", () => {
    const arg = ARGUMENTATIVE_WRITING_TYPE;
    const essayIds = new Set(ESSAY_WRITING_TYPE.sections.map((s) => s.id));
    expect(arg.sections.some((s) => s.id === "counterargument")).toBe(true);
    expect(arg.sections.some((s) => s.id === "rebuttal")).toBe(true);
    expect(arg.sections.some((s) => s.id === "reason-1")).toBe(true);
    expect(essayIds.has("counterargument")).toBe(false);
    expect(getHaulWritingType("argumentative")?.title).toMatch(/Argumentative/i);
  });

  it("Lab report includes hypothesis, procedure, results, analysis, conclusion", () => {
    const lab = LAB_REPORT_WRITING_TYPE;
    const ids = lab.sections.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "hypothesis",
        "procedure",
        "results",
        "analysis",
        "conclusion",
      ]),
    );
  });
});

describe("Haul writing documents", () => {
  it("creates essay document with section content slots", () => {
    const doc = createHaulWritingDocument({ writingTypeId: "essay", mode: "write" });
    expect(doc).not.toBeNull();
    expect(doc!.kind).toBe("haul-writing-v1");
    expect(doc!.sections.length).toBe(ESSAY_WRITING_TYPE.sections.length);
    expect(sectionHasContent(doc!.sections[0]!)).toBe(false);
    doc!.sections[0]!.fieldValues = { thesis: "A clear thesis statement for testing." };
    expect(sectionHasContent(doc!.sections[0]!)).toBe(true);
    const plain = exportHaulWritingAsPlainText(doc!);
    expect(plain).toContain("#");
    expect(plain).toContain("Introduction");
  });

  it("does not treat opening a template as substantial writing evidence", () => {
    expect(isSubstantialHaulWriting("")).toBe(false);
    expect(isSubstantialHaulWriting("short")).toBe(false);
    expect(
      isSubstantialHaulWriting(
        "This is a meaningful paragraph of writing that a learner authored with enough length to count as practice.",
      ),
    ).toBe(true);
  });
});

describe("Haul writing AI actions", () => {
  it("scopes write-for-me to section context and does not claim overwrite", () => {
    const { system, user } = buildHaulWritingAiMessages({
      action: "write-for-me",
      writingTypeId: "essay",
      writingTypeTitle: "Essay",
      sectionId: "introduction",
      sectionTitle: "Introduction",
      sectionPurpose: "Orient the reader",
      currentText: "Existing learner draft stays until they accept a proposal.",
    });
    expect(system.toLowerCase()).toMatch(/proposal|not take ownership|writing assistant/);
    expect(user).toMatch(/ONLY for the current section/i);
    expect(user).toContain("Essay");
    expect(user).toContain("Introduction");
  });

  it("paraphrase preserves selected text in the request", () => {
    const { user } = buildHaulWritingAiMessages({
      action: "paraphrase",
      writingTypeId: "essay",
      writingTypeTitle: "Essay",
      selectedText: "Original sentence to paraphrase.",
      paraphraseStyle: "simplify",
    });
    expect(user).toContain("Original sentence to paraphrase.");
    expect(user).toMatch(/Paraphrase/i);
  });

  it("assignment heuristic suggests argumentative for argue prompts", () => {
    const hit = suggestHaulWritingTypeFromAssignment(
      "Write a 5-paragraph argumentative essay explaining whether schools should…",
    );
    expect(hit?.typeId).toBe("argumentative");
  });
});

describe("Haul writing evidence", () => {
  it("prefers canonical writing-thesis when Knowledge Library pack is registered", () => {
    expect(isSubstantialHaulWriting("")).toBe(false);
    // Packs loaded via evidence module side-effect import
    const id = resolveHaulWritingEvidenceConceptId(["writing-thesis"]);
    expect(id).toBe("writing-thesis");
    expect(
      buildHaulWritingEvidenceNote({
        action: "section_substantial_write",
        writingTypeId: "essay",
        sectionId: "introduction",
      }),
    ).toContain("haul-writing:section_substantial_write:essay:introduction");
  });
});

describe("Haul UI wiring (additive)", () => {
  it("landing asks what you are trying to write; pages editor preserved", () => {
    const workspace = read("src/components/haul/TheHaulWorkspace.tsx");
    expect(workspace).toContain("Write. Learn. Improve.");
    expect(workspace).toContain("What are you working on?");
    expect(workspace).toContain("Open page editor");
    expect(workspace).toContain("study-haul-the-haul-v1");
    expect(workspace).toContain("HaulWritingWorkspace");
  });

  it("writing workspace uses proposal panel and does not auto-overwrite", () => {
    const ws = read("src/components/haul/HaulWritingWorkspace.tsx");
    const proposal = read("src/components/haul/HaulWritingProposal.tsx");
    expect(ws).toContain("HaulWritingProposal");
    expect(proposal).toContain("Replace");
    expect(proposal).toContain("Insert below");
    expect(ws).toContain("Paraphrase selection");
    expect(ws).toContain("data-haul-writing-structure");
    expect(ws).toContain("data-haul-writing-stage");
    expect(ws).toContain("xl:grid-cols-[240px_minmax(0,1fr)_280px]");
    expect(ws).toContain("xl:hidden");
    expect(ws).toContain("/api/haul/writing/evidence");
    // Bundle N — Learning Studio deep-links via teachMeHref (preserves topic).
    expect(ws).toContain("teachMeHref");
  });

  it("landing uses split workspace not centered column", () => {
    const workspace = read("src/components/haul/TheHaulWorkspace.tsx");
    expect(workspace).toContain("lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]");
    expect(workspace).not.toContain("mx-auto max-w-4xl space-y-10");
  });

  it("API route reuses completeForUser and returns proposals", () => {
    const route = read("app/api/haul/writing/route.ts");
    expect(route).toContain("completeForUser");
    expect(route).toContain("proposal");
    expect(route).toContain("aiAvailable");
    expect(route).not.toContain("recordLearningEvidence");
  });

  it("classic Haul storage key remains alongside writing docs key", () => {
    const workspace = read("src/components/haul/TheHaulWorkspace.tsx");
    const types = read("src/lib/haul/writing/types.ts");
    expect(workspace).toContain("study-haul-the-haul-v1");
    expect(types).toContain("study-haul-writing-docs-v1");
    expect(types).toContain("haul-writing-v1");
  });
});
