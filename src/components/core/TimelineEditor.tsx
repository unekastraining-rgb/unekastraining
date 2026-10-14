"use client";

import { Plus, Trash2 } from "lucide-react";

import type { TimelineEvent } from "@/lib/core/note-types";

export function TimelineEditor({
  events,
  onChange,
  bare = false,
}: {
  events: TimelineEvent[];
  onChange: (events: TimelineEvent[]) => void;
  bare?: boolean;
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

  if (bare) {
    return (
      <div className="space-y-2 px-0.5 py-0.5">
        {events.map((event, index) => (
          <div key={index} className="group relative space-y-0.5 border-l border-stone-200/80 pl-2.5">
            <input
              value={event.date}
              onChange={(e) => update(index, "date", e.target.value)}
              placeholder="Date"
              className="w-full bg-transparent text-[10px] font-semibold uppercase tracking-wider text-stone-400 outline-none placeholder:text-stone-300"
            />
            <input
              value={event.title}
              onChange={(e) => update(index, "title", e.target.value)}
              placeholder="Event"
              className="w-full bg-transparent text-sm font-semibold text-stone-900 outline-none placeholder:text-stone-300"
            />
            <textarea
              value={event.description}
              onChange={(e) => update(index, "description", e.target.value)}
              placeholder="What happened…"
              rows={1}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-stone-700 outline-none placeholder:text-stone-300"
            />
            {events.length > 1 ? (
              <button
                type="button"
                onClick={() => removeEvent(index)}
                className="absolute -right-1 top-0 hidden rounded p-0.5 text-stone-300 hover:text-rose-500 group-hover:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={addEvent}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-teal-700"
        >
          <Plus className="h-3 w-3" /> Add event
        </button>
      </div>
    );
  }

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
