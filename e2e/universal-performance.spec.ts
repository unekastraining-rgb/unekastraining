import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { countAttemptsForConcept, readSeed } from "./helpers/fixtures";

/**
 * 2P-45 — Authentic coding PERFORM flow:
 * open != evidence; submit -> PERFORM LearningAttempt; idempotent replay safe.
 */
test.describe("Universal performance (PERFORM) evidence", () => {
  test("coding open creates no attempt; successful submit records PERFORM", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/coding?conceptId=${seed.conceptId}&challengeId=js-sum-two`,
    );
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    const idempotencyKey = `e2e-perform-${seed.conceptId}-${Date.now()}`;
    const payload = {
      challengeId: "js-sum-two",
      conceptId: seed.conceptId,
      code: "function add(a, b) {\n  return a + b;\n}\n",
      skillFacet: "RECOGNIZE",
      outcome: "FAIL",
      score: 0,
      learnerId: "forged",
    };

    const res = await api.post("/api/study/activities/coding", {
      headers: { "X-Idempotency-Key": idempotencyKey },
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as {
      success?: boolean;
      data?: { completion?: { learningAttemptId?: string; outcome?: string } };
    };
    expect(json.success).toBe(true);
    expect(json.data?.completion?.learningAttemptId).toBeTruthy();

    const after = await countAttemptsForConcept(seed.conceptId);
    expect(after).toBe(before + 1);

    const db = createE2ePrisma();
    try {
      const attempt = await db.learningAttempt.findFirst({
        where: {
          conceptId: seed.conceptId,
          id: json.data!.completion!.learningAttemptId!,
        },
        select: { skillFacet: true, outcome: true, userId: true },
      });
      expect(attempt?.skillFacet).toBe("PERFORM");
      expect(attempt?.outcome).toBe("SUCCESS");
      expect(attempt?.userId).toBe(seed.userAId);

      const mastery = await db.conceptMastery.findUnique({
        where: {
          userId_conceptId: {
            userId: seed.userAId,
            conceptId: seed.conceptId,
          },
        },
        select: { perform: true, reviewCount: true },
      });
      expect(mastery).toBeTruthy();
      expect((mastery?.reviewCount ?? 0) > 0).toBe(true);
      expect((mastery?.perform ?? 0) > 0).toBe(true);
    } finally {
      await db.$disconnect();
    }

    const replay = await api.post("/api/study/activities/coding", {
      headers: { "X-Idempotency-Key": idempotencyKey },
      data: payload,
    });
    expect(replay.ok()).toBeTruthy();
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(after);

    await page.reload();
    await expect(page.locator("body")).toBeVisible();
  });

  test("Growth Center reflects performance without permanent-mastery claims", async ({
    page,
  }) => {
    await loginAsPage(page);
    await page.goto("/study/learner-model");
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("body")).not.toContainText(
      /you permanently mastered|you know this forever/i,
    );
  });
});
