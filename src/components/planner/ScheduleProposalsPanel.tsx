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
  status: string;
}

export function ScheduleProposalsPanel({
  onApproved,
}: {
  onApproved?: () => void;
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

  return (
    <section className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
            Adaptive scheduling
          </p>
          <h2 className="text-lg font-bold text-stone-900">AI schedule proposals</h2>
          <p className="mt-1 text-sm text-stone-600">
            Suggestions based on deadlines and weak topics — you approve before anything is added.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Suggest changes
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-stone-500">Loading proposals…</p>
      ) : proposals.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No pending proposals. Tap &quot;Suggest changes&quot; to analyze your schedule.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {proposals.map((proposal) => (
            <li
              key={proposal.id}
              className="rounded-xl border border-orange-100 bg-white p-4"
            >
              <p className="font-semibold text-stone-900">{proposal.title}</p>
              {proposal.description ? (
                <p className="mt-1 text-sm text-stone-600">{proposal.description}</p>
              ) : null}
              <div className="mt-3">
                <ScheduleProposalChangeList changes={proposal.changes} />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={actingId === proposal.id}
                  onClick={() => void act(proposal.id, "approve")}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  disabled={actingId === proposal.id}
                  onClick={() => void act(proposal.id, "reject")}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" /> Deny
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
