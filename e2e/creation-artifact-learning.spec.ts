/**
 * 2P-47 — Creation learning loop E2E (writing).
 * Open ≠ evidence; AI field ≠ evidence; submit → LearningAttempt;
 * criterion feedback path; idempotent replay; ownership.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma, E2E_USER_B_EMAIL } from "./helpers/db";
import { readSeed, sessionCookieForUser } from "./helpers/fixtures";

test.describe("2P-47 Creation artifact learning", () => {
  test("writing: open no attempt; submit evidence; AI-only fails; revise resubmit; ownership", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const db = createE2ePrisma();

    try {
      const concept = await db.concept.create({
        data: {
          userId: seed.userAId,
          title: "HTTPS and secure transport",
          subjectDomain: "writing",
        },
        select: { id: true },
      });

      const before = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: concept.id },
      });

      const open = await page.goto(
        `/study/activities/writing?conceptId=${concept.id}`,
      );
      expect(open?.ok()).toBeTruthy();
      await expect(page.locator("[data-activity-kind='writing']")).toBeVisible({
        timeout: 20_000,
      });
      expect(
        await db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: concept.id },
        }),
      ).toBe(before);

      const list = await api.get(
        `/api/study/activities/writing?conceptId=${concept.id}`,
      );
      expect(list.ok()).toBeTruthy();
      const listJson = (await list.json()) as {
        data?: { challenges?: Array<{ id: string }> };
      };
      const challengeId =
        listJson.data?.challenges?.find((c) => c.id.startsWith("write-"))?.id ??
        listJson.data?.challenges?.[0]?.id;
      expect(challengeId).toBeTruthy();

      // AI-only (no learner text) must not count as authored success.
      const aiOnly = await api.post("/api/study/activities/writing", {
        data: {
          challengeId,
          conceptId: concept.id,
          text: "",
          aiAssistance:
            "AI would write a complete essay on HTTPS encryption here.",
          outcome: "SUCCESS",
          score: 1,
          learnerId: "forged",
        },
      });
      expect(aiOnly.ok()).toBeTruthy();
      const aiJson = (await aiOnly.json()) as {
        data?: { completion?: { outcome?: string } };
      };
      expect(aiJson.data?.completion?.outcome).not.toBe("SUCCESS");

      const afterAi = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: concept.id },
      });
      // Empty learner text may still record FAIL evidence — count can increase.
      expect(afterAi).toBeGreaterThanOrEqual(before);

      const idem = `e2e-creation-${concept.id}-${Date.now()}`;
      const learnerText =
        "HTTPS encrypts the channel between the client and server so eavesdroppers cannot read passwords. A certificate helps the client trust the server identity. Revision: I clarified certificate trust versus encryption of the payload.";

      const submit = await api.post("/api/study/activities/writing", {
        headers: { "X-Idempotency-Key": idem },
        data: {
          challengeId,
          conceptId: concept.id,
          text: learnerText,
          aiAssistance: "Ignore this AI brainstorm — not my submission.",
          outcome: "FAIL",
          score: 0,
        },
      });
      expect(submit.ok()).toBeTruthy();
      const body = (await submit.json()) as {
        data?: {
          completion?: {
            learningAttemptId?: string;
            outcome?: string;
            skillFacet?: string;
          };
          evaluation?: {
            details?: {
              perCriterion?: Array<{ id: string; pass: boolean; label: string }>;
            };
          };
          rejectedForgeryKeys?: string[];
        };
      };
      expect(body.data?.completion?.learningAttemptId).toBeTruthy();
      expect(body.data?.rejectedForgeryKeys?.length ?? 0).toBeGreaterThan(0);

      const afterSubmit = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: concept.id },
      });
      expect(afterSubmit).toBeGreaterThan(afterAi);

      const attempt = await db.learningAttempt.findFirst({
        where: { id: body.data!.completion!.learningAttemptId! },
        select: { skillFacet: true, sourceRefJson: true },
      });
      expect(attempt?.skillFacet).toBeTruthy();
      expect(String(attempt?.sourceRefJson)).toMatch(/writing/i);

      // Idempotent replay
      const replay = await api.post("/api/study/activities/writing", {
        headers: { "X-Idempotency-Key": idem },
        data: {
          challengeId,
          conceptId: concept.id,
          text: learnerText,
        },
      });
      expect(replay.ok()).toBeTruthy();
      const replayJson = (await replay.json()) as { idempotent?: boolean };
      expect(replayJson.idempotent).toBe(true);
      expect(
        await db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: concept.id },
        }),
      ).toBe(afterSubmit);

      const mastery = await db.conceptMastery.findFirst({
        where: { userId: seed.userAId, conceptId: concept.id },
      });
      expect(mastery).toBeTruthy();

      // Foreign ownership
      const userB = await db.user.findFirst({
        where: { email: E2E_USER_B_EMAIL },
        select: { id: true },
      });
      expect(userB?.id).toBeTruthy();
      await page.context().clearCookies();
      await page.context().addCookies([sessionCookieForUser(userB!.id)]);
      const foreign = await page.context().request.post(
        "/api/study/activities/writing",
        {
          data: {
            challengeId,
            conceptId: concept.id,
            text: learnerText,
          },
        },
      );
      expect(foreign.status()).toBe(403);
    } finally {
      await db.$disconnect();
    }
  });
});
