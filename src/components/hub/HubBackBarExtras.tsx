"use client";

import { usePathname } from "next/navigation";

import { HubPlanningNav } from "./HubPlanningNav";
import { HubTopActions } from "./HubTopActions";
import type { PlanningNavActive } from "./planning-nav-types";

export function HubBackBarExtras({
  planningActive,
}: {
  planningActive?: PlanningNavActive;
}) {
  const pathname = usePathname();
  const active =
    planningActive ??
    (pathname.startsWith("/resources")
      ? "resources"
      : pathname.startsWith("/core")
      ? "core"
      : pathname.startsWith("/study")
        ? "study"
        : pathname.startsWith("/calendar")
          ? "calendar"
          : undefined);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <HubPlanningNav active={active} />
      <HubTopActions />
    </div>
  );
}
