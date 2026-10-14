/**
 * 2P-34 — Optional activity submit idempotency (presentation/API hardening).
 *
 * When clients send `X-Idempotency-Key`, replay the prior completion instead of
 * creating a second LearningAttempt. Process-local cache + recent DB scan.
 * Does not change evaluation semantics when the header is absent.
 */

import { db } from "@/lib/db";

export type IdempotentActivityCompletion = {
  learningAttemptId: string;
  conceptId: string;
  outcome: string;
  score: number | null;
};

type CacheEntry = {
  completion: IdempotentActivityCompletion;
  at: number;
};

const MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
const memory = new Map<string, CacheEntry>();

function cacheKey(
  learnerId: string,
  conceptId: string,
  challengeId: string,
  idempotencyKey: string,
): string {
  return `${learnerId}|${conceptId}|${challengeId}|${idempotencyKey}`;
}

export function normalizeIdempotencyKey(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (key.length < 8 || key.length > 128) return null;
  if (!/^[a-zA-Z0-9._:-]+$/.test(key)) return null;
  return key;
}

export function rememberIdempotentActivityCompletion(
  learnerId: string,
  conceptId: string,
  challengeId: string,
  idempotencyKey: string,
  completion: IdempotentActivityCompletion,
): void {
  memory.set(cacheKey(learnerId, conceptId, challengeId, idempotencyKey), {
    completion,
    at: Date.now(),
  });
}

export function peekIdempotentActivityCompletion(
  learnerId: string,
  conceptId: string,
  challengeId: string,
  idempotencyKey: string,
): IdempotentActivityCompletion | null {
  const hit = memory.get(
    cacheKey(learnerId, conceptId, challengeId, idempotencyKey),
  );
  if (!hit) return null;
  if (Date.now() - hit.at > MEMORY_TTL_MS) {
    memory.delete(cacheKey(learnerId, conceptId, challengeId, idempotencyKey));
    return null;
  }
  return hit.completion;
}

/**
 * Scan recent attempts for a matching idempotencyKey in sourceRefJson.
 * Best-effort durable fallback when process memory is cold.
 */
export async function findRecentIdempotentActivityCompletion(input: {
  learnerId: string;
  conceptId: string;
  challengeId: string;
  idempotencyKey: string;
}): Promise<IdempotentActivityCompletion | null> {
  const mem = peekIdempotentActivityCompletion(
    input.learnerId,
    input.conceptId,
    input.challengeId,
    input.idempotencyKey,
  );
  if (mem) return mem;

  const since = new Date(Date.now() - MEMORY_TTL_MS);
  const rows = await db.learningAttempt.findMany({
    where: {
      userId: input.learnerId,
      conceptId: input.conceptId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      conceptId: true,
      outcome: true,
      score: true,
      sourceRefJson: true,
    },
  });

  for (const row of rows) {
    try {
      const ref = JSON.parse(row.sourceRefJson) as {
        idempotencyKey?: unknown;
        id?: unknown;
        activityId?: unknown;
      };
      if (ref.idempotencyKey !== input.idempotencyKey) continue;
      const activityId =
        typeof ref.activityId === "string"
          ? ref.activityId
          : typeof ref.id === "string"
            ? ref.id
            : "";
      if (activityId && activityId !== input.challengeId) continue;
      const completion: IdempotentActivityCompletion = {
        learningAttemptId: row.id,
        conceptId: row.conceptId ?? input.conceptId,
        outcome: row.outcome,
        score: row.score,
      };
      rememberIdempotentActivityCompletion(
        input.learnerId,
        input.conceptId,
        input.challengeId,
        input.idempotencyKey,
        completion,
      );
      return completion;
    } catch {
      /* ignore malformed */
    }
  }
  return null;
}
