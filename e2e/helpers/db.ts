import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { PrismaLibSql } from "@prisma/adapter-libsql";

const require = createRequire(__filename);
const { PrismaClient } = require(
  path.join(process.cwd(), "src", "generated", "prisma"),
) as typeof import("../../src/generated/prisma");

export const E2E_DB_PATH = path.join(process.cwd(), "e2e", "data.db");
export const E2E_USER_EMAIL = "student@csl.local";
export const E2E_USER_B_EMAIL = "learner-b@csl.local";
export const E2E_CONCEPT_TITLE = "Network Connectivity Lab Practice";

export function e2eDatabaseUrl() {
  return `file:${E2E_DB_PATH.replace(/\\/g, "/")}`;
}

export function createE2ePrisma() {
  process.env.DATABASE_URL = e2eDatabaseUrl();
  const adapter = new PrismaLibSql({ url: e2eDatabaseUrl() });
  return new PrismaClient({ adapter });
}

/**
 * Ensure schema exists (no --force-reset — safe for Cursor/CI agents).
 * Wipe rows via cascade delete — does not touch production/dev.db.
 */
export async function resetAndSeedE2eDatabase() {
  fs.mkdirSync(path.dirname(E2E_DB_PATH), { recursive: true });

  execSync(`npx prisma db push --url "${e2eDatabaseUrl()}"`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: e2eDatabaseUrl(),
    },
  });

  const db = createE2ePrisma();
  try {
    // Cascade wipe — isolated e2e/data.db only.
    await db.user.deleteMany();

    const userA = await db.user.create({
      data: { email: E2E_USER_EMAIL, name: "E2E Learner A" },
    });

    const userB = await db.user.create({
      data: { email: E2E_USER_B_EMAIL, name: "E2E Learner B" },
    });

    // Prefs rows avoid first-request create races on Study Hub / layout.
    await db.userPreferences.createMany({
      data: [{ userId: userA.id }, { userId: userB.id }],
    });

    const space = await db.learningSpace.create({
      data: {
        userId: userA.id,
        kind: "SELF_DIRECTED",
        title: "E2E Self-directed",
        subjectDomain: "networking",
      },
    });

    const concept = await db.concept.create({
      data: {
        userId: userA.id,
        title: E2E_CONCEPT_TITLE,
        description: "E2E concept for lab / Adaptive journeys.",
        subjectDomain: "networking",
        learningSpaceId: space.id,
        metadataJson: "{}",
      },
    });

    const course = await db.course.create({
      data: {
        userId: userA.id,
        title: "E2E Networking Course",
        code: "E2E-NET",
      },
    });

    const topic = await db.topic.create({
      data: {
        courseId: course.id,
        name: E2E_CONCEPT_TITLE,
        sortOrder: 0,
        conceptId: concept.id,
      },
    });

    const material = await db.courseMaterial.create({
      data: {
        courseId: course.id,
        title: "E2E Chapter 11 Networking Notes",
        type: "DOCUMENT",
        extractedText: [
          "Chapter 11 — Network Connectivity",
          "",
          "Learning objectives:",
          "- Explain three-way handshake",
          "- Apply Network Connectivity Lab Practice",
          "",
          "Definitions:",
          "Network Connectivity Lab Practice: hands-on verification of links and ports.",
          "Three-way handshake: SYN, SYN-ACK, ACK establish a TCP session.",
          "",
          "Must know: Verify cable, NIC, and default gateway before blaming the ISP.",
        ].join("\n"),
        sortOrder: 1,
      },
    });

    // 2P-31 — assignment title matches topic/concept for Study this CTA.
    const assignment = await db.assignment.create({
      data: {
        courseId: course.id,
        title: E2E_CONCEPT_TITLE,
        description: "E2E assignment linked to Topic.conceptId by title.",
        status: "NOT_STARTED",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // User B owns a separate material — ownership denial journeys.
    const courseB = await db.course.create({
      data: {
        userId: userB.id,
        title: "E2E Learner B Course",
        code: "E2E-B",
      },
    });
    await db.courseMaterial.create({
      data: {
        courseId: courseB.id,
        title: "Learner B Private Notes",
        type: "DOCUMENT",
        extractedText: "Private material for ownership tests.",
        sortOrder: 0,
      },
    });

    return {
      userAId: userA.id,
      conceptId: concept.id,
      courseId: course.id,
      topicId: topic.id,
      materialId: material.id,
      assignmentId: assignment.id,
    };
  } finally {
    await db.$disconnect();
  }
}
