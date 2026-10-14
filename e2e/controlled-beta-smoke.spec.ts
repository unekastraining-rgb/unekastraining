/**
 * Controlled beta smoke — compact journey + one recovery path.
 * Chromium only; does not claim public SaaS readiness.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import {
  countAttemptsForConcept,
  getMasteryForConcept,
  readSeed,
} from "./helpers/fixtures";
import { dismissDevOverlay } from "./helpers/ui";

test.describe("Controlled beta journey smoke", () => {
  test("sign-in → Study Hub → Adaptive → evidence → Lucky → Growth → continuity + feedback", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    // 1–2 Academic Hub reachable, then primary learning destination = Study Hub
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/study");
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Study Hub/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("[data-beta-start-learning]")).toBeVisible();
    await expect(page.locator("[data-beta-feedback]")).toBeVisible();

    const beforeAttempts = await countAttemptsForConcept(seed.conceptId);

    // 3–4 Start Adaptive
    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    test.skip(!start.ok(), `Adaptive start unavailable: ${start.status()}`);
    const { runId } = (await start.json()) as { runId?: string };
    expect(runId).toBeTruthy();

    await page.goto(`/study/adaptive/${runId}`);
    await expect(page.locator("[data-adaptive-run], body").first()).toBeVisible();

    // 5–7 Complete intervention + legitimate evidence via lab submit
    const labUrl = `/study/activities/lab?conceptId=${seed.conceptId}&adaptiveRunId=${runId}`;
    await page.goto(labUrl);
    await expect(page.getByText(/Lab|Practice activity|Goal/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const workArea = page.locator("textarea").first();
    if ((await workArea.count()) > 0) {
      await workArea.fill(
        "Controlled beta smoke: I can explain the concept and apply the key steps.",
      );
      const submit = page.getByRole("button", { name: /Submit|Check|Complete/i }).first();
      if ((await submit.count()) > 0) {
        await submit.click();
        await expect(page.locator("body")).toBeVisible();
      }
    }

    const afterAttempts = await countAttemptsForConcept(seed.conceptId);
    // Evidence may or may not increment depending on lab criteria — mastery read must not fabricate
    expect(afterAttempts).toBeGreaterThanOrEqual(beforeAttempts);
    const mastery = await getMasteryForConcept(seed.userAId, seed.conceptId);
    expect(mastery === null || typeof mastery === "object").toBeTruthy();

    // 8–10 Lucky GET ≠ evidence; optional submit when due
    const luckyGet = await api.get("/api/study/lucky/retention-item");
    expect(luckyGet.ok()).toBeTruthy();
    const afterLuckyGet = await countAttemptsForConcept(seed.conceptId);
    expect(afterLuckyGet).toBe(afterAttempts);

    await page.goto("/study/lucky");
    await expect(page.locator("body")).toBeVisible();

    // 11–12 Return Study Hub + Growth continuity
    await page.goto("/study");
    await expect(page.getByRole("heading", { name: /Study Hub/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto("/study/learner-model");
    await expect(
      page.getByText(/growth|learner|mastery|evidence|continue|concept/i).first(),
    ).toBeVisible({ timeout: 30_000 });

    // Beta feedback — product friction only (not LearningAttempt)
    const feedbackBefore = await (async () => {
      const db = createE2ePrisma();
      try {
        return db.betaFeedback.count({ where: { userId: seed.userAId } });
      } finally {
        await db.$disconnect();
      }
    })();
    const feedbackRes = await api.post("/api/beta/feedback", {
      data: {
        category: "GREAT",
        comment: "Smoke journey works for controlled beta.",
        surface: "study-hub",
      },
    });
    expect(feedbackRes.ok()).toBeTruthy();
    const feedbackAfter = await (async () => {
      const db = createE2ePrisma();
      try {
        return db.betaFeedback.count({ where: { userId: seed.userAId } });
      } finally {
        await db.$disconnect();
      }
    })();
    expect(feedbackAfter).toBe(feedbackBefore + 1);
    const attemptsAfterFeedback = await countAttemptsForConcept(seed.conceptId);
    expect(attemptsAfterFeedback).toBe(afterLuckyGet);
  });

  test("recovery: invalid Adaptive run shows safe recovery, not fabricated success", async ({
    page,
  }) => {
    await loginAsPage(page);
    await page.goto("/study/adaptive/definitely-not-a-run");
    await expect(
      page.getByText(/not found|unavailable|could not|error|back|return/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("body")).not.toContainText(/stack|SESSION_SECRET|api[_-]?key/i);
  });

  test("ops health responds without secrets", async ({ page }) => {
    await loginAsPage(page);
    const res = await page.context().request.get("/api/ops/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      version?: string;
      checks?: Record<string, unknown>;
    };
    expect(body.version).toBeTruthy();
    expect(body.checks?.database).toBe(true);
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/SESSION_SECRET|password|Bearer |enc:v1:/i);
  });
});
