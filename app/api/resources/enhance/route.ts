import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { aiUnavailableResponse } from "@/lib/ai/http";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { normalizeResourceCategory, RESOURCE_CATEGORY_LABELS } from "@/lib/resources/types";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    if (!isAIConfigured()) {
      return aiUnavailableResponse("Resource enhancement");
    }

    await getOrCreateDefaultUser();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const url = String(body.url ?? "").trim();
    const description = body.description ? String(body.description).trim() : "";

    if (!title && !url) {
      return NextResponse.json(
        { success: false, error: "Provide at least a title or URL." },
        { status: 400 },
      );
    }

    const categories = Object.entries(RESOURCE_CATEGORY_LABELS)
      .map(([id, label]) => `${id}: ${label}`)
      .join(", ");

    const result = await aiService.complete([
      {
        role: "system",
        content:
          "You help students organize school resource links. Return ONLY valid JSON with keys: description (string, 1-2 sentences), category (one of the allowed ids), tags (array of 2-5 short strings), summary (string, one sentence on when to use this resource). No markdown.",
      },
      {
        role: "user",
        content: `Title: ${title || "Untitled"}\nURL: ${url || "n/a"}\nExisting description: ${description || "none"}\nAllowed categories: ${categories}`,
      },
    ]);

    let parsed: {
      description?: string;
      category?: string;
      tags?: string[];
      summary?: string;
    } = {};

    try {
      const cleaned = result.content.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json(
        { success: false, error: "AI returned an unreadable response. Try again or fill fields manually." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        description: parsed.description?.trim() || description || "",
        category: normalizeResourceCategory(parsed.category),
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8)
          : [],
        summary: parsed.summary?.trim() || "",
      },
    });
  } catch (error) {
    console.error("Failed to enhance resource:", error);
    return NextResponse.json(
      { success: false, error: "Failed to enhance resource with AI." },
      { status: 500 },
    );
  }
}
