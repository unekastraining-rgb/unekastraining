"use client";

import { useEffect, useState } from "react";
import {
  Columns2,
  ExternalLink,
  Link2,
  MessageSquare,
  Play,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { useTapHandler } from "@/hooks/useTapHandler";
import {
  isDirectVideoUrl,
  isVideoFilePath,
  toVideoEmbedUrl,
} from "@/lib/materials/video-embed";

type SplitMode = "watch" | "chatgpt" | "google";

/**
 * Left pane: lecture video / PDF, the student's own ChatGPT, or Google —
 * notebook stays writable on the right. We never proxy ChatGPT credentials;
 * ChatGPT opens with their login. Google uses an embeddable search view when
 * the browser allows it.
 */
export function CoreStudySplit({
  enabled,
  material,
  onClose,
  onPickSource,
  seedQuery = "",
  courseId: _courseId = null,
  children,
}: {
  enabled: boolean;
  material: {
    id: string;
    title: string;
    type: string;
    url?: string | null;
    filePath?: string | null;
  } | null;
  onClose: () => void;
  onPickSource?: () => void;
  /** Prefill Ask / Google from note title or selection. */
  seedQuery?: string;
  /** Kept for callers; study loop lives in Assist Studio / Study, not split chrome. */
  courseId?: string | null;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<SplitMode>("watch");
  const [pastedUrl, setPastedUrl] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const [askDraft, setAskDraft] = useState(seedQuery);
  const [googleQuery, setGoogleQuery] = useState(seedQuery);
  const [googleActive, setGoogleActive] = useState("");

  useEffect(() => {
    if (!seedQuery.trim()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setAskDraft((current) => (current.trim() ? current : seedQuery));
    setGoogleQuery((current) => (current.trim() ? current : seedQuery));
  }, [seedQuery]);

  const tapClose = useTapHandler(onClose);
  const tapWatch = useTapHandler(() => setMode("watch"));
  const tapChat = useTapHandler(() => setMode("chatgpt"));
  const tapGoogle = useTapHandler(() => setMode("google"));
  const tapPlay = useTapHandler(() => {
    const next = urlDraft.trim();
    if (!next) return;
    setPastedUrl(next);
    setMode("watch");
  });
  const tapPickSource = useTapHandler(() => onPickSource?.());
  const tapOpenChatgpt = useTapHandler(() => {
    void openChatGpt(askDraft);
  });
  const tapCopyOpenChatgpt = useTapHandler(() => {
    void copyAndOpenChatGpt(askDraft);
  });
  const tapRunGoogle = useTapHandler(() => {
    const q = googleQuery.trim();
    if (!q) return;
    setGoogleActive(q);
    setMode("google");
  });
  const tapGoogleTab = useTapHandler(() => {
    const q = googleActive || googleQuery.trim();
    if (!q) return;
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      "_blank",
      "noopener,noreferrer",
    );
  });

  if (!enabled) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  const activeUrl = pastedUrl.trim() || material?.url || null;
  const embed = activeUrl ? toVideoEmbedUrl(activeUrl) : null;
  const uploadedVideo =
    !embed &&
    Boolean(material?.filePath) &&
    (isVideoFilePath(material?.filePath) ||
      material?.type?.toUpperCase() === "VIDEO");
  const hasPdf =
    Boolean(material?.filePath) &&
    !uploadedVideo &&
    !isVideoFilePath(material?.filePath);

  const googleEmbedSrc = googleActive
    ? `https://www.google.com/search?igu=1&q=${encodeURIComponent(googleActive)}`
    : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-row overflow-hidden">
      <aside className="flex h-full min-h-0 w-[min(48%,22rem)] shrink-0 flex-col overflow-hidden border-r border-stone-800 bg-stone-950 text-stone-100 sm:w-1/2">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <Columns2 className="h-3.5 w-3.5 shrink-0 text-orange-300" />
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-stone-100">
            Split · notes stay on the right
          </p>
          <a
            href="/core"
            className="rounded-lg p-1.5 text-stone-400 touch-manipulation hover:bg-white/10 hover:text-white"
            aria-label="Close study split"
          >
            <X className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-1.5">
          <ModeTab
            active={mode === "watch"}
            label="Watch"
            icon={Play}
            tap={tapWatch}
          />
          <ModeTab
            active={mode === "chatgpt"}
            label="My ChatGPT"
            icon={MessageSquare}
            tap={tapChat}
          />
          <ModeTab
            active={mode === "google"}
            label="Google"
            icon={Search}
            tap={tapGoogle}
          />
        </div>

        {mode === "watch" ? (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              <input
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const next = urlDraft.trim();
                    if (!next) return;
                    setPastedUrl(next);
                    setMode("watch");
                  }
                }}
                placeholder="Paste YouTube / Vimeo / video URL"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-stone-100 placeholder:text-stone-400 outline-none focus:border-orange-400/50"
              />
              <button
                type="button"
                {...tapPlay}
                className="shrink-0 rounded-lg bg-orange-500 px-2.5 py-1.5 text-[10px] font-bold text-white touch-manipulation hover:bg-orange-400"
              >
                Play
              </button>
            </div>

            <div className="relative min-h-0 flex-1 bg-black">
              {!material && !embed && !uploadedVideo ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-sm text-stone-300">
                    Paste a YouTube link, pick a video/PDF from Assist → Sources, or switch to
                    My ChatGPT / Google.
                  </p>
                  {onPickSource ? (
                    <button
                      type="button"
                      {...tapPickSource}
                      className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white touch-manipulation hover:bg-orange-400"
                    >
                      Open sources
                    </button>
                  ) : null}
                </div>
              ) : embed && isDirectVideoUrl(embed) ? (
                <video
                  key={embed}
                  src={embed}
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : embed ? (
                <iframe
                  key={embed}
                  title={material?.title ?? "Lecture video"}
                  src={embed}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : uploadedVideo && material ? (
                <video
                  key={material.id}
                  src={`/api/materials/${material.id}/file`}
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : hasPdf && material ? (
                <iframe
                  title={material.title}
                  src={`/api/materials/${material.id}/file`}
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                />
              ) : material?.url ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-sm text-stone-300">
                    This link isn&apos;t an embeddable video — open it in a new tab while you note.
                  </p>
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-400"
                  >
                    Open link
                  </a>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-stone-200">
                  This material has no playable file or link yet.
                </div>
              )}
            </div>
          </>
        ) : null}

        {mode === "chatgpt" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Your ChatGPT · not ours
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-300">
                Opens ChatGPT with <strong className="text-stone-100">your</strong> login in a
                browser window beside your notes. Study Haul never sees your ChatGPT password or
                chat history.
              </p>
            </div>

            <label className="block text-[11px] font-semibold text-stone-400">
              Question to take into ChatGPT
              <textarea
                value={askDraft}
                onChange={(event) => setAskDraft(event.target.value)}
                rows={5}
                placeholder="e.g. Explain osmosis simply, or paste a confusing sentence from class…"
                className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-400 outline-none focus:border-emerald-400/40"
              />
            </label>

            <button
              type="button"
              {...tapCopyOpenChatgpt}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-stone-950 touch-manipulation hover:bg-emerald-400"
            >
              <MessageSquare className="h-4 w-4" />
              Copy question &amp; open my ChatGPT
            </button>
            <button
              type="button"
              {...tapOpenChatgpt}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-stone-100 touch-manipulation hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              Just open ChatGPT (signed in)
            </button>
            <p className="text-[11px] leading-relaxed text-stone-300">
              Tip: keep this split open, ask in ChatGPT, then type or ink the answer into Core.
              Open Study when you want Six / Lucky practice.
            </p>
          </div>
        ) : null}

        {mode === "google" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              <input
                value={googleQuery}
                onChange={(event) => setGoogleQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const q = googleQuery.trim();
                    if (!q) return;
                    setGoogleActive(q);
                  }
                }}
                placeholder="Search Google…"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-stone-100 placeholder:text-stone-400 outline-none focus:border-sky-400/50"
              />
              <button
                type="button"
                {...tapRunGoogle}
                className="shrink-0 rounded-lg bg-sky-500 px-2.5 py-1.5 text-[10px] font-bold text-white touch-manipulation hover:bg-sky-400"
              >
                Search
              </button>
            </div>
            <div className="relative min-h-0 flex-1 bg-white">
              {googleEmbedSrc ? (
                <>
                  <iframe
                    key={googleEmbedSrc}
                    title="Google search"
                    src={googleEmbedSrc}
                    className="absolute inset-0 h-full w-full border-0"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="absolute bottom-3 right-3">
                    <button
                      type="button"
                      {...tapGoogleTab}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/95 px-3 py-2 text-[11px] font-bold text-stone-800 shadow-lg touch-manipulation"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in tab
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-stone-100 p-6 text-center">
                  <p className="text-sm font-semibold text-stone-900">
                    Search a definition, formula, or lecture term — results show here when the
                    browser allows Google embed.
                  </p>
                  <p className="text-xs text-stone-700">
                    If the frame stays blank, use Open in tab (some browsers block Google embeds).
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </aside>
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden lg:w-1/2">
        {children}
      </div>
    </div>
  );
}

function ModeTab({
  active,
  label,
  icon: Icon,
  tap,
}: {
  active: boolean;
  label: string;
  icon: typeof Play;
  tap: ReturnType<typeof useTapHandler>;
}) {
  return (
    <button
      type="button"
      {...tap}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold touch-manipulation ${
        active
          ? "bg-white text-stone-900"
          : "bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

async function copyAndOpenChatGpt(question: string) {
  const text = question.trim();
  if (text && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Still open ChatGPT even if clipboard is blocked.
    }
  }
  openChatGptWindow();
}

function openChatGpt(question: string) {
  // ChatGPT does not accept a stable public query URL for arbitrary prompts;
  // open the app signed-in. Prefer clipboard flow when the student wrote a question.
  void question;
  openChatGptWindow();
}

function openChatGptWindow() {
  const features =
    "popup=yes,width=480,height=780,left=40,top=40,menubar=no,toolbar=no,location=yes,status=no";
  window.open("https://chatgpt.com/", "study-haul-chatgpt", features);
}
