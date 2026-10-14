import { NextResponse } from "next/server";

import type { NoteMethod } from "@/generated/prisma";
import { db } from "@/lib/db";
import { emptyDocument } from "@/lib/core/note-types";
import { buildWhiteboardStarter } from "@/lib/core/whiteboard-starters";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * Form POST create — works on iPad with zero client JS.
 * Redirects straight into the notebook so writing can start.
 */
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const form = await request.formData();
    const mode = String(form.get("mode") ?? "notes");
    const title = String(form.get("title") ?? "").trim() || "Untitled notebook";
    const isWhiteboard = mode === "whiteboard";

    const initialDoc = {
      ...emptyDocument("sketch"),
      notebook: {
        coverId: "classic_orange",
        customCoverColor: null,
        customCoverAssetId: null,
        showCover: false,
        pageTemplateId: "blank",
        customBackgroundAssetId: null,
        penPresetId: "ballpoint",
        pageOrientation: "portrait" as const,
        pageBackgroundColor: "#fffdf9",
      },
      pageTextBoxes: [],
      pageImages: [],
      canvas: isWhiteboard ? buildWhiteboardStarter("plain") : emptyDocument().canvas,
      metadata: {
        activeFormat: isWhiteboard ? "WHITEBOARD" : "BLANK",
      },
      tool: "sketch" as const,
    };

    const note = await db.note.create({
      data: {
        userId: user.id,
        title,
        content: "",
        method: (isWhiteboard ? "WHITEBOARD" : "BLANK") as NoteMethod,
        contentJson: JSON.stringify(initialDoc),
      },
    });

    return NextResponse.redirect(new URL(`/core?noteId=${note.id}`, request.url), 303);
  } catch (error) {
    console.error("Quick-create note failed:", error);
    return NextResponse.redirect(new URL("/core", request.url), 303);
  }
}
