"use client";

import type { RecurrenceEditScope } from "@/lib/calendar/recurrence";

interface RecurrenceScopeDialogProps {
  open: boolean;
  action: "edit" | "delete";
  onChoose: (scope: RecurrenceEditScope) => void;
  onCancel: () => void;
}

const OPTIONS: Array<{ scope: RecurrenceEditScope; label: string; description: string }> =
  [
    {
      scope: "single",
      label: "This event",
      description: "Only this date in the series",
    },
    {
      scope: "following",
      label: "This and following",
      description: "This date and all future repeats",
    },
    {
      scope: "series",
      label: "All events",
      description: "Every date in the series",
    },
  ];

export function RecurrenceScopeDialog({
  open,
  action,
  onChoose,
  onCancel,
}: RecurrenceScopeDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-stone-900">
          {action === "delete" ? "Delete repeating event" : "Edit repeating event"}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          This event is part of a repeating series. What should change?
        </p>

        <div className="mt-4 space-y-2">
          {OPTIONS.map((option) => (
            <button
              key={option.scope}
              type="button"
              onClick={() => onChoose(option.scope)}
              className="w-full rounded-xl border border-orange-100 px-4 py-3 text-left transition hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-sm font-semibold text-stone-900">{option.label}</p>
              <p className="text-xs text-stone-500">{option.description}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-orange-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
