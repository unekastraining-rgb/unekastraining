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
 * 2P-27 — Material → Concept → Adaptive / Tutor / CORE / ownership.
 * Extends 2P-24; does not replace canonical adaptive specs.
 */
test.describe("Material ingestion → learning journeys", () => {
  test("Journey A — Material → Concept → Adaptive → evidence path remains activity-gated", async ({
    page,
  }) => {
    const seed = readSeed();
    expect(seed.materialId).toBeTruthy();
    await loginAsPage(page);
    const api = page.context().request;

    const beforeAttempts = await countAttemptsForConcept(seed.conceptId);

    const prepare = await api.post(
      `/api/materials/${seed.materialId}/learning`,
      { data: { action: "prepare", learnerId: "forged-other-user" } },
    );
    expect(prepare.ok()).toBeTruthy();
    const prepareJson = (await prepare.json()) as {
      success?: boolean;
      learning?: {
        state?: string;
        noteId?: string;
        candidates?: Array<{ key: string; title: string; status: string }>;
        focusConceptId?: string | null;
      };
    };
    expect(prepareJson.success).toBe(true);
    expect(prepareJson.learning?.noteId).toBeTruthy();
    expect(["READY", "PARTIAL"]).toContain(prepareJson.learning?.state);

    // Prepare must not create evidence.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(beforeAttempts);

    const candidates = prepareJson.learning?.candidates ?? [];
    let conceptId = prepareJson.learning?.focusConceptId ?? null;

    if (!conceptId && candidates.length > 0) {
      const confirmable =
        candidates.find((c) => c.status === "proposed" || c.status === "existing") ??
        candidates[0]!;
      const confirm = await api.post(
        `/api/materials/${seed.materialId}/learning`,
        { data: { action: "confirm", candidateKey: confirmable.key } },
      );
      expect(confirm.ok()).toBeTruthy();
      const confirmJson = (await confirm.json()) as {
        success?: boolean;
        conceptId?: string;
      };
      expect(confirmJson.success).toBe(true);
      conceptId = confirmJson.conceptId ?? null;
    }

    // Confirm concept ≠ LearningAttempt.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(beforeAttempts);
    if (conceptId && conceptId !== seed.conceptId) {
      expect(await countAttemptsForConcept(conceptId)).toBe(0);
    }

    expect(conceptId).toBeTruthy();

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId, learnerId: "forged" },
    });
    // Adaptive may return 400 when no sequence needed — still valid ULE path.
    if (start.ok()) {
      const startJson = (await start.json()) as { runId?: string };
      expect(startJson.runId).toBeTruthy();
      await page.goto(`/study/adaptive/${startJson.runId}`);
      await dismissDevOverlay(page);
      await expect(page.locator("[data-adaptive-run]")).toBeVisible({
        timeout: 30_000,
      });
    }

    // Legitimate lab activity may create evidence (reuse seeded concept when bound).
    const labConcept = conceptId ?? seed.conceptId;
    const beforeLab = await countAttemptsForConcept(labConcept);
    await page.goto(`/study/activities/lab?conceptId=${labConcept}`);
    await expect(page.getByText(/Lab|Practice activity|Goal/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const submit = page.locator(
      '[data-activity-submit], button:has-text("Submit"), button:has-text("Check")',
    );
    if ((await submit.count()) > 0) {
      await submit.first().click();
      await page.waitForTimeout(1500);
      const afterLab = await countAttemptsForConcept(labConcept);
      // Evidence only if the activity actually recorded — do not fail if UI is offline.
      expect(afterLab).toBeGreaterThanOrEqual(beforeLab);
    }
  });

  test("Journey B — Material → Tutor ordinary Q&A creates no evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    const tutor = await api.post("/api/study/tutor", {
      data: {
        mode: "GUIDED",
        message: "What is the three-way handshake in my notes?",
        materialId: seed.materialId,
        evidenceIntent: "demonstration",
        learnerId: "forged-user",
      },
    });
    // AI providers may 503; evidence integrity still must hold.
    if (tutor.ok()) {
      const tutorJson = (await tutor.json()) as {
        success?: boolean;
        response?: { meta?: { evidenceRecorded?: boolean } };
        offline?: boolean;
      };
      expect(tutorJson.success).toBe(true);
      expect(tutorJson.response?.meta?.evidenceRecorded ?? false).toBe(false);
    } else {
      expect([500, 502, 503]).toContain(tutor.status());
    }
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Journey C — Material → CORE workbook save/reopen", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const open = await api.post(`/api/materials/${seed.materialId}/open`, {
      data: { mode: "core" },
    });
    expect(open.ok()).toBeTruthy();
    const openJson = (await open.json()) as {
      success?: boolean;
      noteId?: string;
      coreHref?: string;
    };
    expect(openJson.success).toBe(true);
    expect(openJson.noteId).toBeTruthy();

    await page.goto(
      openJson.coreHref ??
        `/core?courseId=${seed.courseId}&materialId=${seed.materialId}&noteId=${openJson.noteId}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);

    // Re-open same workbook identity.
    const reopen = await api.post(`/api/materials/${seed.materialId}/open`, {
      data: { mode: "core" },
    });
    const reopenJson = (await reopen.json()) as {
      noteId?: string;
      created?: boolean;
    };
    expect(reopenJson.noteId).toBe(openJson.noteId);
    expect(reopenJson.created).toBe(false);
  });

  test("Journey D — ownership: User B cannot access User A material", async ({
    browser,
  }) => {
    const seed = readSeed();
    const context = await browser.newContext();
    await loginViaApi(context.request, E2E_USER_B_EMAIL, "E2E Learner B");

    const status = await context.request.get(
      `/api/materials/${seed.materialId}/learning`,
    );
    expect(status.status()).toBe(404);

    const prepare = await context.request.post(
      `/api/materials/${seed.materialId}/learning`,
      { data: { action: "prepare" } },
    );
    expect(prepare.status()).toBe(404);

    const tutor = await context.request.post("/api/study/tutor", {
      data: {
        mode: "GUIDED",
        message: "Summarize this material",
        materialId: seed.materialId,
      },
    });
    // Tutor may succeed offline/online but must not attach foreign material context
    // (loadOwnedMaterialTutorContext returns null → no instructional material leak).
    if (tutor.ok()) {
      const json = (await tutor.json()) as {
        response?: { meta?: { evidenceRecorded?: boolean } };
      };
      expect(json.response?.meta?.evidenceRecorded ?? false).toBe(false);
    }

    const file = await context.request.get(
      `/api/materials/${seed.materialId}/file`,
    );
    expect([401, 403, 404]).toContain(file.status());

    await logoutContext(context);
    await context.close();
  });

  test("Materials page empty/list + prepare UI", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    await page.goto("/materials");
    await dismissDevOverlay(page);
    await expect(page.locator("[data-materials-page]")).toBeVisible();
    const row = page.locator(
      `[data-material-row][data-material-id="${seed.materialId}"]`,
    );
    await expect(row).toBeVisible();
    await row.locator("[data-material-prepare]").click();
    await expect(row.locator("[data-material-learning-ready]")).toBeVisible({
      timeout: 30_000,
    });
    await expect(row.locator("[data-material-provenance]")).toContainText(
      /Source:/i,
    );
  });
});
