import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { serializeResource } from "@/lib/resources/serialize";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const existing = await db.resource.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Resource not found." },
        { status: 404 },
      );
    }

    const resource = await db.resource.update({
      where: { id },
      data: {
        openCount: existing.openCount + 1,
        lastOpenedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: serializeResource(resource) });
  } catch (error) {
    console.error("Failed to track resource open:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track resource open." },
      { status: 500 },
    );
  }
}
