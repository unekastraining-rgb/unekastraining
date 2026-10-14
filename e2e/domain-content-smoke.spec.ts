import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { countAttemptsForConcept, readSeed } from "./helpers/fixtures";

/**
 * 2P-26 — Representative cross-modality browser smokes on expansion content.
 * Builds on 2P-24 auth/isolation; does not seed LearningAttempt/ConceptMastery.
 */
test.describe("Domain content modality smokes", () => {
  test("SQL activity loads and launch ≠ evidence", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/sql?conceptId=${seed.conceptId}`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/SQL|SELECT|challenge|query/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-activity-state]")).toHaveAttribute(
      "data-activity-state",
      /READY|IN_PROGRESS|LOADING/,
    );
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Simulation activity loads with why context", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/simulation?conceptId=${seed.conceptId}`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/Simulation|Goal|Why this activity|Practice/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Writing activity loads without fabricating mastery", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/writing?conceptId=${seed.conceptId}`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/Writing|Goal|Why this activity|draft|exercise/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("2P-36 math lab loads; open ≠ evidence", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/lab?conceptId=${seed.conceptId}&challengeId=lab-math-solve-linear`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/Solve|equation|linear|Goal|Why this activity|Lab/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });
});
