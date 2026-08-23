import { NextResponse } from "next/server";

import { LMSProvider } from "@/generated/prisma";
import { syncDemoLmsData } from "@/lib/lms/sync";
import { requireUser } from "@/lib/user";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await syncDemoLmsData(user.id, LMSProvider.CANVAS);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Demo onboarding import failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import demo data." },
      { status: 500 },
    );
  }
}
