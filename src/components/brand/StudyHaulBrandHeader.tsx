"use client";

const BOOKS = [
  { x: 0, h: 34, w: 14, color: "#3d9b8f", rotate: -14 },
  { x: 12, h: 40, w: 15, color: "#e8b84a", rotate: -11 },
  { x: 25, h: 46, w: 15, color: "#e07a5f", rotate: -9 },
  { x: 38, h: 52, w: 16, color: "#9b8ec4", rotate: -7 },
  { x: 52, h: 58, w: 17, color: "#e07a5f", rotate: -5 },
] as const;

export function HorizontalLeaningBooks({
  className = "",
}: {
  className?: string;
}) {
  const last = BOOKS[BOOKS.length - 1]!;

  return (
    <svg
      viewBox="0 0 92 78"
      aria-hidden
      className={`h-[0.46em] w-auto shrink-0 ${className}`}
    >
      <defs>
        <filter id="book-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.18" />
        </filter>
      </defs>

      {BOOKS.map((book, index) => (
        <g
          key={index}
          transform={`translate(${book.x + book.w / 2}, ${62 - book.h}) rotate(${book.rotate})`}
          filter="url(#book-shadow)"
        >
          <rect
            x={-book.w / 2}
            y={0}
            width={book.w}
            height={book.h}
            rx={2.5}
            fill={book.color}
          />
          <rect
            x={-book.w / 2 + 2}
            y={3}
            width={book.w - 4}
            height={book.h - 6}
            rx={1.5}
            fill="rgba(255,255,255,0.12)"
          />
          <line
            x1={-book.w / 2 + 4}
            y1={0}
            x2={-book.w / 2 + 4}
            y2={book.h}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={1}
          />
        </g>
      ))}

      <g transform={`translate(${last.x + last.w + 2}, ${62 - last.h + 18})`}>
        <path
          d="M0 0 L0 22 Q6 18 12 22 L12 0 Z"
          fill="#ea580c"
          stroke="#c2410c"
          strokeWidth={0.6}
        />
        <rect x={1.5} y={2} width={9} height={1.2} rx={0.6} fill="rgba(255,255,255,0.45)" />
        <text
          x={6}
          y={11}
          textAnchor="middle"
          fill="white"
          fontSize="3.2"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          HAUL
        </text>
        <text
          x={6}
          y="15.5"
          textAnchor="middle"
          fill="white"
          fontSize="2.6"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          PASS
        </text>
        <line
          x1={6}
          y1={-5}
          x2={6}
          y2={0}
          stroke="#c2410c"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function StudyHaulBrandHeader({
  variant = "hero",
}: {
  variant?: "hero" | "compact" | "toolbar";
}) {
  const isCompact = variant === "compact";
  const isToolbar = variant === "toolbar";

  return (
    <div
      className={`leading-none ${
        isCompact
          ? "w-full max-w-full text-center"
          : isToolbar
            ? "w-fit shrink-0"
            : "w-fit max-w-full"
      }`}
      style={{
        fontSize: isToolbar
          ? "clamp(1.35rem, 2.2vw, 1.85rem)"
          : isCompact
            ? "clamp(2.5rem, 11vw, 4.5rem)"
            : "clamp(2.25rem, 7vw, 8.5rem)",
      }}
    >
      <div
        className={`flex max-w-full flex-wrap items-end gap-x-1 ${
          isCompact ? "justify-center" : ""
        }`}
      >
        <h1
          className="flex min-w-0 items-end font-black tracking-tight text-stone-900"
          style={{ fontSize: "inherit" }}
        >
          <span>Study</span>
          <span className="relative">
            Haul
            <span
              aria-hidden
              className="absolute -bottom-[0.04em] left-0 right-0 h-[0.04em] rounded-full"
              style={{
                background:
                  "linear-gradient(to right, color-mix(in srgb, var(--sh-primary, #fb923c) 80%, transparent), color-mix(in srgb, var(--sh-primary, #fb923c) 60%, transparent), transparent)",
              }}
            />
          </span>
        </h1>

        <HorizontalLeaningBooks
          className={`mb-[0.03em] ${isCompact ? "scale-90" : isToolbar ? "scale-[0.55]" : "max-sm:scale-90"}`}
        />
      </div>

      {!isToolbar ? (
        <p
          className={`mt-[0.12em] text-[0.115em] font-medium tracking-wide text-muted-soft ${
            isCompact ? "" : "pl-[0.08em]"
          }`}
        >
          (Yesenia&apos;s Nerd)
        </p>
      ) : null}
    </div>
  );
}
