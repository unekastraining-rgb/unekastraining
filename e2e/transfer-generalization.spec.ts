/**
 * 2P-46 — Transfer across contexts (math linear equations).
 * Context A success → alternate context B recommended → B evidence recorded.
 * Open ≠ evidence; idempotent replay safe; ownership enforced.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma, E2E_USER_B_EMAIL } from "./helpers/db";
import { readSeed, sessionCookieForUser } from "./helpers/fixtures";

function stepsForChallenge(id: string): string[] {
  switch (id) {
    case "math-linear-subtract":
      return ["3x - 7 = 11", "3x = 18", "x = 6"];
    case "math-linear-distribute":
      return ["5(x + 2) = 25", "5x + 10 = 25", "5x = 15", "x = 3"];
    case "math-linear-both-sides":
      return ["2x + 3 = x + 9", "x + 3 = 9", "x = 6"];
    case "math-linear-retain":
      return ["4x + 8 = 0", "4x = -8", "x = -2"];
    default:
      return ["2x + 4 = 10", "2x = 6", "x = 3"];
  }
}

test.describe("2P-46 Transfer across contexts", () => {
  test("success in context A soft-prefers alternate B; both write LearningAttempt", async ({
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
          title: "Linear equation solving",
        },
        select: { id: true },
      });

      const before = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: concept.id },
      });

      const open = await page.goto(
        `/study/activities/math?conceptId=${concept.id}`,
      );
      expect(open?.ok()).toBeTruthy();
      expect(
        await db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: concept.id },
        }),
      ).toBe(before);

      const listA = await api.get(
        `/api/study/activities/math?conceptId=${concept.id}`,
      );
      expect(listA.ok()).toBeTruthy();
      const jsonA = (await listA.json()) as {
        data?: { recommendedContentId?: string | null };
      };
      const contentA =
        jsonA.data?.recommendedContentId ?? "math-linear-basic";

      const idemA = `e2e-transfer-a-${concept.id}-${Date.now()}`;
      const submitA = await api.post("/api/study/activities/math", {
        headers: { "X-Idempotency-Key": idemA },
        data: {
          challengeId: contentA,
          conceptId: concept.id,
          steps: stepsForChallenge(contentA),
          explanation: "Isolate x with both-sides transforms.",
          outcome: "FAIL",
          score: 0,
          learnerId: "forged",
        },
      });
      expect(submitA.ok()).toBeTruthy();
      const bodyA = (await submitA.json()) as {
        data?: {
          completion?: { learningAttemptId?: string; outcome?: string };
          rejectedForgeryKeys?: string[];
        };
      };
      expect(bodyA.data?.completion?.learningAttemptId).toBeTruthy();
      expect(bodyA.data?.completion?.outcome).toBe("SUCCESS");
      expect(bodyA.data?.rejectedForgeryKeys?.length ?? 0).toBeGreaterThan(0);

      const afterA = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: concept.id },
      });
      expect(afterA).toBe(before + 1);

      const attemptA = await db.learningAttempt.findFirst({
        where: {
          id: bodyA.data!.completion!.learningAttemptId!,
        },
        select: { sourceRefJson: true },
      });
      const refA = JSON.parse(String(attemptA?.sourceRefJson ?? "{}")) as {
        contextVariant?: string;
        contentKey?: string;
        contentId?: string;
      };
      expect(refA.contextVariant || refA.contentId).toBeTruthy();

      const listB = await api.get(
        `/api/study/activities/math?conceptId=${concept.id}`,
      );
      expect(listB.ok()).toBeTruthy();
      const jsonB = (await listB.json()) as {
        data?: {
          recommendedContentId?: string | null;
          transferHints?: {
            avoidContextVariant?: string | null;
            excludeContentKeys?: string[];
          };
        };
      };
      expect(jsonB.data?.transferHints?.avoidContextVariant).toBeTruthy();
      const contentB = jsonB.data?.recommendedContentId;
      expect(contentB).toBeTruthy();
      expect(contentB).not.toBe(contentA);

      const idemB = `e2e-transfer-b-${concept.id}-${Date.now()}`;
      const submitB = await api.post("/api/study/activities/math", {
        headers: { "X-Idempotency-Key": idemB },
        data: {
          challengeId: contentB,
          conceptId: concept.id,
          steps: stepsForChallenge(String(contentB)),
          explanation: "Transfer practice in an alternate equation context.",
        },
      });
      expect(submitB.ok()).toBeTruthy();
      const bodyB = (await submitB.json()) as {
        data?: {
          completion?: { learningAttemptId?: string; outcome?: string };
        };
      };
      expect(bodyB.data?.completion?.learningAttemptId).toBeTruthy();

      expect(
        await db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: concept.id },
        }),
      ).toBe(before + 2);

      const replay = await api.post("/api/study/activities/math", {
        headers: { "X-Idempotency-Key": idemB },
        data: {
          challengeId: contentB,
          conceptId: concept.id,
          steps: stepsForChallenge(String(contentB)),
        },
      });
      expect(replay.ok()).toBeTruthy();
      const replayJson = (await replay.json()) as { idempotent?: boolean };
      expect(replayJson.idempotent).toBe(true);
      expect(
        await db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: concept.id },
        }),
      ).toBe(before + 2);

      const mastery = await db.conceptMastery.findFirst({
        where: { userId: seed.userAId, conceptId: concept.id },
      });
      expect(mastery).toBeTruthy();

      // Foreign ownership: user B cannot use user A's concept.
      const userB = await db.user.findFirst({
        where: { email: E2E_USER_B_EMAIL },
        select: { id: true },
      });
      expect(userB?.id).toBeTruthy();
      await page.context().clearCookies();
      await page.context().addCookies([sessionCookieForUser(userB!.id)]);
      const foreign = await page.context().request.post(
        "/api/study/activities/math",
        {
          data: {
            challengeId: contentB,
            conceptId: concept.id,
            steps: stepsForChallenge(String(contentB)),
          },
        },
      );
      expect(foreign.status()).toBe(403);
    } finally {
      await db.$disconnect();
    }
  });
});
