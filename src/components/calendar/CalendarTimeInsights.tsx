"use client";

import { BarChart3 } from "lucide-react";

import type { CalendarTimeInsights } from "@/lib/calendar/time-insights";

export function CalendarTimeInsightsPanel({
  insights,
}: {
  insights: CalendarTimeInsights;
}) {
  const bars = [
    { label: "Class", hours: insights.classHours, color: "#3b82f6" },
    { label: "Study", hours: insights.studyHours, color: "#22c55e" },
    { label: "Assignments", hours: insights.assignmentHours, color: "#f59e0b" },
  ];
  const maxHours = Math.max(...bars.map((bar) => bar.hours), 1);

  return (
    <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-orange-600" />
        <h3 className="text-sm font-bold text-stone-900">Time insights</h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-center">
        <InsightStat label="Scheduled" value={`${insights.totalScheduledHours}h`} />
        <InsightStat label="Free est." value={`${insights.freeHoursEstimate}h`} />
        <InsightStat label="Events" value={String(insights.eventCount)} />
        <InsightStat label="Overdue" value={String(insights.overdueCount)} />
      </div>

      <div className="space-y-2">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-1 flex justify-between text-xs text-stone-600">
              <span>{bar.label}</span>
              <span>{bar.hours}h</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-orange-50">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(bar.hours / maxHours) * 100}%`,
                  backgroundColor: bar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {insights.busiestDay ? (
        <p className="mt-3 text-xs text-stone-500">
          Busiest day:{" "}
          <span className="font-semibold text-stone-700">
            {new Date(`${insights.busiestDay}T12:00:00`).toLocaleDateString(
              undefined,
              { weekday: "short", month: "short", day: "numeric" },
            )}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function InsightStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-orange-50/80 px-2 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p className="text-lg font-bold text-stone-900">{value}</p>
    </div>
  );
}
