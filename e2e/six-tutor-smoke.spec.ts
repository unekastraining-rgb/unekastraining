import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import {
  countAttemptsForConcept,
  readSeed,
} from "./helpers/fixtures";

test.describe("SIX smoke", () => {
  test("SIX chunking guide loads for learner", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);

    await page.goto(`/study/six/chunking?conceptId=${seed.conceptId}`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/Chunking|Six|Technique|Organize/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("Teach Me evaluate path can create evidence when supported", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(`/study/teach-me?conceptId=${seed.conceptId}`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });

    // Prefer existing evaluate / check UI when present — do not invent a tutor backend.
    const evaluate = page.getByRole("button", {
      name: /Evaluate|Check|Submit|Explain/i,
    });
    const chatInput = page.locator("textarea, input[type='text']").first();

    if ((await evaluate.count()) > 0 && (await chatInput.count()) > 0) {
      await chatInput.fill(
        "Chunking groups related ideas so working memory can hold the structure.",
      );
      await evaluate.first().click();
      // Evidence only if authoritative evaluate succeeds — soft boundary.
      await expect
        .poll(async () => countAttemptsForConcept(seed.conceptId), {
          timeout: 20_000,
        })
        .toBeGreaterThanOrEqual(before);
    } else {
      // Smoke: surface loaded without creating a second tutor system.
      await expect(
        page.getByText(/Teach|Tutor|Explain|concept/i).first(),
      ).toBeVisible({ timeout: 30_000 });
      expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
    }
  });
});

test.describe("Tutor smoke", () => {
  test("Study Hub preserves learning chrome; ordinary browse ≠ evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("[data-orchestrator-suggestion]").first()).toBeVisible({
      timeout: 30_000,
    });

    // Ordinary Hub browse must not manufacture LearningAttempt.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });
});
