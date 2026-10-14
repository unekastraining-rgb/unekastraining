/** Client-side signal that LMS background sync finished (avoids router.refresh on mobile). */
export const LMS_SYNCED_EVENT = "studyhaul:lms-synced";

export function dispatchLmsSynced() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LMS_SYNCED_EVENT));
}

export function subscribeLmsSynced(onSynced: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onSynced();
  window.addEventListener(LMS_SYNCED_EVENT, handler);
  return () => window.removeEventListener(LMS_SYNCED_EVENT, handler);
}
