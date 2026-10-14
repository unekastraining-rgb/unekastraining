import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { countAttemptsForConcept, readSeed } from "./helpers/fixtures";

/**
 * 2P-33 — Universal Learning Experience unification journeys.
 * Launch/navigation ≠ evidence. Soft asserts where surfaces are data-dependent.
 */
test.describe("Universal learning experience unification", () => {
  test("Hub presents Study Hub home + Start/Continue language path", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /Study Hub/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Start or Continue learning/i).first()).toBeVisible();

    // Viewing Hub must not create evidence.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Growth Center Start/Continue aligns with Hub action language", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study/learner-model");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByText(/What I know|What I'm developing|What needs practice/i).first(),
    ).toBeVisible({ timeout: 30_000 });

    const cta = page.getByRole("button", {
      name: /Start learning|Continue learning/i,
    });
    if ((await cta.count()) > 0) {
      await expect(cta.first()).toBeVisible();
    }
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Material prepare → Start/Continue learning (no evidence on prepare)", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(`/courses/${seed.courseId}/materials/${seed.materialId}`);
    await expect(page).not.toHaveURL(/\/login/);

    const prepare = page.getByRole("button", { name: /Prepare for learning/i });
    if ((await prepare.count()) > 0) {
      await prepare.first().click();
      await expect(
        page.locator("[data-material-learning-ready], [data-material-learning-error]").first(),
      ).toBeVisible({ timeout: 45_000 });
      const start = page.getByRole("button", {
        name: /Start learning|Continue learning/i,
      });
      // Soft: only when focus concept ready
      if ((await start.count()) > 0) {
        await expect(start.first()).toBeVisible();
      }
    }

    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("SIX Adaptive-bound shows Continue learning return affordance", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    // Create Adaptive run then open SIX with bind params (soft if start fails).
    const start = await page.request.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    if (start.ok()) {
      const body = (await start.json()) as { runId?: string };
      if (body.runId) {
        await page.goto(
          `/study/six/chunking?adaptiveRunId=${encodeURIComponent(body.runId)}&adaptiveStep=0`,
        );
        await expect(page).not.toHaveURL(/\/login/);
        await expect(
          page.locator("[data-six-adaptive-return]").or(
            page.getByRole("link", { name: /Continue learning/i }),
          ).first(),
        ).toBeVisible({ timeout: 30_000 });
      }
    }

    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Tutor Teach Me open does not create evidence", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(`/study/teach-me?conceptId=${seed.conceptId}`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });
});
