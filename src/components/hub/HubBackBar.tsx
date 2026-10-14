import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StudyHaulBrandHeader } from "@/components/brand/StudyHaulBrandHeader";
import { ClientIcon } from "@/components/ui/ClientIcon";

import { GlobalSearch } from "./GlobalSearch";
import { HubBackBarExtras } from "./HubBackBarExtras";
import { MobileHubDrawer } from "./MobileHubDrawer";
import type { PlanningNavActive } from "./planning-nav-types";

export function HubBackBar({
  title,
  planningActive,
  compact = false,
  minimal = false,
}: {
  title: string;
  planningActive?: PlanningNavActive;
  /** Tighter chrome for immersive surfaces like Core writing */
  compact?: boolean;
  /** Core writing: hub link + title only — maximize paper height */
  minimal?: boolean;
}) {
  if (minimal) {
    return (
      <div
        className="glass-header relative z-[120] shrink-0 border-b border-brand/30"
        data-core-hub-bar
      >
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4">
          <MobileHubDrawer />
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-stone-700 transition hover:brightness-95 touch-manipulation"
          >
            <ClientIcon icon={ArrowLeft} className="h-3 w-3" />
            Hub
          </Link>
          <span className="text-xs font-semibold text-stone-800">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-header sticky top-0 z-[200] shrink-0 overflow-visible border-b border-brand/30">
      <div className={`hub-shell ${compact ? "py-1.5 sm:py-2" : "py-3"}`}>
        <div
          className={`grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-4 ${
            compact ? "sm:gap-2" : "gap-3"
          }`}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
            <MobileHubDrawer />
            <Link
              href="/dashboard"
              data-hub-chrome
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-brand bg-brand-soft px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:brightness-95 touch-manipulation"
            >
              <ClientIcon icon={ArrowLeft} className="h-3.5 w-3.5" />
              Hub
            </Link>
            <StudyHaulBrandHeader variant="toolbar" />
            <span className="hidden text-sm font-semibold text-stone-600 sm:inline">·</span>
            <span className="text-sm font-semibold text-stone-800">{title}</span>
          </div>

          {compact ? (
            <div className="hidden w-full sm:max-w-md lg:block lg:w-80 lg:justify-self-end">
              <GlobalSearch className="w-full" />
            </div>
          ) : (
            <div className="w-full sm:max-w-md lg:w-80 lg:justify-self-end">
              <GlobalSearch className="w-full" />
            </div>
          )}

          <div className={`lg:justify-self-end ${compact ? "hidden sm:block" : ""}`}>
            <HubBackBarExtras planningActive={planningActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
