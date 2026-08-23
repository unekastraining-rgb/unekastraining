import { NextResponse } from "next/server";

import { buildStudyTelemetry } from "@/lib/csl/study-sessions";
import { requireUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireUser();
    const telemetry = await buildStudyTelemetry(user.id);
    return NextResponse.json({ success: true, data: telemetry });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to load study telemetry:", error);
    return NextResponse.json({ success: false, error: "Failed to load telemetry." }, { status: 500 });
  }
}
