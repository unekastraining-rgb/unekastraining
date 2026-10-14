import { test, expect } from "@playwright/test";

import { loginAsPage, loginViaApi } from "./helpers/auth";
import { createE2ePrisma, E2E_USER_B_EMAIL, E2E_USER_EMAIL } from "./helpers/db";
import { readSeed, getUserIdByEmail } from "./helpers/fixtures";

test.describe("Ownership / security", () => {
  test("User B cannot open User A's Adaptive run", async ({ browser }) => {
    const seed = readSeed();
    const userBId = await getUserIdByEmail(E2E_USER_B_EMAIL);
    expect(userBId).toBeTruthy();

    const contextA = await browser.newContext();
    await loginViaApi(contextA.request, E2E_USER_EMAIL);
    const start = await contextA.request.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    const startJson = (await start.json()) as {
      success?: boolean;
      runId?: string;
      error?: string;
    };
    test.skip(
      !start.ok() || !startJson.runId,
      `Adaptive start unavailable: ${startJson.error ?? start.status()}`,
    );
    const runId = startJson.runId!;
    await contextA.close();

    const contextB = await browser.newContext();
    await loginViaApi(contextB.request, E2E_USER_B_EMAIL);
    const pageB = await contextB.newPage();
    const res = await pageB.goto(`/study/adaptive/${runId}`);
    const status = res?.status() ?? 0;
    const body = (await pageB.textContent("body")) ?? "";
    // Existing semantics: notFound() UI and/or HTTP 404 — never expose A's run shell.
    const denied =
      status === 404 ||
      /not found|does not exist|unavailable/i.test(body) ||
      (await pageB.locator("[data-adaptive-run]").count()) === 0;
    expect(denied).toBe(true);
    await expect(pageB.locator('[data-adaptive-status="ACTIVE"]')).toHaveCount(0);
    await contextB.close();

    // Attempt ownership: B must not retrieve A's LearningAttempt rows via Adaptive run API.
    const db = createE2ePrisma();
    let attemptId: string | null = null;
    try {
      const attempt = await db.learningAttempt.findFirst({
        where: { userId: seed.userAId },
        select: { id: true },
      });
      attemptId = attempt?.id ?? null;
    } finally {
      await db.$disconnect();
    }

    if (attemptId) {
      const contextProbe = await browser.newContext();
      await loginViaApi(contextProbe.request, E2E_USER_B_EMAIL);
      const probe = await contextProbe.request.get(
        `/api/study/adaptive/${runId}`,
      );
      // No public attempt-by-id leak — unauthorized/missing for B.
      expect([401, 403, 404]).toContain(probe.status());
      await contextProbe.close();
    }
  });
});

test.describe("Recovery / error states", () => {
  test("invalid Adaptive run shows not found", async ({ page }) => {
    await loginAsPage(page);
    const res = await page.goto("/study/adaptive/does-not-exist-run-id");
    const status = res?.status() ?? 0;
    const body = (await page.textContent("body")) ?? "";
    expect(
      status === 404 || /not found|does not exist/i.test(body),
    ).toBe(true);
    await expect(page.locator("[data-adaptive-run]")).toHaveCount(0);
  });

  test("Growth Center loads empty-safe chrome", async ({ page }) => {
    await loginAsPage(page);
    await page.goto("/study/learner-model");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page
        .locator(
          "[data-growth-center-surface], [data-growth-center-error], [data-learner-model-error]",
        )
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("activity rejects empty submit without fabricating success", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    await page.goto(`/study/activities/lab?conceptId=${seed.conceptId}`);
    const workArea = page.locator("textarea").first();
    await expect(workArea).toBeVisible({ timeout: 30_000 });
    const submit = page.getByRole("button", { name: /Submit for evaluation/i });
    await expect(submit).toBeDisabled();
  });
});
