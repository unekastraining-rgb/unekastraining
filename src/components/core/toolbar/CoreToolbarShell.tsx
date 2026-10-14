"use client";

import { ChevronLeft, X } from "lucide-react";
import { createContext, useContext, type CSSProperties } from "react";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";

const CoreToolbarEmbedContext = createContext(false);
const CoreToolbarAnchorContext = createContext<CSSProperties | null>(null);

export function CoreToolbarEmbedProvider({
  embedded,
  children,
}: {
  embedded: boolean;
  children: React.ReactNode;
}) {
  return (
    <CoreToolbarEmbedContext.Provider value={embedded}>
      {children}
    </CoreToolbarEmbedContext.Provider>
  );
}

export function CoreToolbarAnchorProvider({
  anchor,
  children,
}: {
  anchor: CSSProperties | null;
  children: React.ReactNode;
}) {
  return (
    <CoreToolbarAnchorContext.Provider value={anchor}>
      {children}
    </CoreToolbarAnchorContext.Provider>
  );
}

export function CoreToolbarShell({
  title,
  onBack,
  onClose,
  children,
  className = "",
  align = "left",
  embedded,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
  embedded?: boolean;
}) {
  const embeddedFromContext = useContext(CoreToolbarEmbedContext);
  const anchor = useContext(CoreToolbarAnchorContext);
  const isEmbedded = embedded ?? embeddedFromContext;
  const alignClass = align === "right" ? "lg:right-0 lg:left-auto" : "lg:left-0";

  // Fixed (+ optional measured anchor) escapes overflow-hidden ancestors that clip absolute panels.
  // Above ink (z-5000) and hub (z-400) so iPad taps hit the sheet, not the canvas.
  const floatingClass = anchor
    ? `fixed z-[5100] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl ${className}`
    : `fixed inset-x-0 bottom-0 z-[5100] max-h-[min(85dvh,32rem)] w-full rounded-t-2xl border border-stone-200 bg-white shadow-2xl lg:inset-x-auto lg:bottom-auto ${alignClass} lg:left-3 lg:top-16 lg:mt-0 lg:max-h-[min(32rem,calc(100dvh-5rem))] lg:w-[min(22rem,calc(100vw-1.5rem))] lg:rounded-2xl ${className}`;

  return (
    <div
      data-core-toolbar-panel
      className={
        isEmbedded
          ? `flex h-full min-h-0 w-full flex-col bg-white ${className}`
          : floatingClass
      }
      style={!isEmbedded && anchor ? anchor : undefined}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-stone-100 px-3 py-2.5">
        {onBack ? (
          <CoreChromeAction
            onActivate={() => onBack()}
            aria-label="Back"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 touch-manipulation hover:bg-stone-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </CoreChromeAction>
        ) : null}
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">{title}</p>
        <CoreChromeAction
          onActivate={onClose}
          aria-label="Close"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 touch-manipulation hover:bg-stone-100"
        >
          <X className="h-4 w-4" />
        </CoreChromeAction>
      </header>
      <div
        className={
          isEmbedded
            ? "min-h-0 flex-1 overflow-y-auto p-3"
            : "max-h-[min(28rem,70vh)] overflow-y-auto p-3"
        }
      >
        {children}
      </div>
    </div>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 touch-manipulation hover:bg-stone-50">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-stone-500">{description}</span>
        ) : null}
      </span>
      <span className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 rounded border-orange-300 text-orange-600"
        />
      </span>
    </label>
  );
}

export function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block rounded-xl px-2 py-2">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-stone-800">{label}</span>
        <span className="text-xs font-bold text-stone-500">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  );
}

export function NavRow({
  label,
  description,
  onClick,
}: {
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <CoreChromeAction
      onActivate={onClick}
      className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 py-2.5 text-left touch-manipulation hover:bg-stone-50"
    >
      <span>
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-stone-500">{description}</span>
        ) : null}
      </span>
      <ChevronLeft className="h-4 w-4 rotate-180 text-stone-400" />
    </CoreChromeAction>
  );
}

export function OptionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <CoreChromeAction
      onActivate={onClick}
      pressed={active}
      className={`inline-flex min-h-11 items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold touch-manipulation ${
        active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
      }`}
    >
      {label}
    </CoreChromeAction>
  );
}
