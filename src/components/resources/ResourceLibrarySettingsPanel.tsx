"use client";

import { ColorPicker } from "@/components/customization/ColorPicker";
import type { ResourcesLibrarySettings } from "@/lib/resources/types";

export function ResourceLibrarySettingsPanel({
  settings,
  onChange,
}: {
  settings: ResourcesLibrarySettings;
  onChange: (patch: Partial<ResourcesLibrarySettings>) => void;
}) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--sh-border-subtle)", background: "var(--sh-elevated)" }}>
      <h2 className="text-sm font-bold text-stone-900">Library appearance</h2>
      <p className="mt-1 text-xs text-stone-500">
        Customize layout and card details for your resource library.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Layout</p>
          <div className="mt-2 flex gap-2">
            {(["grid", "list"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => onChange({ layout })}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  settings.layout === layout
                    ? "chip-active"
                    : "chip"
                }`}
              >
                {layout === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Appearance</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["light", "dark", "system"] as const).map((appearance) => (
              <button
                key={appearance}
                type="button"
                onClick={() => onChange({ appearance })}
                className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${
                  settings.appearance === appearance
                    ? "chip-active"
                    : "chip"
                }`}
              >
                {appearance}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Card details</p>
          <div className="mt-2 space-y-2">
            {(
              [
                ["showIcons", "Show icons"],
                ["showDescriptions", "Show descriptions"],
                ["showTags", "Show tags"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2">
                <span className="text-xs font-medium text-stone-700">{label}</span>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(event) => onChange({ [key]: event.target.checked })}
                />
              </label>
            ))}
          </div>
        </div>

        <ColorPicker
          compact
          label="Library accent"
          value={settings.accentColor ?? "#ea580c"}
          onChange={(color) => onChange({ accentColor: color })}
        />
      </div>
    </div>
  );
}
