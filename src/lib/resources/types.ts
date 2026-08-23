export type ResourceCategory =
  | "academic"
  | "library"
  | "tutoring"
  | "technology"
  | "financial_aid"
  | "career"
  | "student_services"
  | "research"
  | "other";

export type ResourceSort = "az" | "recent" | "most_used";

export type ResourcesLayout = "grid" | "list";

export type ResourcesAppearance = "light" | "dark" | "system";

export interface ResourceRecord {
  id: string;
  userId: string;
  title: string;
  url: string;
  description: string | null;
  category: ResourceCategory;
  tags: string[];
  icon: string;
  accentColor: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  sourceBatchId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ResourcesLibrarySettings {
  layout: ResourcesLayout;
  appearance: ResourcesAppearance;
  showIcons: boolean;
  showDescriptions: boolean;
  showTags: boolean;
  accentColor: string | null;
}

export const DEFAULT_RESOURCES_LIBRARY_SETTINGS: ResourcesLibrarySettings = {
  layout: "grid",
  appearance: "light",
  showIcons: true,
  showDescriptions: true,
  showTags: true,
  accentColor: null,
};

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  academic: "Academic",
  library: "Library",
  tutoring: "Tutoring",
  technology: "Technology",
  financial_aid: "Financial Aid",
  career: "Career",
  student_services: "Student Services",
  research: "Research",
  other: "Other",
};

export const RESOURCE_FILTER_OPTIONS: Array<{ id: "all" | ResourceCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "academic", label: "Academic" },
  { id: "library", label: "Library" },
  { id: "tutoring", label: "Tutoring" },
  { id: "technology", label: "Technology" },
  { id: "financial_aid", label: "Financial Aid" },
  { id: "career", label: "Career" },
  { id: "student_services", label: "Student Services" },
  { id: "research", label: "Research" },
  { id: "other", label: "Other" },
];

export const RESOURCE_SORT_OPTIONS: Array<{ id: ResourceSort; label: string }> = [
  { id: "az", label: "A–Z" },
  { id: "recent", label: "Recently Added" },
  { id: "most_used", label: "Most Used" },
];

export const RESOURCE_ICON_OPTIONS = [
  { id: "link", label: "Link" },
  { id: "book", label: "Books" },
  { id: "library", label: "Library" },
  { id: "graduation", label: "Academic" },
  { id: "users", label: "Tutoring" },
  { id: "laptop", label: "Technology" },
  { id: "dollar", label: "Financial Aid" },
  { id: "briefcase", label: "Career" },
  { id: "heart", label: "Student Services" },
  { id: "search", label: "Research" },
  { id: "accessibility", label: "Accessibility" },
  { id: "globe", label: "Portal" },
  { id: "file", label: "Documents" },
  { id: "help", label: "Help" },
] as const;

export type ResourceIconId = (typeof RESOURCE_ICON_OPTIONS)[number]["id"];

export function parseResourceTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function serializeResourceTags(tags: string[]): string {
  return JSON.stringify(
    tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 12),
  );
}

export function normalizeResourceCategory(value: string | undefined): ResourceCategory {
  const allowed = RESOURCE_FILTER_OPTIONS.map((item) => item.id).filter(
    (id): id is ResourceCategory => id !== "all",
  );
  if (value && allowed.includes(value as ResourceCategory)) {
    return value as ResourceCategory;
  }
  return "other";
}
