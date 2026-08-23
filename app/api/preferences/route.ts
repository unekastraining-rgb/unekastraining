import { NextResponse } from "next/server";

import {
  getOrCreateUserPreferences,
  updateUserPreferences,
} from "@/lib/preferences";
import {
  getUserAppSettings,
  updateUserAppSettings,
  type AppSettings,
} from "@/lib/settings/app-settings";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const [preferences, appSettings] = await Promise.all([
      getOrCreateUserPreferences(user.id),
      getUserAppSettings(user.id),
    ]);
    return NextResponse.json({ success: true, preferences, appSettings });
  } catch (error) {
    console.error("Failed to load preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load preferences." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();

    const themeKeys = [
      "themeTemplate",
      "primaryColor",
      "backgroundColor",
      "accentColor",
      "paletteColors",
      "elementaryMode",
      "defaultQuickView",
    ] as const;

    const themePatch: Record<string, unknown> = {};
    for (const key of themeKeys) {
      if (body[key] !== undefined) themePatch[key] = body[key];
    }
    if (Object.keys(themePatch).length > 0) {
      await updateUserPreferences(user.id, themePatch);
    }

    const appPatch: Partial<AppSettings> = {};
    if (body.aiSourceMode !== undefined) appPatch.aiSourceMode = body.aiSourceMode;
    if (body.aiUseCourseMaterialsInChat !== undefined) {
      appPatch.aiUseCourseMaterialsInChat = body.aiUseCourseMaterialsInChat;
    }
    if (body.desktopNotifications !== undefined) {
      appPatch.desktopNotifications = body.desktopNotifications;
    }
    if (Object.keys(appPatch).length > 0) {
      await updateUserAppSettings(user.id, appPatch);
    }

    const [preferences, appSettings] = await Promise.all([
      getOrCreateUserPreferences(user.id),
      getUserAppSettings(user.id),
    ]);

    return NextResponse.json({ success: true, preferences, appSettings });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update preferences." },
      { status: 500 },
    );
  }
}
