/**
 * 2P-41 — Language workspace: open ≠ attempt; typed submit creates evidence.
 * Uses typed fallback (deterministic) — does not claim physical mic coverage.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";

test.describe("2P-41 Language workspace", () => {
  test("open creates no LearningAttempt; empty is not SUCCESS; typed submit creates attempt", async ({
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
        `/study/activities/language?conceptId=${seed.conceptId}`,
      );
      expect(open?.ok()).toBeTruthy();
      await expect(page.locator("[data-language-workspace]")).toBeVisible({
        timeout: 20_000,
      });

      const afterOpen = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(afterOpen).toBe(before);

      const empty = await api.post("/api/study/activities/language", {
        data: {
          challengeId: "lang-speak-train-station",
          conceptId: seed.conceptId,
          recordingState: "READY",
          outcome: "SUCCESS",
          score: 1,
        },
      });
      expect(empty.ok()).toBeTruthy();
      const emptyJson = (await empty.json()) as {
        data?: {
          completion?: { outcome?: string };
          rejectedForgeryKeys?: string[];
          evaluation?: { details?: { pronunciationQualityScore?: unknown } };
        };
      };
      expect(emptyJson.data?.completion?.outcome).not.toBe("SUCCESS");
      expect(emptyJson.data?.rejectedForgeryKeys?.length ?? 0).toBeGreaterThan(
        0,
      );
      expect(
        emptyJson.data?.evaluation?.details?.pronunciationQualityScore ?? null,
      ).toBeNull();

      const valid = await api.post("/api/study/activities/language", {
        data: {
          challengeId: "lang-speak-train-station",
          conceptId: seed.conceptId,
          typedResponse: "I need help finding the train station.",
        },
      });
      expect(valid.ok()).toBeTruthy();
      const validJson = (await valid.json()) as {
        data?: {
          completion?: { outcome?: string; learningAttemptId?: string };
          evaluation?: { details?: { pronunciationQualityScore?: unknown } };
        };
      };
      expect(validJson.data?.completion?.outcome).toBe("SUCCESS");
      expect(validJson.data?.completion?.learningAttemptId).toBeTruthy();
      expect(
        validJson.data?.evaluation?.details?.pronunciationQualityScore ?? null,
      ).toBeNull();

      const afterSubmit = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(afterSubmit).toBeGreaterThan(before);
    } finally {
      await db.$disconnect();
    }
  });
});
