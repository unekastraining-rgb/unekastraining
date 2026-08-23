"use client";

import { Plus, Trash2 } from "lucide-react";

import type { TimelineEvent } from "@/lib/core/note-types";

export function TimelineEditor({
  events,
  onChange,
}: {
  events: TimelineEvent[];
  onChange: (events: TimelineEvent[]) => void;
}) {
  const update = (index: number, field: keyof TimelineEvent, value: string) => {
    onChange(events.map((event, i) => (i === index ? { ...event, [field]: value } : event)));
  };

  const addEvent = () => {
    onChange([...events, { date: "", title: "", description: "" }]);
  };

  const removeEvent = (index: number) => {
    if (events.length <= 1) return;
    onChange(events.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 p-4">
      <button
        type="button"
        onClick={addEvent}
        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add event
      </button>
      <div className="relative space-y-3 border-l-2 border-orange-200 pl-4">
        {events.map((event, index) => (
          <div key={index} className="relative rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <span className="absolute -left-[1.35rem] top-5 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-white" />
            <div className="mb-2 flex items-center justify-between">
              <input
                value={event.date}
                onChange={(e) => update(index, "date", e.target.value)}
                placeholder="Date / era"
                className="text-xs font-bold uppercase tracking-wider text-orange-700 outline-none"
              />
              <button type="button" onClick={() => removeEvent(index)} className="text-stone-400 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              value={event.title}
              onChange={(e) => update(index, "title", e.target.value)}
              placeholder="Event title"
              className="w-full font-semibold text-stone-900 outline-none"
            />
            <textarea
              value={event.description}
              onChange={(e) => update(index, "description", e.target.value)}
              placeholder="What happened and why it matters..."
              rows={2}
              className="mt-2 w-full resize-none text-sm text-stone-600 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
