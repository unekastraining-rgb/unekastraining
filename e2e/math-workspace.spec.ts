/**
 * 2P-39 — Math workspace: open ≠ attempt; submit creates SOLVE evidence.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";

test.describe("2P-39 Math workspace", () => {
  test("GET/open creates no LearningAttempt; valid submit does; invalid is not SUCCESS", async ({
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

      const open = await page.goto(
        `/study/activities/math?conceptId=${seed.conceptId}`,
      );
      expect(open?.ok()).toBeTruthy();
      await expect(page.locator("[data-math-workspace]")).toBeVisible({
        timeout: 20_000,
      });

      const afterOpen = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(afterOpen).toBe(before);

      const invalid = await api.post("/api/study/activities/math", {
        data: {
          challengeId: "math-linear-basic",
          conceptId: seed.conceptId,
          steps: ["2x + 4 = 10", "2x = 14", "x = 7"],
          outcome: "SUCCESS",
          score: 1,
        },
      });
      expect(invalid.ok()).toBeTruthy();
      const invalidJson = (await invalid.json()) as {
        success?: boolean;
        data?: { completion?: { outcome?: string }; rejectedForgeryKeys?: string[] };
      };
      expect(invalidJson.success).toBe(true);
      expect(invalidJson.data?.completion?.outcome).not.toBe("SUCCESS");
      expect(invalidJson.data?.rejectedForgeryKeys?.length ?? 0).toBeGreaterThan(0);

      const valid = await api.post("/api/study/activities/math", {
        data: {
          challengeId: "math-linear-basic",
          conceptId: seed.conceptId,
          steps: ["2x + 4 = 10", "2x = 6", "x = 3"],
        },
      });
      expect(valid.ok()).toBeTruthy();
      const validJson = (await valid.json()) as {
        data?: { completion?: { outcome?: string; learningAttemptId?: string } };
      };
      expect(validJson.data?.completion?.outcome).toBe("SUCCESS");
      expect(validJson.data?.completion?.learningAttemptId).toBeTruthy();

      const afterSubmit = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(afterSubmit).toBeGreaterThan(before);
    } finally {
      await db.$disconnect();
    }
  });
});
