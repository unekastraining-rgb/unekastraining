import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { discoverResourcesLocally, resourceMatchesQuery } from "@/lib/resources/search";
import { serializeResource } from "@/lib/resources/serialize";
import { RESOURCE_CATEGORY_LABELS } from "@/lib/resources/types";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const question = String(body.question ?? "").trim();

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Enter a question to search your resources." },
        { status: 400 },
      );
    }

    const resources = (await db.resource.findMany({
      where: { userId: user.id },
    })).map(serializeResource);

    if (!isAIConfigured()) {
      return NextResponse.json({
        success: true,
        offline: true,
        data: discoverResourcesLocally(resources, question),
        searchTerms: question.split(/\s+/).filter(Boolean),
      });
    }

    const catalog = resources
      .map(
        (resource) =>
          `- id:${resource.id} | ${resource.title} | ${RESOURCE_CATEGORY_LABELS[resource.category]} | tags:${resource.tags.join(", ")} | ${resource.description ?? ""}`,
      )
      .join("\n");

    const result = await aiService.complete([
      {
        role: "system",
        content:
          "You match student questions to their saved school resources. Return ONLY JSON: { searchTerms: string[], resourceIds: string[] }. Pick resourceIds only from the provided catalog. searchTerms should help keyword search too.",
      },
      {
        role: "user",
        content: `Question: ${question}\n\nResources:\n${catalog || "(none)"}`,
      },
    ]);

    let searchTerms = question.split(/\s+/).filter(Boolean);
    let resourceIds: string[] = [];

    try {
      const cleaned = result.content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        searchTerms?: string[];
        resourceIds?: string[];
      };
      if (Array.isArray(parsed.searchTerms)) {
        searchTerms = parsed.searchTerms.map(String).filter(Boolean);
      }
      if (Array.isArray(parsed.resourceIds)) {
        resourceIds = parsed.resourceIds.map(String);
      }
    } catch {
      return NextResponse.json({
        success: true,
        offline: true,
        data: discoverResourcesLocally(resources, question),
        searchTerms,
      });
    }

    const idSet = new Set(resourceIds);
    const aiMatches = resources.filter((resource) => idSet.has(resource.id));
    const termQuery = searchTerms.join(" ").toLowerCase();
    const termMatches = termQuery
      ? resources.filter((resource) => resourceMatchesQuery(resource, termQuery))
      : [];

    const merged = new Map<string, (typeof resources)[number]>();
    for (const item of [...aiMatches, ...termMatches]) merged.set(item.id, item);

    return NextResponse.json({
      success: true,
      data: [...merged.values()],
      searchTerms,
    });
  } catch (error) {
    console.error("Failed to discover resources:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search resources." },
      { status: 500 },
    );
  }
}
