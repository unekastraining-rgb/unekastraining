"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

import { StudyHaulBrandHeader } from "@/components/brand/StudyHaulBrandHeader";
import { ClientIcon } from "@/components/ui/ClientIcon";

import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { useTapHandler } from "@/hooks/useTapHandler";

import { GlobalSearch } from "./GlobalSearch";
import { GradeSchoolModeToggle } from "./GradeSchoolModeToggle";
import { HubNotifications } from "./HubNotifications";
import { HubPlanningNav } from "./HubPlanningNav";
import { HubSectionsMenu } from "./HubSectionsMenu";
import { MobileHubMenu } from "./MobileHubMenu";
import type { HubTab } from "./types";
import type { PlanningNavActive } from "./planning-nav-types";

export function HubTopBar({
  onOpenSettings,
  planningActive = "hub",
  activeTab = "hub",
  onTabChange,
}: {
  onOpenSettings?: () => void;
  planningActive?: PlanningNavActive;
  activeTab?: HubTab;
  onTabChange?: (tab: HubTab) => void;
}) {
  const compactNav = useCompactHubNav();
  const tapSettings = useTapHandler(() => onOpenSettings?.());

  return (
    <header
      data-hub-chrome
      className="glass-header sticky top-0 z-[200] overflow-visible"
      suppressHydrationWarning
    >
      <div className="hub-shell py-3 sm:py-4 lg:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-x-10">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            {onTabChange ? (
              <MobileHubMenu active={activeTab} onChange={onTabChange} />
            ) : null}
            <div className="min-w-0 shrink-0">
              <StudyHaulBrandHeader />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:items-end">
            <GlobalSearch className="w-full sm:max-w-md lg:w-80 xl:w-96" />

            <div className="hub-chrome-interactive flex w-full flex-wrap items-center justify-end gap-2">
              <GradeSchoolModeToggle />
              <HubNotifications />
              <HubSectionsMenu />
              <div className="w-full overflow-x-auto sm:w-auto">
                <HubPlanningNav active={planningActive} />
              </div>
              {compactNav ? (
                <button
                  type="button"
                  {...tapSettings}
                  className="rounded-xl border border-brand bg-white p-2.5 text-stone-600 transition touch-manipulation hover:bg-brand-soft"
                  aria-label="Open settings"
                >
                  <ClientIcon icon={Settings} className="h-5 w-5" />
                </button>
              ) : null}
              <Link
                href="/courses"
                suppressHydrationWarning
                className="btn-primary shrink-0 px-4 py-2 text-sm shadow-md"
              >
                Add class
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
