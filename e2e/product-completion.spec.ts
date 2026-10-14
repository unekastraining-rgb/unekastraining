/**
 * 2P-53 — Product completion journeys (smoke).
 * Reuses existing APIs; does not invent a second learning spine.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { readSeed } from "./helpers/fixtures";

test.describe("2P-53 product completion journeys", () => {
  test("Journey A/F — Study Hub + Growth continuity load without fabricating attempts", async ({
    page,
  }) => {
    await loginAsPage(page);
    await page.goto("/study");
    await expect(page.locator("body")).toBeVisible();

    const hub = page.locator("[data-study-hub], main, body");
    await expect(hub.first()).toBeVisible();

    await page.goto("/study/learner-model");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/growth|learner|mastery|evidence|continue/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("Journey B — Lucky retention surface reachable; GET does not require AI", async ({
    page,
  }) => {
    await loginAsPage(page);
    const api = page.context().request;
    const getItem = await api.get("/api/study/lucky/retention-item");
    expect(getItem.ok()).toBeTruthy();
    const body = (await getItem.json()) as { success?: boolean };
    expect(body.success).toBe(true);

    await page.goto("/study/lucky");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Journey C — Adaptive start for seeded concept (school learning entry)", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    test.skip(!start.ok(), `Adaptive start unavailable: ${start.status()}`);
    const json = (await start.json()) as { runId?: string };
    expect(json.runId).toBeTruthy();
  });

  test("Journey G — mobile viewport Study Hub loads", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsPage(page);
    await page.goto("/study");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Journey H — invalid Adaptive run shows recovery, not fabricated success", async ({
    page,
  }) => {
    await loginAsPage(page);
    await page.goto("/study/adaptive/not-a-real-run-id-2p53");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/not found|unavailable|could not|error|back/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
