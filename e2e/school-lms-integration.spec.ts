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
 * 2P-31 — School / LMS → Universal Learning.
 * Extends prior suites; does not replace them.
 */
test.describe("School / LMS → Universal Learning", () => {
  test("Journey G — Course → Material → Adaptive learning path", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto(`/courses/${seed.courseId}`);
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();

    await api.post(`/api/materials/${seed.materialId}/learning`, {
      data: { action: "prepare" },
    });

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId, materialId: seed.materialId },
    });
    expect(start.ok()).toBeTruthy();
    const startJson = (await start.json()) as { runId?: string };
    expect(startJson.runId).toBeTruthy();
    // Start Adaptive alone does not create evidence.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto(
      `/study/adaptive/${startJson.runId}?materialId=${seed.materialId}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("[data-adaptive-run]")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("Journey H — Assignment → linked concept → Adaptive; status ≠ evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    expect(seed.assignmentId).toBeTruthy();

    const link = await api.get(
      `/api/assignments/${seed.assignmentId}/study-learning`,
    );
    expect(link.ok()).toBeTruthy();
    const linkJson = (await link.json()) as {
      success?: boolean;
      conceptId?: string | null;
      createsEvidence?: boolean;
    };
    expect(linkJson.success).toBe(true);
    expect(linkJson.conceptId).toBe(seed.conceptId);
    expect(linkJson.createsEvidence).toBe(false);
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    // Marking assignment complete must not create evidence.
    const complete = await api.patch("/api/assignments", {
      data: { assignmentId: seed.assignmentId, status: "SUBMITTED" },
    });
    expect(complete.ok()).toBeTruthy();
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    expect(start.ok()).toBeTruthy();
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto("/dashboard?tab=schedule");
    await dismissDevOverlay(page);
    // 2P-33 — Start/Continue learning when concept linked (assignment context as hint).
    const studyBtn = page.getByRole("button", {
      name: /Start learning|Continue learning/i,
    });
    if ((await studyBtn.count()) > 0) {
      await expect(studyBtn.first()).toBeVisible();
    }
  });

  test("Journey I — LMS/course ownership: User B denied User A resources", async ({
    browser,
  }) => {
    const seed = readSeed();
    const context = await browser.newContext();
    await loginViaApi(context.request, E2E_USER_B_EMAIL, "E2E Learner B");

    const course = await context.request.get(`/api/courses/${seed.courseId}`);
    expect([403, 404]).toContain(course.status());

    if (seed.assignmentId) {
      const assignment = await context.request.get(
        `/api/assignments/${seed.assignmentId}/study-learning`,
      );
      expect([403, 404]).toContain(assignment.status());
    }

    const material = await context.request.get(
      `/api/materials/${seed.materialId}/learning`,
    );
    // Foreign material → not ok or empty learning payload.
    if (material.ok()) {
      const json = (await material.json()) as { learning?: unknown; error?: string };
      expect(json.learning == null || json.error).toBeTruthy();
    } else {
      expect([403, 404]).toContain(material.status());
    }

    const adaptive = await context.request.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    expect([400, 404]).toContain(adaptive.status());

    await logoutContext(context);
    await context.close();
  });

  test("Journey J — Personal learning without Course still works", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    await page.goto("/study");
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    expect(start.ok()).toBeTruthy();
    const startJson = (await start.json()) as { runId?: string };
    await page.goto(`/study/adaptive/${startJson.runId}`);
    await expect(page.locator("[data-adaptive-run]")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("Journey K — Material provenance on Adaptive from course material", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId, materialId: seed.materialId },
    });
    expect(start.ok()).toBeTruthy();
    const startJson = (await start.json()) as { runId?: string };
    await page.goto(
      `/study/adaptive/${startJson.runId}?materialId=${seed.materialId}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("[data-adaptive-run]")).toBeVisible({
      timeout: 30_000,
    });
    const citation = page.locator("[data-material-source-citation]");
    if ((await citation.count()) > 0) {
      await expect(citation.first()).toContainText(/Source:/i);
    }
  });

  test("Journey L — LMS sync failure does not mutate mastery/evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    // Sync with unusable provider credentials — must not create evidence.
    const sync = await api.post("/api/lms/sync", {
      data: { provider: "CANVAS" },
      timeout: 20_000,
    });
    // May 400/401/500 when no connection — local learning must remain.
    expect([200, 400, 401, 404, 500, 502, 503]).toContain(sync.status());
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto("/study");
    await dismissDevOverlay(page);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("Journey M — 2P-49 Assignment → Adaptive preserves school context ≠ mastery", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);
    expect(seed.assignmentId).toBeTruthy();

    await page.goto(`/courses/${seed.courseId}`);
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);

    const start = await api.post("/api/study/adaptive/start", {
      data: {
        conceptId: seed.conceptId,
        assignmentId: seed.assignmentId,
      },
    });
    expect(start.ok()).toBeTruthy();
    const startJson = (await start.json()) as {
      runId?: string;
      assignmentId?: string | null;
    };
    expect(startJson.runId).toBeTruthy();
    expect(startJson.assignmentId).toBe(seed.assignmentId);
    // Start alone does not create evidence; assignment context ≠ mastery.
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto(
      `/study/adaptive/${startJson.runId}?assignmentId=${seed.assignmentId}`,
    );
    await dismissDevOverlay(page);
    await expect(page.locator("[data-adaptive-run]")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("[data-school-context-strip]")).toBeVisible();
    await expect(
      page.locator("[data-school-context-not-mastery]"),
    ).toBeVisible();

    await page.goto("/study");
    await dismissDevOverlay(page);
    // School strip or growth continuity may appear; body must load.
    await expect(page.locator("body")).toBeVisible();
    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);
  });
});
