import { NextResponse } from "next/server";

import { getNextRetentionReviewItem } from "@/lib/learning/retention/review";
import { syncRetentionSourcesForUser } from "@/lib/learning/retention/bridges";
import { getOrCreateDefaultUser } from "@/lib/user";

/** Next due RetentionItem for Lucky item-level review (one at a time). */
export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    try {
      await syncRetentionSourcesForUser(user.id);
    } catch (syncError) {
      console.error(
        "ULE retention sync before review failed (continuing):",
        syncError,
      );
    }

    const item = await getNextRetentionReviewItem(user.id);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Failed to load retention review item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load retention item." },
      { status: 500 },
    );
  }
}
