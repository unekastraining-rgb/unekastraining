import { CalendarEventType } from "@/generated/prisma";
import { getAppOrigin } from "@/lib/lms/oauth";
import { parseRecurrenceRule, toRrule } from "@/lib/calendar/recurrence";
import { getUserCalendarSettings } from "@/lib/calendar/settings";

export function getGoogleCalendarCallbackUrl() {
  return `${getAppOrigin()}/api/calendar/google/oauth/callback`;
}

export function getGoogleCalendarOAuthUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleCalendarCallbackUrl(),
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCalendarCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleCalendarCallbackUrl(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${text}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

export async function refreshGoogleCalendarToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed (${response.status})`);
  }

  return (await response.json()) as { access_token: string; expires_in?: number };
}

interface GoogleCalendarListEntry {
  id: string;
  summary?: string;
  backgroundColor?: string;
  primary?: boolean;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

async function googleFetch<T>(accessToken: string, url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export async function listGoogleCalendars(accessToken: string) {
  const payload = await googleFetch<{ items?: GoogleCalendarListEntry[] }>(
    accessToken,
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
  );
  return payload.items ?? [];
}

export async function listGoogleEvents(
  accessToken: string,
  calendarId: string,
  options?: { timeMin?: Date; timeMax?: Date; syncToken?: string | null },
) {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  if (options?.syncToken) {
    params.set("syncToken", options.syncToken);
  } else {
    const timeMin = options?.timeMin ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeMax = options?.timeMax ?? new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
    params.set("timeMin", timeMin.toISOString());
    params.set("timeMax", timeMax.toISOString());
  }

  const encodedCalendarId = encodeURIComponent(calendarId);
  const payload = await googleFetch<{
    items?: GoogleCalendarEvent[];
    nextSyncToken?: string;
  }>(
    accessToken,
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?${params}`,
  );

  return {
    events: (payload.items ?? []).filter((event) => event.status !== "cancelled"),
    nextSyncToken: payload.nextSyncToken ?? null,
  };
}

function parseGoogleEventTimes(event: GoogleCalendarEvent) {
  const startRaw = event.start?.dateTime ?? event.start?.date;
  if (!startRaw) return null;

  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  const startAt = allDay
    ? new Date(`${startRaw}T12:00:00`)
    : new Date(startRaw);

  const endRaw = event.end?.dateTime ?? event.end?.date;
  const endAt = endRaw
    ? allDay
      ? new Date(`${endRaw}T12:00:00`)
      : new Date(endRaw)
    : null;

  return { startAt, endAt, allDay };
}

export async function syncGoogleCalendarConnection(
  userId: string,
  connectionId: string,
): Promise<{ imported: number; updated: number }> {
  const { db } = await import("@/lib/db");

  const connection = await db.calendarConnection.findFirst({
    where: { id: connectionId, userId, provider: "google" },
  });

  if (!connection?.accessToken) {
    throw new Error("Google Calendar is not connected.");
  }

  let accessToken = connection.accessToken;
  if (connection.refreshToken) {
    try {
      const refreshed = await refreshGoogleCalendarToken(connection.refreshToken);
      accessToken = refreshed.access_token;
      await db.calendarConnection.update({
        where: { id: connection.id },
        data: { accessToken },
      });
    } catch {
      // Use existing token if refresh fails
    }
  }

  const { events, nextSyncToken } = await listGoogleEvents(
    accessToken,
    connection.externalCalendarId,
    { syncToken: connection.syncToken },
  );

  let imported = 0;
  let updated = 0;

  for (const event of events) {
    if (!event.id || !event.summary) continue;
    const times = parseGoogleEventTimes(event);
    if (!times) continue;

    const existing = await db.calendarEvent.findFirst({
      where: {
        userId,
        externalSource: "google",
        externalId: event.id,
      },
    });

    const data = {
      title: event.summary,
      description: event.description ?? null,
      location: event.location ?? null,
      startAt: times.startAt,
      endAt: times.endAt,
      allDay: times.allDay,
      eventType: CalendarEventType.PERSONAL,
      color: connection.color ?? "#4285f4",
      calendarConnectionId: connection.id,
    };

    if (existing) {
      await db.calendarEvent.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
    } else {
      await db.calendarEvent.create({
        data: {
          userId,
          externalSource: "google",
          externalId: event.id,
          ...data,
        },
      });
      imported += 1;
    }
  }

  await db.calendarConnection.update({
    where: { id: connection.id },
    data: {
      syncToken: nextSyncToken ?? connection.syncToken,
      lastSyncedAt: new Date(),
      status: "connected",
    },
  });

  return { imported, updated };
}

