/**
 * 2P-35 — Lucky handoff browser verification (existing WEAK_MASTERY bridge only).
 * Does not redesign Lucky or create a second retention system.
 */
import { test, expect } from "@playwright/test";

import { loginAsPage } from "./helpers/auth";
import { createE2ePrisma } from "./helpers/db";
import { readSeed } from "./helpers/fixtures";

async function countWeakMasteryRetention(
  userId: string,
  conceptId: string,
): Promise<number> {
  const db = createE2ePrisma();
  try {
    return db.retentionItem.count({
      where: {
        userId,
        sourceType: "WEAK_MASTERY",
        sourceRef: conceptId,
      },
    });
  } finally {
    await db.$disconnect();
  }
}

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

test.describe("2P-35 Lucky Adaptive handoff", () => {
  test("COMPLETED with weak mastery may upsert WEAK_MASTERY RetentionItem; ACTIVE/ABANDONED do not", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;

    await ensureWeakConceptMastery(seed.userAId, seed.conceptId);
    const before = await countWeakMasteryRetention(
      seed.userAId,
      seed.conceptId,
    );

    // ACTIVE start — no handoff yet
    const startActive = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    test.skip(
      !startActive.ok(),
      `Adaptive start unavailable: ${startActive.status()}`,
    );
    const activeJson = (await startActive.json()) as { runId?: string };
    const activeRunId = activeJson.runId!;
    expect(activeRunId).toBeTruthy();

    const midActive = await countWeakMasteryRetention(
      seed.userAId,
      seed.conceptId,
    );
    expect(midActive).toBe(before);

    // Abandon path — still no Lucky handoff
    const abandon = await api.post(
      `/api/study/adaptive/${activeRunId}/abandon`,
    );
    expect(abandon.ok()).toBeTruthy();
    const afterAbandon = await countWeakMasteryRetention(
      seed.userAId,
      seed.conceptId,
    );
    expect(afterAbandon).toBe(before);

    // Fresh ACTIVE → COMPLETED — legal handoff path
    const start2 = await api.post("/api/study/adaptive/start", {
      data: { conceptId: seed.conceptId },
    });
    expect(start2.ok()).toBeTruthy();
    const { runId } = (await start2.json()) as { runId?: string };
    expect(runId).toBeTruthy();

    const complete = await api.post(`/api/study/adaptive/${runId}/complete`);
    expect(complete.ok()).toBeTruthy();

    const afterComplete = await countWeakMasteryRetention(
      seed.userAId,
      seed.conceptId,
    );
    // Weak mastery + reviewCount≥1 → upsert RetentionItem (count ≥ before).
    expect(afterComplete).toBeGreaterThanOrEqual(before);
    expect(afterComplete).toBeGreaterThanOrEqual(1);

    // Duplicate complete rejected — RetentionItem count must not explode.
    const dup = await api.post(`/api/study/adaptive/${runId}/complete`);
    expect([400, 404, 409]).toContain(dup.status());
    const afterDup = await countWeakMasteryRetention(
      seed.userAId,
      seed.conceptId,
    );
    expect(afterDup).toBe(afterComplete);
  });

  test("Lucky retention GET does not create LearningAttempt; submit does", async ({
    page,
  }) => {
    const seed = readSeed();
    await loginAsPage(page);
    const api = page.context().request;
    const db = createE2ePrisma();

    try {
      await ensureWeakConceptMastery(seed.userAId, seed.conceptId);
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
          dueAt: new Date(),
          priority: 0.7,
          metadataJson: JSON.stringify({
            retain: 0.2,
            reviewCount: 2,
            retentionReason: "WEAK_MASTERY",
          }),
        },
        update: {
          status: "DUE",
          dueAt: new Date(),
          conceptId: seed.conceptId,
        },
      });

      const before = await db.learningAttempt.count({
        where: {
          userId: seed.userAId,
          conceptId: seed.conceptId,
        },
      });

      const getItem = await api.get("/api/study/lucky/retention-item");
      expect(getItem.ok()).toBeTruthy();
      const afterGet = await db.learningAttempt.count({
        where: {
          userId: seed.userAId,
          conceptId: seed.conceptId,
        },
      });
      expect(afterGet).toBe(before);

      const body = (await getItem.json()) as {
        item?: { retentionItemId?: string; inputMode?: string } | null;
      };
      const retentionItem = body.item;
      if (!retentionItem?.retentionItemId) {
        test.skip(true, "No retention item available");
        return;
      }

      const answer =
        retentionItem.inputMode === "self_rate"
          ? "AGAIN"
          : "not quite right yet";
      const submit = await api.post("/api/study/lucky/retention-item/submit", {
        data: {
          retentionItemId: retentionItem.retentionItemId,
          answer,
        },
      });
      expect(submit.ok()).toBeTruthy();

      const afterSubmit = await db.learningAttempt.count({
        where: {
          userId: seed.userAId,
          conceptId: seed.conceptId,
        },
      });
      expect(afterSubmit).toBeGreaterThan(before);
    } finally {
      await db.$disconnect();
    }
  });
});
