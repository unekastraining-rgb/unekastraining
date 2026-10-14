import type { ReactNode } from "react";

import type { LearnPreferenceKey } from "@/lib/learning/learner-preferences";

const VIEW = "0 0 48 48";

function Frame({
  children,
  accent,
}: {
  children: ReactNode;
  accent: string;
}) {
  return (
    <svg
      viewBox={VIEW}
      className="h-12 w-12"
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="10"
        className={accent}
        fill="currentColor"
        opacity="0.12"
      />
      {children}
    </svg>
  );
}

export function HowILearnPrefVisual({
  pref,
  gradeSchool = false,
}: {
  pref: LearnPreferenceKey;
  gradeSchool?: boolean;
}) {
  const stroke = gradeSchool ? "#0f766e" : "#1c1917";
  const accent = gradeSchool ? "text-teal-700" : "text-stone-800";

  switch (pref) {
    case "step_by_step":
      return (
        <Frame accent={accent}>
          <path
            d="M14 16h20M14 24h14M14 32h10"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="34" cy="32" r="3" stroke={stroke} strokeWidth="2" />
        </Frame>
      );
    case "examples":
      return (
        <Frame accent={accent}>
          <rect
            x="12"
            y="14"
            width="16"
            height="20"
            rx="2"
            stroke={stroke}
            strokeWidth="2"
          />
          <path
            d="M32 18h6v16h-6"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M16 20h8M16 25h6"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Frame>
      );
    case "visuals":
      return (
        <Frame accent={accent}>
          <circle cx="24" cy="22" r="8" stroke={stroke} strokeWidth="2" />
          <path
            d="M14 34c3-4 7-6 10-6s7 2 10 6"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="22" r="2.5" fill={stroke} />
        </Frame>
      );
    case "hands_on":
      return (
        <Frame accent={accent}>
          <path
            d="M18 30V18l6-4 6 4v12"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M18 30h12M21 24h6"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Frame>
      );
    case "practice_questions":
      return (
        <Frame accent={accent}>
          <circle cx="24" cy="24" r="10" stroke={stroke} strokeWidth="2" />
          <path
            d="M20 22c0-2.2 1.8-4 4-4s3.5 1.4 3.5 3.2c0 1.6-1.2 2.4-2.4 3.2-.8.5-1.1 1-1.1 1.8"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="33" r="1.4" fill={stroke} />
        </Frame>
      );
    case "talking_through":
      return (
        <Frame accent={accent}>
          <path
            d="M14 18h14a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H22l-5 4v-4h-3a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M18 24h8M18 28h5"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Frame>
      );
    case "writing_explain":
      return (
        <Frame accent={accent}>
          <path
            d="M16 32l16-16 4 4-16 16H16v-4z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M28 16l4 4"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Frame>
      );
    case "real_world":
      return (
        <Frame accent={accent}>
          <circle cx="24" cy="24" r="11" stroke={stroke} strokeWidth="2" />
          <path
            d="M13 24h22M24 13c3 3.5 4.5 7 4.5 11S27 32.5 24 35c-3-2.5-4.5-7-4.5-11S21 16.5 24 13z"
            stroke={stroke}
            strokeWidth="1.8"
          />
        </Frame>
      );
    case "repetition_recall":
      return (
        <Frame accent={accent}>
          <path
            d="M16 22a8 8 0 0 1 14-4M32 26a8 8 0 0 1-14 4"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M28 14l2 4h-4M20 34l-2-4h4"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Frame>
      );
    case "not_sure":
    default:
      return (
        <Frame accent={accent}>
          <circle cx="24" cy="24" r="10" stroke={stroke} strokeWidth="2" />
          <path
            d="M24 18v8"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="32" r="1.5" fill={stroke} />
        </Frame>
      );
  }
}
