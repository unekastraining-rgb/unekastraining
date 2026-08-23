"use client";

import { useEffect, useRef, useState } from "react";

import { ColorPicker } from "@/components/customization/ColorPicker";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  children: React.ReactNode;
}

export function ColorPickerPopover({
  color,
  onChange,
  children,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200"
        aria-label="Change color"
      >
        {children}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2">
          <ColorPicker
            value={color}
            onChange={(next) => {
              onChange(next);
            }}
            label="Color"
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
