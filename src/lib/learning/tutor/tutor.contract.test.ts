import { describe, expect, it } from "vitest";

import {
  getTutorModePolicy,
  isTutorMode,
  listTutorModes,
  TUTOR_MODES,
  type TutorRequest,
  type TutorResponse,
} from "@/lib/learning/tutor";
import {
  toTutorRequestFromDemonstration,
  toTutorRequestFromLegacyChat,
} from "@/lib/learning/tutor/facade";

describe("Tutor contract — modes", () => {
  it("lists all supported policy profiles", () => {
    expect(listTutorModes()).toEqual([
      "BEGINNER",
      "TEACH_ME",
      "SOCRATIC",
      "GUIDED",
      "PRACTICE",
      "CHALLENGE",
      "EXAM",
      "ADVANCED",
    ]);
    expect(TUTOR_MODES).toHaveLength(8);
  });

  it("validates mode strings", () => {
    expect(isTutorMode("SOCRATIC")).toBe(true);
    expect(isTutorMode("JavaTutor")).toBe(false);
    expect(isTutorMode("")).toBe(false);
  });

  it("returns a policy (not a separate service) per mode", () => {
    for (const mode of TUTOR_MODES) {
      const policy = getTutorModePolicy(mode);
      expect(policy.mode).toBe(mode);
      expect(policy.systemPolicy.length).toBeGreaterThan(40);
      expect(policy.temperature).toBeGreaterThan(0);
      expect(policy.maxTokens).toBeGreaterThan(100);
      expect(policy.systemPolicy).toMatch(/Study Haul's tutor/i);
    }
  });

  it("SOCRATIC and EXAM policies differ in coaching stance", () => {
    const socratic = getTutorModePolicy("SOCRATIC").systemPolicy;
    const exam = getTutorModePolicy("EXAM").systemPolicy;
    expect(socratic).toMatch(/guiding questions|hints/i);
    expect(exam).toMatch(/without coaching|Assess/i);
  });
});

describe("TutorRequest / TutorResponse contracts", () => {
  it("accepts a valid TutorRequest without a Course", () => {
    const request: TutorRequest = {
      learnerId: "learner-1",
      mode: "TEACH_ME",
      message: "What is photosynthesis?",
      learningSpaceId: "space-hobby",
      subjectDomain: "biology",
      modality: "text",
      evidenceIntent: "none",
    };
    expect(request.learnerId).toBeTruthy();
    expect(request).not.toHaveProperty("courseId");
  });

  it("supports optional concept and activity linkage", () => {
    const request: TutorRequest = {
      learnerId: "learner-1",
      mode: "PRACTICE",
      message: "Check my answer",
      conceptIds: ["c1"],
      learningObjectId: "lo-1",
      activityId: "act-1",
      signal: "practice",
      evidenceIntent: "practice_answer",
      learnerDemonstration: "Chloroplasts convert light to chemical energy.",
    };
    expect(request.conceptIds).toEqual(["c1"]);
    expect(request.evidenceIntent).toBe("practice_answer");
  });

  it("keeps TutorResponse learner-facing fields clean", () => {
    const response: TutorResponse = {
      text: "Photosynthesis converts light energy into chemical energy.",
      mode: "BEGINNER",
      conceptTitles: ["Photosynthesis"],
      suggestedAction: { label: "Try a practice prompt", kind: "practice" },
      meta: {
        usedLearnerModel: true,
        usedKnowledgeModel: true,
        conceptIds: ["internal-concept-id"],
        evidenceRecorded: false,
      },
    };
    expect(response.conceptTitles[0]).toBe("Photosynthesis");
    expect(JSON.stringify(response.text)).not.toMatch(/internal-concept-id/);
  });
});

describe("Tutor facade adapters (unused by UI in 2D-1)", () => {
  it("maps legacy chat to TutorRequest with evidenceIntent none", () => {
    const req = toTutorRequestFromLegacyChat({
      learnerId: "u1",
      message: "help",
      surface: "core_assist",
    });
    expect(req.mode).toBe("TEACH_ME");
    expect(req.evidenceIntent).toBe("none");
  });

  it("maps demonstration payloads to PRACTICE + practice_answer + server auth", () => {
    const req = toTutorRequestFromDemonstration({
      learnerId: "u1",
      message: "Evaluate my explanation",
      learnerDemonstration: "Inheritance lets a class reuse another class.",
      conceptIds: ["c-inherit"],
    });
    expect(req.mode).toBe("PRACTICE");
    expect(req.evidenceIntent).toBe("practice_answer");
    expect(req.evidenceAuthorizedByServer).toBe(true);
  });
});
