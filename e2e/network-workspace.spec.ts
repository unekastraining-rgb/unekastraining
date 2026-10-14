/**
 * 2P-40 — Network workspace: open ≠ attempt; submit creates evidence.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";
import { getNetworkChallenge } from "../src/lib/learning/activities/networking/challenges";
import { applyInterfacePatch } from "../src/lib/learning/activities/networking/state";

test.describe("2P-40 Network workspace", () => {
  test("open creates no LearningAttempt; invalid is not SUCCESS; valid submit creates attempt", async ({
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
        `/study/activities/networking?conceptId=${seed.conceptId}`,
      );
      expect(open?.ok()).toBeTruthy();
      await expect(page.locator("[data-network-workspace]")).toBeVisible({
        timeout: 20_000,
      });

      const afterOpen = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: seed.conceptId },
      });
      expect(afterOpen).toBe(before);

      const challenge = getNetworkChallenge("net-disabled-iface")!;
      const invalid = await api.post("/api/study/activities/networking", {
        data: {
          challengeId: "net-disabled-iface",
          conceptId: seed.conceptId,
          state: challenge.initialState,
          diagnosis: "maybe dns",
          outcome: "SUCCESS",
          score: 1,
        },
      });
      expect(invalid.ok()).toBeTruthy();
      const invalidJson = (await invalid.json()) as {
        data?: {
          completion?: { outcome?: string };
          rejectedForgeryKeys?: string[];
        };
      };
      expect(invalidJson.data?.completion?.outcome).not.toBe("SUCCESS");
      expect(invalidJson.data?.rejectedForgeryKeys?.length ?? 0).toBeGreaterThan(
        0,
      );

      const fixed = applyInterfacePatch(challenge.initialState, {
        interfaceId: "pc-a-eth0",
        enabled: true,
      });
      const valid = await api.post("/api/study/activities/networking", {
        data: {
          challengeId: "net-disabled-iface",
          conceptId: seed.conceptId,
          state: fixed,
          diagnosis: "PC eth0 interface was disabled so the link was down.",
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
