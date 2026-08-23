import { NextResponse } from "next/server";

import {
  disconnectUserGoogleCalendars,
  listGoogleConnections,
  updateGoogleConnectionColor,
} from "@/lib/calendar/google-connection-api";
import { requireUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireUser();
    const connections = await listGoogleConnections(user.id);

    return NextResponse.json({
      success: true,
      connected: connections.some((item) => item.status === "connected"),
      connections,
    });
  } catch (error) {
    console.error("Failed to load Google Calendar status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load Google Calendar status." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { connectionId, color } = body as {
      connectionId?: string;
      color?: string;
    };

    if (!connectionId || !color) {
      return NextResponse.json(
        { success: false, error: "connectionId and color are required." },
        { status: 400 },
      );
    }

    const connection = await updateGoogleConnectionColor(
      user.id,
      connectionId,
      color,
    );

    return NextResponse.json({ success: true, connection });
  } catch (error) {
    console.error("Failed to update Google calendar color:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update calendar color.";
    const status = error instanceof Error && message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await disconnectUserGoogleCalendars(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to disconnect Google Calendar:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disconnect Google Calendar." },
      { status: 500 },
    );
  }
}
