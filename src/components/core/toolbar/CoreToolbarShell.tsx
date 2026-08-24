"use client";

import { ChevronLeft, X } from "lucide-react";
import { createContext, useContext } from "react";

const CoreToolbarEmbedContext = createContext(false);

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
  const isEmbedded = embedded ?? embeddedFromContext;
  const alignClass = align === "right" ? "md:right-0 md:left-auto" : "md:left-0";
  return (
    <div
      data-core-toolbar-panel
      className={
        isEmbedded
          ? `flex h-full min-h-0 w-full flex-col bg-white ${className}`
          : `fixed inset-x-0 bottom-0 z-[90] max-h-[min(85dvh,32rem)] w-full rounded-t-2xl border border-stone-200 bg-white shadow-2xl md:absolute md:inset-x-auto md:bottom-auto ${alignClass} md:top-full md:mt-2 md:max-h-none md:w-[min(22rem,calc(100vw-2rem))] md:rounded-2xl ${className}`
      }
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-stone-100 px-3 py-2.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
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
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl px-2 py-2 hover:bg-stone-50">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-stone-500">{description}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 rounded border-orange-300 text-orange-600"
      />
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
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left hover:bg-stone-50"
    >
      <span>
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-stone-500">{description}</span>
        ) : null}
      </span>
      <ChevronLeft className="h-4 w-4 rotate-180 text-stone-400" />
    </button>
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
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
      }`}
    >
      {label}
    </button>
  );
}
