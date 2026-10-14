import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  avatarMimeFromName,
  decodeAvatarData,
  readAvatarFile,
} from "@/lib/user/avatar-storage";
import { getOrCreateDefaultUser, UnauthorizedError } from "@/lib/user";

/**
 * Serves the signed-in user's profile photo.
 * Prefers DB bytes so web ↔ mobile share the same login photo without a shared disk.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  try {
    const { file: rawFile } = await params;
    const file = decodeURIComponent(rawFile).split("?")[0] ?? "";
    const user = await getOrCreateDefaultUser();

    // New stable URLs: /api/user/avatar/{userId}
    // Legacy disk URLs: /api/user/avatar/{userId}-{uuid}.ext
    const ownsFile =
      file === user.id ||
      file.startsWith(`${user.id}.`) ||
      file.startsWith(`${user.id}-`);
    if (!ownsFile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fromDb = decodeAvatarData(user.avatarData);
    if (fromDb && fromDb.byteLength > 0) {
      return new NextResponse(new Uint8Array(fromDb), {
        headers: {
          "Content-Type": user.avatarMime || "image/png",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Backfill path: legacy disk-only uploads still work on the machine that has the file.
    const candidates = [
      file,
      `${user.id}.png`,
      `${user.id}.jpg`,
      `${user.id}.webp`,
    ];
    for (const candidate of candidates) {
      const buffer = await readAvatarFile(candidate);
      if (!buffer) continue;

      // Persist into DB so the next device (mobile) can load it from the account.
      void db.user
        .update({
          where: { id: user.id },
          data: {
            avatarData: buffer.toString("base64"),
            avatarMime: avatarMimeFromName(candidate),
            avatarUrl: `/api/user/avatar/${user.id}`,
          },
        })
        .catch((error) => console.warn("Avatar DB backfill failed:", error));

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": avatarMimeFromName(candidate),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Avatar serve failed:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
