import { db } from "@/lib/db";

export type AiSourceMode = "course_only" | "course_plus_general";

export interface AppSettings {
  aiSourceMode: AiSourceMode;
  aiUseCourseMaterialsInChat: boolean;
  /** Opt into OpenAI after free Gemini→Groq→OpenRouter (requires OPENAI_API_KEY). */
  aiUseOpenAIPro: boolean;
  desktopNotifications: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  aiSourceMode: "course_plus_general",
  aiUseCourseMaterialsInChat: true,
  aiUseOpenAIPro: false,
  desktopNotifications: false,
};

export function parseAppSettings(raw: string | null | undefined): AppSettings {
  if (!raw) return { ...DEFAULT_APP_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      aiSourceMode:
        parsed.aiSourceMode === "course_only"
          ? "course_only"
          : DEFAULT_APP_SETTINGS.aiSourceMode,
      aiUseCourseMaterialsInChat:
        parsed.aiUseCourseMaterialsInChat ??
        DEFAULT_APP_SETTINGS.aiUseCourseMaterialsInChat,
      aiUseOpenAIPro:
        parsed.aiUseOpenAIPro ?? DEFAULT_APP_SETTINGS.aiUseOpenAIPro,
      desktopNotifications:
        parsed.desktopNotifications ?? DEFAULT_APP_SETTINGS.desktopNotifications,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export async function getUserAppSettings(userId: string): Promise<AppSettings> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });
  return parseAppSettings(row?.settingsJson);
}

export async function updateUserAppSettings(
  userId: string,
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });

  let blob: Record<string, unknown> = {};
  if (row?.settingsJson) {
    try {
      blob = JSON.parse(row.settingsJson) as Record<string, unknown>;
    } catch {
      blob = {};
    }
  }

  const current = parseAppSettings(row?.settingsJson);
  const next = { ...current, ...patch };
  const updated = { ...blob, ...next };

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, settingsJson: JSON.stringify(updated) },
    update: { settingsJson: JSON.stringify(updated) },
  });

  return next;
}

export function aiSourceInstruction(mode: AiSourceMode): string {
  return mode === "course_only"
    ? "Use ONLY the provided course materials and professor terminology. Do not introduce outside concepts unless the material explicitly references them."
    : "Prioritize the provided course materials, but you may use general academic knowledge to clarify or fill small gaps.";
}

export function defaultCourseMaterialsOnly(mode: AiSourceMode): boolean {
  return mode === "course_only";
}
