import { NextResponse } from "next/server";

import {
  discoverGoogleCalendarsForUser,
  getGoogleAccessTokenForUser,
  setGoogleCalendarSyncState,
} from "@/lib/calendar/google-calendar";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireUser();
    const tokenInfo = await getGoogleAccessTokenForUser(user.id);

    if (tokenInfo) {
      await discoverGoogleCalendarsForUser(
        user.id,
        tokenInfo.accessToken,
        tokenInfo.refreshToken,
      );
    }

    const connections = await db.calendarConnection.findMany({
      where: { userId: user.id, provider: "google" },
      select: {
        id: true,
        calendarName: true,
        externalCalendarId: true,
        color: true,
        status: true,
        lastSyncedAt: true,
      },
      orderBy: [{ status: "asc" }, { calendarName: "asc" }],
    });

    return NextResponse.json({
      success: true,
      calendars: connections.map((connection) => ({
        ...connection,
        syncing: connection.status === "connected",
      })),
    });
  } catch (error) {
    console.error("Failed to list Google calendars:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list Google calendars." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const selections = body.selections as Array<{
      connectionId: string;
      enabled: boolean;
    }>;

    if (!Array.isArray(selections) || selections.length === 0) {
      return NextResponse.json(
        { success: false, error: "selections array is required." },
        { status: 400 },
      );
    }

    let imported = 0;
    let updated = 0;
    let removed = 0;

    for (const selection of selections) {
      const result = await setGoogleCalendarSyncState(
        user.id,
        selection.connectionId,
        selection.enabled,
      );
      imported += result.imported;
      updated += result.updated;
      removed += result.removed;
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      removed,
    });
  } catch (error) {
    console.error("Failed to update Google calendar selection:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update Google calendar selection.",
      },
      { status: 500 },
    );
  }
}
