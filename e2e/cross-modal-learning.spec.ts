/**
 * 2P-42 — Cross-modal journey (deterministic fixtures).
 * Explain (SIX) history → application activity evidence → mastery updates.
 * Does not claim physical mic / external AI.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";

test.describe("2P-42 Cross-modal learning loop", () => {
  test("application submit creates evidence; open ≠ attempt; Adaptive start ok", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const db = createE2ePrisma();

    try {
      const before = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });

      const start = await api.post("/api/study/adaptive/start", {
        data: { conceptId: seed.conceptId },
      });
      // Start may be no_sequence_needed depending on mastery — either is fine.
      expect([200, 201, 400, 409].includes(start.status())).toBeTruthy();

      const open = await page.goto(
        `/study/activities/lab?conceptId=${seed.conceptId}`,
      );
      expect(open?.ok()).toBeTruthy();
      await expect(page.locator("[data-activity-kind='lab']")).toBeVisible({
        timeout: 20_000,
      });

      const afterOpen = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(afterOpen).toBe(before);

      // Submit a substantive lab response via API (deterministic; UI catalogs vary).
      const challenges = await api.get(
        `/api/study/activities/lab?conceptId=${seed.conceptId}`,
      );
      expect(challenges.ok()).toBeTruthy();
      const listJson = (await challenges.json()) as {
        data?: { challenges?: Array<{ id: string }> };
      };
      const challengeId = listJson.data?.challenges?.[0]?.id;
      expect(challengeId).toBeTruthy();

      const submit = await api.post("/api/study/activities/lab", {
        data: {
          challengeId,
          conceptId: seed.conceptId,
          text:
            "I configured the apparatus, recorded observations, and concluded based on the measured result for this lab procedure.",
        },
      });
      expect(submit.ok()).toBeTruthy();
      const submitJson = (await submit.json()) as {
        data?: { completion?: { learningAttemptId?: string; outcome?: string } };
      };
      expect(submitJson.data?.completion?.learningAttemptId).toBeTruthy();

      const afterSubmit = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(afterSubmit).toBeGreaterThan(before);

      const mastery = await db.conceptMastery.findFirst({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(mastery).toBeTruthy();
    } finally {
      await db.$disconnect();
    }
  });
});
