import { NextResponse } from "next/server";

import { decodeOAuthState } from "@/lib/auth/session";
import {
  completeGoogleCalendarOAuth,
  exchangeGoogleCalendarCode,
} from "@/lib/calendar/google-calendar";
import { getAppOrigin } from "@/lib/lms/oauth";

function googleOAuthReturnUrl(origin: string, returnTo: string | undefined) {
  if (returnTo === "hub-settings") {
    return `${origin}/dashboard?tab=settings`;
  }
  return `${origin}/calendar?settings=1`;
}

export async function GET(request: Request) {
  const origin = getAppOrigin();

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateRaw = searchParams.get("state");
    const oauthError = searchParams.get("error");

    const state = stateRaw ? decodeOAuthState(stateRaw) : null;
    const returnUrl = googleOAuthReturnUrl(origin, state?.returnTo);

    if (oauthError) {
      return NextResponse.redirect(
        `${returnUrl}&googleError=${encodeURIComponent(oauthError)}`,
      );
    }

    if (!code || !stateRaw) {
      return NextResponse.redirect(`${returnUrl}&googleError=missing_code`);
    }

    if (!state?.userId || state.provider !== "GOOGLE_CALENDAR") {
      return NextResponse.redirect(`${returnUrl}&googleError=invalid_state`);
    }

    const tokens = await exchangeGoogleCalendarCode(code);
    const result = await completeGoogleCalendarOAuth(
      state.userId,
      tokens.access_token,
      tokens.refresh_token ?? null,
    );

    return NextResponse.redirect(
      `${returnUrl}&googleConnected=1&imported=${result.imported}&updated=${result.updated}&googlePicker=1`,
    );
  } catch (error) {
    console.error("Google Calendar OAuth callback failed:", error);
    const message = error instanceof Error ? error.message : "oauth_failed";
    const { searchParams } = new URL(request.url);
    const stateRaw = searchParams.get("state");
    const state = stateRaw ? decodeOAuthState(stateRaw) : null;
    const returnUrl = googleOAuthReturnUrl(origin, state?.returnTo);
    return NextResponse.redirect(
      `${returnUrl}&googleError=${encodeURIComponent(message)}`,
    );
  }
}
