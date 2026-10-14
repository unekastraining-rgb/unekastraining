"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { triggerLmsBackgroundSync } from "@/lib/lms/background-sync";
import { dispatchLmsSynced } from "@/lib/lms/sync-events";

import { BottomNav } from "./BottomNav";

/**
 * Wraps Study / Core / Calendar pages with bottom nav (tablet + phone)
 * and refreshes courses/topics from the user's saved LMS connections.
 *
 * lockViewport: Core/Calendar need a fixed height so inner desks scroll.
 * Study/Resources need page scroll — leave lockViewport false.
 */
export function HubSubpageShell({
  children,
  lockViewport = false,
}: {
  children: ReactNode;
  /** When true, clip to the viewport (Core notebook / Calendar). */
  lockViewport?: boolean;
}) {
  const compactNav = useCompactHubNav();
  const lmsSyncStarted = useRef(false);

  useEffect(() => {
    if (lmsSyncStarted.current) return;
    lmsSyncStarted.current = true;
    // Background LMS sync only — avoid router.refresh() on mobile/tablet; it
    // remounts server trees and was breaking Core/Calendar touch + loading state.
    void triggerLmsBackgroundSync()
      .then((synced) => {
        if (synced) dispatchLmsSynced();
      })
      .catch(() => {});
  }, []);

  const shellClass = [
    "flex flex-col",
    lockViewport ? "h-dvh max-h-dvh overflow-hidden" : "min-h-dvh overflow-y-auto",
    compactNav ? "box-border pb-[calc(5.5rem+env(safe-area-inset-bottom))]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={shellClass}>{children}</div>
      {compactNav ? (
        <BottomNav
          active="hub"
          onChange={() => {
            // Route links handle navigation on sub-pages.
          }}
        />
      ) : null}
    </>
  );
}
