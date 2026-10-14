import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { countAttemptsForConcept, readSeed } from "./helpers/fixtures";

/**
 * 2P-32 — Representative deep-content journeys.
 * Launch ≠ evidence; uses existing activity pages + Adaptive-ready kinds.
 */
test.describe("Universal content depth journeys", () => {
  test("CS coding activity loads (practice→challenge path available)", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/coding?conceptId=${seed.conceptId}&contentId=java-inheritance-vehicle`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/inheritance|Vehicle|Car|Goal|Why this activity|Coding/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("SQL join variant loads without fabricating evidence", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/sql?conceptId=${seed.conceptId}&contentId=sql-join-customers-orders`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/SQL|JOIN|customer|order|challenge|query/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Nursing sepsis challenge simulation loads", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/simulation?conceptId=${seed.conceptId}&contentId=sim-nursing-sepsis-challenge`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/Simulation|sepsis|priority|Goal|Why this activity|nursing/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Business price-ceiling simulation loads", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/simulation?conceptId=${seed.conceptId}&contentId=sim-price-ceiling-challenge`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/Simulation|ceiling|shortage|supply|demand|Goal|Why this activity/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Writing evidence-transfer challenge loads", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/writing?conceptId=${seed.conceptId}&contentId=write-evidence-transfer-challenge`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/Writing|claim|evidence|bike|Goal|Why this activity|draft/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Game security-terms challenge loads", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/game?conceptId=${seed.conceptId}&contentId=game-security-terms-challenge`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/Game|authentication|authorization|phishing|Goal|Why this activity/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Project API feature challenge loads", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/project?conceptId=${seed.conceptId}&contentId=project-api-feature-challenge`,
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/Project|API|acceptance|milestone|Goal|Why this activity/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });
});
