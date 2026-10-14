"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { setActiveRichTextHost, getActiveRichTextHost } from "@/lib/core/rich-text-active";
import {
  plainTextFromHtml,
  resolveTextBoxHtml,
  sanitizeRichHtml,
} from "@/lib/core/rich-text";

export function RichTextEditor({
  id,
  text,
  html,
  color,
  placeholder = "Type here...",
  readOnly = false,
  selected = false,
  autoFocus = false,
  bare = false,
  className = "",
  style,
  onChange,
  onPointerDown,
  onBlur: onBlurProp,
}: {
  id?: string;
  text: string;
  html?: string | null;
  color?: string;
  placeholder?: string;
  readOnly?: boolean;
  /** When true, this editor owns the docked format toolbar. */
  selected?: boolean;
  autoFocus?: boolean;
  /** No card chrome — transparent floating text for the canvas. */
  bare?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onChange: (next: { text: string; html: string }) => void;
  onPointerDown?: (event: React.PointerEvent) => void;
  onBlur?: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef("");
  const [richTextHostId, setRichTextHostId] = useState(() => id ?? "rte_host");
  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync host id when parent assigns stable editor id
      setRichTextHostId(id);
      return;
    }
    setRichTextHostId((current) =>
      current === "rte_host"
        ? `rte_${Math.random().toString(36).slice(2, 9)}`
        : current,
    );
  }, [id]);
  const [focused, setFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!(text || html));

  function emitFromEditor() {
    const el = editorRef.current;
    if (!el) return;
    const nextHtml = sanitizeRichHtml(el.innerHTML);
    const nextText = plainTextFromHtml(nextHtml);
    lastEmitted.current = nextHtml;
    setIsEmpty(!nextText.trim());
    onChange({ text: nextText, html: nextHtml });
  }

  function registerHost() {
    setActiveRichTextHost({
      id: richTextHostId,
      focus: () => editorRef.current?.focus(),
      emit: emitFromEditor,
    });
  }

  // Seed before paint so notebook text (e.g. "love") is not an empty box on iPad.
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const incoming = resolveTextBoxHtml({ text, html });
    if (incoming === lastEmitted.current) return;
    if (document.activeElement === el) return;
    el.innerHTML = incoming;
    lastEmitted.current = incoming;
    setIsEmpty(!plainTextFromHtml(incoming).trim());
  }, [text, html]);

  useEffect(() => {
    if (selected && !readOnly) {
      registerHost();
      return () => {
        if (getActiveRichTextHost()?.id === richTextHostId) {
          setActiveRichTextHost(null);
        }
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, readOnly, richTextHostId]);

  useEffect(() => {
    if (!autoFocus || readOnly) return;
    const frame = requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, readOnly]);

  // Re-selecting an idle canvas text box: unlock edit mode and focus for formatting.
  useEffect(() => {
    if (!bare || !selected || readOnly) return;
    const frame = requestAnimationFrame(() => {
      editorRef.current?.focus();
      registerHost();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bare, selected, readOnly]);

  return (
    <div className={`flex h-full min-h-0 min-w-0 flex-col ${className}`}>
      <div className="relative min-h-0 min-w-0 flex-1">
        {isEmpty && !focused && placeholder ? (
          <span
            className={`pointer-events-none absolute text-sm text-stone-400 ${
              bare ? "left-0.5 top-0.5" : "left-3 top-3"
            }`}
          >
            {placeholder}
          </span>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline
          aria-label={placeholder || "Text"}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          data-rich-text-id={richTextHostId}
          onPointerDown={(event) => {
            event.stopPropagation();
            onPointerDown?.(event);
          }}
          onFocus={() => {
            setFocused(true);
            if (!readOnly) registerHost();
          }}
          onBlur={(event) => {
            const related = event.relatedTarget as HTMLElement | null;
            if (
              related?.closest?.(
                "[data-text-format-toolbar], [data-text-format-dock], [data-canvas-inspector]",
              )
            ) {
              emitFromEditor();
              return;
            }
            setFocused(false);
            emitFromEditor();
            onBlurProp?.();
          }}
          onInput={emitFromEditor}
          className={
            bare
              ? "h-full min-h-[1.5rem] min-w-0 overflow-auto whitespace-pre-wrap break-words bg-transparent px-0.5 py-0.5 text-sm leading-relaxed outline-none touch-manipulation [overflow-wrap:anywhere]"
              : "h-full min-h-[4rem] min-w-0 overflow-auto whitespace-pre-wrap break-words bg-transparent p-3 text-sm leading-relaxed outline-none touch-manipulation [overflow-wrap:anywhere]"
          }
          style={{ color: color ?? "#44403c", ...style }}
        />
      </div>
    </div>
  );
}
