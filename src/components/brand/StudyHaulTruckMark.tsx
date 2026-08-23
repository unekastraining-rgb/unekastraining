/** Study Haul delivery truck — shared mark for login hero and sidebar. */
export function StudyHaulTruckMark({ className = "h-11 w-[7.5rem]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 52" className={`drop-shadow-md ${className}`} aria-hidden>
      <ellipse cx="58" cy="46" rx="52" ry="3" fill="rgba(0,0,0,0.12)" />
      <rect x="4" y="18" width="52" height="22" rx="3" fill="#0d9488" />
      <rect x="8" y="22" width="44" height="14" rx="2" fill="#14b8a6" opacity="0.45" />
      <text
        x="30"
        y="33"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        HAUL
      </text>
      <path d="M56 18 H78 Q88 18 92 24 V40 H56 Z" fill="#ea580c" />
      <rect x="62" y="24" width="18" height="10" rx="2" fill="#fff8f1" opacity="0.85" />
      <rect x="64" y="26" width="14" height="2" rx="1" fill="#14b8a6" />
      <circle cx="24" cy="42" r="6" fill="#292524" />
      <circle cx="24" cy="42" r="2.5" fill="#78716c" />
      <circle cx="78" cy="42" r="6" fill="#292524" />
      <circle cx="78" cy="42" r="2.5" fill="#78716c" />
      <rect x="92" y="28" width="10" height="3" rx="1" fill="#fbbf24" />
      <rect x="92" y="33" width="8" height="2" rx="1" fill="#fbbf24" opacity="0.7" />
    </svg>
  );
}
