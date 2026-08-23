"use client";

import { useEffect, useState } from "react";

import { StudyHaulTruckMark } from "@/components/brand/StudyHaulTruckMark";

/** Small delivery truck driving from Study Haul toward the sign-in panel. */
export function StudyHaulLoginTruck() {
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    setMotionReady(true);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 hidden overflow-hidden lg:block"
    >
      <div className="absolute inset-x-[6%] bottom-[18%] border-t border-dashed border-stone-400/30" />

      <div
        className={`absolute bottom-[17%] ${motionReady ? "animate-[haul-truck-drive_9s_ease-in-out_infinite]" : "left-[24%] opacity-0"}`}
      >
        <StudyHaulTruckMark />
      </div>
    </div>
  );
}
