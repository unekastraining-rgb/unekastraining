import { NextResponse } from "next/server";

import { getFreeAIProviderStatus } from "@/lib/ai/config";

/** Diagnostics for Settings / Study hub — which free-tier AI keys are active (no secrets). */
export async function GET() {
  return NextResponse.json({
    success: true,
    ...getFreeAIProviderStatus(),
  });
}
