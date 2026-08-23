"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Users } from "lucide-react";

import type { InfiniteCanvasData } from "@/lib/core/note-types";
import { emptyCanvas } from "@/lib/core/note-types";

export function CollabWhiteboardPanel({
  noteId,
  canvasData,
  onCanvasSync,
}: {
  noteId: string | null;
  canvasData?: InfiniteCanvasData;
  onCanvasSync: (canvas: InfiniteCanvasData) => void;
}) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [participants, setParticipants] = useState(1);

  const createBoard = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/collab/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          title: "CORE whiteboard",
          snapshot: canvasData ?? emptyCanvas(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShareCode(data.shareCode);
        setStatus("Board created — share the code with classmates.");
      }
    } finally {
      setBusy(false);
    }
  }, [canvasData, noteId]);

  const joinBoard = useCallback(async () => {
    if (!joinCode.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/collab/boards/${joinCode.trim().toUpperCase()}`);
      const data = await response.json();
      if (data.success) {
        setShareCode(data.shareCode);
        if (data.snapshot) {
          onCanvasSync(data.snapshot as InfiniteCanvasData);
        }
        setStatus("Joined live board.");
      } else {
        setStatus(data.error ?? "Board not found.");
      }
    } finally {
      setBusy(false);
    }
  }, [joinCode, onCanvasSync]);

  useEffect(() => {
    if (!shareCode) return;
    const interval = window.setInterval(() => {
      void fetch(`/api/collab/boards/${shareCode}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success && data.snapshot) {
            onCanvasSync(data.snapshot as InfiniteCanvasData);
            setParticipants(data.participantCount ?? 1);
          }
        })
        .catch(() => {});
    }, 2500);
    return () => window.clearInterval(interval);
  }, [onCanvasSync, shareCode]);

  useEffect(() => {
    if (!shareCode || !canvasData) return;
    const timer = window.setTimeout(() => {
      void fetch(`/api/collab/boards/${shareCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: canvasData }),
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [canvasData, shareCode]);

  const shareUrl =
    typeof window !== "undefined" && shareCode
      ? `${window.location.origin}/core?collab=${shareCode}`
      : "";

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-sky-700" />
        <p className="text-xs font-bold uppercase tracking-wider text-sky-800">
          Live collab whiteboard
        </p>
      </div>
      <p className="mt-2 text-xs text-stone-600">
        Study groups can sketch together — changes sync every few seconds.
      </p>

      {shareCode ? (
        <div className="mt-3 rounded-xl border border-sky-100 bg-white p-3">
          <p className="text-sm font-bold text-stone-900">Code: {shareCode}</p>
          <p className="text-xs text-stone-500">{participants} active · polling sync</p>
          {shareUrl ? (
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700"
            >
              <Copy className="h-3 w-3" /> Copy link
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void createBoard()}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Start session"}
          </button>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="Join code"
            className="w-28 rounded-lg border border-sky-200 px-2 py-1.5 text-xs uppercase"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void joinBoard()}
            className="rounded-lg border border-sky-300 px-3 py-1.5 text-xs font-semibold text-sky-800"
          >
            Join
          </button>
        </div>
      )}
      {status ? <p className="mt-2 text-xs text-stone-500">{status}</p> : null}
    </section>
  );
}
