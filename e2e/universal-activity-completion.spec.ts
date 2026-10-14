import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import {
  countAttemptsForConcept,
  createE2eAdaptiveRun,
  getAdaptiveRunStatus,
  getMasteryForConcept,
  readSeed,
} from "./helpers/fixtures";

async function dismissDevOverlay(page: import("@playwright/test").Page) {
  const portal = page.locator("nextjs-portal");
  if ((await portal.count()) > 0) {
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
  }
}

/**
 * 2P-30 — Universal Activity Completion (Game / Project Adaptive).
 * Extends prior suites; does not replace them.
 */
test.describe("Universal Activity Completion — Game / Project", () => {
  test("Journey A — Game Adaptive: launch ≠ evidence → evaluate → bind", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const run = await createE2eAdaptiveRun({
      userId: seed.userAId,
      conceptId: seed.conceptId,
      intervention: "game",
    });

    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(`/study/adaptive/${run.id}`);
    await dismissDevOverlay(page);
    await expect(page.locator("[data-adaptive-run]")).toBeVisible({
      timeout: 30_000,
    });

    const gameUrl = `/study/activities/game?conceptId=${seed.conceptId}&adaptiveRunId=${run.id}&adaptiveStep=0`;
    await page.goto(gameUrl);
    await dismissDevOverlay(page);
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: 30_000,
    });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    // Prefer networking game when available.
    const select = page.locator("select").first();
    if ((await select.count()) > 0) {
      const options = await select.locator("option").allTextContents();
      const netIdx = options.findIndex((t) => /network|DHCP|DNS/i.test(t));
      if (netIdx >= 0) {
        await select.selectOption({ index: netIdx });
      }
    }

    const answer =
      "DHCP assigns IP addresses with a lease. DNS resolves domain names to addresses. " +
      "The default gateway is the router exit used to forward traffic off the local network.";
    await page.locator("textarea").first().fill(answer);
    await page.getByRole("button", { name: /Submit for evaluation/i }).click();
    await expect(page.locator("[data-activity-result]")).toBeVisible({
      timeout: 45_000,
    });

    const after = await countAttemptsForConcept(seed.conceptId);
    expect(after).toBeGreaterThan(before);
    const mastery = await getMasteryForConcept(seed.userAId, seed.conceptId);
    expect(mastery).not.toBeNull();
    expect(mastery!.reviewCount).toBeGreaterThan(0);

    // Client cannot forge SUCCESS via empty submit after real attempt — attempt count stays.
    const forged = await api.post("/api/study/activities/game", {
      data: {
        conceptId: seed.conceptId,
        challengeId: "game-network-terms",
        text: "",
        outcome: "SUCCESS",
        completed: true,
        adaptiveRunId: run.id,
        adaptiveStep: 0,
      },
    });
    // Empty artifact should fail evaluation or 4xx — never invent SUCCESS mastery.
    if (forged.ok()) {
      const json = (await forged.json()) as {
        evaluation?: { outcome?: string };
        ok?: boolean;
      };
      expect(json.evaluation?.outcome ?? "FAIL").not.toBe("SUCCESS");
    }

    const ret = page.locator("[data-adaptive-return]");
    if ((await ret.count()) > 0) {
      await ret.first().click();
      await expect(page).toHaveURL(new RegExp(`/study/adaptive/${run.id}`), {
        timeout: 20_000,
      });
    }
  });

  test("Journey B — Project Adaptive: learner-authored plan → evidence → bind", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);

    const run = await createE2eAdaptiveRun({
      userId: seed.userAId,
      conceptId: seed.conceptId,
      intervention: "project",
    });
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/project?conceptId=${seed.conceptId}&adaptiveRunId=${run.id}&adaptiveStep=0`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: 30_000,
    });
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    const plan =
      "Objective: master network connectivity lab practice. " +
      "Milestone: week 1 configure and ping gateway. " +
      "Success criteria: measure quiz score and verify DHCP lease.";
    await page.locator("textarea").first().fill(plan);
    await page.getByRole("button", { name: /Submit for evaluation/i }).click();
    await expect(page.locator("[data-activity-result]")).toBeVisible({
      timeout: 45_000,
    });
    expect(await countAttemptsForConcept(seed.conceptId)).toBeGreaterThan(
      before,
    );
  });

  test("Journey C — Game abandonment: no false completion", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const run = await createE2eAdaptiveRun({
      userId: seed.userAId,
      conceptId: seed.conceptId,
      intervention: "game",
    });
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/game?conceptId=${seed.conceptId}&adaptiveRunId=${run.id}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: 30_000,
    });

    const abandon = await api.post(`/api/study/adaptive/${run.id}/abandon`);
    expect(abandon.ok()).toBeTruthy();
    const status = await getAdaptiveRunStatus(run.id);
    expect(status?.status).toBe("ABANDONED");
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Journey D — Project abandonment: no false completion", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const run = await createE2eAdaptiveRun({
      userId: seed.userAId,
      conceptId: seed.conceptId,
      intervention: "project",
    });
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(
      `/study/activities/project?conceptId=${seed.conceptId}&adaptiveRunId=${run.id}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: 30_000,
    });

    const abandon = await api.post(`/api/study/adaptive/${run.id}/abandon`);
    expect(abandon.ok()).toBeTruthy();
    expect((await getAdaptiveRunStatus(run.id))?.status).toBe("ABANDONED");
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Journey E — Material context on Game Adaptive (optional citation)", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);

    const run = await createE2eAdaptiveRun({
      userId: seed.userAId,
      conceptId: seed.conceptId,
      intervention: "game",
    });

    await page.goto(
      `/study/activities/game?conceptId=${seed.conceptId}&adaptiveRunId=${run.id}&materialId=${seed.materialId}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("body")).toBeVisible();
    // Citation optional when reverse-link works — page must not error.
    await expect(page.locator("textarea").first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("Journey F — Existing activities regression smoke", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);

    for (const kind of [
      "coding",
      "sql",
      "lab",
      "simulation",
      "presentation",
      "writing",
    ] as const) {
      await page.goto(`/study/activities/${kind}?conceptId=${seed.conceptId}`);
      await dismissDevOverlay(page);
      await expect(page.locator("body")).toBeVisible();
      await expect(page).not.toHaveURL(/\/login/);
    }
  });
});
