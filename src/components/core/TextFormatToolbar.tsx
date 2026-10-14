"use client";

import { useEffect, useState } from "react";
import { Bold, Highlighter, Italic, RemoveFormatting, Underline } from "lucide-react";

import { useTapHandler } from "@/hooks/useTapHandler";
import {
  readActiveRichTextState,
  runActiveRichTextCommand,
  subscribeActiveRichTextHost,
} from "@/lib/core/rich-text-active";
import { TEXT_HIGHLIGHT_COLORS, TEXT_INK_COLORS } from "@/lib/core/rich-text";

export function TextFormatToolbar({
  defaultColor = "#44403c",
  className = "",
  compact = false,
}: {
  defaultColor?: string;
  className?: string;
  /** Keep controls on one row; color pickers float instead of wrapping. */
  compact?: boolean;
}) {
  const [active, setActive] = useState({ bold: false, italic: false, underline: false });
  const [colorPanel, setColorPanel] = useState<"ink" | "highlight" | null>(null);

  useEffect(() => {
    function refresh() {
      setActive(readActiveRichTextState());
    }
    refresh();
    const unsub = subscribeActiveRichTextHost(refresh);
    document.addEventListener("selectionchange", refresh);
    return () => {
      unsub();
      document.removeEventListener("selectionchange", refresh);
    };
  }, []);

  function run(command: Parameters<typeof runActiveRichTextCommand>[0], value?: string) {
    runActiveRichTextCommand(command, value);
    setActive(readActiveRichTextState());
  }

  return (
    <div
      data-text-format-toolbar
      className={`relative flex shrink-0 items-center gap-0.5 ${
        compact ? "flex-nowrap" : "flex-wrap gap-1"
      } ${className}`}
      onPointerDown={(event) => {
        // Mouse only — preventDefault on touch kills iPad activation.
        if (event.pointerType === "mouse") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <FormatButton label="Bold" active={active.bold} onClick={() => run("bold")} compact={compact}>
        <Bold className="h-3.5 w-3.5" strokeWidth={2.5} />
      </FormatButton>
      <FormatButton
        label="Italic"
        active={active.italic}
        onClick={() => run("italic")}
        compact={compact}
      >
        <Italic className="h-3.5 w-3.5" />
      </FormatButton>
      <FormatButton
        label="Underline"
        active={active.underline}
        onClick={() => run("underline")}
        compact={compact}
      >
        <Underline className="h-3.5 w-3.5" />
      </FormatButton>
      <span className="mx-0.5 h-4 w-px shrink-0 bg-stone-200" />
      <FormatButton
        label="Text color"
        active={colorPanel === "ink"}
        onClick={() => setColorPanel((current) => (current === "ink" ? null : "ink"))}
        compact={compact}
      >
        <span className="relative flex h-3.5 w-3.5 items-end justify-center text-[11px] font-black leading-none text-stone-800">
          A
          <span
            className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
            style={{ backgroundColor: defaultColor }}
          />
        </span>
      </FormatButton>
      <FormatButton
        label="Highlight"
        active={colorPanel === "highlight"}
        onClick={() =>
          setColorPanel((current) => (current === "highlight" ? null : "highlight"))
        }
        compact={compact}
      >
        <Highlighter className="h-3.5 w-3.5" />
      </FormatButton>
      <FormatButton
        label="Clear formatting"
        onClick={() => run("removeFormat")}
        compact={compact}
      >
        <RemoveFormatting className="h-3.5 w-3.5" />
      </FormatButton>

      {colorPanel === "ink" ? (
        <div
          className={
            compact
              ? "absolute left-0 top-full z-[520] mt-1 flex flex-wrap items-center gap-1 rounded-xl border border-stone-200 bg-white p-2 shadow-lg"
              : "flex w-full flex-wrap items-center gap-1 pt-1 sm:w-auto sm:pt-0"
          }
        >
          {TEXT_INK_COLORS.map((option) => (
            <ColorSwatch
              key={option.id}
              label={option.label}
              color={option.value}
              onActivate={() => {
                run("foreColor", option.value);
                setColorPanel(null);
              }}
            />
          ))}
        </div>
      ) : null}

      {colorPanel === "highlight" ? (
        <div
          className={
            compact
              ? "absolute left-0 top-full z-[520] mt-1 flex flex-wrap items-center gap-1 rounded-xl border border-stone-200 bg-white p-2 shadow-lg"
              : "flex w-full flex-wrap items-center gap-1 pt-1 sm:w-auto sm:pt-0"
          }
        >
          {TEXT_HIGHLIGHT_COLORS.map((option) => (
            <ColorSwatch
              key={option.id}
              label={`${option.label} highlight`}
              color={option.value}
              onActivate={() => {
                run("hiliteColor", option.value);
                setColorPanel(null);
              }}
            />
          ))}
          <FormatButton
            label="Remove highlight"
            onClick={() => {
              run("hiliteColor", "transparent");
              setColorPanel(null);
            }}
          >
            None
          </FormatButton>
        </div>
      ) : null}
    </div>
  );
}

function FormatButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const tap = useTapHandler(onClick);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...tap}
      suppressHydrationWarning
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md transition touch-manipulation ${
        active
          ? "bg-stone-900 text-white"
          : "text-stone-600 hover:bg-orange-50 hover:text-stone-900"
      }`}
    >
      <span className="pointer-events-none inline-flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}

function ColorSwatch({
  label,
  color,
  onActivate,
}: {
  label: string;
  color: string;
  onActivate: () => void;
}) {
  const tap = useTapHandler(onActivate);
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      data-core-chrome-action="1"
      {...tap}
      className="h-5 w-5 rounded-md ring-1 ring-stone-200 hover:ring-orange-400"
      style={{
        backgroundColor: color,
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    />
  );
}
