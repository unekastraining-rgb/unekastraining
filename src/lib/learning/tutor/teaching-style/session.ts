/**
 * 2P-20 — Client session-held Teaching Style (presentation preference only).
 * Does not write mastery, evidence, notes, or Adaptive state.
 */

import type { TeachingStyle } from "./types";
import { isTeachingStyle } from "./resolve";

export const TEACHING_STYLE_SESSION_STORAGE_KEY = "studyhaul.teachingStyle";

export function readSessionTeachingStyle(): TeachingStyle | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(TEACHING_STYLE_SESSION_STORAGE_KEY);
    if (!raw) return undefined;
    return isTeachingStyle(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
}

/** Persist or clear session-held style. Does not reset chats by itself. */
export function writeSessionTeachingStyle(
  style: TeachingStyle | "" | undefined,
): void {
  if (typeof window === "undefined") return;
  try {
    if (!style) {
      window.sessionStorage.removeItem(TEACHING_STYLE_SESSION_STORAGE_KEY);
      return;
    }
    if (isTeachingStyle(style)) {
      window.sessionStorage.setItem(TEACHING_STYLE_SESSION_STORAGE_KEY, style);
    }
  } catch {
    /* ignore quota / private mode */
  }
}
