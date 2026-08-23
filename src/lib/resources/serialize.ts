import type { Resource } from "@/generated/prisma";
import {
  normalizeResourceCategory,
  parseResourceTags,
  type ResourceRecord,
} from "@/lib/resources/types";

export function serializeResource(resource: Resource): ResourceRecord {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(resource.metadataJson || "{}") as Record<string, unknown>;
  } catch {
    metadata = {};
  }

  return {
    id: resource.id,
    userId: resource.userId,
    title: resource.title,
    url: resource.url,
    description: resource.description,
    category: normalizeResourceCategory(resource.category),
    tags: parseResourceTags(resource.tagsJson),
    icon: resource.icon,
    accentColor: resource.accentColor,
    openCount: resource.openCount,
    lastOpenedAt: resource.lastOpenedAt?.toISOString() ?? null,
    sourceBatchId: resource.sourceBatchId,
    metadata,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}
