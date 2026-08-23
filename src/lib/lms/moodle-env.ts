import { LMSProvider } from "@/generated/prisma";
import { db } from "@/lib/db";
import { normalizeMoodleBaseUrl } from "@/lib/lms/moodle-url";

export interface MoodleCredentials {
  baseUrl: string;
  accessToken: string;
  source: "database" | "env";
}

export function isValidMoodleToken(token: string | null | undefined): boolean {
  const trimmed = token?.trim() ?? "";
  return /^[a-f0-9]{32}$/i.test(trimmed);
}

export function getEnvMoodleCredentials(): MoodleCredentials | null {
  const baseUrl = process.env.MOODLE_URL?.trim();
  const accessToken = process.env.MOODLE_TOKEN?.trim();

  if (!baseUrl || !isValidMoodleToken(accessToken)) {
    return null;
  }

  return {
    baseUrl: normalizeMoodleBaseUrl(baseUrl),
    accessToken: accessToken!,
    source: "env",
  };
}

async function persistMoodleCredentials(
  userId: string,
  baseUrl: string,
  accessToken: string,
): Promise<void> {
  const existing = await db.lMSConnection.findFirst({
    where: { userId, provider: LMSProvider.MOODLE },
  });

  if (existing) {
    await db.lMSConnection.update({
      where: { id: existing.id },
      data: {
        baseUrl,
        accessToken,
        status: "connected",
        displayName: baseUrl,
      },
    });
    return;
  }

  await db.lMSConnection.create({
    data: {
      userId,
      provider: LMSProvider.MOODLE,
      baseUrl,
      accessToken,
      status: "connected",
      displayName: baseUrl,
    },
  });
}

export async function resolveMoodleCredentials(
  userId: string,
  options?: { persistEnv?: boolean },
): Promise<MoodleCredentials | null> {
  const persistEnv = options?.persistEnv !== false;

  const connection = await db.lMSConnection.findFirst({
    where: { userId, provider: LMSProvider.MOODLE },
    select: { baseUrl: true, accessToken: true },
  });

  if (
    connection?.baseUrl &&
    isValidMoodleToken(connection.accessToken)
  ) {
    return {
      baseUrl: normalizeMoodleBaseUrl(connection.baseUrl),
      accessToken: connection.accessToken!.trim(),
      source: "database",
    };
  }

  const fromEnv = getEnvMoodleCredentials();
  if (!fromEnv) {
    return null;
  }

  if (persistEnv) {
    await persistMoodleCredentials(userId, fromEnv.baseUrl, fromEnv.accessToken);
  }

  return fromEnv;
}
