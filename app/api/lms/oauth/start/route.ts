import { NextResponse } from "next/server";

import {
  decodeOAuthState,
  encodeOAuthState,
  oauthNonce,
} from "@/lib/auth/session";
import {
  getBlackboardOAuthUrl,
  getCanvasOAuthUrl,
  getGoogleClassroomOAuthUrl,
} from "@/lib/lms/oauth";
import { requireUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") ?? "CANVAS";
    const baseUrl = searchParams.get("baseUrl")?.trim() ?? "";

    const state = encodeOAuthState({
      userId: user.id,
      provider,
      baseUrl,
      nonce: oauthNonce(),
    });

    if (provider === "GOOGLE_CLASSROOM") {
      try {
        const url = getGoogleClassroomOAuthUrl(state);
        return NextResponse.redirect(url);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error:
              "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to use Google Classroom OAuth.",
          },
          { status: 400 },
        );
      }
    }

    if (provider === "BLACKBOARD") {
      if (!baseUrl) {
        return NextResponse.json(
          { success: false, error: "baseUrl is required for Blackboard OAuth." },
          { status: 400 },
        );
      }
      try {
        const url = getBlackboardOAuthUrl(baseUrl, state);
        return NextResponse.redirect(url);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error:
              "Set BLACKBOARD_CLIENT_ID and BLACKBOARD_CLIENT_SECRET in .env, or paste an API token instead.",
          },
          { status: 400 },
        );
      }
    }

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: "baseUrl is required for Canvas OAuth." },
        { status: 400 },
      );
    }

    try {
      const url = getCanvasOAuthUrl(baseUrl, state);
      return NextResponse.redirect(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Set CANVAS_CLIENT_ID and CANVAS_CLIENT_SECRET in .env, or paste an API token instead.",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("OAuth start failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start OAuth." },
      { status: 500 },
    );
  }
}
