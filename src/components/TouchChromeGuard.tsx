"use client";

import { useLayoutEffect } from "react";
import { isTouchChrome } from "@/lib/core/touch-chrome";

/** @deprecated Prefer isTouchChrome for hub chrome. */
export function deviceHasTouch(): boolean {
  return isTouchChrome();
}

export { isTouchChrome };

export const TOUCH_CHROME_SELECTOR =
  "[data-hub-chrome], [data-core-hub-bar], [data-core-header], [data-core-toolbar], [data-pdf-toolbar], [data-pdf-ink-toolbar], [data-pdf-loop-bar], [data-core-selection-loop], [data-canvas-inspector], [data-quiz-chrome], [data-hub-onboarding], [data-study-gap-loop], [data-text-format-toolbar], .hub-chrome-interactive, [data-core-side-panel], [data-core-toolbar-backdrop], [data-core-toolbar-panel], [data-core-notes-drawer], [data-core-notes-rail], [data-notebook-page-rail], [data-notebook-cover], [data-notebook-setup], [data-tap-handler='1']";

export const TOUCH_OVERLAY_TAP_ROOT =
  "[data-core-side-panel], [data-core-toolbar-panel], [data-core-toolbar-backdrop], [data-text-format-toolbar], [data-core-notes-drawer], [data-core-notes-rail], [data-notebook-page-rail], [data-notebook-cover], [data-notebook-setup], [data-core-toolbar], [data-core-header], [data-core-hub-bar], [data-pdf-toolbar], [data-pdf-ink-toolbar], [data-pdf-loop-bar], [data-canvas-inspector], [data-core-selection-loop], [data-core-import-loading]";

const CHROME_SELECTOR = TOUCH_CHROME_SELECTOR;

const CANVAS_EXCLUDE =
  "[data-page-canvas], [data-notebook-desk], canvas";

const OVERLAY_CONTROL =
  "button, [role='button'], [role='switch'], [data-core-chrome-action], summary, label";

export function isTouchChromeInteractive(interactive: HTMLElement): boolean {
  if (interactive.closest(CHROME_SELECTOR)) return true;
  if (interactive.closest(CANVAS_EXCLUDE)) return false;
  return false;
}

/**
 * Find the control for an overlay tap.
 * Includes useTapHandler buttons — iPad often never arms those; we synthesize click.
 */
export function findOverlayTapControl(
  hit: Element | null,
  overlayRootSelector: string = TOUCH_OVERLAY_TAP_ROOT,
): HTMLElement | null {
  if (!hit || typeof (hit as Element).closest !== "function") return null;
  if (!hit.closest(overlayRootSelector)) return null;

  const control = hit.closest(OVERLAY_CONTROL);
  if (!control || typeof (control as Element).closest !== "function") return null;
  const el = control as HTMLElement;
  if (!el.closest(overlayRootSelector)) return null;
  if (el.closest("a[href]")) return null;
  if (el.tagName === "BUTTON" && (el as HTMLButtonElement).type === "submit") {
    return null;
  }
  if ((el as HTMLButtonElement).disabled) return null;
  return el;
}

/**
 * data-touch for CSS hub swap + overlay taps for sheet interiors.
 * Phone/iPad only — never Windows mouse desktops (maxTouchPoints alone
 * would steal hybrid laptops into touch chrome).
 */
export function TouchChromeGuard() {
  useLayoutEffect(() => {
    const chrome = isTouchChrome();
    if (chrome) {
      document.documentElement.dataset.touch = "true";
    } else {
      delete document.documentElement.dataset.touch;
      return;
    }

    // Boot script may already own overlay taps.
    if ((window as Window & { __coreOverlayTap?: number }).__coreOverlayTap) {
      return () => {
        delete document.documentElement.dataset.touch;
      };
    }

    let start: { x: number; y: number } | null = null;

    function onTouchStart(event: TouchEvent) {
      const t = event.changedTouches[0] ?? event.touches[0];
      if (!t) return;
      start = { x: t.clientX, y: t.clientY };
    }

    function onTouchCancel() {
      start = null;
    }

    function onTouchEnd(event: TouchEvent) {
      const t = event.changedTouches[0];
      if (!t || !start) return;
      const dx = Math.abs(t.clientX - start.x);
      const dy = Math.abs(t.clientY - start.y);
      start = null;
      if (dx > 36 || dy > 36) return;

      const hit =
        document.elementFromPoint(t.clientX, t.clientY) ??
        (event.target instanceof Element ? event.target : null);
      const control = findOverlayTapControl(hit);
      if (!control) return;

      // Private debounce only — never stamp __coreOverlayLastFire before click
      // (that made useTapHandler.fire no-op the synthesized click).
      const win = window as Window & { __coreOverlayGuardLast?: number };
      const now = Date.now();
      if (now - (win.__coreOverlayGuardLast ?? 0) < 450) return;
      win.__coreOverlayGuardLast = now;

      event.preventDefault();
      event.stopPropagation();
      control.click();
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    document.addEventListener("touchend", onTouchEnd, { passive: false, capture: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true, capture: true });

    return () => {
      delete document.documentElement.dataset.touch;
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("touchend", onTouchEnd, true);
      document.removeEventListener("touchcancel", onTouchCancel, true);
    };
  }, []);

  return null;
}
