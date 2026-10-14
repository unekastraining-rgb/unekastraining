"use client";

import { useEffect, useRef } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BringToFront,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Group,
  MousePointer2,
  Scissors,
  SendToBack,
  Trash2,
  Ungroup,
} from "lucide-react";

export interface CanvasContextMenuState {
  x: number;
  y: number;
}

export function CanvasContextMenu({
  menu,
  onClose,
  hasSelection,
  canPaste,
  canGroup,
  canUngroup,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onSelectAll,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
}: {
  menu: CanvasContextMenuState | null;
  onClose: () => void;
  hasSelection: boolean;
  canPaste: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onSelectAll: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("click", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const run = (action: () => void) => {
    action();
    onClose();
  };

  const items: Array<
    | { type: "sep" }
    | {
        type: "item";
        label: string;
        shortcut?: string;
        icon: typeof Scissors;
        disabled?: boolean;
        danger?: boolean;
        onClick: () => void;
      }
  > = [
    {
      type: "item",
      label: "Cut",
      shortcut: "Ctrl+X",
      icon: Scissors,
      disabled: !hasSelection,
      onClick: () => run(onCut),
    },
    {
      type: "item",
      label: "Copy",
      shortcut: "Ctrl+C",
      icon: ClipboardCopy,
      disabled: !hasSelection,
      onClick: () => run(onCopy),
    },
    {
      type: "item",
      label: "Paste",
      shortcut: "Ctrl+V",
      icon: ClipboardPaste,
      disabled: !canPaste,
      onClick: () => run(onPaste),
    },
    {
      type: "item",
      label: "Duplicate",
      shortcut: "Ctrl+D",
      icon: Copy,
      disabled: !hasSelection,
      onClick: () => run(onDuplicate),
    },
    { type: "sep" },
    {
      type: "item",
      label: "Bring to front",
      icon: BringToFront,
      disabled: !hasSelection || !onBringToFront,
      onClick: () => onBringToFront && run(onBringToFront),
    },
    {
      type: "item",
      label: "Bring forward",
      icon: ArrowUpToLine,
      disabled: !hasSelection || !onBringForward,
      onClick: () => onBringForward && run(onBringForward),
    },
    {
      type: "item",
      label: "Send backward",
      icon: ArrowDownToLine,
      disabled: !hasSelection || !onSendBackward,
      onClick: () => onSendBackward && run(onSendBackward),
    },
    {
      type: "item",
      label: "Send to back",
      icon: SendToBack,
      disabled: !hasSelection || !onSendToBack,
      onClick: () => onSendToBack && run(onSendToBack),
    },
    { type: "sep" },
    {
      type: "item",
      label: "Group",
      shortcut: "Ctrl+G",
      icon: Group,
      disabled: !canGroup,
      onClick: () => run(onGroup),
    },
    {
      type: "item",
      label: "Ungroup",
      shortcut: "Ctrl+Shift+G",
      icon: Ungroup,
      disabled: !canUngroup,
      onClick: () => run(onUngroup),
    },
    { type: "sep" },
    {
      type: "item",
      label: "Select all",
      shortcut: "Ctrl+A",
      icon: MousePointer2,
      onClick: () => run(onSelectAll),
    },
    {
      type: "item",
      label: "Delete",
      shortcut: "Del",
      icon: Trash2,
      disabled: !hasSelection,
      danger: true,
      onClick: () => run(onDelete),
    },
  ];

  const left = Math.min(menu.x, typeof window !== "undefined" ? window.innerWidth - 220 : menu.x);
  const top = Math.min(menu.y, typeof window !== "undefined" ? window.innerHeight - 420 : menu.y);

  return (
    <div
      ref={rootRef}
      role="menu"
      data-canvas-context-menu
      className="fixed z-[5200] min-w-[12rem] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl"
      style={{ left, top }}
    >
      {items.map((item, index) => {
        if (item.type === "sep") {
          return <div key={`sep-${index}`} className="my-1 border-t border-stone-100" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={item.onClick}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium disabled:opacity-40 ${
              item.danger
                ? "text-rose-600 hover:bg-rose-50"
                : "text-stone-700 hover:bg-orange-50"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.shortcut ? (
              <span className="text-[10px] font-normal text-stone-400">{item.shortcut}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
