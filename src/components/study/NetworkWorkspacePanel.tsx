"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTapHandler } from "@/hooks/useTapHandler";
import type { NetworkState } from "@/lib/learning/activities/networking/types";

type NetworkChallengeView = {
  id: string;
  title: string;
  prompt: string;
  symptom?: string;
  initialState?: NetworkState;
  requireHostnameResolve?: boolean;
  hostname?: string;
  scaffolds?: Array<{
    kind: string;
    label: string;
    content: string;
  }>;
};

/**
 * Small educational topology workspace.
 * Working edits / ping / hints never create evidence — parent submit does.
 */
export function NetworkWorkspacePanel(props: {
  challenge: NetworkChallengeView;
  onArtifactChange: (payload: string) => void;
}) {
  const { challenge, onArtifactChange } = props;
  const initial = useMemo(
    () =>
      challenge.initialState ?? {
        nodes: [],
        interfaces: [],
        links: [],
      },
    [challenge.initialState],
  );
  const [state, setState] = useState<NetworkState>(initial);
  const [selectedNodeId, setSelectedNodeId] = useState(
    initial.nodes[0]?.id ?? "",
  );
  const [diagnosis, setDiagnosis] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  const publish = useCallback(
    (nextState: NetworkState, nextDiagnosis: string) => {
      onArtifactChange(
        JSON.stringify({ state: nextState, diagnosis: nextDiagnosis }),
      );
    },
    [onArtifactChange],
  );

  useEffect(() => {
    publish(state, diagnosis);
  }, [state, diagnosis, publish]);

  const selectedIfaces = state.interfaces.filter(
    (i) => i.nodeId === selectedNodeId,
  );
  const primary = selectedIfaces[0];

  const updatePrimary = (patch: Partial<typeof primary>) => {
    if (!primary) return;
    setState((prev) => ({
      ...prev,
      interfaces: prev.interfaces.map((i) =>
        i.id === primary.id ? { ...i, ...patch } : i,
      ),
    }));
    setStatusMessage(null);
  };

  const runPing = useTapHandler(() => {
    void fetch("/api/study/activities/networking", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "diagnostic",
        kind: "ping",
        challengeId: challenge.id,
        state,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          success?: boolean;
          diagnostic?: { ok?: boolean; learnerMessage?: string };
          error?: string;
        };
        if (!data.success || !data.diagnostic) {
          setStatusOk(false);
          setStatusMessage(data.error ?? "Diagnostic failed.");
          return;
        }
        setStatusOk(Boolean(data.diagnostic.ok));
        setStatusMessage(data.diagnostic.learnerMessage ?? null);
      })
      .catch(() => {
        setStatusOk(false);
        setStatusMessage("Diagnostic failed.");
      });
  });

  const runHostname = useTapHandler(() => {
    void fetch("/api/study/activities/networking", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "diagnostic",
        kind: "hostname",
        challengeId: challenge.id,
        state,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          success?: boolean;
          diagnostic?: { ok?: boolean; learnerMessage?: string };
          error?: string;
        };
        if (!data.success || !data.diagnostic) {
          setStatusOk(false);
          setStatusMessage(data.error ?? "Diagnostic failed.");
          return;
        }
        setStatusOk(Boolean(data.diagnostic.ok));
        setStatusMessage(data.diagnostic.learnerMessage ?? null);
      })
      .catch(() => {
        setStatusOk(false);
        setStatusMessage("Diagnostic failed.");
      });
  });

  const showHint = useTapHandler(() => {
    setHintVisible(true);
    setHintIndex((i) => {
      const max = Math.max(0, (challenge.scaffolds?.length ?? 1) - 1);
      return Math.min(i + 1, max);
    });
  });

  const hints = challenge.scaffolds ?? [];
  const activeHint = hintVisible
    ? hints[Math.min(hintIndex, Math.max(0, hints.length - 1))]
    : null;

  return (
    <div
      className="space-y-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/80 to-white p-4 sm:p-5"
      data-network-workspace
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
          Network workspace · educational topology
        </p>
        <p className="mt-1 text-sm text-stone-700">{challenge.prompt}</p>
        {challenge.symptom ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Symptom: {challenge.symptom}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-stone-500">
          Synthetic lab only — no real network scanning or exploitation.
        </p>
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white px-3 py-4"
        aria-hidden
      >
        {state.nodes.map((node, index) => (
          <div key={node.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedNodeId(node.id)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold touch-manipulation ${
                selectedNodeId === node.id
                  ? "border-sky-500 bg-sky-100 text-sky-950"
                  : "border-stone-200 bg-stone-50 text-stone-800"
              }`}
            >
              {node.label}
              <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-stone-500">
                {node.type}
              </span>
            </button>
            {index < state.nodes.length - 1 ? (
              <span className="text-stone-400" aria-hidden>
                ──
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <ul className="sr-only" aria-label="Network devices">
        {state.nodes.map((node) => {
          const ifaces = state.interfaces.filter((i) => i.nodeId === node.id);
          return (
            <li key={`a11y-${node.id}`}>
              {node.label} ({node.type})
              {ifaces.map((i) => (
                <span key={i.id}>
                  {"; "}
                  {i.name}
                  {i.enabled ? " enabled" : " disabled"}
                  {i.ipAddress ? ` ${i.ipAddress}` : ""}
                </span>
              ))}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          Selected device
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
          >
            {state.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.type})
              </option>
            ))}
          </select>
        </label>

        {primary ? (
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={primary.enabled}
              onChange={(e) => updatePrimary({ enabled: e.target.checked })}
            />
            Interface {primary.name} enabled
          </label>
        ) : null}
      </div>

      {primary ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["ipAddress", "IP address"],
              ["subnetMask", "Subnet mask"],
              ["gateway", "Gateway"],
              ["dns", "DNS"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-medium text-stone-700">
              {label}
              <input
                value={String(primary[key] ?? "")}
                onChange={(e) =>
                  updatePrimary({
                    [key]: e.target.value.trim() || undefined,
                  })
                }
                className="mt-1 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
                inputMode="decimal"
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          {...runPing}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-300 bg-sky-100 px-4 text-sm font-semibold text-sky-950 touch-manipulation"
        >
          Simulated ping
        </button>
        {challenge.requireHostnameResolve ? (
          <button
            type="button"
            {...runHostname}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-900 touch-manipulation"
          >
            Check hostname
            {challenge.hostname ? ` (${challenge.hostname})` : ""}
          </button>
        ) : null}
        <button
          type="button"
          {...showHint}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-950 touch-manipulation"
        >
          Hint
        </button>
      </div>

      {statusMessage ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-3 py-2 text-sm ${
            statusOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}

      {activeHint ? (
        <aside
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800"
          aria-live="polite"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
            {activeHint.label}
          </p>
          <p className="mt-1">{activeHint.content}</p>
          <p className="mt-1 text-xs text-stone-500">
            Hints do not change your score.
          </p>
        </aside>
      ) : null}

      <label className="block text-sm font-medium text-stone-700">
        Diagnosis (what failed and why?)
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-sky-500 focus:outline-none"
          placeholder="Name the faulty component/category without pasting an answer key."
        />
      </label>
    </div>
  );
}
