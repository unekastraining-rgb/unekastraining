import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import {
  countAttemptsForConcept,
  getMasteryForConcept,
  readSeed,
} from "./helpers/fixtures";
import { dismissDevOverlay } from "./helpers/ui";

/**
 * Canonical Adaptive journey + real structured activity evidence.
 * Evidence comes from UI submit — not seeded LearningAttempt/ConceptMastery.
 */
test.describe("Canonical Adaptive + lab evidence journey", () => {
  test("Study Hub → Orchestrator/Adaptive → lab interaction creates evidence + mastery", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    await page.goto("/study");
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();

    // Wait until Orchestrator finishes loading (loading chrome also uses data-orchestrator-suggestion).
    const orch = page.locator("[data-orchestrator-suggestion]");
    await expect(orch.first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-hub-suggestion-loading]")).toHaveCount(0, {
      timeout: 45_000,
    });
    await orch.first().scrollIntoViewIfNeeded();

    // 2P-25 — Start vs Continue semantics (unified labels).
    const learningCta = page.locator(
      '[data-hub-primary-cta="adaptive"], [data-orchestrator-adaptive-study], [data-continue-learning]',
    );
    if ((await learningCta.count()) > 0) {
      await expect(learningCta.first()).toContainText(/Start learning|Continue learning/i);
    }

    const primaryAdaptive = page.locator(
      '[data-hub-primary-cta="adaptive"], [data-orchestrator-adaptive-study]',
    );
    const emptyFallback = page.locator("[data-hub-suggestion-empty]");

    let adaptiveRunId: string | null = null;

    if ((await primaryAdaptive.count()) > 0) {
      await primaryAdaptive.first().click();
      await expect(page).toHaveURL(/\/study\/adaptive\//, { timeout: 30_000 });
      await expect(page.locator("[data-adaptive-run]")).toBeVisible();
      await expect(page.locator("[data-adaptive-status]")).toHaveAttribute(
        "data-adaptive-status",
        /ACTIVE|COMPLETED|ABANDONED|unavailable/,
      );
      const match = page.url().match(/\/study\/adaptive\/([^/?#]+)/);
      adaptiveRunId = match?.[1] ?? null;

      const continueSix = page.locator("[data-adaptive-continue-six]");
      if ((await continueSix.count()) > 0) {
        await expect(continueSix.first()).toBeVisible();
        await expect(page.locator("[data-adaptive-run]")).toBeVisible();
      }
    } else if ((await emptyFallback.count()) > 0) {
      await expect(emptyFallback.first()).toBeVisible();
    } else {
      // Settled recommendation without Adaptive primary (e.g. SIX fallback only).
      await expect(orch.first()).toBeVisible();
    }

    // Ensure an Adaptive run exists for bind when the Hub CTA did not create one.
    if (!adaptiveRunId) {
      const start = await api.post("/api/study/adaptive/start", {
        data: { conceptId: seed.conceptId },
      });
      if (start.ok()) {
        const startJson = (await start.json()) as { runId?: string };
        adaptiveRunId = startJson.runId ?? null;
      }
    }

    // --- Structured lab: Launch ≠ Evidence ---
    const beforeAttempts = await countAttemptsForConcept(seed.conceptId);
    const labUrl = adaptiveRunId
      ? `/study/activities/lab?conceptId=${seed.conceptId}&adaptiveRunId=${adaptiveRunId}`
      : `/study/activities/lab?conceptId=${seed.conceptId}`;
    await page.goto(labUrl);
    await expect(page.getByText(/Lab|Practice activity|Goal/i).first()).toBeVisible({
      timeout: 30_000,
    });

    const workArea = page.locator("textarea").first();
    await expect(workArea).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-activity-state]")).toHaveAttribute(
      "data-activity-state",
      /READY|IN_PROGRESS|LOADING/,
    );

    // Still no evidence from open alone.
    const midAttempts = await countAttemptsForConcept(seed.conceptId);
    expect(midAttempts).toBe(beforeAttempts);

    // Legitimate interaction matching lab-network-connectivity criteria.
    const answer =
      "I configure the interface IP and gateway, then ping the DNS server. " +
      "The test observe result is timeout. I diagnose the fault because DHCP is misconfigured.";
    await workArea.fill(answer);
    await dismissDevOverlay(page);
    await page
      .getByRole("button", { name: /Submit for evaluation/i })
      .click({ force: true });

    await expect(page.locator("[data-activity-result]")).toBeVisible({
      timeout: 45_000,
    });

    const afterAttempts = await countAttemptsForConcept(seed.conceptId);
    expect(afterAttempts).toBeGreaterThan(beforeAttempts);

    const mastery = await getMasteryForConcept(seed.userAId, seed.conceptId);
    expect(mastery).not.toBeNull();
    expect(mastery!.reviewCount).toBeGreaterThan(0);
    expect(mastery!.perform > 0 || mastery!.reviewCount > 0).toBe(true);

    // Adaptive return / completion boundary when bound.
    const adaptiveReturn = page.locator("[data-adaptive-return]");
    if ((await adaptiveReturn.count()) > 0 && adaptiveRunId) {
      await adaptiveReturn.first().click();
      await expect(page).toHaveURL(new RegExp(`/study/adaptive/${adaptiveRunId}`), {
        timeout: 30_000,
      });
      await expect(page.locator("[data-adaptive-run]")).toBeVisible();

      const completeBtn = page.locator("[data-adaptive-complete]");
      if ((await completeBtn.count()) > 0) {
        await completeBtn.first().click();
        await expect(page.locator('[data-adaptive-status="COMPLETED"]')).toBeVisible({
          timeout: 30_000,
        });
      }

      // LUCKY boundary — only when the existing sync legally surfaces retention chrome.
      const lucky = page.locator("[data-lucky], [data-retention], a[href*='/study/lucky']");
      if ((await lucky.count()) > 0) {
        await expect(lucky.first()).toBeVisible();
      }
    }
  });

  test("unauthenticated Study Hub follows existing auth redirect", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/study");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: /Continue with email/i })).toBeVisible();
    await context.close();
  });
});