export async function getGoogleAccessTokenForUser(userId: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  connectionId: string;
} | null> {
  const { db } = await import("@/lib/db");
  const connection = await db.calendarConnection.findFirst({
    where: { userId, provider: "google", accessToken: { not: null } },
    orderBy: { updatedAt: "desc" },
  });

  if (!connection?.accessToken) return null;

  let accessToken = connection.accessToken;
  if (connection.refreshToken) {
    try {
      const refreshed = await refreshGoogleCalendarToken(connection.refreshToken);
      accessToken = refreshed.access_token;
      await db.calendarConnection.updateMany({
        where: { userId, provider: "google" },
        data: { accessToken },
      });
    } catch {
      // Use existing token if refresh fails
    }
  }

  return {
    accessToken,
    refreshToken: connection.refreshToken,
    connectionId: connection.id,
  };
}

export async function discoverGoogleCalendarsForUser(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
) {
  const { db } = await import("@/lib/db");
  const calendars = await listGoogleCalendars(accessToken);

  for (const calendar of calendars) {
    const existing = await db.calendarConnection.findFirst({
      where: {
        userId,
        provider: "google",
        externalCalendarId: calendar.id,
      },
    });

    await db.calendarConnection.upsert({
      where: {
        userId_provider_externalCalendarId: {
          userId,
          provider: "google",
          externalCalendarId: calendar.id,
        },
      },
      create: {
        userId,
        provider: "google",
        externalCalendarId: calendar.id,
        calendarName: calendar.summary ?? "Google Calendar",
        color: calendar.backgroundColor ?? "#4285f4",
        accessToken,
        refreshToken,
        status: calendar.primary ? "connected" : "available",
      },
      update: {
        calendarName: calendar.summary ?? "Google Calendar",
        color: calendar.backgroundColor ?? existing?.color ?? "#4285f4",
        accessToken,
        refreshToken: refreshToken ?? undefined,
        status: existing?.status ?? (calendar.primary ? "connected" : "available"),
      },
    });
  }

  return calendars;
}

export async function completeGoogleCalendarOAuth(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
) {
  const calendars = await discoverGoogleCalendarsForUser(
    userId,
    accessToken,
    refreshToken,
  );

  const { db } = await import("@/lib/db");
  const connections = await db.calendarConnection.findMany({
    where: { userId, provider: "google", status: "connected" },
  });

  let imported = 0;
  let updated = 0;

  for (const connection of connections) {
    const result = await syncGoogleCalendarConnection(userId, connection.id);
    imported += result.imported;
    updated += result.updated;
  }

  return {
    calendars,
    imported,
    updated,
    availableCount: calendars.length,
  };
}

export async function setGoogleCalendarSyncState(
  userId: string,
  connectionId: string,
  enabled: boolean,
): Promise<{ imported: number; updated: number; removed: number }> {
  const { db } = await import("@/lib/db");

  const connection = await db.calendarConnection.findFirst({
    where: { id: connectionId, userId, provider: "google" },
  });

  if (!connection) {
    throw new Error("Google calendar connection not found.");
  }

  if (!enabled) {
    const removed = await db.calendarEvent.deleteMany({
      where: {
        userId,
        calendarConnectionId: connection.id,
      },
    });

    await db.calendarConnection.update({
      where: { id: connection.id },
      data: { status: "available", syncToken: null, lastSyncedAt: null },
    });

    return { imported: 0, updated: 0, removed: removed.count };
  }

  await db.calendarConnection.update({
    where: { id: connection.id },
    data: { status: "connected" },
  });

  const result = await syncGoogleCalendarConnection(userId, connection.id);
  return { ...result, removed: 0 };
}

export async function connectGooglePrimaryCalendar(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
) {
  const result = await completeGoogleCalendarOAuth(userId, accessToken, refreshToken);
  const { db } = await import("@/lib/db");
  const connection = await db.calendarConnection.findFirst({
    where: { userId, provider: "google", status: "connected" },
    orderBy: { createdAt: "asc" },
  });

  if (!connection) {
    throw new Error("No Google calendars connected.");
  }

  return { connection, imported: result.imported, updated: result.updated };
}

export type GoogleWritableEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  recurrence: string | null;
  externalId: string | null;
  externalSource: string | null;
  calendarConnectionId: string | null;
};

