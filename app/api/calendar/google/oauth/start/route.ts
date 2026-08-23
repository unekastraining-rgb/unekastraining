import { NextResponse } from "next/server";

import { encodeOAuthState, oauthNonce } from "@/lib/auth/session";
import { getGoogleCalendarOAuthUrl } from "@/lib/calendar/google-calendar";
import { requireUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get("returnTo") ?? "calendar";
    const state = encodeOAuthState({
      userId: user.id,
      provider: "GOOGLE_CALENDAR",
      returnTo,
      nonce: oauthNonce(),
    });

    const url = getGoogleCalendarOAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof Error && error.message.includes("GOOGLE_CLIENT_ID")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, and add the calendar redirect URI in Google Cloud Console.",
        },
        { status: 400 },
      );
    }
    console.error("Google Calendar OAuth start failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start Google Calendar OAuth." },
      { status: 500 },
    );
  }
}
