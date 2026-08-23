import type { HubTab } from "@/components/hub/types";

const HUB_TABS: HubTab[] = ["hub", "classes", "locker", "chat", "settings"];

export function isHubTab(value: string): value is HubTab {
  if (HUB_TABS.includes(value as HubTab)) return true;
  // Backward compatibility for old schedule tab URLs
  return value === "schedule";
}

export function parseHubTab(value: string | null): HubTab {
  if (value === "schedule") return "hub";
  if (value && isHubTab(value)) return value;
  return "hub";
}

export function hubTabPath(tab: HubTab): string {
  return tab === "hub" ? "/dashboard" : `/dashboard?tab=${tab}`;
}

export function hubCalendarHref(options?: {
  date?: string;
  focus?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.date) params.set("date", options.date);
  if (options?.focus) params.set("focus", options.focus);
  const query = params.toString();
  return query ? `/calendar?${query}` : "/calendar";
}

export function hubScheduleHref(options?: {
  date?: string;
  focus?: string;
  tab?: HubTab;
}): string {
  if (options?.focus) {
    const params = new URLSearchParams();
    params.set("view", "assignments");
    params.set("focus", options.focus);
    return `/dashboard?${params.toString()}`;
  }

  if (options?.date) {
    return hubCalendarHref({ date: options.date, focus: options.focus });
  }

  if (options?.tab && options.tab !== "hub") {
    const params = new URLSearchParams();
    params.set("tab", options.tab);
    return `/dashboard?${params.toString()}`;
  }

  return "/dashboard";
}

export function hubAssignmentFocusHref(assignmentId: string): string {
  return hubScheduleHref({ focus: assignmentId });
}

export function hubAssignmentsHref(): string {
  return "/dashboard?view=assignments";
}

export function hubChatHref(options?: {
  courseId?: string;
  prompt?: string;
}): string {
  const params = new URLSearchParams();
  params.set("tab", "chat");
  if (options?.courseId) {
    params.set("courseId", options.courseId);
  }
  if (options?.prompt) {
    params.set("prompt", options.prompt);
  }
  return `/dashboard?${params.toString()}`;
}

export function parseHubDateParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T12:00:00`);
}
