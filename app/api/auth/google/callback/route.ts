import { NextResponse } from "next/server";

import {
  exchangeGoogleAuthCode,
  fetchGoogleUserProfile,
} from "@/lib/auth/google-oauth";
import { decodeOAuthState, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getAppOrigin } from "@/lib/lms/oauth";

export async function GET(request: Request) {
  const origin = getAppOrigin();

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateRaw = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(oauthError)}`,
      );
    }

    if (!code || !stateRaw) {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const state = decodeOAuthState(stateRaw);
    if (!state || state.provider !== "GOOGLE_SIGNIN") {
      return NextResponse.redirect(`${origin}/login?error=invalid_state`);
    }

    const tokens = await exchangeGoogleAuthCode(code);
    const profile = await fetchGoogleUserProfile(tokens.access_token);
    const email = profile.email.trim().toLowerCase();

    const user = await db.user.upsert({
      where: { email },
      update: {
        ...(profile.name ? { name: profile.name } : {}),
        ...(profile.picture ? { avatarUrl: profile.picture } : {}),
      },
      create: {
        email,
        name: profile.name ?? email.split("@")[0],
        avatarUrl: profile.picture,
      },
    });

    await setSessionCookie(user.id);

    const next = state.next?.startsWith("/") ? state.next : "/dashboard";
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error("Google sign-in callback failed:", error);
    const message = error instanceof Error ? error.message : "sign_in_failed";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }
}
