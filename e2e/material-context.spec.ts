import { test, expect } from "@playwright/test";

import { loginAsPage, loginViaApi, logoutContext } from "./helpers/auth";
import {
  countAttemptsForConcept,
  E2E_USER_B_EMAIL,
  readSeed,
} from "./helpers/fixtures";
import { dismissDevOverlay } from "./helpers/ui";

/**
 * 2P-28 — Material context / source-grounded experience.
 * Extends 2P-24/27; does not replace prior suites.
 */
test.describe("Material context → source-grounded learning", () => {
  test("Journey A — Material → Adaptive → source citation → open source → no evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    await api.post(`/api/materials/${seed.materialId}/learning`, {
      data: { action: "prepare" },
    });
    const status = await api.get(`/api/materials/${seed.materialId}/learning`);
    const statusJson = (await status.json()) as {
      learning?: {
        candidates?: Array<{ key: string; status: string }>;
        focusConceptId?: string | null;
        noteId?: string;
      };
    };

    let conceptId = statusJson.learning?.focusConceptId ?? null;
    const candidates = statusJson.learning?.candidates ?? [];
    if (!conceptId && candidates[0]) {
      const confirm = await api.post(
        `/api/materials/${seed.materialId}/learning`,
        { data: { action: "confirm", candidateKey: candidates[0].key } },
      );
      const confirmJson = (await confirm.json()) as { conceptId?: string };
      conceptId = confirmJson.conceptId ?? null;
    }
    expect(conceptId).toBeTruthy();

    const before = await countAttemptsForConcept(conceptId!);

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId, materialId: seed.materialId },
    });
    expect(start.ok()).toBeTruthy();
    const startJson = (await start.json()) as {
      runId?: string;
      materialId?: string | null;
    };
    expect(startJson.runId).toBeTruthy();
    expect(startJson.materialId).toBe(seed.materialId);

    await page.goto(
      `/study/adaptive/${startJson.runId}?materialId=${seed.materialId}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("[data-adaptive-run]")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("[data-material-source-citation]")).toBeVisible();
    await expect(page.locator("[data-material-provenance]")).toContainText(
      /Source:/i,
    );

    // Open source (CORE) — navigation ≠ evidence.
    const openCore = page.locator("[data-material-view-source]");
    if ((await openCore.count()) > 0) {
      await dismissDevOverlay(page);
      const href = await openCore.first().getAttribute("href");
      if (href) {
        await page.goto(href);
      } else {
        await openCore.first().click({ force: true });
      }
      await expect(page).toHaveURL(/\/core/, { timeout: 20_000 });
      await expect(page).not.toHaveURL(/\/login/);
    }
    expect(await countAttemptsForConcept(conceptId!)).toBe(before);

    // Return to Adaptive and continue into activity if available.
    await page.goto(
      `/study/adaptive/${startJson.runId}?materialId=${seed.materialId}`,
    );
    const continueBtn = page.locator("[data-adaptive-continue-six]");
    if ((await continueBtn.count()) > 0) {
      await continueBtn.first().click();
      await expect(page).toHaveURL(/\/study\//, { timeout: 20_000 });
      const citation = page.locator("[data-material-source-citation]");
      // Citation optional on activity if reverse-lookup works; URL materialId preferred.
      if ((await citation.count()) > 0) {
        await expect(citation.first()).toBeVisible();
      }
    }
  });

  test("Journey B — Material → Tutor shows provenance without evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    // Non-AI provenance path (always available).
    const status = await api.get(`/api/materials/${seed.materialId}/learning`);
    expect(status.ok()).toBeTruthy();
    const statusJson = (await status.json()) as {
      learning?: { provenanceLabel?: string };
    };
    expect(statusJson.learning?.provenanceLabel ?? "").toMatch(/Source:/i);

    const tutor = await api.post("/api/study/tutor", {
      data: {
        mode: "GUIDED",
        message: "Summarize the three-way handshake from my notes.",
        materialId: seed.materialId,
      },
    });
    if (tutor.ok()) {
      const tutorJson = (await tutor.json()) as {
        success?: boolean;
        response?: {
          meta?: {
            evidenceRecorded?: boolean;
            materialProvenanceLabel?: string;
          };
        };
      };
      expect(tutorJson.success).toBe(true);
      expect(tutorJson.response?.meta?.evidenceRecorded ?? false).toBe(false);
      expect(tutorJson.response?.meta?.materialProvenanceLabel ?? "").toMatch(
        /Source:/i,
      );
    } else {
      // Provider outage — ownership/context still must not create evidence.
      expect([500, 502, 503]).toContain(tutor.status());
    }
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });

  test("Journey C — Material → CORE → reopen → materials relationship", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const open = await api.post(`/api/materials/${seed.materialId}/open`, {
      data: { mode: "core" },
    });
    const openJson = (await open.json()) as {
      noteId?: string;
      coreHref?: string;
    };
    expect(openJson.noteId).toBeTruthy();

    await page.goto(
      openJson.coreHref ??
        `/core?courseId=${seed.courseId}&materialId=${seed.materialId}&noteId=${openJson.noteId}`,
    );
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);

    const reopen = await api.post(`/api/materials/${seed.materialId}/open`, {
      data: { mode: "core" },
    });
    const reopenJson = (await reopen.json()) as { noteId?: string };
    expect(reopenJson.noteId).toBe(openJson.noteId);

    await page.goto("/materials");
    await expect(
      page.locator(`[data-material-row][data-material-id="${seed.materialId}"]`),
    ).toBeVisible();
  });

  test("Journey D — No material: Adaptive/Tutor chrome unchanged", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    await page.goto("/study");
    await dismissDevOverlay(page);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("[data-material-source-citation]")).toHaveCount(0);

    const api = page.context().request;
    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    if (start.ok()) {
      const startJson = (await start.json()) as { runId?: string };
      await page.goto(`/study/adaptive/${startJson.runId}`);
      await dismissDevOverlay(page);
      await expect(page.locator("[data-adaptive-run]")).toBeVisible({
        timeout: 30_000,
      });
      // Without materialId / concept-linked note, citation may be absent — must not error.
      await expect(page.locator("[data-adaptive-status]")).toBeVisible();
    }
  });

  test("Journey E — Cross-user material context denied", async ({ browser }) => {
    const seed = readSeed();
    const context = await browser.newContext();
    await loginViaApi(context.request, E2E_USER_B_EMAIL, "E2E Learner B");

    const start = await context.request.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId, materialId: seed.materialId },
    });
    // Concept is owned by A → not_found for B, or if somehow start fails ownership.
    expect([400, 404]).toContain(start.status());

    const tutor = await context.request.post("/api/study/tutor", {
      data: {
        mode: "GUIDED",
        message: "Leak this material",
        materialId: seed.materialId,
      },
    });
    if (tutor.ok()) {
      const json = (await tutor.json()) as {
        response?: { meta?: { materialProvenanceLabel?: string } };
      };
      // Foreign material → no provenance meta leak.
      expect(json.response?.meta?.materialProvenanceLabel).toBeUndefined();
    }

    await logoutContext(context);
    await context.close();
  });
});
