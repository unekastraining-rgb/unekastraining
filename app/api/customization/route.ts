import { NextResponse } from "next/server";

import {
  deleteUserPalette,
  getUserCustomization,
  patchCustomization,
  recordRecentColor,
  removeRecentColor,
  toggleFavoriteColor,
  upsertUserPalette,
} from "@/lib/customization/store";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  const user = await getOrCreateDefaultUser();
  const state = await getUserCustomization(user.id);
  return NextResponse.json(state);
}

export async function PATCH(request: Request) {
  const user = await getOrCreateDefaultUser();
  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action as string;

  switch (action) {
    case "recordColor":
      return NextResponse.json(
        await recordRecentColor(user.id, String(body.color ?? "")),
      );
    case "toggleFavoriteColor":
      return NextResponse.json(
        await toggleFavoriteColor(user.id, String(body.color ?? "")),
      );
    case "removeRecentColor":
      return NextResponse.json(
        await removeRecentColor(user.id, String(body.color ?? "")),
      );
    case "upsertPalette":
      return NextResponse.json(
        await upsertUserPalette(
          user.id,
          body.palette as Parameters<typeof upsertUserPalette>[1],
        ),
      );
    case "deletePalette":
      return NextResponse.json(
        await deleteUserPalette(user.id, String(body.paletteId ?? "")),
      );
    case "toggleFavoritePalette": {
      const current = await getUserCustomization(user.id);
      const paletteId = String(body.paletteId ?? "");
      const exists = current.favoritePaletteIds.includes(paletteId);
      const favoritePaletteIds = exists
        ? current.favoritePaletteIds.filter((id) => id !== paletteId)
        : [paletteId, ...current.favoritePaletteIds];
      return NextResponse.json(
        await patchCustomization(user.id, { favoritePaletteIds }),
      );
    }
    case "patch":
      return NextResponse.json(
        await patchCustomization(user.id, body.state as Parameters<typeof patchCustomization>[1]),
      );
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
