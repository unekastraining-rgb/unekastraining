import { NextResponse } from "next/server";

import { getGoogleSignInOAuthUrl } from "@/lib/auth/google-oauth";
import { encodeOAuthState, oauthNonce } from "@/lib/auth/session";
import { getAppOrigin } from "@/lib/lms/oauth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const next = searchParams.get("next") ?? "/dashboard";

    const state = encodeOAuthState({
      provider: "GOOGLE_SIGNIN",
      next: next.startsWith("/") ? next : "/dashboard",
      nonce: oauthNonce(),
    });

    const url = getGoogleSignInOAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    const origin = getAppOrigin();
    const message =
      error instanceof Error ? error.message : "Google sign-in unavailable.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }
}
