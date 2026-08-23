import { NextResponse } from "next/server";

import { getResourcesLibrarySettings, updateResourcesLibrarySettings } from "@/lib/resources/library-settings";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const settings = await getResourcesLibrarySettings(user.id);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to load resource library settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load library settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const settings = await updateResourcesLibrarySettings(user.id, body);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to update resource library settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update library settings." },
      { status: 500 },
    );
  }
}
