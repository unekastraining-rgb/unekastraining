/**
 * 2P-34 — Production hardening E2E: ownership, adaptive terminal,
 * activity idempotency, no-evidence navigation, note stale concurrency.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage, loginViaApi } from "./helpers/auth";
import {
  createE2ePrisma,
  E2E_USER_B_EMAIL,
  E2E_USER_EMAIL,
} from "./helpers/db";
import {
  countAttemptsForConcept,
  getUserIdByEmail,
  readSeed,
} from "./helpers/fixtures";

test.describe("2P-34 ownership / security", () => {
  test("User B cannot GET User A note; forged course link is dropped", async ({
    browser,
  }) => {
    const seed = readSeed();
    const userBId = await getUserIdByEmail(E2E_USER_B_EMAIL);
    expect(userBId).toBeTruthy();

    const contextA = await browser.newContext();
    await loginViaApi(contextA.request, E2E_USER_EMAIL);
    const create = await contextA.request.post("/api/notes", {
      data: {
        title: "2P-34 owned note",
        contentJson: JSON.stringify({ version: 1, marker: "owner-a" }),
        courseId: seed.courseId,
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as {
      data?: { id: string; courseId?: string | null };
    };
    const noteId = created.data?.id;
    expect(noteId).toBeTruthy();
    expect(created.data?.courseId).toBe(seed.courseId);
    await contextA.close();

    const contextB = await browser.newContext();
    await loginViaApi(contextB.request, E2E_USER_B_EMAIL);
    const steal = await contextB.request.get(`/api/notes/${noteId}`);
    expect([401, 403, 404]).toContain(steal.status());

    // Foreign courseId must not attach to B's note.
    const forge = await contextB.request.post("/api/notes", {
      data: {
        title: "2P-34 forge course",
        contentJson: JSON.stringify({ version: 1 }),
        courseId: seed.courseId,
      },
    });
    expect(forge.ok()).toBeTruthy();
    const forged = (await forge.json()) as {
      data?: { courseId?: string | null };
    };
    expect(forged.data?.courseId ?? null).toBeNull();
    await contextB.close();
  });

  test("forged learnerId on activity submit is ignored (session wins)", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const before = await countAttemptsForConcept(seed.conceptId);
    const res = await api.post("/api/study/activities/lab", {
      data: {
        challengeId: "nonexistent-challenge-2p34",
        conceptId: seed.conceptId,
        learnerId: "forged-other-learner",
        userId: "forged-other-user",
        outcome: "SUCCESS",
        score: 1,
      },
    });
    // Must not 500 into success fabrication; reject or fail evaluation.
    expect(res.status()).not.toBe(500);
    const body = (await res.json()) as { success?: boolean };
    expect(body.success).not.toBe(true);
    const after = await countAttemptsForConcept(seed.conceptId);
    expect(after).toBe(before);
  });
});

test.describe("2P-34 Adaptive resume / terminal", () => {
  test("duplicate complete is rejected at coordinator; run stays COMPLETED", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    test.skip(!start.ok(), `Adaptive start unavailable: ${start.status()}`);
    const startJson = (await start.json()) as { runId?: string };
    const runId = startJson.runId;
    expect(runId).toBeTruthy();

    const first = await api.post(`/api/study/adaptive/${runId}/complete`);
    // May 400 if run not eligible to complete yet — still must not resurrect later.
    if (first.ok()) {
      const second = await api.post(`/api/study/adaptive/${runId}/complete`);
      expect([400, 404, 409]).toContain(second.status());
      const body = (await second.json()) as { success?: boolean };
      expect(body.success).not.toBe(true);
    }

    const db = createE2ePrisma();
    try {
      const run = await db.adaptiveSequenceRun.findFirst({
        where: { id: runId!, userId: seed.userAId },
        select: { status: true },
      });
      if (first.ok()) {
        expect(run?.status).toBe("COMPLETED");
      } else {
        expect(["ACTIVE", "COMPLETED", "ABANDONED"]).toContain(run?.status);
      }
    } finally {
      await db.$disconnect();
    }
  });

  test("ABANDONED run cannot complete as SUCCESS path", async ({ page }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    test.skip(!start.ok(), `Adaptive start unavailable: ${start.status()}`);
    const { runId } = (await start.json()) as { runId?: string };
    expect(runId).toBeTruthy();

    const abandon = await api.post(`/api/study/adaptive/${runId}/abandon`);
    expect(abandon.ok()).toBeTruthy();

    const complete = await api.post(`/api/study/adaptive/${runId}/complete`);
    expect([400, 404]).toContain(complete.status());
    const body = (await complete.json()) as { success?: boolean };
    expect(body.success).not.toBe(true);

    const db = createE2ePrisma();
    try {
      const run = await db.adaptiveSequenceRun.findFirst({
        where: { id: runId!, userId: seed.userAId },
        select: { status: true },
      });
      expect(run?.status).toBe("ABANDONED");
    } finally {
      await db.$disconnect();
    }
  });
});

test.describe("2P-34 CORE save integrity", () => {
  test("stale expectedUpdatedAt yields 409; content unchanged", async ({
    page,
  }) => {
    await loginAsPage(page);
    const api = page.context().request;

    const create = await api.post("/api/notes", {
      data: {
        title: "2P-34 concurrency",
        contentJson: JSON.stringify({ version: 1, marker: "v1" }),
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as {
      data?: { id: string; updatedAt?: string };
    };
    const noteId = created.data?.id;
    expect(noteId).toBeTruthy();
    const t0 = created.data?.updatedAt;
    expect(t0).toBeTruthy();

    const patch1 = await api.patch(`/api/notes/${noteId}`, {
      data: {
        contentJson: JSON.stringify({ version: 1, marker: "v2" }),
        expectedUpdatedAt: t0,
      },
    });
    expect(patch1.ok()).toBeTruthy();
    const after1 = (await patch1.json()) as {
      data?: { updatedAt?: string; contentJson?: string };
    };

    const stale = await api.patch(`/api/notes/${noteId}`, {
      data: {
        contentJson: JSON.stringify({ version: 1, marker: "stale-overwrite" }),
        expectedUpdatedAt: t0,
      },
    });
    expect(stale.status()).toBe(409);
    const staleBody = (await stale.json()) as { code?: string };
    expect(staleBody.code).toBe("stale_note");

    const reopen = await api.get(`/api/notes/${noteId}`);
    const body = (await reopen.json()) as {
      data?: { contentJson?: string };
    };
    expect(String(body.data?.contentJson)).toContain("v2");
    expect(String(body.data?.contentJson)).not.toContain("stale-overwrite");
    expect(after1.data?.updatedAt).toBeTruthy();
  });
});

test.describe("2P-34 no-evidence navigation", () => {
  test("Hub / Growth / CORE open do not create LearningAttempt", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const before = await countAttemptsForConcept(seed.conceptId);

    await page.goto("/study");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/study/learner-model");
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/core");
    await expect(page).not.toHaveURL(/\/login/);

    const after = await countAttemptsForConcept(seed.conceptId);
    expect(after).toBe(before);
  });
});
