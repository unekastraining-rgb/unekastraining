import { NextResponse } from "next/server";

import { decodeOAuthState } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  exchangeBlackboardCode,
  exchangeCanvasCode,
  exchangeGoogleCode,
  getAppOrigin,
  providerFromState,
} from "@/lib/lms/oauth";
import { syncUserLmsProvider } from "@/lib/lms/sync";

export async function GET(request: Request) {
  const origin = getAppOrigin();
  const settingsUrl = `${origin}/dashboard?tab=settings`;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateRaw = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        `${settingsUrl}&lmsError=${encodeURIComponent(oauthError)}`,
      );
    }

    if (!code || !stateRaw) {
      return NextResponse.redirect(`${settingsUrl}&lmsError=missing_code`);
    }

    const state = decodeOAuthState(stateRaw);
    if (!state?.userId || !state.provider) {
      return NextResponse.redirect(`${settingsUrl}&lmsError=invalid_state`);
    }

    const provider = providerFromState(state.provider);
    let accessToken = "";
    let refreshToken: string | null = null;
    let baseUrl = state.baseUrl || null;

    if (state.provider === "GOOGLE_CLASSROOM") {
      const tokens = await exchangeGoogleCode(code);
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token ?? null;
      baseUrl = "https://classroom.googleapis.com";
    } else if (state.provider === "BLACKBOARD") {
      if (!baseUrl) {
        return NextResponse.redirect(`${settingsUrl}&lmsError=missing_base_url`);
      }
      const tokens = await exchangeBlackboardCode(baseUrl, code);
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token ?? null;
    } else {
      if (!baseUrl) {
        return NextResponse.redirect(`${settingsUrl}&lmsError=missing_base_url`);
      }
      const tokens = await exchangeCanvasCode(baseUrl, code);
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token ?? null;
    }

    const existing = await db.lMSConnection.findFirst({
      where: { userId: state.userId, provider },
    });

    if (existing) {
      await db.lMSConnection.update({
        where: { id: existing.id },
        data: {
          baseUrl,
          accessToken,
          refreshToken,
          status: "connected",
          displayName: baseUrl,
        },
      });
    } else {
      await db.lMSConnection.create({
        data: {
          userId: state.userId,
          provider,
          baseUrl,
          accessToken,
          refreshToken,
          status: "connected",
          displayName: baseUrl ?? provider,
        },
      });
    }

    let syncMessage = "LMS connected successfully.";
    try {
      const syncResult = await syncUserLmsProvider(state.userId, provider);
      syncMessage = syncResult.message;
    } catch (error) {
      console.warn("Post-OAuth LMS sync failed:", error);
      syncMessage =
        error instanceof Error
          ? `Connected, but sync failed: ${error.message}`
          : "Connected, but sync failed. Try Sync now in Settings.";
    }

    return NextResponse.redirect(
      `${settingsUrl}&lmsConnected=1&lmsSync=${encodeURIComponent(syncMessage)}`,
    );
  } catch (error) {
    console.error("OAuth callback failed:", error);
    const message = error instanceof Error ? error.message : "oauth_failed";
    return NextResponse.redirect(
      `${settingsUrl}&lmsError=${encodeURIComponent(message)}`,
    );
  }
}
