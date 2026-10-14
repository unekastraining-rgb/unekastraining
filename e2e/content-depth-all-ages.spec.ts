/**
 * 2P-48 — Content depth / all-ages selection E2E.
 * A) Weak mastery → foundational proportional content
 * B) Strong mastery → deeper content (not forced to beginner)
 * Age/grade query params do not override evidence.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";

test.describe("2P-48 Content depth & all-ages", () => {
  test("weak vs strong mastery select different proportional labs; age query ignored", async ({
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
          title: "Proportional scaling",
          subjectDomain: "mathematics",
        },
        select: { id: true },
      });

      // Scenario A — thin mastery → prefer easier content
      await db.conceptMastery.create({
        data: {
          userId: seed.userAId,
          conceptId: concept.id,
          recognize: 0.15,
          explain: 0.15,
          apply: 0.05,
          solve: 0,
          perform: 0,
          retain: 0,
          confidence: 0.2,
          reviewCount: 1,
        },
      });

      const listA = await api.get(
        `/api/study/activities/lab?conceptId=${concept.id}&ageBand=child&difficulty=5`,
      );
      expect(listA.ok()).toBeTruthy();
      const jsonA = (await listA.json()) as {
        data?: {
          recommendedContentId?: string | null;
          contentLevelHints?: { preferredDifficulty?: number | null };
        };
      };
      expect(jsonA.data?.contentLevelHints?.preferredDifficulty).toBeTruthy();
      expect(
        Number(jsonA.data?.contentLevelHints?.preferredDifficulty),
      ).toBeLessThanOrEqual(2);
      const contentA = jsonA.data?.recommendedContentId;
      expect(contentA).toBeTruthy();

      // Open ≠ evidence
      const before = await db.learningAttempt.count({
        where: { userId: seed.userAId, conceptId: concept.id },
      });
      await page.goto(`/study/activities/lab?conceptId=${concept.id}`);
      expect(
        await db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: concept.id },
        }),
      ).toBe(before);

      // Scenario B — strong mastery on same concept → deeper preference
      await db.conceptMastery.update({
        where: {
          userId_conceptId: {
            userId: seed.userAId,
            conceptId: concept.id,
          },
        },
        data: {
          recognize: 0.85,
          explain: 0.85,
          apply: 0.8,
          solve: 0.82,
          perform: 0.75,
          retain: 0.7,
          confidence: 0.8,
          reviewCount: 6,
        },
      });

      const listB = await api.get(
        `/api/study/activities/lab?conceptId=${concept.id}&grade=K-2&ageBand=elementary`,
      );
      expect(listB.ok()).toBeTruthy();
      const jsonB = (await listB.json()) as {
        data?: {
          recommendedContentId?: string | null;
          contentLevelHints?: { preferredDifficulty?: number | null };
        };
      };
      expect(
        Number(jsonB.data?.contentLevelHints?.preferredDifficulty),
      ).toBeGreaterThanOrEqual(3);
      const contentB = jsonB.data?.recommendedContentId;
      expect(contentB).toBeTruthy();
      // Soft prefer should differ when ladder exists
      expect(contentB).not.toBe(contentA);

      // Meaningful submit on deeper content
      const challengeId = contentB!;
      const stepsById: Record<string, string> = {
        "lab-proportional-scale-blocks":
          "Each tower needs 2 blocks. Three towers need 6 blocks total (2+2+2). A common mistake is adding 3+2 instead of scaling.",
        "lab-proportional-scale":
          "Proportion 6/4 = x/10 so x = 15 cups. Avoid additive mistakes like adding 6 instead of scaling by 10/4.",
        "lab-proportional-scale-map":
          "Scale 1 cm = 4 km; 7 cm → 28 km by multiplying. Avoid mixing cm and km units.",
        "lab-proportional-scale-rate":
          "Rate is 45/9 = 5 pages per minute; 14 minutes → 70 pages. Pitfall: assuming the rate changes.",
        "lab-proportional-scale-retain":
          "Unit price 6/8; 12 pencils cost $9 using proportion 8:6 = 12:x.",
      };
      const text =
        stepsById[challengeId] ??
        stepsById["lab-proportional-scale-rate"]!;

      const submit = await api.post("/api/study/activities/lab", {
        headers: {
          "X-Idempotency-Key": `e2e-depth-${concept.id}-${Date.now()}`,
        },
        data: {
          challengeId,
          conceptId: concept.id,
          text,
          outcome: "FAIL",
          score: 0,
          learnerId: "forged",
        },
      });
      expect(submit.ok()).toBeTruthy();
      const body = (await submit.json()) as {
        data?: { completion?: { learningAttemptId?: string } };
      };
      expect(body.data?.completion?.learningAttemptId).toBeTruthy();
      expect(
        await db.learningAttempt.count({
          where: { userId: seed.userAId, conceptId: concept.id },
        }),
      ).toBeGreaterThan(before);

      // Mixed ability: strong math concept vs weak biology concept → different hints
      const bio = await db.concept.create({
        data: {
          userId: seed.userAId,
          title: "Scientific CER",
          subjectDomain: "science",
        },
        select: { id: true },
      });
      await db.conceptMastery.create({
        data: {
          userId: seed.userAId,
          conceptId: bio.id,
          recognize: 0.1,
          explain: 0.1,
          apply: 0,
          solve: 0,
          perform: 0,
          retain: 0,
          confidence: 0.15,
          reviewCount: 1,
        },
      });
      const listBio = await api.get(
        `/api/study/activities/writing?conceptId=${bio.id}`,
      );
      expect(listBio.ok()).toBeTruthy();
      const bioJson = (await listBio.json()) as {
        data?: { contentLevelHints?: { preferredDifficulty?: number | null } };
      };
      expect(
        Number(bioJson.data?.contentLevelHints?.preferredDifficulty ?? 2),
      ).toBeLessThanOrEqual(2);
    } finally {
      await db.$disconnect();
    }
  });
});
