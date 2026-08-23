import { NextResponse } from "next/server";

import {
  getUserCalendarSettings,
  updateUserCalendarSettings,
} from "@/lib/calendar/settings";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const settings = await getUserCalendarSettings(user.id);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to load calendar settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load calendar settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const settings = await updateUserCalendarSettings(user.id, body);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to update calendar settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update calendar settings." },
      { status: 500 },
    );
  }
}
