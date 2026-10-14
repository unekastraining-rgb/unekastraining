"use client";

/**
 * Compact checkbox for multi-select list cards.
 */
export function SelectCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <label
      className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center touch-manipulation ${className}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="h-4 w-4 accent-[var(--sh-primary,#ea580c)]"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = Boolean(indeterminate) && !checked;
        }}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
    </label>
  );
}
