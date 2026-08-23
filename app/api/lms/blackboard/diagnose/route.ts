import { NextResponse } from "next/server";

import { LMSProvider } from "@/generated/prisma";
import { diagnoseBlackboardConnection } from "@/lib/lms/blackboard-diagnose";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json().catch(() => ({}));

    const connection = await db.lMSConnection.findFirst({
      where: { userId: user.id, provider: LMSProvider.BLACKBOARD },
    });

    const baseUrl =
      (typeof body.baseUrl === "string" && body.baseUrl.trim()) ||
      connection?.baseUrl ||
      "";
    const accessToken =
      (typeof body.accessToken === "string" && body.accessToken.trim()) ||
      connection?.accessToken ||
      "";

    if (!baseUrl || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Blackboard base URL and access token are required.",
        },
        { status: 400 },
      );
    }

    const report = await diagnoseBlackboardConnection(baseUrl, accessToken);

    return NextResponse.json({
      success: report.ok,
      report,
    });
  } catch (error) {
    console.error("Blackboard diagnose failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Blackboard diagnose failed.",
      },
      { status: 500 },
    );
  }
}
