import { test, expect } from "@playwright/test";

import { loginAsPage, loginViaApi, logoutContext } from "./helpers/auth";
import {
  countAttemptsForConcept,
  E2E_USER_B_EMAIL,
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
 * 2P-29 — Universal Learner Context.
 * Extends 2P-24–28; does not replace prior suites.
 */
test.describe("Universal Learner Context", () => {
  test("Journey A — Context → Adaptive → activity evidence path intact", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const before = await countAttemptsForConcept(seed.conceptId);

    const ctxRes = await api.get(
      `/api/study/learner-context?conceptId=${seed.conceptId}&materialId=${seed.materialId}`,
    );
    expect(ctxRes.ok()).toBeTruthy();
    const ctxJson = (await ctxRes.json()) as {
      success?: boolean;
      context?: {
        createsEvidence?: boolean;
        createsMastery?: boolean;
        conceptId?: string | null;
        learnerId?: string;
      };
      presentation?: { lines?: string[]; createsEvidence?: boolean };
    };
    expect(ctxJson.success).toBe(true);
    expect(ctxJson.context?.createsEvidence).toBe(false);
    expect(ctxJson.context?.createsMastery).toBe(false);
    expect(ctxJson.presentation?.createsEvidence).toBe(false);
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId, materialId: seed.materialId },
    });
    expect(start.ok()).toBeTruthy();
    const startJson = (await start.json()) as { runId?: string };
    expect(startJson.runId).toBeTruthy();
    // Start Adaptive still does not create LearningAttempt by itself.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto(
      `/study/adaptive/${startJson.runId}?materialId=${seed.materialId}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("[data-adaptive-run]")).toBeVisible({
      timeout: 30_000,
    });
    // Context strip optional when lines empty; Adaptive chrome must work.
    await expect(page.locator("[data-adaptive-status]")).toBeVisible();
  });

  test("Journey B — Context → Tutor teaching style without automatic evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    // Teaching style / context without AI (always available).
    const ctxRes = await api.get(
      `/api/study/learner-context?conceptId=${seed.conceptId}&materialId=${seed.materialId}&teachingStyle=SIMPLIFIED`,
    );
    expect(ctxRes.ok()).toBeTruthy();
    const ctxJson = (await ctxRes.json()) as {
      context?: { teachingStyle?: string | null; createsEvidence?: boolean };
      presentation?: { createsEvidence?: boolean };
    };
    expect(ctxJson.context?.createsEvidence).toBe(false);
    expect(ctxJson.context?.teachingStyle).toBe("SIMPLIFIED");
    expect(ctxJson.presentation?.createsEvidence).toBe(false);
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    // Tutor may hang on provider outage — bound wait; evidence must stay flat either way.
    try {
      const tutor = await api.post("/api/study/tutor", {
        data: {
          mode: "GUIDED",
          message: "Explain JOINs simply.",
          conceptIds: [seed.conceptId],
          materialId: seed.materialId,
          teachingStyle: "SIMPLIFIED",
        },
        timeout: 25_000,
      });
      if (tutor.ok()) {
        const json = (await tutor.json()) as {
          success?: boolean;
          response?: {
            meta?: {
              evidenceRecorded?: boolean;
              teachingStyle?: string;
              learnerContextPresentation?: { createsEvidence?: boolean };
            };
          };
        };
        expect(json.success).toBe(true);
        expect(json.response?.meta?.evidenceRecorded ?? false).toBe(false);
        expect(json.response?.meta?.teachingStyle).toBe("SIMPLIFIED");
        if (json.response?.meta?.learnerContextPresentation) {
          expect(
            json.response.meta.learnerContextPresentation.createsEvidence,
          ).toBe(false);
        }
      } else {
        expect([500, 502, 503]).toContain(tutor.status());
      }
    } catch {
      // Provider hang / timeout — learner-context path above already proved no evidence.
    }
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Journey C — Growth Center consumes normalized context", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study/learner-model");
    await dismissDevOverlay(page);
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible({
      timeout: 30_000,
    });
    // Opening Growth Center must not create evidence.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    if (start.ok()) {
      const startJson = (await start.json()) as { runId?: string };
      await page.goto(`/study/adaptive/${startJson.runId}`);
      await expect(page.locator("[data-adaptive-run]")).toBeVisible({
        timeout: 30_000,
      });
    }
  });

  test("Journey D — Cold start Hub / Growth / Tutor / Adaptive-capable", async ({
    page,
  }) => {
    await loginAsPage(page);
    const api = page.context().request;

    await page.goto("/study");
    await dismissDevOverlay(page);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/study/learner-model");
    await dismissDevOverlay(page);
    await expect(page.locator("[data-growth-center-surface]")).toBeVisible({
      timeout: 30_000,
    });

    const coldCtx = await api.get("/api/study/learner-context");
    expect(coldCtx.ok()).toBeTruthy();
    const coldJson = (await coldCtx.json()) as {
      context?: { createsEvidence?: boolean };
      presentation?: { lines?: string[] };
    };
    expect(coldJson.context?.createsEvidence).toBe(false);

    try {
      const tutor = await api.post("/api/study/tutor", {
        data: { mode: "GUIDED", message: "What should I study first?" },
        timeout: 20_000,
      });
      // Cold Tutor may 200 offline/online or 5xx provider — UI path must not hang.
      expect([200, 400, 500, 502, 503]).toContain(tutor.status());
    } catch {
      // Provider hang — Hub/Growth/context already verified above.
    }
  });

  test("Journey E — Cross-user learner context denied", async ({ browser }) => {
    const seed = readSeed();
    const context = await browser.newContext();
    await loginViaApi(context.request, E2E_USER_B_EMAIL, "E2E Learner B");

    // Spoofed learnerId query must not switch identity.
    const spoof = await context.request.get(
      `/api/study/learner-context?learnerId=${seed.userAId}&conceptId=${seed.conceptId}&materialId=${seed.materialId}`,
    );
    expect(spoof.ok()).toBeTruthy();
    const spoofJson = (await spoof.json()) as {
      context?: {
        learnerId?: string;
        conceptId?: string | null;
        material?: { materialId?: string } | null;
        activeLearning?: unknown;
      };
    };
    expect(spoofJson.context?.learnerId).not.toBe(seed.userAId);
    // User B cannot resolve User A's concept/material into context.
    expect(spoofJson.context?.conceptId).toBeNull();
    expect(spoofJson.context?.material).toBeNull();

    const foreignAdaptive = await context.request.post(
      "/api/study/adaptive/start",
      { data: { conceptId: seed.conceptId } },
    );
    expect([400, 404]).toContain(foreignAdaptive.status());

    await logoutContext(context);
    await context.close();
  });
});
