"use client";

import { useEffect, useRef, useState } from "react";

type TrailPoint = { x: number; y: number; born: number };

export function LaserPointerOverlay({
  active,
  color = "#ef4444",
}: {
  active: boolean;
  color?: string;
}) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setCursor(null);
      setTrail([]);
      return;
    }

    function onMove(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("[data-core-toolbar-dock], [data-core-header], [data-core-side-panel]")) {
        return;
      }
      const point = { x: event.clientX, y: event.clientY };
      setCursor(point);
      setTrail((current) => [...current.slice(-18), { ...point, born: Date.now() }]);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function tick() {
      const cutoff = Date.now() - 700;
      setTrail((current) => current.filter((point) => point.born >= cutoff));
      frameRef.current = window.requestAnimationFrame(tick);
    }

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [active]);

  if (!active || !cursor) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {trail.map((point, index) => {
        const age = Date.now() - point.born;
        const opacity = Math.max(0, 1 - age / 700) * (0.15 + index / trail.length / 4);
        const size = 6 + (index / Math.max(trail.length, 1)) * 10;
        return (
          <span
            key={`${point.born}-${index}`}
            className="absolute rounded-full"
            style={{
              left: point.x,
              top: point.y,
              width: size,
              height: size,
              transform: "translate(-50%, -50%)",
              backgroundColor: color,
              opacity,
              boxShadow: `0 0 12px ${color}`,
            }}
          />
        );
      })}
      <span
        className="absolute rounded-full"
        style={{
          left: cursor.x,
          top: cursor.y,
          width: 14,
          height: 14,
          transform: "translate(-50%, -50%)",
          backgroundColor: color,
          boxShadow: `0 0 16px ${color}, 0 0 4px white`,
        }}
      />
    </div>
  );
}
