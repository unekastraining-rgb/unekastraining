"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pipette, Star, X } from "lucide-react";

import {
  clamp,
  hexToHsl,
  hexToRgb,
  hslToHex,
  normalizeHex,
  parseColorInput,
  rgbToHex,
  type Hsl,
} from "@/lib/customization/color-math";
import { useCustomizationOptional } from "@/components/customization/CustomizationProvider";

type Tab = "picker" | "recent" | "favorites";

export function ColorPicker({
  value,
  onChange,
  label = "Color",
  compact = false,
  onClose,
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  compact?: boolean;
  onClose?: () => void;
}) {
  const customization = useCustomizationOptional();
  const [open, setOpen] = useState(!compact);
  const [tab, setTab] = useState<Tab>("picker");
  const [hsl, setHsl] = useState<Hsl>(() => hexToHsl(value) ?? { h: 220, s: 60, l: 50 });
  const slRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const parsed = hexToHsl(value);
    if (parsed) setHsl(parsed);
  }, [value]);

  const hex = hslToHex(hsl);
  const rgb = hexToRgb(hex)!;

  const commit = useCallback(
    (color: string) => {
      const normalized = normalizeHex(color);
      if (!normalized) return;
      onChange(normalized);
      void customization?.recordColor(normalized);
    },
    [onChange, customization],
  );

  const updateHsl = (next: Partial<Hsl>) => {
    const merged = { ...hsl, ...next };
    setHsl(merged);
    commit(hslToHex(merged));
  };

  const handleSlPointer = (clientX: number, clientY: number) => {
    const el = slRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const l = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);
    updateHsl({ s, l });
  };

  async function pickFromScreen() {
    if (!("EyeDropper" in window)) return;
    try {
      // @ts-expect-error EyeDropper is not in all TS libs
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      const parsed = normalizeHex(result.sRGBHex);
      if (parsed) {
        const nextHsl = hexToHsl(parsed);
        if (nextHsl) setHsl(nextHsl);
        commit(parsed);
      }
    } catch {
      // user cancelled
    }
  }

  function ColorSwatchRow({
    colors,
    removable,
    onRemove,
  }: {
    colors: string[];
    removable?: boolean;
    onRemove?: (color: string) => void;
  }) {
    if (colors.length === 0) {
      return <p className="text-xs text-stone-400">No colors yet.</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <div key={color} className="relative">
            <button
              type="button"
              title={color}
              onClick={() => {
                const parsed = hexToHsl(color);
                if (parsed) setHsl(parsed);
                commit(color);
              }}
              className={`h-8 w-8 rounded-full border-2 transition hover:scale-105 ${
                value === color ? "border-stone-900" : "border-white shadow"
              }`}
              style={{ backgroundColor: color }}
            />
            {removable && onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(color)}
                className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow"
                aria-label="Remove"
              >
                <X className="h-2.5 w-2.5 text-stone-500" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  const panel = (
    <div className="w-72 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{label}</p>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-stone-100">
            <X className="h-4 w-4 text-stone-500" />
          </button>
        ) : null}
      </div>

      <div className="mb-2 flex gap-1 rounded-lg bg-stone-100 p-0.5">
        {(["picker", "recent", "favorites"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${
              tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "picker" ? (
        <div className="space-y-3">
          <div
            ref={slRef}
            className="relative h-36 cursor-crosshair rounded-xl"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsl.h} 100% 50%))`,
            }}
            onPointerDown={(e) => {
              dragging.current = true;
              handleSlPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (!dragging.current) return;
              handleSlPointer(e.clientX, e.clientY);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerLeave={() => {
              dragging.current = false;
            }}
          >
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${hsl.s}%`,
                top: `${100 - hsl.l}%`,
                backgroundColor: hex,
              }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(hsl.h)}
            onChange={(e) => updateHsl({ h: Number(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background:
                "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            }}
            aria-label="Hue"
          />

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <label className="space-y-1">
              <span className="font-semibold text-stone-500">HEX</span>
              <input
                value={hex}
                onChange={(e) => {
                  const parsed = parseColorInput(e.target.value);
                  if (parsed) {
                    const next = hexToHsl(parsed);
                    if (next) setHsl(next);
                    commit(parsed);
                  }
                }}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-stone-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-stone-500">RGB</span>
              <input
                value={`${rgb.r}, ${rgb.g}, ${rgb.b}`}
                onChange={(e) => {
                  const parts = e.target.value.split(/[,\s]+/).map(Number);
                  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
                    const parsed = rgbToHex({ r: parts[0], g: parts[1], b: parts[2] });
                    const next = hexToHsl(parsed);
                    if (next) setHsl(next);
                    commit(parsed);
                  }
                }}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-stone-800"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-stone-500">HSL</span>
              <input
                value={`${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`}
                onChange={(e) => {
                  const match = e.target.value.match(
                    /(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/,
                  );
                  if (match) {
                    updateHsl({
                      h: Number(match[1]),
                      s: Number(match[2]),
                      l: Number(match[3]),
                    });
                  }
                }}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-stone-800"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void pickFromScreen()}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
            >
              <Pipette className="h-3 w-3" />
              Eyedropper
            </button>
            <button
              type="button"
              onClick={() => void customization?.toggleFavorite(hex)}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
            >
              <Star className="h-3 w-3" />
              Favorite
            </button>
            <div
              className="ml-auto h-8 w-8 rounded-lg border border-stone-200 shadow-inner"
              style={{ backgroundColor: hex }}
            />
          </div>
        </div>
      ) : null}

      {tab === "recent" ? (
        <ColorSwatchRow
          colors={customization?.state.recentColors ?? []}
          removable
          onRemove={(color) => void customization?.removeRecent(color)}
        />
      ) : null}

      {tab === "favorites" ? (
        <ColorSwatchRow colors={customization?.state.favoriteColors ?? []} />
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-stone-200"
          style={{ backgroundColor: value }}
          title="Pick color"
        />
        {open ? (
          <div className="absolute left-0 top-full z-[60] mt-2">{panel}</div>
        ) : null}
      </div>
    );
  }

  return panel;
}
