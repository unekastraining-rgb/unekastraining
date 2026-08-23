import Link from "next/link";
import { Settings } from "lucide-react";

import { StudyHaulBrandHeader } from "@/components/brand/StudyHaulBrandHeader";

import { GlobalSearch } from "./GlobalSearch";
import { GradeSchoolModeToggle } from "./GradeSchoolModeToggle";
import { HubNotifications } from "./HubNotifications";
import { HubPlanningNav } from "./HubPlanningNav";
import type { PlanningNavActive } from "./planning-nav-types";

export function HubTopBar({
  onOpenSettings,
  planningActive = "hub",
}: {
  onOpenSettings?: () => void;
  planningActive?: PlanningNavActive;
}) {
  return (
    <header className="glass-header sticky top-0 z-40 overflow-x-clip">
      <div className="hub-shell py-3 sm:py-4 lg:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-x-10">
          <div className="min-w-0 shrink-0">
            <StudyHaulBrandHeader />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:items-end">
            <GlobalSearch className="w-full sm:max-w-md lg:w-80 xl:w-96" />

            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <GradeSchoolModeToggle />
              <HubNotifications />
              <div className="w-full overflow-x-auto sm:w-auto">
                <HubPlanningNav active={planningActive} />
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="rounded-xl border border-brand bg-white p-2.5 text-stone-600 transition hover:bg-brand-soft md:hidden"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <Link href="/courses" className="btn-primary shrink-0 px-4 py-2 text-sm shadow-md">
                Add class
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
