import type { ResourceCategory, ResourceRecord, ResourceSort } from "@/lib/resources/types";
import { RESOURCE_CATEGORY_LABELS } from "@/lib/resources/types";

export function filterResources(
  resources: ResourceRecord[],
  options: {
    query?: string;
    category?: "all" | ResourceCategory;
    sort?: ResourceSort;
  },
): ResourceRecord[] {
  const q = options.query?.trim().toLowerCase() ?? "";
  let results = resources;

  if (options.category && options.category !== "all") {
    results = results.filter((resource) => resource.category === options.category);
  }

  if (q) {
    results = results.filter((resource) => resourceMatchesQuery(resource, q));
  }

  return sortResources(results, options.sort ?? "az");
}

export function resourceMatchesQuery(resource: ResourceRecord, query: string): boolean {
  const haystack = [
    resource.title,
    resource.description ?? "",
    RESOURCE_CATEGORY_LABELS[resource.category],
    ...resource.tags,
  ]
    .join(" ")
    .toLowerCase();

  return query.split(/\s+/).every((term) => haystack.includes(term));
}

export function sortResources(resources: ResourceRecord[], sort: ResourceSort): ResourceRecord[] {
  const copy = [...resources];
  switch (sort) {
    case "recent":
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "most_used":
      return copy.sort((a, b) => {
        if (b.openCount !== a.openCount) return b.openCount - a.openCount;
        return a.title.localeCompare(b.title);
      });
    case "az":
    default:
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

/** Local keyword expansion for optional AI discovery fallback. */
export function discoverResourcesLocally(
  resources: ResourceRecord[],
  question: string,
): ResourceRecord[] {
  const q = question.trim().toLowerCase();
  if (!q) return resources;

  const synonymMap: Record<string, string[]> = {
    tutoring: ["tutor", "tutoring", "writing center", "math", "peer"],
    research: ["research", "database", "library", "journal", "paper"],
    financial: ["financial aid", "scholarship", "fafsa", "tuition"],
    career: ["career", "internship", "job", "resume"],
    technology: ["tech", "it", "computer", "wifi", "password"],
  };

  const expandedTerms = new Set<string>(q.split(/\s+/).filter(Boolean));
  for (const [key, values] of Object.entries(synonymMap)) {
    if (q.includes(key)) values.forEach((value) => expandedTerms.add(value));
  }

  return sortResources(
    resources.filter((resource) => {
      const haystack = [
        resource.title,
        resource.description ?? "",
        RESOURCE_CATEGORY_LABELS[resource.category],
        ...resource.tags,
      ]
        .join(" ")
        .toLowerCase();
      return [...expandedTerms].some((term) => haystack.includes(term));
    }),
    "az",
  );
}
