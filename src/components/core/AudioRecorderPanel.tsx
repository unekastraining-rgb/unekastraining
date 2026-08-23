"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Mic, Square, Sparkles } from "lucide-react";

import type { AudioClip } from "@/lib/core/note-types";

export function AudioRecorderPanel({
  noteId,
  clips,
  onChange,
  onInsertTranscript,
}: {
  noteId: string | null;
  clips: AudioClip[];
  onChange: (clips: AudioClip[]) => void;
  onInsertTranscript: (text: string, aiGenerated: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startTime = useRef(0);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  async function handleRecordingComplete() {
    const blob = new Blob(chunks.current, { type: "audio/webm" });
    const durationMs = Date.now() - startTime.current;
    const clipId = `audio-${Date.now()}`;
    const clip: AudioClip = {
      id: clipId,
      label: `Recording ${clipsRef.current.length + 1}`,
      transcript: "",
      durationMs,
      recordedAt: new Date().toISOString(),
    };

    if (noteId) {
      setTranscribing(clipId);
      try {
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        const response = await fetch(`/api/notes/${noteId}/transcribe`, {
          method: "POST",
          body: form,
        });
        const data = await response.json();
        if (data.success) {
          clip.transcript = data.transcript;
          clip.aiTranscript = true;
          clip.storageKey = data.storageKey;
        }
      } catch {
        clip.transcript = "(Transcription unavailable — add GEMINI_API_KEY)";
      } finally {
        setTranscribing(null);
      }
    }

    onChange([clip, ...clipsRef.current]);
    setRecording(false);
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void handleRecordingComplete();
      };
      mediaRecorder.current = recorder;
      startTime.current = Date.now();
      recorder.start();
      setRecording(true);
    } catch {
      alert("Microphone access is required to record audio.");
    }
  }, [noteId, onChange]);

  function stopRecording() {
    mediaRecorder.current?.stop();
  }

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-800">
          Audio capture
        </p>
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            <Square className="h-3 w-3" /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={!noteId}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            <Mic className="h-3.5 w-3.5" /> Record
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-stone-600">
        Record lectures or thoughts — CORE transcribes and marks AI text clearly.
      </p>
      {clips.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {clips.map((clip) => (
            <li key={clip.id} className="rounded-xl border border-violet-100 bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-stone-900">{clip.label}</p>
                <span className="text-xs text-stone-500">
                  {Math.round(clip.durationMs / 1000)}s
                </span>
              </div>
              {transcribing === clip.id ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-violet-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…
                </p>
              ) : clip.transcript ? (
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  {clip.aiTranscript ? (
                    <span className="mr-1 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-bold text-violet-700">
                      AI
                    </span>
                  ) : null}
                  {clip.transcript}
                </p>
              ) : (
                <p className="mt-2 text-xs text-stone-400">No transcript yet</p>
              )}
              {clip.transcript ? (
                <button
                  type="button"
                  onClick={() => onInsertTranscript(clip.transcript, Boolean(clip.aiTranscript))}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
                >
                  <Sparkles className="h-3 w-3" /> Insert into notes
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
