import { NextResponse } from "next/server";

import { getSixRecommendations } from "@/lib/csl/six-recommendations";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(12, Number(searchParams.get("limit") ?? 6));
    const courseId = searchParams.get("courseId") ?? undefined;

    const recommendations = await getSixRecommendations(user.id, limit, courseId);

    return NextResponse.json({ success: true, recommendations });
  } catch (error) {
    console.error("Failed to load Six recommendations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load recommendations." },
      { status: 500 },
    );
  }
}
