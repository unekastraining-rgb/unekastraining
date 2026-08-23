"use client";

import { useEffect, useState } from "react";

type StudyArt =
  | "books"
  | "whiteboard"
  | "laptop"
  | "flashcards"
  | "notes"
  | "quiz"
  | "stickyNote"
  | "calendar"
  | "deadline"
  | "paper";

interface Floater {
  label: string;
  x: string;
  y: string;
  rotate: number;
  delay: string;
  art: StudyArt;
  scale: number;
}

const FLOATERS: Floater[] = [
  { label: "Books", art: "books", x: "6%", y: "10%", rotate: -14, delay: "0s", scale: 1 },
  {
    label: "Whiteboard",
    art: "whiteboard",
    x: "68%",
    y: "8%",
    rotate: 7,
    delay: "0.35s",
    scale: 1.08,
  },
  { label: "Sticky notes", art: "stickyNote", x: "82%", y: "34%", rotate: 12, delay: "0.9s", scale: 1 },
  { label: "Laptop", art: "laptop", x: "74%", y: "56%", rotate: -5, delay: "0.7s", scale: 1 },
  { label: "Flashcards", art: "flashcards", x: "10%", y: "58%", rotate: 11, delay: "1s", scale: 1 },
  { label: "Calendar", art: "calendar", x: "22%", y: "22%", rotate: -8, delay: "0.5s", scale: 1 },
  { label: "Deadlines", art: "deadline", x: "48%", y: "12%", rotate: 4, delay: "1.2s", scale: 1 },
  { label: "Notes", art: "notes", x: "52%", y: "68%", rotate: -9, delay: "0.55s", scale: 1 },
  { label: "Quiz", art: "quiz", x: "34%", y: "78%", rotate: 6, delay: "1.35s", scale: 1.08 },
  { label: "Syllabus", art: "paper", x: "88%", y: "72%", rotate: -11, delay: "0.25s", scale: 1.06 },
  {
    label: "Whiteboard",
    art: "whiteboard",
    x: "14%",
    y: "78%",
    rotate: 5,
    delay: "1.5s",
    scale: 1.05,
  },
  {
    label: "Sticky notes",
    art: "stickyNote",
    x: "58%",
    y: "38%",
    rotate: -6,
    delay: "0.15s",
    scale: 0.98,
  },
];

const BLOWING_PAPERS = [
  { x: "28%", y: "44%", rotate: -18, delay: "0s", w: 28, h: 36 },
  { x: "42%", y: "52%", rotate: 22, delay: "0.8s", w: 24, h: 32 },
  { x: "62%", y: "28%", rotate: -10, delay: "1.4s", w: 22, h: 30 },
  { x: "18%", y: "42%", rotate: 14, delay: "2s", w: 26, h: 34 },
  { x: "76%", y: "48%", rotate: -16, delay: "0.4s", w: 20, h: 28 },
  { x: "46%", y: "86%", rotate: 8, delay: "1.8s", w: 24, h: 30 },
] as const;

const LARGE_ART: StudyArt[] = ["whiteboard", "quiz", "paper"];

