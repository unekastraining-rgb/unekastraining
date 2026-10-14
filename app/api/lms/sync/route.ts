import { NextResponse } from "next/server";

import { LMSProvider } from "@/generated/prisma";
import { syncUserLmsProvider } from "@/lib/lms/sync";
import { logOpsEvent } from "@/lib/ops/safe-log";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const provider = (body.provider as LMSProvider) ?? LMSProvider.CANVAS;
    const useDemo = body.demo === true;

    const result = await syncUserLmsProvider(user.id, provider, { demo: useDemo });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to sync LMS:", error);
    const raw = error instanceof Error ? error.message : "";
    const needsConnect = raw.includes("Connect your LMS");
    const status = needsConnect ? 400 : 500;
    logOpsEvent("lms.sync.failure", { status });
    return NextResponse.json(
      {
        success: false,
        error: needsConnect
          ? "Connect your LMS in Settings, then try sync again."
          : "Could not sync LMS right now. Try again later.",
      },
      { status },
    );
  }
}
