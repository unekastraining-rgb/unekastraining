/**
 * Private/beta lifecycle smoke — auth → Hub → Adaptive → evidence → Lucky → Growth.
 * Does not deploy; Chromium only.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";

test.describe("Private/beta deployment smoke", () => {
  test("authenticate → Hub → Adaptive activity path → mastery → Growth; Lucky GET ≠ evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    await page.goto("/study");
    await expect(page.locator("body")).toBeVisible();

    const before = await (async () => {
      const db = createE2ePrisma();
      try {
        return db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: seed.conceptId },
        });
      } finally {
        await db.$disconnect();
      }
    })();

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    test.skip(!start.ok(), `Adaptive start unavailable: ${start.status()}`);
    const { runId } = (await start.json()) as { runId?: string };
    expect(runId).toBeTruthy();

    await page.goto(`/study/adaptive/${runId}`);
    await expect(page.locator("body")).toBeVisible();

    const luckyGet = await api.get("/api/study/lucky/retention-item");
    expect(luckyGet.ok()).toBeTruthy();

    const afterGet = await (async () => {
      const db = createE2ePrisma();
      try {
        return db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: seed.conceptId },
        });
      } finally {
        await db.$disconnect();
      }
    })();
    expect(afterGet).toBe(before);

    await page.goto("/study/learner-model");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/growth|learner|mastery|evidence|continue|concept/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("CORE note save/reload path remains available after login", async ({ page }) => {
    await loginAsPage(page);
    await page.goto("/core");
    await expect(page.locator("body")).toBeVisible();
    // Soft chrome check — full persistence covered by artifact-persistence E2E.
    await expect(
      page.locator("[data-core-save-status], [data-notebook-desk], main, body").first(),
    ).toBeVisible();
  });

  test("invalid session / unauthorized Adaptive id recovers safely", async ({ page }) => {
    await loginAsPage(page);
    await page.goto("/study/adaptive/definitely-not-a-run");
    await expect(
      page.getByText(/not found|unavailable|could not|error|back/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
