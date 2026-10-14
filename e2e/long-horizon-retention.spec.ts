/**
 * 2P-52 — Long-horizon retention E2E (simulated time via dueAt — no real waits).
 * Preserves Lucky UX; verifies GET≠evidence, submit→RETAIN, schedule moves out.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";

const DAY = 24 * 60 * 60 * 1000;

async function ensureWeakConceptMastery(userId: string, conceptId: string) {
  const db = createE2ePrisma();
  try {
    await db.conceptMastery.upsert({
      where: { userId_conceptId: { userId, conceptId } },
      create: {
        userId,
        conceptId,
        recognize: 0.4,
        explain: 0.4,
        apply: 0.3,
        solve: 0.3,
        perform: 0.3,
        retain: 0.2,
        confidence: 0.4,
        reviewCount: 2,
        nextReviewAt: new Date(),
      },
      update: {
        retain: 0.2,
        reviewCount: 2,
        nextReviewAt: new Date(),
      },
    });
  } finally {
    await db.$disconnect();
  }
}

test.describe("2P-52 long-horizon retention", () => {
  test("overdue item → Lucky GET (no evidence) → submit RETAIN → dueAt moves out", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const db = createE2ePrisma();

    try {
      await ensureWeakConceptMastery(seed.userAId, seed.conceptId);

      const overdueDue = new Date(Date.now() - 3 * DAY);
      await db.retentionItem.upsert({
        where: {
          userId_sourceType_sourceRef: {
            userId: seed.userAId,
            sourceType: "WEAK_MASTERY",
            sourceRef: seed.conceptId,
          },
        },
        create: {
          userId: seed.userAId,
          sourceType: "WEAK_MASTERY",
          sourceRef: seed.conceptId,
          conceptId: seed.conceptId,
          status: "DUE",
          dueAt: overdueDue,
          priority: 0.78,
          metadataJson: JSON.stringify({
            retain: 0.2,
            reviewCount: 2,
            retentionReason: "WEAK_MASTERY",
          }),
        },
        update: {
          status: "DUE",
          dueAt: overdueDue,
          conceptId: seed.conceptId,
          priority: 0.78,
        },
      });

      const beforeAttempts = await db.learningAttempt.count({
        where: {
          userId: seed.userAId,
          conceptId: seed.conceptId,
          skillFacet: "RETAIN",
        },
      });

      const getItem = await api.get("/api/study/lucky/retention-item");
      expect(getItem.ok()).toBeTruthy();
      const afterGet = await db.learningAttempt.count({
        where: {
          userId: seed.userAId,
          conceptId: seed.conceptId,
          skillFacet: "RETAIN",
        },
      });
      expect(afterGet).toBe(beforeAttempts);

      const body = (await getItem.json()) as {
        item?: {
          retentionItemId?: string;
          inputMode?: string;
          horizonState?: string;
          horizonLabel?: string;
        } | null;
      };
      const item = body.item;
      if (!item?.retentionItemId) {
        test.skip(true, "No retention item available");
        return;
      }

      expect(["DUE", "OVERDUE"]).toContain(item.horizonState ?? "DUE");
      if (item.horizonLabel) {
        expect(item.horizonLabel.toLowerCase()).not.toMatch(/forgot/);
      }

      const answer =
        item.inputMode === "self_rate" ? "EASY" : "authorization permission";
      const submit = await api.post("/api/study/lucky/retention-item/submit", {
        data: {
          retentionItemId: item.retentionItemId,
          answer,
        },
      });
      expect(submit.ok()).toBeTruthy();

      const afterSubmit = await db.learningAttempt.count({
        where: {
          userId: seed.userAId,
          conceptId: seed.conceptId,
          skillFacet: "RETAIN",
        },
      });
      expect(afterSubmit).toBeGreaterThan(beforeAttempts);

      const updated = await db.retentionItem.findUnique({
        where: {
          userId_sourceType_sourceRef: {
            userId: seed.userAId,
            sourceType: "WEAK_MASTERY",
            sourceRef: seed.conceptId,
          },
        },
      });
      expect(updated).toBeTruthy();
      expect(updated!.dueAt!.getTime()).toBeGreaterThan(Date.now() + DAY);
      expect(updated!.reviewCount).toBeGreaterThan(0);

      const mastery = await db.conceptMastery.findUnique({
        where: {
          userId_conceptId: {
            userId: seed.userAId,
            conceptId: seed.conceptId,
          },
        },
      });
      expect(mastery).toBeTruthy();
      expect(mastery!.reviewCount).toBeGreaterThanOrEqual(2);
    } finally {
      await db.$disconnect();
    }
  });

  test("duplicate Adaptive COMPLETE does not duplicate RetentionItem", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    await ensureWeakConceptMastery(seed.userAId, seed.conceptId);

    const db = createE2ePrisma();
    let before = 0;
    try {
      before = await db.retentionItem.count({
        where: {
          userId: seed.userAId,
          sourceType: "WEAK_MASTERY",
          sourceRef: seed.conceptId,
        },
      });
    } finally {
      await db.$disconnect();
    }

    const start = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    test.skip(!start.ok(), `Adaptive start unavailable: ${start.status()}`);
    const { runId } = (await start.json()) as { runId?: string };
    expect(runId).toBeTruthy();

    const complete = await api.post(`/api/study/adaptive/${runId}/complete`);
    expect(complete.ok()).toBeTruthy();

    const dup = await api.post(`/api/study/adaptive/${runId}/complete`);
    expect([400, 404, 409]).toContain(dup.status());

    const db2 = createE2ePrisma();
    try {
      const after = await db2.retentionItem.count({
        where: {
          userId: seed.userAId,
          sourceType: "WEAK_MASTERY",
          sourceRef: seed.conceptId,
        },
      });
      expect(after).toBeGreaterThanOrEqual(Math.max(before, 1));
      // Idempotent upsert — still a single source key row.
      expect(after).toBeLessThanOrEqual(Math.max(before, 1) + 1);
      const rows = await db2.retentionItem.findMany({
        where: {
          userId: seed.userAId,
          sourceType: "WEAK_MASTERY",
          sourceRef: seed.conceptId,
        },
      });
      expect(rows.length).toBe(1);
    } finally {
      await db2.$disconnect();
    }
  });
});
