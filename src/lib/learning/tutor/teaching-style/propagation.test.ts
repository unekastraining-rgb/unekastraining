/**
 * 2P-20 — Teaching Style propagation across Unified Tutor entry points.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  extractTeachingStyleHintFromMessage,
  getTeachingStyleEntryPoint,
  listTeachingStyleEntryPoints,
  resolveTeachingStyle,
  teachingStylePropagationTruthSummary,
  toTutorRequestFromCoreAssist,
  toTutorRequestFromLegacyChat,
  toTutorRequestFromDemonstration,
  toTutorRequestFromSixTutor,
  toTutorRequestFromTeachMe,
} from "@/lib/learning/tutor";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-20 entry-point inventory", () => {
  it("documents every Unified Tutor-related surface", () => {
    const points = listTeachingStyleEntryPoints();
    expect(points.map((p) => p.id)).toEqual(
      expect.arrayContaining([
        "foundation_tutor",
        "six_tutor",
        "core_assist",
        "teach_me",
        "facade_legacy_chat",
        "facade_demonstration",
        "adaptive_tutor_step",
        "lucky",
      ]),
    );
    expect(getTeachingStyleEntryPoint("foundation_tutor")?.status).toBe(
      "SUPPORTED",
    );
    expect(getTeachingStyleEntryPoint("six_tutor")?.status).toBe("SUPPORTED");
    expect(getTeachingStyleEntryPoint("core_assist")?.status).toBe("SUPPORTED");
    expect(getTeachingStyleEntryPoint("teach_me")?.status).toBe("SUPPORTED");
    expect(getTeachingStyleEntryPoint("lucky")?.status).toBe("NOT_APPLICABLE");
    expect(getTeachingStyleEntryPoint("adaptive_tutor_step")?.status).toBe(
      "NOT_APPLICABLE",
    );
    expect(points.every((p) => p.status !== "MISSING")).toBe(true);
  });

  it("propagation truth forbids second engines and CORE/Lucky mutation", () => {
    const t = teachingStylePropagationTruthSummary();
    expect(t.noSecondTutor).toBe(true);
    expect(t.noTeachingStyleEngine).toBe(true);
    expect(t.styleOptional).toBe(true);
    expect(t.doesNotWriteNoteContentJson).toBe(true);
    expect(t.doesNotAlterLuckyRetention).toBe(true);
  });
});

describe("2P-20 adapter / facade propagation", () => {
  it("legacy chat and demonstration facades carry optional style", () => {
    const chat = toTutorRequestFromLegacyChat({
      learnerId: "u1",
      message: "hi",
      teachingStyle: "SIMPLIFIED",
    });
    expect(chat.teachingStyle).toBe("SIMPLIFIED");
    expect(chat.mode).toBe("GUIDED");

    const demo = toTutorRequestFromDemonstration({
      learnerId: "u1",
      message: "prompt",
      learnerDemonstration: "my answer is long enough for practice evidence",
      teachingStyle: "DETAILED",
    });
    expect(demo.teachingStyle).toBe("DETAILED");
    expect(demo.evidenceAuthorizedByServer).toBe(true);
  });

  it("SIX adapter propagates style without changing GUIDED mode", async () => {
    const req = await toTutorRequestFromSixTutor({
      learnerId: "u1",
      message: "Explain this chunk",
      component: "chunking",
      topic: "Java interfaces",
      teachingStyle: "SIMPLIFIED",
    });
    expect(req.mode).toBe("GUIDED");
    expect(req.teachingStyle).toBe("SIMPLIFIED");
    expect(req.evidenceIntent).toBe("none");
  });

  it("CORE adapter propagates style without writing document fields", async () => {
    const req = await toTutorRequestFromCoreAssist({
      learnerId: "u1",
      message: "What is a pointer?",
      rawSourceBlock: "Pointers store addresses.",
      studyBlock: "",
      aiSourceInstruction: "Use course materials.",
      courseTitle: "CS101",
      teachingStyle: "BEGINNER",
    });
    expect(req.mode).toBe("TEACH_ME");
    expect(req.teachingStyle).toBe("BEGINNER");
    expect(req.evidenceIntent).toBe("none");
    expect(JSON.stringify(req)).not.toMatch(/contentJson|Note\.content/);
  });

  it("Teach Me adapter propagates style; evidence remains none on Tutor path", async () => {
    const req = await toTutorRequestFromTeachMe({
      learnerId: "u1",
      userResponse: "Interfaces are contracts that classes implement.",
      sourceBlock: "Java interfaces…",
      sourceModeInstruction: "course_only",
      teachingStyle: "SIMPLIFIED",
    });
    expect(req.mode).toBe("TEACH_ME");
    expect(req.teachingStyle).toBe("SIMPLIFIED");
    expect(req.evidenceIntent).toBe("none");
  });
});

describe("2P-20 message hints (explicit phrases only)", () => {
  it("maps clear NL phrases without age/struggle inference", () => {
    expect(
      extractTeachingStyleHintFromMessage("Teach me this like I'm 5"),
    ).toBe("SIMPLIFIED");
    expect(
      extractTeachingStyleHintFromMessage("Explain that normally please"),
    ).toBe("STANDARD");
    expect(
      extractTeachingStyleHintFromMessage("Give me the detailed version"),
    ).toBe("DETAILED");
    expect(
      extractTeachingStyleHintFromMessage("I failed again help me"),
    ).toBeUndefined();
    expect(
      extractTeachingStyleHintFromMessage("I am 5 years old"),
    ).toBeUndefined();
  });

  it("message hint loses to explicit selection", () => {
    expect(
      resolveTeachingStyle({
        explicit: "DETAILED",
        messageHint: "SIMPLIFIED",
      }),
    ).toEqual({ style: "DETAILED", source: "explicit" });
  });
});

describe("2P-20 route wiring source integrity", () => {
  it("foundation / six / core / evaluate routes parse teachingStyle", () => {
    expect(read("app/api/study/tutor/route.ts")).toMatch(/parseTeachingStyle/);
    expect(read("app/api/study/tutor/route.ts")).toMatch(
      /extractTeachingStyleHintFromMessage/,
    );
    expect(read("app/api/study/six-tutor/route.ts")).toMatch(/teachingStyle/);
    expect(read("app/api/core/chat/route.ts")).toMatch(/teachingStyle/);
    expect(read("app/api/study/evaluate/route.ts")).toMatch(/teachingStyle/);
  });

  it("lucky and diagnose remain style-free", () => {
    expect(read("app/api/study/lucky/route.ts")).not.toMatch(/teachingStyle/);
    expect(read("src/lib/learning/orchestrator/diagnose.ts")).not.toMatch(
      /teachingStyle|TeachingStyle/,
    );
  });

  it("CORE UI does not write style into note content", () => {
    const ui = read("src/components/core/CoreSourceChat.tsx");
    expect(ui).toMatch(/TeachingStyleSelector/);
    expect(ui).toMatch(/teachingStyle/);
    expect(ui).not.toMatch(/contentJson/);
  });
});

describe("2P-20 Intent / Mode / Style separation", () => {
  it("style does not project into TutorMode in adapters", async () => {
    const six = await toTutorRequestFromSixTutor({
      learnerId: "u1",
      message: "Teach me like I'm 5",
      component: "feynman",
      topic: "Supply and demand",
      teachingStyle: "SIMPLIFIED",
    });
    // Feynman SIX intervention ≠ FEYNMAN Teaching Style; mode stays GUIDED.
    expect(six.mode).toBe("GUIDED");
    expect(six.activityId).toBe("feynman");
    expect(six.teachingStyle).toBe("SIMPLIFIED");
  });
});
