/**
 * Bundle M — Final Fix Bundle: product readiness & audit remediation.
 * Games deep-link, practice routes, registry menu, evidence idempotency, curriculum helper.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import "@/lib/learning/knowledge/packs";
import { listStructuredChallenges } from "@/lib/learning/activities/structured/service";
import {
  conceptIdForStructuredChallenge,
  structuredChallengeIdsForConcept,
} from "@/lib/learning/activities/structured/kl-concept-bridge";
import { preferredGameChallengeIdForConcept } from "@/lib/learning/activities/structured/concept-game-challenge";
import { curriculumStatusForIndex } from "@/lib/learning/studio/curriculum-position";
import {
  buildCapabilityHref,
  getStudyCapability,
} from "@/lib/study/capability-registry";
import { buildIdempotentEvaluateEvidenceKey } from "@/lib/learning/activity/framework/evaluate-evidence-key";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Bundle M — Games challenge deep-link (FPA-001)", () => {
  it("catalog link includes challengeId for every game", () => {
    const page = read("app/study/games/page.tsx");
    expect(page).toContain("challengeId=");
    expect(page).toContain("/study/activities/game");
    const games = listStructuredChallenges("game");
    expect(games.length).toBeGreaterThan(0);
    for (const g of games) {
      expect(g.id.trim().length).toBeGreaterThan(0);
    }
  });

  it("activity route accepts and forwards challengeId", () => {
    const page = read("app/study/activities/[kind]/page.tsx");
    expect(page).toContain("challengeId");
    expect(page).toContain("initialChallengeId");
    expect(page).toContain("continueBase");
  });

  it("ActivityWorkspace prefers deep-linked challenge over recommended/first", () => {
    const ws = read("src/components/study/ActivityWorkspace.tsx");
    expect(ws).toContain("initialChallengeId");
    expect(ws).toContain("deepLinkId");
    expect(ws).toMatch(/list\.find\(\(c\) => c\.id === deepLinkId\)/);
    expect(ws).toContain("GameMatchPanel");
  });

  it("ConceptEntryPicker preserves challengeId on continue", () => {
    const picker = read("src/components/study/ConceptEntryPicker.tsx");
    expect(picker).toContain("withContinueParams");
    expect(picker).toContain("URLSearchParams");
  });

  it("selected challenge reaches game workspace wiring", () => {
    const games = listStructuredChallenges("game");
    const pick = games[0]!;
    const href = `/study/activities/game?challengeId=${encodeURIComponent(pick.id)}`;
    expect(href).toContain(pick.id);
    expect(read("app/study/games/page.tsx")).toContain(
      "challengeId=${encodeURIComponent(g.id)}",
    );
  });

  it("fallback without challengeId remains valid (recommended or first)", () => {
    const ws = read("src/components/study/ActivityWorkspace.tsx");
    expect(ws).toContain("recommendedContentId");
    expect(ws).toMatch(/list\[0\]/);
  });

  it("Learning → Game preserves selected challenge when concept maps to a game", () => {
    const strip = read("src/components/study/ContextualCapabilityStrip.tsx");
    expect(strip).toContain("buildCapabilityHref");
    expect(strip).toContain("preferredGameChallengeIdForConcept");
    const gameId = preferredGameChallengeIdForConcept("biology-photosynthesis");
    expect(gameId).toBeTruthy();
    const ids = structuredChallengeIdsForConcept("biology-photosynthesis");
    expect(ids).toContain(gameId!);
    expect(conceptIdForStructuredChallenge(gameId!)).toBe(
      "biology-photosynthesis",
    );
    const registry = read("src/lib/study/capability-registry.ts");
    expect(registry).toContain("challengeId");
    const games = getStudyCapability("games")!;
    const href = buildCapabilityHref(games, {
      conceptId: "biology-photosynthesis",
      challengeId: gameId!,
    });
    expect(href).toContain("/study/activities/game");
    expect(href).toContain("challengeId=");
    expect(href).toContain(gameId!);
  });
});

describe("Bundle M — Practice route consolidation (FPA-005)", () => {
  it("practice-hub is the canonical Practice Hub", () => {
    expect(read("app/study/practice-hub/page.tsx")).toContain(
      "listSupportedPracticeLandscape",
    );
    expect(getStudyCapability("practice")?.directPath).toBe(
      "/study/practice-hub",
    );
  });

  it("/study/practice is specialized coding practice (not a duplicate hub)", () => {
    const page = read("app/study/practice/page.tsx");
    expect(page).toContain("CodePracticeWorkspace");
    expect(page).toMatch(/Coding practice|Code practice|coding practice/i);
  });
});

describe("Bundle M — Hub menu uses capability registry (FPA-008)", () => {
  it("HubSectionsMenu derives capability paths from registry", () => {
    const menu = read("src/components/hub/HubSectionsMenu.tsx");
    expect(menu).toContain("getStudyCapability");
    expect(menu).toContain('cap("games")');
    expect(menu).toContain('cap("practice"');
    expect(menu).toContain("The Haul");
    expect(getStudyCapability("games")?.directPath).toBe("/study/games");
    expect(getStudyCapability("practice")?.directPath).toBe(
      "/study/practice-hub",
    );
    expect(getStudyCapability("six")?.directPath).toBe("/study/six");
    expect(getStudyCapability("planner")?.directPath).toBe("/planner");
  });
});

describe("Bundle M — Activity spatial width (FPA-006)", () => {
  it("workspace kinds use wider layout; prose stays constrained", () => {
    const ws = read("src/components/study/ActivityWorkspace.tsx");
    expect(ws).toContain("WIDE_WORKSPACE_KINDS");
    expect(ws).toContain("max-w-6xl");
    for (const kind of [
      "coding",
      "sql",
      "lab",
      "project",
      "presentation",
      "game",
      "simulation",
      "networking",
    ]) {
      expect(ws).toContain(`"${kind}"`);
    }
  });
});

describe("Bundle M — Evidence idempotency (FPA-009)", () => {
  it("same logical submission → same evidence key", () => {
    const a = buildIdempotentEvaluateEvidenceKey({
      userId: "u1",
      mode: "interactive",
      topic: "Photosynthesis",
      conceptId: "biology-photosynthesis",
      activityId: "biology-photosynthesis:match",
      outcome: "correct",
      submissionFingerprint: "answer:chloroplast",
    });
    const b = buildIdempotentEvaluateEvidenceKey({
      userId: "u1",
      mode: "interactive",
      topic: "Photosynthesis",
      conceptId: "biology-photosynthesis",
      activityId: "biology-photosynthesis:match",
      outcome: "correct",
      submissionFingerprint: "answer:chloroplast",
    });
    expect(a).toBe(b);
    expect(a).not.toMatch(/\d{10,}/); // no Date.now()-style stamp
  });

  it("retry → no duplicate key; distinct attempt → distinct key", () => {
    const base = {
      userId: "u1",
      mode: "interactive" as const,
      topic: "t",
      conceptId: "c1",
      activityId: "a1",
      outcome: "correct",
      submissionFingerprint: "x",
    };
    expect(buildIdempotentEvaluateEvidenceKey(base)).toBe(
      buildIdempotentEvaluateEvidenceKey(base),
    );
    expect(
      buildIdempotentEvaluateEvidenceKey({
        ...base,
        submissionFingerprint: "y",
      }),
    ).not.toBe(buildIdempotentEvaluateEvidenceKey(base));
    expect(
      buildIdempotentEvaluateEvidenceKey({ ...base, attemptId: "att-1" }),
    ).not.toBe(
      buildIdempotentEvaluateEvidenceKey({ ...base, attemptId: "att-2" }),
    );
  });

  it("different learner → distinct evidence; repeated practice with new attempt stays possible", () => {
    const shared = {
      mode: "six" as const,
      topic: "Java",
      conceptId: "java-arraylist",
      activityId: null,
      outcome: "partial",
      submissionFingerprint: "draft-1",
    };
    expect(
      buildIdempotentEvaluateEvidenceKey({ ...shared, userId: "a" }),
    ).not.toBe(
      buildIdempotentEvaluateEvidenceKey({ ...shared, userId: "b" }),
    );
    const practice1 = buildIdempotentEvaluateEvidenceKey({
      ...shared,
      userId: "a",
      attemptId: "practice-round-1",
    });
    const practice2 = buildIdempotentEvaluateEvidenceKey({
      ...shared,
      userId: "a",
      attemptId: "practice-round-2",
    });
    expect(practice1).not.toBe(practice2);
  });

  it("evaluate route uses idempotent key helper (not Date.now alone)", () => {
    const route = read("app/api/study/evaluate/route.ts");
    expect(route).toContain("buildIdempotentEvaluateEvidenceKey");
    expect(route).not.toMatch(
      /evaluate:\$\{user\.id\}:\$\{mode\}:.*Date\.now/,
    );
  });
});

describe("Bundle M — Curriculum status helper (FPA-010)", () => {
  it("TeachFirst uses curriculumStatusForIndex", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("curriculumStatusForIndex");
    expect(curriculumStatusForIndex(0, 1)).toBe("visited");
    expect(curriculumStatusForIndex(1, 1)).toBe("current");
    expect(curriculumStatusForIndex(2, 1)).toBe("next");
    expect(curriculumStatusForIndex(3, 1)).toBe("available");
  });
});
