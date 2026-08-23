import { syncGoogleCalendarConnection } from "@/lib/calendar/google-calendar";
import { db } from "@/lib/db";

const connectionSelect = {
  id: true,
  calendarName: true,
  externalCalendarId: true,
  color: true,
  status: true,
  lastSyncedAt: true,
} as const;

export async function listGoogleConnections(userId: string) {
  return db.calendarConnection.findMany({
    where: { userId, provider: "google" },
    select: connectionSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function syncUserGoogleCalendars(
  userId: string,
  connectionId?: string,
) {
  const connections = connectionId
    ? await db.calendarConnection.findMany({
        where: { userId, id: connectionId, provider: "google", status: "connected" },
      })
    : await db.calendarConnection.findMany({
        where: { userId, provider: "google", status: "connected" },
      });

  if (connections.length === 0) {
    throw new Error(
      connectionId
        ? "Google calendar connection not found."
        : "No Google Calendar connected.",
    );
  }

  let imported = 0;
  let updated = 0;

  for (const connection of connections) {
    const result = await syncGoogleCalendarConnection(userId, connection.id);
    imported += result.imported;
    updated += result.updated;
  }

  return { imported, updated, syncedAt: new Date().toISOString() };
}

export async function updateGoogleConnectionColor(
  userId: string,
  connectionId: string,
  color: string,
) {
  const connection = await db.calendarConnection.findFirst({
    where: { id: connectionId, userId, provider: "google" },
  });

  if (!connection) {
    throw new Error("Connection not found.");
  }

  const updated = await db.calendarConnection.update({
    where: { id: connection.id },
    data: { color },
  });

  await db.calendarEvent.updateMany({
    where: {
      userId,
      calendarConnectionId: connection.id,
    },
    data: { color },
  });

  return updated;
}

export async function disconnectUserGoogleCalendars(userId: string) {
  await db.calendarEvent.deleteMany({
    where: { userId, externalSource: "google" },
  });

  await db.calendarConnection.deleteMany({
    where: { userId, provider: "google" },
  });
}
