/**
 * 2P-50 E2E — Artifact persistence, multi-file projects, evidence boundary.
 */
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

test.describe("2P-50 Artifact persistence", () => {
  test("CORE: create → patch ink/text → reopen persists contentJson", async ({
    page,
  }) => {
    await loginAsPage(page);
    const api = page.context().request;

    const create = await api.post("/api/notes", {
      data: {
        title: "2P-50 Persist",
        contentJson: JSON.stringify({
          typed: "hello-core",
          strokes: [{ id: "s1", points: [{ x: 1, y: 2 }], color: "#000", size: 2 }],
        }),
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as {
      data?: { id: string; updatedAt?: string };
    };
    const noteId = created.data?.id;
    expect(noteId).toBeTruthy();
    const t0 = created.data?.updatedAt;

    const patch = await api.patch(`/api/notes/${noteId}`, {
      data: {
        contentJson: JSON.stringify({
          typed: "hello-core-saved",
          strokes: [
            { id: "s1", points: [{ x: 1, y: 2 }], color: "#000", size: 2 },
            { id: "s2", points: [{ x: 3, y: 4 }], color: "#111", size: 3 },
          ],
        }),
        expectedUpdatedAt: t0,
      },
    });
    expect(patch.ok()).toBeTruthy();

    await page.goto(`/core?noteId=${noteId}`);
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);

    const reopen = await api.get(`/api/notes/${noteId}`);
    const body = (await reopen.json()) as {
      data?: { contentJson?: string };
    };
    expect(String(body.data?.contentJson)).toContain("hello-core-saved");
    expect(String(body.data?.contentJson)).toContain("s2");
  });

  test("Mobile viewport: CORE open + reload keeps note", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAsPage(page);
    const api = page.context().request;

    const create = await api.post("/api/notes", {
      data: {
        title: "2P-50 Tablet",
        contentJson: JSON.stringify({ typed: "tablet-marker" }),
      },
    });
    const noteId = ((await create.json()) as { data?: { id: string } }).data
      ?.id;
    expect(noteId).toBeTruthy();

    await page.goto(`/core?noteId=${noteId}`);
    await dismissDevOverlay(page);
    await expect(page.locator("body")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await dismissDevOverlay(page);
    await expect(page).not.toHaveURL(/\/login/);

    const reopen = await api.get(`/api/notes/${noteId}`);
    expect(String((await reopen.json()).data?.contentJson)).toContain(
      "tablet-marker",
    );
  });

  test("Multi-file project: A and B save independently; edit ≠ evidence", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const before = await countAttemptsForConcept(seed.conceptId);

    const created = await api.post("/api/projects", {
      data: {
        action: "create",
        title: "2P-50 Project",
        courseId: seed.courseId,
        assignmentId: seed.assignmentId,
      },
    });
    expect(created.ok()).toBeTruthy();
    const proj = (await created.json()) as {
      data?: { projectId: string; updatedAt: string; createsEvidence?: boolean };
    };
    expect(proj.data?.projectId).toBeTruthy();
    expect(proj.data?.createsEvidence).toBe(false);

    const addA = await api.post("/api/projects", {
      data: {
        action: "add-file",
        projectId: proj.data!.projectId,
        fileTitle: "File A",
        expectedUpdatedAt: proj.data!.updatedAt,
      },
    });
    expect(addA.ok()).toBeTruthy();
    const aJson = (await addA.json()) as {
      data?: { fileNoteId: string; updatedAt: string };
    };

    const addB = await api.post("/api/projects", {
      data: {
        action: "add-file",
        projectId: proj.data!.projectId,
        fileTitle: "File B",
        artifactType: "CODE",
        expectedUpdatedAt: aJson.data!.updatedAt,
      },
    });
    expect(addB.ok()).toBeTruthy();
    const bJson = (await addB.json()) as {
      data?: { fileNoteId: string; updatedAt: string };
    };

    const saveA = await api.patch(`/api/notes/${aJson.data!.fileNoteId}`, {
      data: { contentJson: JSON.stringify({ typed: "content-A-only" }) },
    });
    expect(saveA.ok()).toBeTruthy();

    const saveB = await api.patch(`/api/notes/${bJson.data!.fileNoteId}`, {
      data: { contentJson: JSON.stringify({ typed: "content-B-only" }) },
    });
    expect(saveB.ok()).toBeTruthy();

    const getA = await api.get(`/api/notes/${aJson.data!.fileNoteId}`);
    const getB = await api.get(`/api/notes/${bJson.data!.fileNoteId}`);
    expect(String((await getA.json()).data?.contentJson)).toContain(
      "content-A-only",
    );
    expect(String((await getB.json()).data?.contentJson)).toContain(
      "content-B-only",
    );
    expect(String((await getA.json()).data?.contentJson)).not.toContain(
      "content-B-only",
    );

    expect(await countAttemptsForConcept(seed.conceptId)).toBe(before);

    await page.goto(`/core?noteId=${proj.data!.projectId}`);
    await dismissDevOverlay(page);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Foreign project access rejected; client ownerId ignored", async ({
    browser,
  }) => {
    const seed = readSeed();
    const ctxA = await browser.newContext();
    await loginViaApi(ctxA.request);
    const created = await ctxA.request.post("/api/projects", {
      data: { action: "create", title: "Owner A project" },
    });
    const projectId = ((await created.json()) as { data?: { projectId: string } })
      .data?.projectId;
    expect(projectId).toBeTruthy();
    await logoutContext(ctxA);
    await ctxA.close();

    const ctxB = await browser.newContext();
    await loginViaApi(ctxB.request, E2E_USER_B_EMAIL, "E2E Learner B");
    const steal = await ctxB.request.get(
      `/api/projects?projectId=${projectId}`,
    );
    expect([403, 404]).toContain(steal.status());

    const forge = await ctxB.request.post("/api/projects", {
      data: {
        action: "add-file",
        projectId,
        fileTitle: "Hijack",
        userId: seed.userAId,
        ownerId: seed.userAId,
      },
    });
    expect([403, 404]).toContain(forge.status());
    await logoutContext(ctxB);
    await ctxB.close();
  });
});
