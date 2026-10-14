import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";

test.describe("Responsive smoke", () => {
  test("Study Hub primary chrome remains usable", async ({ page }) => {
    await loginAsPage(page);
    await page.goto("/study");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBe(false);

    const orch = page.locator("[data-orchestrator-suggestion]").first();
    await expect(orch).toBeVisible({ timeout: 30_000 });
    const box = await orch.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeGreaterThan(20);
      expect(box.width).toBeGreaterThan(40);
    }
  });

  test("Growth Center CTAs are touch-sized", async ({ page }) => {
    await loginAsPage(page);
    await page.goto("/study/learner-model");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.locator("[data-growth-center-surface], [data-growth-center-error]").first(),
    ).toBeVisible({ timeout: 30_000 });
    const links = page.locator("a, button").filter({
      hasText: /Study Hub|Continue|Start/i,
    });
    const count = await links.count();
    if (count > 0) {
      const box = await links.first().boundingBox();
      if (box) expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });
});
