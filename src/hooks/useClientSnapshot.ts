import { useSyncExternalStore } from "react";

/** False on SSR + first paint; true after mount (hydration-safe). */
export function useIsClientMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Snapshot that matches SSR until mount, then switches to the client value. */
export function useClientSnapshot<T>(
  getClientSnapshot: () => T,
  getServerSnapshot: () => T,
): T {
  const mounted = useIsClientMounted();
  return mounted ? getClientSnapshot() : getServerSnapshot();
}
