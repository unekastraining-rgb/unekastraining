import { NextResponse } from "next/server";

import { LMSProvider } from "@/generated/prisma";
import { syncUserLmsProvider } from "@/lib/lms/sync";
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
    const message = error instanceof Error ? error.message : "Failed to sync LMS.";
    const status = message.includes("Connect your LMS") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
