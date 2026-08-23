import { NextResponse } from "next/server";

import { syncUserGoogleCalendars } from "@/lib/calendar/google-connection-api";
import { requireUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const connectionId = body.connectionId as string | undefined;

    const result = await syncUserGoogleCalendars(user.id, connectionId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Google Calendar sync failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sync Google Calendar.";
    const status =
      error instanceof Error &&
      (message.includes("not found") || message.includes("No Google"))
        ? 400
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