export function StudyHaulLoginHero() {
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    setMotionReady(true);
  }, []);

  return (
    <div
      className="relative hidden min-h-full flex-col items-center justify-center overflow-hidden px-8 py-14 lg:flex"
      style={{
        background:
          "radial-gradient(circle at 20% 30%, rgba(13,148,136,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(234,88,12,0.28), transparent 42%), linear-gradient(145deg, #1c1917 0%, #292524 45%, #1c1917 100%)",
      }}
    >
      {BLOWING_PAPERS.map((paper, index) => (
        <div
          key={`paper-${index}`}
          className={`pointer-events-none absolute rounded-sm border border-white/10 bg-[#fff8f1]/20 shadow-sm backdrop-blur-[1px] ${
            motionReady ? "animate-[paper-drift_5s_ease-in-out_infinite]" : ""
          }`}
          style={{
            left: paper.x,
            top: paper.y,
            width: paper.w,
            height: paper.h,
            rotate: `${paper.rotate}deg`,
            animationDelay: paper.delay,
          }}
        />
      ))}

      {FLOATERS.map((item) => (
        <div
          key={`${item.label}-${item.x}-${item.y}`}
          className={`absolute ${motionReady ? "animate-[login-float_6s_ease-in-out_infinite]" : ""}`}
          style={{
            left: item.x,
            top: item.y,
            animationDelay: item.delay,
            rotate: `${item.rotate}deg`,
            scale: item.scale,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-sm">
              <StudyClipArt kind={item.art} large={LARGE_ART.includes(item.art)} />
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
              {item.label}
            </span>
          </div>
        </div>
      ))}

      <div className="relative z-10 text-center">
        <h1 className="text-5xl font-black tracking-tight text-white xl:text-6xl">
          Study
          <span className="relative inline-block">
            Haul
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-teal-400 via-orange-400 to-transparent"
            />
          </span>
        </h1>
      </div>
    </div>
  );
}

function StudyClipArt({ kind, large }: { kind: StudyArt; large: boolean }) {
  const size = large ? "h-11 w-11" : "h-10 w-10";

  switch (kind) {
    case "books":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <rect x="8" y="10" width="10" height="28" rx="2" fill="#0d9488" />
          <rect x="19" y="8" width="11" height="30" rx="2" fill="#ea580c" />
          <rect x="30" y="12" width="10" height="26" rx="2" fill="#7c3aed" />
        </svg>
      );
    case "whiteboard":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <rect x="6" y="10" width="36" height="24" rx="3" fill="#f5f5f4" stroke="#d6d3d1" />
          <path d="M12 22 Q18 16 24 22 T36 22" stroke="#0d9488" strokeWidth="2" fill="none" />
          <path d="M14 28 L22 28" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="22" y="34" width="4" height="8" fill="#78716c" />
        </svg>
      );
    case "stickyNote":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <path d="M12 10 H34 V32 L24 38 L14 32 Z" fill="#fde047" stroke="#eab308" />
          <line x1="16" y1="18" x2="30" y2="18" stroke="#ca8a04" strokeWidth="1.5" opacity="0.6" />
          <line x1="16" y1="24" x2="26" y2="24" stroke="#ca8a04" strokeWidth="1.5" opacity="0.6" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <rect x="10" y="12" width="28" height="28" rx="3" fill="#fff8f1" stroke="#fdba74" />
          <rect x="10" y="12" width="28" height="8" rx="3" fill="#ea580c" />
          <circle cx="18" cy="28" r="2.5" fill="#0d9488" />
          <circle cx="24" cy="28" r="2.5" fill="#d6d3d1" />
          <circle cx="30" cy="28" r="2.5" fill="#d6d3d1" />
          <circle cx="18" cy="34" r="2.5" fill="#d6d3d1" />
          <circle cx="24" cy="34" r="2.5" fill="#ea580c" />
        </svg>
      );
    case "deadline":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <circle cx="24" cy="26" r="14" fill="#fff8f1" stroke="#fb7185" strokeWidth="2" />
          <line x1="24" y1="26" x2="24" y2="18" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="26" x2="30" y2="28" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="8" r="3" fill="#e11d48" />
        </svg>
      );
    case "laptop":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <rect x="10" y="12" width="28" height="18" rx="2" fill="#292524" />
          <rect x="12" y="14" width="24" height="14" rx="1" fill="#14b8a6" />
          <path d="M6 32 H42 L38 36 H10 Z" fill="#57534e" />
        </svg>
      );
    case "flashcards":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <rect x="10" y="14" width="22" height="16" rx="2" fill="#fff8f1" stroke="#fdba74" />
          <rect x="16" y="18" width="22" height="16" rx="2" fill="#fff8f1" stroke="#fdba74" />
          <line x1="18" y1="24" x2="32" y2="24" stroke="#ea580c" strokeWidth="1.5" />
        </svg>
      );
    case "notes":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <rect x="12" y="8" width="24" height="32" rx="2" fill="#fff8f1" stroke="#fdba74" />
          <line x1="16" y1="16" x2="32" y2="16" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="16" y1="22" x2="30" y2="22" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="16" y1="28" x2="28" y2="28" stroke="#d6d3d1" strokeWidth="1.5" />
        </svg>
      );
    case "paper":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <path d="M14 8 H30 L36 14 V38 H14 Z" fill="#fff8f1" stroke="#fdba74" />
          <path d="M30 8 V14 H36" fill="#ffedd5" stroke="#fdba74" />
          <line x1="18" y1="20" x2="32" y2="20" stroke="#d6d3d1" strokeWidth="1.5" />
          <line x1="18" y1="26" x2="30" y2="26" stroke="#d6d3d1" strokeWidth="1.5" />
        </svg>
      );
    case "quiz":
      return (
        <svg viewBox="0 0 48 48" className={size} aria-hidden>
          <circle cx="24" cy="24" r="14" fill="#ea580c" />
          <path
            d="M17 24 L22 29 L32 19"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
