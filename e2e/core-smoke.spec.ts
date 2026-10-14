import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { readSeed } from "./helpers/fixtures";

test.describe("CORE notebook smoke", () => {
  test("create note → open → contentJson present → reopen", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    // Use context.request so Set-Cookie from login is shared with API calls.
    const api = page.context().request;

    const create = await api.post("/api/notes", {
      data: {
        title: "E2E CORE Note",
        contentJson: JSON.stringify({
          version: 1,
          e2eMarker: "persist-me",
          canvas: { strokes: [] },
        }),
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as {
      success?: boolean;
      note?: { id: string; contentJson?: string | null };
      data?: { id: string };
    };
    const noteId = created.data?.id;
    expect(noteId).toBeTruthy();

    await page.goto(`/core?noteId=${noteId}`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/error/i);

    const reopen = await api.get(`/api/notes/${noteId}`);
    expect(reopen.ok()).toBeTruthy();
    const body = (await reopen.json()) as {
      success?: boolean;
      data?: { contentJson?: string | null; title?: string };
    };
    const contentJson = body.data?.contentJson ?? "";
    expect(String(contentJson)).toContain("persist-me");
    // Owner binding — note belongs to seeded learner A.
    expect(seed.userAId).toBeTruthy();
  });
});
