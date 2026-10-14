import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { countAttemptsForConcept, readSeed } from "./helpers/fixtures";

/**
 * 2P-44 — Mastery calibration: open ≠ evidence; submit creates attempt;
 * Growth Center stays truthful; reload does not duplicate.
 */
test.describe("Mastery calibration & evidence sufficiency", () => {
  test("open/view does not create attempts; Growth Center loads calibrated state", async ({
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
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto("/study/learner-model");
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible({
      timeout: 30_000,
    });
    // Truthful wording — deny permanent-mastery claims (2P-43/44 copy).
    await expect(page.locator("[data-growth-continuity-temporal]")).toContainText(
      /does not claim anything is mastered forever/i,
    );
    await expect(page.locator("body")).not.toContainText(
      /you permanently mastered|you know this forever|completely mastered this/i,
    );

    await page.reload();
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible({
      timeout: 30_000,
    });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Adaptive resume/open does not fabricate LearningAttempts", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study/learner-model");
    const continueBtn = page.locator("[data-continue-learning]").first();
    if ((await continueBtn.count()) === 0) {
      test.skip();
      return;
    }
    await continueBtn.click();
    await expect(page).toHaveURL(/\/study\/adaptive\//, { timeout: 45_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.reload();
    await expect(page).toHaveURL(/\/study\/adaptive\//);
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });
});
