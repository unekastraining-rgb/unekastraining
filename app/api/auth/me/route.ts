import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      isDefaultAccount: false,
    });
  } catch (error) {
    console.error("Failed to load session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load session." },
      { status: 500 },
    );
  }
}
