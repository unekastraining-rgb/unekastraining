import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { countAttemptsForConcept, readSeed } from "./helpers/fixtures";

test.describe("Growth Center → Adaptive continuity", () => {
  test("Growth Center is read-only and Start/Continue enters Adaptive", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);

    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study/learner-model");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /learning at a glance|Growth/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible();

    // Viewing Growth Center must not create evidence.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    // Orchestrator section present (recommendation authority — not a second engine).
    await expect(page.locator("[data-growth-center-orchestrator]")).toBeVisible();
    await expect(page.getByText(/Recommendations come from Study Haul/i)).toBeVisible();

    const continueBtn = page.locator("[data-continue-learning]").first();
    if ((await continueBtn.count()) > 0) {
      await expect(continueBtn).toContainText(/Start learning|Continue learning/i);
      await continueBtn.click();
      await expect(page).toHaveURL(/\/study\/adaptive\//, { timeout: 45_000 });
      await expect(page.locator("[data-adaptive-run]")).toBeVisible();
    } else {
      // Cold start — empty state CTAs to Study Hub / Core (no fabricated mastery).
      await expect(
        page.locator("[data-growth-center-empty], [data-learner-model-empty]"),
      ).toBeVisible();
      await page.getByRole("link", { name: /Study Hub/i }).first().click();
      await expect(page).toHaveURL(/\/study/);
    }

    // Still no evidence from Growth Center navigation alone.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });
});
