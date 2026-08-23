"use client";

import Link from "next/link";

import type { ScheduleChange } from "@/lib/schedule/proposals";

export function ScheduleProposalChangeList({
  changes,
  compact = false,
}: {
  changes: ScheduleChange[];
  compact?: boolean;
}) {
  return (
    <ul className={compact ? "space-y-1" : "space-y-2"}>
      {changes.map((change, index) => (
        <li
          key={`${change.title}-${index}`}
          className={
            compact
              ? "text-[11px] text-stone-600"
              : "rounded-lg bg-orange-50/60 px-3 py-2 text-sm text-stone-700"
          }
        >
          <span className={compact ? "font-medium text-stone-800" : "font-medium"}>
            {change.title}
          </span>
          {!compact ? (
            <span className="text-stone-500"> — {change.description}</span>
          ) : null}
          {change.minutes ? (
            <span className={compact ? "text-violet-600" : "ml-1 text-xs text-orange-600"}>
              {compact ? ` · ${change.minutes}m` : ` (${change.minutes} min)`}
            </span>
          ) : null}
          {change.sixHref ? (
            <div className={compact ? "mt-0.5" : "mt-2"}>
              <Link
                href={change.sixHref}
                className={
                  compact
                    ? "text-[10px] font-semibold text-violet-700 hover:underline"
                    : "inline-flex rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-200"
                }
              >
                Preview Six session
              </Link>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