function formatGoogleDateOnly(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildGoogleEventBody(event: GoogleWritableEvent) {
  const body: Record<string, unknown> = {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
  };

  const rule = parseRecurrenceRule(event.recurrence);
  const rrule = rule ? toRrule(rule) : null;
  if (rrule) {
    body.recurrence = [`RRULE:${rrule}`];
  }

  if (event.allDay) {
    body.start = { date: formatGoogleDateOnly(event.startAt) };
    const end = event.endAt ?? event.startAt;
    const exclusiveEnd = new Date(end);
    exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
    body.end = { date: formatGoogleDateOnly(exclusiveEnd) };
  } else {
    body.start = { dateTime: event.startAt.toISOString() };
    const endAt =
      event.endAt ?? new Date(event.startAt.getTime() + 60 * 60 * 1000);
    body.end = { dateTime: endAt.toISOString() };
  }

  return body;
}

async function getGoogleConnectionAccessToken(
  userId: string,
  connectionId: string,
): Promise<{ accessToken: string; externalCalendarId: string }> {
  const { db } = await import("@/lib/db");

  const connection = await db.calendarConnection.findFirst({
    where: {
      id: connectionId,
      userId,
      provider: "google",
      status: "connected",
      accessToken: { not: null },
    },
  });

  if (!connection?.accessToken) {
    throw new Error("Google Calendar is not connected.");
  }

  let accessToken = connection.accessToken;
  if (connection.refreshToken) {
    try {
      const refreshed = await refreshGoogleCalendarToken(connection.refreshToken);
      accessToken = refreshed.access_token;
      await db.calendarConnection.update({
        where: { id: connection.id },
        data: { accessToken },
      });
    } catch {
      // Use existing token if refresh fails
    }
  }

  return { accessToken, externalCalendarId: connection.externalCalendarId };
}

async function resolveGoogleWriteConnectionId(
  userId: string,
  event: GoogleWritableEvent,
  defaultConnectionId: string | null,
): Promise<string | null> {
  const { db } = await import("@/lib/db");

  if (event.calendarConnectionId) {
    const linked = await db.calendarConnection.findFirst({
      where: {
        id: event.calendarConnectionId,
        userId,
        provider: "google",
        status: "connected",
      },
      select: { id: true },
    });
    if (linked) return linked.id;
  }

  if (defaultConnectionId) {
    const preferred = await db.calendarConnection.findFirst({
      where: {
        id: defaultConnectionId,
        userId,
        provider: "google",
        status: "connected",
      },
      select: { id: true },
    });
    if (preferred) return preferred.id;
  }

  const first = await db.calendarConnection.findFirst({
    where: { userId, provider: "google", status: "connected" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return first?.id ?? null;
}

async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleWritableEvent,
): Promise<string> {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGoogleEventBody(event)),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google create failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as GoogleCalendarEvent;
  if (!payload.id) {
    throw new Error("Google create returned no event id.");
  }

  return payload.id;
}

async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  externalId: string,
  event: GoogleWritableEvent,
): Promise<void> {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${encodeURIComponent(externalId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGoogleEventBody(event)),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google update failed (${response.status}): ${text}`);
  }
}

async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  externalId: string,
): Promise<void> {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${encodeURIComponent(externalId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const text = await response.text();
    throw new Error(`Google delete failed (${response.status}): ${text}`);
  }
}

export async function writeCalendarEventToGoogle(
  userId: string,
  event: GoogleWritableEvent,
): Promise<{ externalId: string; calendarConnectionId: string } | null> {
  const settings = await getUserCalendarSettings(userId);
  if (!settings.googleWriteEnabled) return null;

  const connectionId = await resolveGoogleWriteConnectionId(
    userId,
    event,
    settings.defaultGoogleConnectionId,
  );
  if (!connectionId) return null;

  const { accessToken, externalCalendarId } = await getGoogleConnectionAccessToken(
    userId,
    connectionId,
  );

  if (event.externalId) {
    await updateGoogleCalendarEvent(
      accessToken,
      externalCalendarId,
      event.externalId,
      event,
    );
    return { externalId: event.externalId, calendarConnectionId: connectionId };
  }

  const externalId = await createGoogleCalendarEvent(
    accessToken,
    externalCalendarId,
    event,
  );

  return { externalId, calendarConnectionId: connectionId };
}

export async function deleteCalendarEventFromGoogle(
  userId: string,
  event: Pick<
    GoogleWritableEvent,
    "externalId" | "externalSource" | "calendarConnectionId"
  >,
): Promise<void> {
  if (event.externalSource !== "google" || !event.externalId) return;

  const settings = await getUserCalendarSettings(userId);
  if (!settings.googleWriteEnabled) return;

  const connectionId =
    event.calendarConnectionId ??
    (await resolveGoogleWriteConnectionId(
      userId,
      {
        ...event,
        id: "",
        title: "",
        description: null,
        location: null,
        startAt: new Date(),
        endAt: null,
        allDay: false,
        recurrence: null,
      },
      settings.defaultGoogleConnectionId,
    ));

  if (!connectionId) return;

  const { accessToken, externalCalendarId } = await getGoogleConnectionAccessToken(
    userId,
    connectionId,
  );

  await deleteGoogleCalendarEvent(accessToken, externalCalendarId, event.externalId);
}
