"use client";

import { StudyHaulTruckMark } from "@/components/brand/StudyHaulTruckMark";
import { useIsClientMounted } from "@/hooks/useClientSnapshot";

/** Haul truck driving between Settings and Sign out in the sidebar. */
export function StudyHaulSidebarTruck() {
  const motionReady = useIsClientMounted();

  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-1 my-1 h-11 overflow-hidden rounded-xl bg-gradient-to-r via-white to-rose-50/30"
      style={{
        backgroundImage:
          "linear-gradient(to right, color-mix(in srgb, var(--sh-primary) 8%, white), white, rgb(255 241 242 / 0.3))",
      }}
    >
      <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-brand/80" />
      <div
        className="absolute top-1/2 -translate-y-[58%] animate-[haul-truck-sidebar_7s_ease-in-out_infinite]"
        style={{
          opacity: motionReady ? 1 : 0,
          animationPlayState: motionReady ? "running" : "paused",
        }}
      >
        <StudyHaulTruckMark className="h-8 w-[5.5rem]" />
      </div>
    </div>
  );
}
