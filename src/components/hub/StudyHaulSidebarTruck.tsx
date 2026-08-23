"use client";

import { useEffect, useState } from "react";

import { StudyHaulTruckMark } from "@/components/brand/StudyHaulTruckMark";

/** Haul truck driving between Settings and Sign out in the sidebar. */
export function StudyHaulSidebarTruck() {
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    setMotionReady(true);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-1 my-1 h-11 overflow-hidden rounded-xl bg-gradient-to-r from-[color-mix(in_srgb,var(--sh-primary)_8%,white)]/40 via-white to-rose-50/30"
    >
      <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-brand/80" />
      <div
        className={`absolute top-1/2 -translate-y-[58%] ${
          motionReady
            ? "animate-[haul-truck-sidebar_7s_ease-in-out_infinite]"
            : "left-2 opacity-0"
        }`}
      >
        <StudyHaulTruckMark className="h-8 w-[5.5rem]" />
      </div>
    </div>
  );
}
