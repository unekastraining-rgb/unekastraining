import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  accountAvatarUrl,
  encodeAvatarData,
  persistAvatarFiles,
} from "@/lib/user/avatar-storage";
import { getOrCreateDefaultUser, UnauthorizedError } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Use a PNG or JPG image" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/png";
    const avatarData = encodeAvatarData(buffer);

    // Best-effort local cache (optional). Account sync uses avatarData in the DB.
    try {
      await persistAvatarFiles(user.id, buffer, mimeType);
    } catch (error) {
      console.warn("Avatar disk cache skipped:", error);
    }

    const avatarUrl = accountAvatarUrl(user.id, Date.now());

    await db.user.update({
      where: { id: user.id },
      data: {
        avatarUrl,
        avatarData,
        avatarMime: mimeType,
      },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Avatar upload failed:", error);
    const message =
      error instanceof Error && /too large/i.test(error.message)
        ? error.message
        : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
