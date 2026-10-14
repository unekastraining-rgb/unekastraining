"use client";

import {
  useCallback,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";

export type TapHandlerProps = {
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
  /** Marks chrome for CSS hit-testing (children get pointer-events: none). */
  "data-tap-handler": "1";
};

/**
 * Reliable taps on iPad/Safari — same constraints GoodNotes avoids by being
 * native, and that web note apps hit constantly:
 *
 * - iOS often cancels Pointer Events mid-gesture (`pointercancel`) so
 *   `pointerup` never arrives.
 * - Real `<a href>` navigation (Shelf) still works; buttons need an explicit
 *   `touchend` activation path.
 * - Mouse/keyboard still use `click`.
 *
 * Fire order: touchend (finger) → pointerup (pen, if no touchend) → click.
 * 450ms debounce collapses duplicates / ghost clicks.
 */
export function useTapHandler(handler: () => void): TapHandlerProps {
  const handlerRef = useRef(handler);
  // eslint-disable-next-line react-hooks/refs -- keep latest handler for stable tap callbacks
  handlerRef.current = handler;
  const lastFireRef = useRef(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const armedRef = useRef(false);
  /** True after touchend handled this gesture — skip redundant pointerup. */
  const touchHandledRef = useRef(false);

  const fire = useCallback(() => {
    const win = window as Window & { __coreOverlayLastFire?: number };
    const now = Date.now();
    // Debounce only our own fires. Do NOT bail on __coreOverlayLastFire set by a
    // document overlay before btn.click() — that deadlock made panel interiors
    // open-but-dead on iPad (overlay stamped, then click → fire no-op'd).
    if (now - lastFireRef.current < 450) return;
    lastFireRef.current = now;
    win.__coreOverlayLastFire = now;
    handlerRef.current();
  }, []);

  const startAt = useCallback((x: number, y: number) => {
    startRef.current = { x, y };
    armedRef.current = true;
    touchHandledRef.current = false;
  }, []);

  const movedTooFar = useCallback((x: number, y: number) => {
    const start = startRef.current;
    if (!start) return false;
    return Math.abs(x - start.x) > 22 || Math.abs(y - start.y) > 22;
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      startAt(event.clientX, event.clientY);
    },
    [startAt],
  );

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      const t = event.changedTouches[0] ?? event.touches[0];
      if (!t) return;
      startAt(t.clientX, t.clientY);
    },
    [startAt],
  );

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      const t = event.changedTouches[0];
      if (!t || !armedRef.current) return;
      armedRef.current = false;
      if (movedTooFar(t.clientX, t.clientY)) {
        startRef.current = null;
        return;
      }
      startRef.current = null;
      touchHandledRef.current = true;
      // Stop iOS ghost click; we already activated.
      event.preventDefault();
      event.stopPropagation();
      fire();
    },
    [fire, movedTooFar],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      if (typeof event.button === "number" && event.button > 0) return;
      // Finger already handled via touchend (more reliable than pointerup on iOS).
      if (event.pointerType === "touch" || touchHandledRef.current) {
        touchHandledRef.current = false;
        return;
      }
      if (!armedRef.current) return;
      armedRef.current = false;
      if (movedTooFar(event.clientX, event.clientY)) {
        startRef.current = null;
        return;
      }
      startRef.current = null;
      event.preventDefault();
      event.stopPropagation();
      fire();
    },
    [fire, movedTooFar],
  );

  const onPointerCancel = useCallback(() => {
    // iOS Scribble / scroll often cancels pointers — clear arm so we don't
    // fire a stale tap later; touchend may still arrive and activate.
    armedRef.current = false;
    startRef.current = null;
  }, []);

  const onClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      // Keyboard activation and mouse; touch already fired via touchend.
      fire();
      event.preventDefault();
    },
    [fire],
  );

  return {
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onTouchStart,
    onTouchEnd,
    "data-tap-handler": "1",
  };
}
