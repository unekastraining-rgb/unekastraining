import { NextResponse } from "next/server";

import { resolveMoodleCredentials } from "@/lib/lms/moodle-env";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const credentials = await resolveMoodleCredentials(user.id);

    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Moodle is not connected. Set MOODLE_URL and MOODLE_TOKEN in .env or save them in Settings.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      baseUrl: credentials.baseUrl,
      accessToken: credentials.accessToken,
      source: credentials.source,
    });
  } catch (error) {
    console.error("Failed to load Moodle credentials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load Moodle credentials." },
      { status: 500 },
    );
  }
}
