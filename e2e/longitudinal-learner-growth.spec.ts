import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { countAttemptsForConcept, readSeed } from "./helpers/fixtures";

/**
 * 2P-43 — Longitudinal continuity: leave / return / resume without fake evidence.
 * Hub + Growth Center share the same continuity resolve path.
 */
test.describe("Longitudinal learner growth & action continuity", () => {
  test("Hub and Growth Center expose continuity; open/view does not create attempts", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);

    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.locator("[data-learner-growth-continuity-strip]"),
    ).toBeVisible({ timeout: 30_000 });

    // Viewing Hub continuity must not create LearningAttempts.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto("/study/learner-model");
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.locator("[data-growth-continuity-temporal]"),
    ).toBeVisible();

    // Reload recovers the same surfaces (deterministic continuity read model).
    await page.reload();
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.locator("[data-growth-continuity-temporal]"),
    ).toBeVisible();

    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    // Resume / Start CTA must not invent evidence on click alone if Adaptive opens.
    const continueBtn = page.locator("[data-continue-learning]").first();
    if ((await continueBtn.count()) > 0) {
      await continueBtn.click();
      await expect(page).toHaveURL(/\/study\/adaptive\//, { timeout: 45_000 });
      // Opening Adaptive run is not submit — attempt count unchanged until evidence write.
      expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
    }
  });

  test("Study Hub continuity strip links to Growth Center", async ({ page }) => {
    await loginAsPage(page);
    await page.goto("/study");
    const strip = page.locator("[data-learner-growth-continuity-strip]");
    await expect(strip).toBeVisible({ timeout: 30_000 });
    const growthLink = strip.locator('[data-continuity-cta="growth-center"]').first();
    await expect(growthLink).toHaveAttribute("href", "/study/learner-model");
    await Promise.all([
      page.waitForURL(/\/study\/learner-model/, { timeout: 30_000 }),
      growthLink.click(),
    ]);
    await expect(page.locator("[data-growth-continuity-temporal]")).toBeVisible({
      timeout: 30_000,
    });
  });
});
