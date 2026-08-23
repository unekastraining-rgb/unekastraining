import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getResourcesLibrarySettings } from "@/lib/resources/library-settings";
import { serializeResource } from "@/lib/resources/serialize";
import {
  normalizeResourceCategory,
  serializeResourceTags,
} from "@/lib/resources/types";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const [resources, librarySettings] = await Promise.all([
      db.resource.findMany({
        where: { userId: user.id },
        orderBy: { title: "asc" },
      }),
      getResourcesLibrarySettings(user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: resources.map(serializeResource),
      librarySettings,
      aiAvailable: isAIConfigured(),
    });
  } catch (error) {
    console.error("Failed to list resources:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load resources." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const url = String(body.url ?? "").trim();

    if (!title || !url) {
      return NextResponse.json(
        { success: false, error: "Title and URL are required." },
        { status: 400 },
      );
    }

    const resource = await db.resource.create({
      data: {
        userId: user.id,
        title,
        url,
        description: body.description ? String(body.description).trim() : null,
        category: normalizeResourceCategory(body.category),
        tagsJson: serializeResourceTags(
          Array.isArray(body.tags)
            ? body.tags.map(String)
            : typeof body.tags === "string"
              ? body.tags.split(",")
              : [],
        ),
        icon: typeof body.icon === "string" ? body.icon : "link",
        accentColor: body.accentColor ? String(body.accentColor) : null,
        sourceBatchId: body.sourceBatchId ? String(body.sourceBatchId) : null,
        metadataJson: JSON.stringify(body.metadata ?? {}),
      },
    });

    return NextResponse.json(
      { success: true, data: serializeResource(resource) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create resource:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create resource." },
      { status: 500 },
    );
  }
}
