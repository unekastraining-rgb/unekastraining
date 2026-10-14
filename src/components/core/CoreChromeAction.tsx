"use client";

import type { ReactNode } from "react";
import { useTapHandler } from "@/hooks/useTapHandler";

/**
 * Desktop / healthy-client chrome action (touchend + click).
 * No navigation — parent sets React state. Touch hubs use CoreHubChrome links instead.
 */
export function CoreChromeAction({
  children,
  onActivate,
  className = "",
  title,
  "aria-label": ariaLabel,
  disabled = false,
  pressed = false,
}: {
  children: ReactNode;
  onActivate: () => void;
  className?: string;
  title?: string;
  "aria-label"?: string;
  disabled?: boolean;
  pressed?: boolean;
}) {
  const tap = useTapHandler(() => {
    if (!disabled) onActivate();
  });

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pressed || undefined}
      aria-label={ariaLabel}
      title={title}
      data-core-chrome-action="1"
      {...tap}
      className={`${className} ${disabled ? "opacity-50" : "cursor-pointer"}`}
      style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
    >
      <span className="pointer-events-none inline-flex items-center justify-center gap-1">
        {children}
      </span>
    </button>
  );
}
