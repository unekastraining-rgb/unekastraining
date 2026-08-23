/** Pointer helpers for canvas element move / resize / rotate. */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export function pointerToLocal(
  clientX: number,
  clientY: number,
  container: HTMLElement,
): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function clampRect(rect: Rect, minSize = 24): Rect {
  return {
    ...rect,
    width: Math.max(minSize, rect.width),
    height: Math.max(minSize, rect.height),
    x: Math.max(0, rect.x),
    y: Math.max(0, rect.y),
  };
}

export function bindPointerDrag(options: {
  event: PointerEvent;
  onMove: (dx: number, dy: number, event: PointerEvent) => void;
  onEnd?: (event: PointerEvent) => void;
}) {
  const originX = options.event.clientX;
  const originY = options.event.clientY;
  let lastX = originX;
  let lastY = originY;

  function onMove(event: PointerEvent) {
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    options.onMove(dx, dy, event);
  }

  function onUp(event: PointerEvent) {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    options.onEnd?.(event);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

export function bindPointerDragAbsolute(options: {
  event: PointerEvent;
  onMove: (x: number, y: number, event: PointerEvent) => void;
  onEnd?: (event: PointerEvent) => void;
}) {
  const startX = options.event.clientX;
  const startY = options.event.clientY;
  let originX = startX;
  let originY = startY;

  function onMove(event: PointerEvent) {
    const dx = event.clientX - originX;
    const dy = event.clientY - originY;
    originX = event.clientX;
    originY = event.clientY;
    options.onMove(dx, dy, event);
  }

  function onUp(event: PointerEvent) {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    options.onEnd?.(event);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

export function bindPointerResize(options: {
  startRect: Rect;
  onResize: (rect: Rect) => void;
  onEnd?: () => void;
  aspectLock?: boolean;
  event: PointerEvent;
}) {
  const startX = options.startRect.x;
  const startY = options.startRect.y;
  const startW = options.startRect.width;
  const startH = options.startRect.height;
  const originX = options.event.clientX;
  const originY = options.event.clientY;

  function onMove(event: PointerEvent) {
    const dx = event.clientX - originX;
    const dy = event.clientY - originY;
    let width = Math.max(24, startW + dx);
    let height = Math.max(24, startH + dy);
    if (options.aspectLock && startW > 0) {
      const ratio = startH / startW;
      height = width * ratio;
    }
    options.onResize(clampRect({ x: startX, y: startY, width, height }));
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    options.onEnd?.();
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}
