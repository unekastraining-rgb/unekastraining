import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StudyHaulBrandHeader } from "@/components/brand/StudyHaulBrandHeader";

import { GlobalSearch } from "./GlobalSearch";
import { HubBackBarExtras } from "./HubBackBarExtras";
import type { PlanningNavActive } from "./planning-nav-types";

export function HubBackBar({
  title,
  planningActive,
}: {
  title: string;
  planningActive?: PlanningNavActive;
}) {
  return (
    <div className="glass-header">
      <div className="hub-shell py-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3 lg:gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full border border-brand bg-brand-soft px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:brightness-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Hub
            </Link>
            <StudyHaulBrandHeader variant="toolbar" />
            <span className="hidden text-sm font-semibold text-stone-600 sm:inline">·</span>
            <span className="text-sm font-semibold text-stone-800">{title}</span>
          </div>

          <div className="w-full sm:max-w-md lg:w-80 lg:justify-self-end">
            <GlobalSearch className="w-full" />
          </div>

          <div className="lg:justify-self-end">
            <HubBackBarExtras planningActive={planningActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
