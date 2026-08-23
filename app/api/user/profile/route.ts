import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function PATCH(request: Request) {
  const user = await getOrCreateDefaultUser();
  const body = (await request.json()) as { name?: unknown };

  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const name = body.name.trim();
  if (name.length > 80) {
    return NextResponse.json({ error: "Name must be 80 characters or fewer" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { name: name || null },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
