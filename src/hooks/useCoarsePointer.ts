"use client";

import { useSyncExternalStore } from "react";

function readCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function subscribeCoarsePointer(onStoreChange: () => void) {
  const query = window.matchMedia("(hover: none) and (pointer: coarse)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

/** True on phones and tablets where finger is the primary pointer. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribeCoarsePointer,
    readCoarsePointer,
    () => false,
  );
}
