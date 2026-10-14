/**
 * Adaptive teaching wiring — preferences, mode≠difficulty, Tutor focus, coding launch.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildContentDifficultyPromptBias,
  buildLearnPreferencePromptBias,
  parseLearnPreferenceKeys,
  serializeLearnPreferences,
  topicSuggestsCodingActivity,
} from "@/lib/learning/learner-preferences";
import { buildSixLessonSystemPrompt } from "@/lib/csl/six-worked-lesson";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Adaptive teaching wiring", () => {
  it("stores how-I-learn-best preferences without collapsing to difficulty", () => {
    const json = serializeLearnPreferences(["examples", "hands_on", "visuals"]);
    expect(parseLearnPreferenceKeys(json)).toEqual(
      expect.arrayContaining(["examples", "hands_on", "visuals"]),
    );
    expect(parseLearnPreferenceKeys(json)).not.toContain("not_sure");

    const bias = buildLearnPreferencePromptBias(["examples", "hands_on"]);
    expect(bias).toMatch(/worked\/real-world examples|examples/i);
    expect(bias).toMatch(/DO something|guided\/apply/i);
    expect(bias).toMatch(/SIX techniques as machinery/);

    const visual = buildLearnPreferencePromptBias(["visuals"]);
    expect(visual).toMatch(/representation|diagram/i);

    const unsure = buildLearnPreferencePromptBias(["not_sure"]);
    expect(unsure).toMatch(/not sure|balanced/i);
  });

  it("keeps material difficulty prompt bias separate from teaching mode", () => {
    const diff = buildContentDifficultyPromptBias(1);
    expect(diff).toMatch(/MATERIAL DIFFICULTY/);
    expect(diff).toMatch(/Beginner/);
    const advanced = buildContentDifficultyPromptBias(4);
    expect(advanced).toMatch(/Advanced/);

    const system = buildSixLessonSystemPrompt("detailed-explanation", {
      teachingStylePolicy: "Teaching style: SIMPLIFIED (Teach Me Like I'm 5).",
      preferenceBias: buildLearnPreferencePromptBias(["examples", "visuals"]),
      difficultyBias: buildContentDifficultyPromptBias(4),
    });
    expect(system).toMatch(/TEACHING MODE|EXPLANATION STYLE/);
    expect(system).toMatch(/MATERIAL DIFFICULTY/);
    expect(system).toMatch(/Do NOT conflate/);
    expect(system).toMatch(/like I'm 5/i);
    expect(system).toMatch(/LEARNER PREFERENCES/);
  });

  it("six-lesson route loads profile preferences and contentDifficulty", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("getOrCreateLearnerProfile");
    expect(route).toContain("buildLearnPreferencePromptBias");
    expect(route).toContain("buildContentDifficultyPromptBias");
    expect(route).toContain("preferenceBias");
    expect(route).toContain("difficultyBias");
    expect(route).toContain("contentDifficulty");
    expect(route).toContain("learnPreferences");
  });

  it("Tutor receives current lesson step context", () => {
    const chat = read("src/components/study/SixTutorChat.tsx");
    const adapter = read("src/lib/learning/tutor/six-adapter.ts");
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const tutorRoute = read("app/api/study/six-tutor/route.ts");
    expect(chat).toContain("focusStepContext");
    expect(adapter).toContain("CURRENT LESSON STEP");
    expect(adapter).toContain("focusStepContext");
    expect(teach).toContain("focusStepContext={focusStepContext}");
    expect(teach).toContain("buildFocusStepContext");
    expect(tutorRoute).toContain("focusStepContext");
  });

  it("Learn wires preferences UI, coding practice, and keeps Difficulty off front door", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const prefsUi = read("src/components/study/LearnPreferencesControls.tsx");
    expect(teach).toContain("LearnPreferencesControls");
    expect(teach).toContain("data-learn-coding-hint");
    expect(teach).toContain("resolveStudyRoomHref");
    expect(teach).toContain("topicSuggestsCodingActivity");
    expect(prefsUi).toContain("How do you learn best?");
    expect(prefsUi).toContain("Material difficulty");
    expect(prefsUi).toContain("data-learn-change-how");
    expect(center).not.toContain("LearnPreferencesControls");
    expect(center).not.toContain("TeachingStyleSelector");
    expect(center).not.toContain("Material difficulty");
    expect(topicSuggestsCodingActivity("Classes & Objects", "Java")).toBe(true);
    expect(topicSuggestsCodingActivity("Photosynthesis", "Biology")).toBe(false);
  });

  it("Start Studying remains welcome-only", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const howIdx = center.indexOf('data-study-haul-journey="how"');
    const howSlice = center.slice(howIdx, howIdx + 800);
    expect(howSlice).not.toContain("sessionBuilder");
    expect(howSlice).not.toContain("start-studying");
    expect(center).toContain('data-study-haul-journey="welcome"');
    expect(center).toContain("data-study-start-session");
  });

  it("learner-preferences API exists", () => {
    const api = read("app/api/study/learner-preferences/route.ts");
    expect(api).toContain("modalityPreferencesJson");
    expect(api).toContain("serializeLearnPreferences");
    expect(api).toContain("export async function GET");
    expect(api).toContain("export async function PATCH");
  });
});
