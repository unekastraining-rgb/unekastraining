"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";

import { ScheduleProposalChangeList } from "@/components/planner/ScheduleProposalChangeList";
import type { ScheduleChange } from "@/lib/schedule/proposals";

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  changes: ScheduleChange[];
}

export function CalendarAiScheduling({
  onApproved,
  compact = false,
}: {
  onApproved?: () => void;
  compact?: boolean;
}) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/schedule/proposals");
    const data = await response.json();
    if (data.success) setProposals(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    try {
      const response = await fetch("/api/schedule/proposals", { method: "POST" });
      const data = await response.json();
      if (data.success) await load();
    } finally {
      setGenerating(false);
    }
  }

  async function act(id: string, action: "approve" | "reject") {
    setActingId(id);
    try {
      await fetch("/api/schedule/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await load();
      if (action === "approve") onApproved?.();
    } finally {
      setActingId(null);
    }
  }

  const proposal = proposals[0];

  return (
    <div
      className={
        compact
          ? "card-soft border-violet-100/80 bg-violet-50/40 p-4"
          : "rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-5 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-violet-800">
          <Sparkles className="h-4 w-4 shrink-0" />
          <p className="text-sm font-bold">AI scheduling</p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={generating}
          className="rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {generating ? "…" : "Suggest"}
        </button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-violet-700/90">
        Study blocks from deadlines and weak topics — you approve before anything is added.
      </p>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-violet-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </p>
      ) : !proposal ? (
        <p className="mt-3 text-xs text-violet-600/80">
          No pending proposals. Tap Suggest to analyze your week.
        </p>
      ) : (
        <div className="mt-3 space-y-2 rounded-xl border border-violet-100 bg-white/80 p-3">
          <p className="text-xs font-semibold text-stone-900">{proposal.title}</p>
          <div className="max-h-40 overflow-y-auto">
            <ScheduleProposalChangeList
              changes={proposal.changes.slice(0, compact ? 3 : 6)}
              compact
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={actingId === proposal.id}
              onClick={() => void act(proposal.id, "approve")}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Check className="h-3 w-3" /> Accept
            </button>
            <button
              type="button"
              disabled={actingId === proposal.id}
              onClick={() => void act(proposal.id, "reject")}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-60"
            >
              <X className="h-3 w-3" /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
