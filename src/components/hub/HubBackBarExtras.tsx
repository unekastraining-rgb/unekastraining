"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { HubPlanningNav } from "./HubPlanningNav";
import { HubSectionsMenu } from "./HubSectionsMenu";
import { HubTopActions } from "./HubTopActions";
import type { PlanningNavActive } from "./planning-nav-types";

function activeFromPathname(pathname: string): PlanningNavActive | undefined {
  if (pathname.startsWith("/resources")) return "resources";
  if (pathname.startsWith("/core")) return "core";
  if (pathname.startsWith("/study")) return "study";
  if (pathname.startsWith("/calendar")) return "calendar";
  return undefined;
}

export function HubBackBarExtras({
  planningActive,
}: {
  planningActive?: PlanningNavActive;
}) {
  const pathname = usePathname();
  // Stable on SSR/first paint when planningActive omitted — update after mount from pathname.
  const [derivedActive, setDerivedActive] = useState<PlanningNavActive | undefined>(
    planningActive,
  );

  useEffect(() => {
    if (planningActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setDerivedActive(planningActive);
      return;
    }
    setDerivedActive(activeFromPathname(pathname));
  }, [pathname, planningActive]);

  const active = planningActive ?? derivedActive;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <HubSectionsMenu />
      <HubPlanningNav active={active} />
      <HubTopActions />
    </div>
  );
}
