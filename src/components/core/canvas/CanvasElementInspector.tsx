"use client";

import { Group, Ungroup } from "lucide-react";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { ColorPicker } from "@/components/customization/ColorPicker";
import { CompactPalettePicker } from "@/components/customization/CompactPalettePicker";
import type { PageDecoration, PageImage, PageTextBox } from "@/lib/core/note-types";

export function CanvasElementInspector({
  decoration,
  image,
  textBox,
  selectedCount = 1,
  onDecorationChange,
  onImageChange,
  onTextBoxChange,
  onGroup,
  onUngroup,
  canGroup = false,
  canUngroup = false,
  onClose,
}: {
  decoration?: PageDecoration | null;
  image?: PageImage | null;
  textBox?: PageTextBox | null;
  selectedCount?: number;
  onDecorationChange?: (patch: Partial<PageDecoration>) => void;
  onImageChange?: (patch: Partial<PageImage>) => void;
  onTextBoxChange?: (patch: Partial<PageTextBox>) => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  canGroup?: boolean;
  canUngroup?: boolean;
  onClose?: () => void;
}) {
  if (!decoration && !image && !textBox && selectedCount === 0) return null;

  const fillColor = decoration?.color ?? textBox?.backgroundColor ?? "#fef9c3";
  const borderColor = decoration?.borderColor ?? decoration?.color ?? "#44403c";
  const textColor = decoration?.textColor ?? textBox?.color ?? "#44403c";
  const opacity = decoration?.opacity ?? image?.opacity ?? textBox?.opacity ?? 1;
  const multi = selectedCount > 1;

  return (
    <div
      data-canvas-inspector
      className="shrink-0 border-b border-orange-100 bg-stone-50/80 px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          {multi
            ? `${selectedCount} selected`
            : textBox
              ? "Text box"
              : decoration
                ? "Element"
                : image
                  ? "Image"
                  : "Selection"}
        </p>

        {(canGroup || canUngroup) && (
          <div className="flex gap-1">
            {canGroup ? (
              <CoreChromeAction
                onActivate={() => onGroup?.()}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                title="Group (⌘G)"
              >
                <Group className="h-3 w-3" />
                Group
              </CoreChromeAction>
            ) : null}
            {canUngroup ? (
              <CoreChromeAction
                onActivate={() => onUngroup?.()}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-50"
                title="Ungroup (⇧⌘G)"
              >
                <Ungroup className="h-3 w-3" />
                Ungroup
              </CoreChromeAction>
            ) : null}
          </div>
        )}

        {textBox && !multi ? (
          <>
            <div className="min-w-[7rem]">
              <ColorPicker
                compact
                label="Default text"
                value={textColor}
                onChange={(color) => onTextBoxChange?.({ color })}
              />
            </div>
            <div className="min-w-[7rem]">
              <ColorPicker
                compact
                label="Box fill"
                value={textBox.backgroundColor ?? "#ffffff"}
                onChange={(color) => onTextBoxChange?.({ backgroundColor: color })}
              />
            </div>
          </>
        ) : null}

        {decoration && !multi ? (
          <>
            <div className="min-w-[7rem]">
              <ColorPicker
                compact
                label="Fill"
                value={fillColor}
                onChange={(color) => onDecorationChange?.({ color })}
              />
            </div>
            {decoration.kind === "text_stamp" ||
            decoration.kind === "banner" ||
            decoration.kind === "sticky" ? (
              <>
                <div className="min-w-[7rem]">
                  <ColorPicker
                    compact
                    label="Border"
                    value={borderColor}
                    onChange={(color) => onDecorationChange?.({ borderColor: color })}
                  />
                </div>
                {(decoration.kind === "sticky" || decoration.kind === "text_stamp") && (
                  <div className="min-w-[7rem]">
                    <ColorPicker
                      compact
                      label="Text"
                      value={textColor}
                      onChange={(color) => onDecorationChange?.({ textColor: color })}
                    />
                  </div>
                )}
              </>
            ) : null}
            {(decoration.kind === "text_stamp" || decoration.kind === "banner") && (
              <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
                <span className="text-[10px] font-semibold text-stone-500">Label</span>
                <input
                  value={decoration.text ?? ""}
                  onChange={(e) => onDecorationChange?.({ text: e.target.value })}
                  className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs outline-none focus:border-orange-300"
                />
              </label>
            )}
            <div className="min-w-[10rem] flex-1">
              <CompactPalettePicker
                applyGlobally={false}
                label="Palette"
                showImageImport
                onSelectPalette={(colors) => {
                  if (colors[0]) onDecorationChange?.({ color: colors[0] });
                }}
              />
            </div>
          </>
        ) : null}

        {image && !multi ? (
          <p className="text-[10px] text-stone-500">Imported image — adjust opacity to fade.</p>
        ) : null}

        {!multi ? (
          <label className="flex min-w-[7rem] flex-col gap-1">
            <span className="text-[10px] font-semibold text-stone-500">Opacity</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (decoration) onDecorationChange?.({ opacity: next });
                if (image) onImageChange?.({ opacity: next });
                if (textBox) onTextBoxChange?.({ opacity: next });
              }}
              className="w-full"
            />
          </label>
        ) : null}

        {onClose ? (
          <CoreChromeAction
            onActivate={onClose}
            className="ml-auto text-[10px] font-semibold text-stone-400 hover:text-stone-600"
          >
            Done
          </CoreChromeAction>
        ) : null}
      </div>
    </div>
  );
}
