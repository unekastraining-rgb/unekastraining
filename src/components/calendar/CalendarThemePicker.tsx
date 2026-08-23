"use client";

import { ColorPicker } from "@/components/customization/ColorPicker";
import { CompactPalettePicker } from "@/components/customization/CompactPalettePicker";
import {
  CALENDAR_THEME_PRESETS,
  calendarThemeFromPalette,
  settingsFromThemePreset,
  type CalendarThemeId,
} from "@/lib/calendar/calendar-themes";
import type { CalendarSettings } from "@/lib/calendar/settings";

export function CalendarThemePicker({
  settings,
  onSave,
}: {
  settings: CalendarSettings;
  onSave: (patch: Partial<CalendarSettings>) => Promise<void>;
}) {
  const activeBg = settings.backgroundColor ?? "#ffffff";
  const activeAccent = settings.accentColor ?? "#6366f1";
  const eventPalette =
    settings.customEventPalette ??
    CALENDAR_THEME_PRESETS.find((t) => t.id === settings.themeId)?.eventPalette ??
    [];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
          Theme presets
        </p>
        <p className="mb-3 text-xs text-stone-500">
          Like Coursicle — each theme sets the calendar background and event colors together.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CALENDAR_THEME_PRESETS.map((theme) => {
            const active = settings.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => void onSave(settingsFromThemePreset(theme.id))}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  active
                    ? "border-[var(--cal-accent,#ea580c)] ring-2 ring-orange-300"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div
                  className="h-14 p-2"
                  style={{ backgroundColor: theme.backgroundColor }}
                >
                  <div className="flex h-full gap-1">
                    {theme.eventPalette.slice(0, 4).map((color) => (
                      <span
                        key={color}
                        className="flex-1 rounded-md"
                        style={{ backgroundColor: color, opacity: 0.85 }}
                      />
                    ))}
                  </div>
                </div>
                <div
                  className="px-2 py-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: theme.accentColor,
                    color: theme.isDark ? "#fff" : "#fff",
                  }}
                >
                  {theme.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
        <p className="text-xs font-bold text-stone-800">Built-in palettes</p>
        <p className="mt-0.5 text-[10px] text-stone-500">
          Sets background, accent, and event colors at once — you can still tweak each below.
        </p>
        <CompactPalettePicker
          label="Apply palette to calendar"
          applyGlobally={false}
          onSelectPalette={(colors) => void onSave(calendarThemeFromPalette(colors))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-100 p-3">
          <p className="text-xs font-bold text-stone-700">Background</p>
          <div className="mt-2 flex items-center gap-2">
            <ColorPicker
              compact
              value={activeBg}
              onChange={(color) =>
                void onSave({ themeId: "custom" as CalendarThemeId, backgroundColor: color })
              }
              label="Background"
            />
            <span className="font-mono text-[10px] text-stone-500">{activeBg}</span>
          </div>
        </div>
        <div className="rounded-xl border border-stone-100 p-3">
          <p className="text-xs font-bold text-stone-700">Accent</p>
          <div className="mt-2 flex items-center gap-2">
            <ColorPicker
              compact
              value={activeAccent}
              onChange={(color) =>
                void onSave({ themeId: "custom" as CalendarThemeId, accentColor: color })
              }
              label="Accent"
            />
            <span className="font-mono text-[10px] text-stone-500">{activeAccent}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
          Event colors
        </p>
        <p className="mb-2 text-[10px] text-stone-500">
          Classes and events are mapped to the nearest swatch — click to replace a color.
        </p>
        <div className="flex flex-wrap gap-2">
          {eventPalette.map((color, index) => (
            <ColorPicker
              key={`${index}-${color}`}
              compact
              value={color}
              onChange={(next) => {
                const copy = [...eventPalette];
                copy[index] = next;
                void onSave({
                  themeId: "custom",
                  customEventPalette: copy,
                });
              }}
              label={`Event ${index + 1}`}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              void onSave({
                themeId: "custom",
                customEventPalette: [...eventPalette, "#94a3b8"],
              })
            }
            className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-stone-300 text-stone-500"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
