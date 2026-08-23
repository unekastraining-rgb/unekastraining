import type { CalendarViewMode } from "./workspace-types";
import type { ColorScaleId } from "./color-scales";
import type { CalendarThemeId } from "./calendar-themes";
import { db } from "@/lib/db";
import { parseAppSettings, type AppSettings } from "@/lib/settings/app-settings";

export type { CalendarThemeId };

export const PERSONAL_CALENDAR_ID = "personal";

export function googleCalendarId(connectionId: string) {
  return `google:${connectionId}`;
}

export interface CalendarSettings {
  defaultView: CalendarViewMode;
  weekStartsOn: "sunday" | "monday";
  workingHoursStart: number;
  workingHoursEnd: number;
  defaultEventDurationMinutes: number;
  colorScale: ColorScaleId;
  /** Coursicle-style theme preset or custom */
  themeId: CalendarThemeId;
  /** Page/canvas background behind the grid */
  backgroundColor: string | null;
  /** Toolbar, buttons, and accents */
  accentColor: string | null;
  /** Override event block palette (null = use theme or color scale) */
  customEventPalette: string[] | null;
  personalCalendarColor: string;
  hiddenCalendarIds: string[];
  showTimeInsights: boolean;
  /** Push Study Haul event creates/updates/deletes to Google Calendar */
  googleWriteEnabled: boolean;
  /** Connected Google calendar that receives new local events */
  defaultGoogleConnectionId: string | null;
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  defaultView: "week",
  weekStartsOn: "monday",
  workingHoursStart: 7,
  workingHoursEnd: 22,
  defaultEventDurationMinutes: 60,
  colorScale: "pastel",
  themeId: "coursicle-classic",
  backgroundColor: null,
  accentColor: null,
  customEventPalette: null,
  personalCalendarColor: "#6366f1",
  hiddenCalendarIds: [],
  showTimeInsights: true,
  googleWriteEnabled: true,
  defaultGoogleConnectionId: null,
};

interface SettingsBlob extends AppSettings {
  calendar?: Partial<CalendarSettings>;
}

function parseCalendarSettings(raw: Partial<CalendarSettings> | undefined): CalendarSettings {
  return {
    defaultView: raw?.defaultView ?? DEFAULT_CALENDAR_SETTINGS.defaultView,
    weekStartsOn: raw?.weekStartsOn ?? DEFAULT_CALENDAR_SETTINGS.weekStartsOn,
    workingHoursStart:
      raw?.workingHoursStart ?? DEFAULT_CALENDAR_SETTINGS.workingHoursStart,
    workingHoursEnd: raw?.workingHoursEnd ?? DEFAULT_CALENDAR_SETTINGS.workingHoursEnd,
    defaultEventDurationMinutes:
      raw?.defaultEventDurationMinutes ??
      DEFAULT_CALENDAR_SETTINGS.defaultEventDurationMinutes,
    colorScale: raw?.colorScale ?? DEFAULT_CALENDAR_SETTINGS.colorScale,
    themeId: raw?.themeId ?? DEFAULT_CALENDAR_SETTINGS.themeId,
    backgroundColor: raw?.backgroundColor ?? DEFAULT_CALENDAR_SETTINGS.backgroundColor,
    accentColor: raw?.accentColor ?? DEFAULT_CALENDAR_SETTINGS.accentColor,
    customEventPalette: raw?.customEventPalette ?? DEFAULT_CALENDAR_SETTINGS.customEventPalette,
    personalCalendarColor:
      raw?.personalCalendarColor ?? DEFAULT_CALENDAR_SETTINGS.personalCalendarColor,
    hiddenCalendarIds: raw?.hiddenCalendarIds ?? [],
    showTimeInsights: raw?.showTimeInsights ?? DEFAULT_CALENDAR_SETTINGS.showTimeInsights,
    googleWriteEnabled:
      raw?.googleWriteEnabled ?? DEFAULT_CALENDAR_SETTINGS.googleWriteEnabled,
    defaultGoogleConnectionId:
      raw?.defaultGoogleConnectionId ??
      DEFAULT_CALENDAR_SETTINGS.defaultGoogleConnectionId,
  };
}

async function readSettingsBlob(userId: string): Promise<SettingsBlob> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });

  if (!row?.settingsJson) {
    return { ...parseAppSettings(null) };
  }

  try {
    return JSON.parse(row.settingsJson) as SettingsBlob;
  } catch {
    return { ...parseAppSettings(null) };
  }
}

export async function getUserCalendarSettings(userId: string): Promise<CalendarSettings> {
  const blob = await readSettingsBlob(userId);
  return parseCalendarSettings(blob.calendar);
}

export async function updateUserCalendarSettings(
  userId: string,
  patch: Partial<CalendarSettings>,
): Promise<CalendarSettings> {
  const blob = await readSettingsBlob(userId);
  const current = parseCalendarSettings(blob.calendar);
  const next = { ...current, ...patch };

  const updated: SettingsBlob = {
    ...parseAppSettings(JSON.stringify(blob)),
    calendar: next,
  };

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, settingsJson: JSON.stringify(updated) },
    update: { settingsJson: JSON.stringify(updated) },
  });

  return next;
}
