import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { serializeResource } from "@/lib/resources/serialize";
import {
  normalizeResourceCategory,
  serializeResourceTags,
} from "@/lib/resources/types";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const resource = await db.resource.findFirst({
      where: { id, userId: user.id },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "Resource not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: serializeResource(resource) });
  } catch (error) {
    console.error("Failed to load resource:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load resource." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const body = await request.json();

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
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.url !== undefined ? { url: String(body.url).trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description ? String(body.description).trim() : null }
          : {}),
        ...(body.category !== undefined
          ? { category: normalizeResourceCategory(String(body.category)) }
          : {}),
        ...(body.tags !== undefined
          ? {
              tagsJson: serializeResourceTags(
                Array.isArray(body.tags)
                  ? body.tags.map(String)
                  : typeof body.tags === "string"
                    ? body.tags.split(",")
                    : [],
              ),
            }
          : {}),
        ...(body.icon !== undefined ? { icon: String(body.icon) } : {}),
        ...(body.accentColor !== undefined
          ? { accentColor: body.accentColor ? String(body.accentColor) : null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, data: serializeResource(resource) });
  } catch (error) {
    console.error("Failed to update resource:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update resource." },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    await db.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete resource:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resource." },
      { status: 500 },
    );
  }
}
