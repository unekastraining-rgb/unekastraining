import fs from "node:fs";
import path from "node:path";

import { encodeSession, SESSION_COOKIE_NAME } from "./session";
import {
  createE2ePrisma,
  E2E_USER_B_EMAIL,
  E2E_USER_EMAIL,
} from "./db";

export type E2eSeed = {
  userAId: string;
  conceptId: string;
  courseId: string;
  topicId: string;
  materialId: string;
  /** 2P-31 — optional; present after seed refresh. */
  assignmentId?: string;
};

export function readSeed(): E2eSeed {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "e2e", ".seed.json"),
    "utf8",
  );
  return JSON.parse(raw) as E2eSeed;
}

/** Fallback cookie when API login is unavailable — signed with E2E_SESSION_SECRET. */
export function sessionCookieForUser(userId: string) {
  const token = encodeSession({
    userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}

export async function countAttemptsForConcept(conceptId: string) {
  const db = createE2ePrisma();
  try {
    return db.learningAttempt.count({ where: { conceptId } });
  } finally {
    await db.$disconnect();
  }
}

/** Seed an ACTIVE Adaptive run with a forced universal intervention (E2E only). */
export async function createE2eAdaptiveRun(input: {
  userId: string;
  conceptId: string;
  intervention: string;
}) {
  const db = createE2ePrisma();
  try {
    return db.adaptiveSequenceRun.create({
      data: {
        userId: input.userId,
        conceptId: input.conceptId,
        status: "ACTIVE",
        currentStepIndex: 0,
        stepsJson: JSON.stringify([
          { intervention: input.intervention, learningObjectId: null },
        ]),
        interventionHistoryJson: "[]",
        lastAttemptId: null,
      },
      select: { id: true, status: true, conceptId: true },
    });
  } finally {
    await db.$disconnect();
  }
}

export async function getAdaptiveRunStatus(runId: string) {
  const db = createE2ePrisma();
  try {
    const run = await db.adaptiveSequenceRun.findUnique({
      where: { id: runId },
      select: { status: true, currentStepIndex: true },
    });
    return run;
  } finally {
    await db.$disconnect();
  }
}

export async function getMasteryForConcept(userId: string, conceptId: string) {
  const db = createE2ePrisma();
  try {
    return db.conceptMastery.findUnique({
      where: { userId_conceptId: { userId, conceptId } },
    });
  } finally {
    await db.$disconnect();
  }
}

export async function getUserIdByEmail(email: string) {
  const db = createE2ePrisma();
  try {
    const user = await db.user.findUnique({ where: { email } });
    return user?.id ?? null;
  } finally {
    await db.$disconnect();
  }
}

export { E2E_USER_B_EMAIL, E2E_USER_EMAIL, createE2ePrisma as getE2ePrisma };
