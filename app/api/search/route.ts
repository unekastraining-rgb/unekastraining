import { NextResponse } from "next/server";

import { searchGlobal } from "@/lib/search/global-search";
import { requireUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const limit = Math.min(30, Number(searchParams.get("limit") ?? 20));

    const results = await searchGlobal(user.id, q, limit);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Global search failed:", error);
    return NextResponse.json({ success: false, error: "Search failed." }, { status: 500 });
  }
}
