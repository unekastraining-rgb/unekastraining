"use client";

import { useSyncExternalStore } from "react";

/** Viewports below this width use the mobile hub chrome (hamburger + bottom nav). */
export const COMPACT_HUB_NAV_MAX_WIDTH = 1280;

function deviceHasTouch(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    (navigator.maxTouchPoints ?? 0) > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches
  );
}

function readCompactHubNav(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const narrow = window.innerWidth < COMPACT_HUB_NAV_MAX_WIDTH;
  // iPad Pro landscape can be ≥1280 CSS px while reporting pointer:fine with a keyboard.
  const touchTablet =
    deviceHasTouch() && window.innerWidth < COMPACT_HUB_NAV_MAX_WIDTH + 120;
  return coarse || narrow || touchTablet;
}

function subscribeCompactHubNav(onStoreChange: () => void) {
  const coarseQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
  const hoverQuery = window.matchMedia("(hover: none)");
  coarseQuery.addEventListener("change", onStoreChange);
  hoverQuery.addEventListener("change", onStoreChange);
  window.addEventListener("resize", onStoreChange);
  return () => {
    coarseQuery.removeEventListener("change", onStoreChange);
    hoverQuery.removeEventListener("change", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
  };
}

/**
 * True on phones, iPads (including landscape / keyboard), and narrow desktop windows.
 *
 * Returns false on the server and on the first client render so SSR HTML matches
 * hydration — then updates. A mismatch here silently kills click/touch handlers
 * (exactly the “Shelf works, other buttons don’t” symptom).
 */
export function useCompactHubNav(): boolean {
  return useSyncExternalStore(
    subscribeCompactHubNav,
    readCompactHubNav,
    () => false,
  );
}
