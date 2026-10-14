"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  Code2,
  FlaskConical,
  Gamepad2,
  Layers,
  Menu,
  MessageCircle,
  Network,
  Presentation,
  Puzzle,
  Sparkles,
  SquarePen,
  Target,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

import { StudyHaulCardRail } from "@/components/study/StudyHaulCardRail";
import {
  luckyQuizHref,
  coreStudyGuideHref,
} from "@/lib/study/loop-hrefs";
import {
  buildPracticeItemHref,
  listContextualPracticeChoices,
  listSupportedPracticeLandscape,
  type PracticeLandscapeItem,
} from "@/lib/study/practice-landscape";
import { resolveStudyRoomHref } from "@/lib/study/resolve-study-room";
import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * Topic-centric Study Haul — a learning place, not a feature dashboard.
 * Landing: identity + What do you need? → room launches existing engines
 * with course/topic context (no technique/capability catalogs).
 */

type DestinationId = "learn" | "practice" | "check" | "remember" | "tutor";

type TopicStudyHaulProps = {
  courseId: string;
  courseTitle: string;
  topic: string | null;
  materialId?: string | null;
  /** Where this learning context came from (My Courses / My Learning / …). */
  sourceLabel?: string | null;
  /** Quiet-nav: return to material selection without leaving Study Haul. */
  onChangeMaterial?: () => void;
};

type GalleryItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  mark?: string;
};

type PlaceVisual = {
  Icon: LucideIcon;
  /** Compact recognition mark (text glyph), adult-friendly */
  mark: string;
  wellAdult: string;
  wellGs: string;
  cardAdult: string;
  cardGs: string;
  roomAdult: string;
  roomGs: string;
};

const PLACE_VISUAL: Record<DestinationId, PlaceVisual> = {
  learn: {
    Icon: BookOpen,
    mark: "◇",
    wellAdult: "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80",
    wellGs: "bg-sky-200 text-sky-950 ring-2 ring-sky-300",
    cardAdult:
      "border-sky-200/90 bg-gradient-to-b from-sky-50/90 to-white hover:border-sky-400",
    cardGs:
      "border-sky-300 bg-gradient-to-b from-sky-100 to-amber-50/50 hover:border-sky-500",
    roomAdult: "border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-white",
    roomGs:
      "border-sky-300 bg-gradient-to-br from-sky-100 via-amber-50/50 to-white",
  },
  practice: {
    Icon: Wrench,
    mark: "{}",
    wellAdult: "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80",
    wellGs: "bg-violet-200 text-violet-950 ring-2 ring-violet-300",
    cardAdult:
      "border-violet-200/90 bg-gradient-to-b from-violet-50/90 to-white hover:border-violet-400",
    cardGs:
      "border-violet-300 bg-gradient-to-b from-violet-100 to-fuchsia-50/40 hover:border-violet-500",
    roomAdult:
      "border-violet-200 bg-gradient-to-br from-violet-50/70 via-white to-white",
    roomGs:
      "border-violet-300 bg-gradient-to-br from-violet-100 via-fuchsia-50/40 to-white",
  },
  check: {
    Icon: CheckCircle2,
    mark: "✓",
    wellAdult: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80",
    wellGs: "bg-emerald-200 text-emerald-950 ring-2 ring-emerald-300",
    cardAdult:
      "border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 to-white hover:border-emerald-400",
    cardGs:
      "border-emerald-300 bg-gradient-to-b from-emerald-100 to-lime-50/50 hover:border-emerald-500",
    roomAdult:
      "border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white",
    roomGs:
      "border-emerald-300 bg-gradient-to-br from-emerald-100 via-lime-50/40 to-white",
  },
  remember: {
    Icon: Brain,
    mark: "☰",
    wellAdult: "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80",
    wellGs: "bg-amber-200 text-amber-950 ring-2 ring-amber-300",
    cardAdult:
      "border-amber-200/90 bg-gradient-to-b from-amber-50/90 to-white hover:border-amber-400",
    cardGs:
      "border-amber-300 bg-gradient-to-b from-amber-100 to-orange-50/50 hover:border-amber-500",
    roomAdult:
      "border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-white",
    roomGs:
      "border-amber-300 bg-gradient-to-br from-amber-100 via-orange-50/40 to-white",
  },
  tutor: {
    Icon: MessageCircle,
    mark: "…",
    wellAdult: "bg-teal-100 text-teal-900 ring-1 ring-teal-200/80",
    wellGs: "bg-teal-200 text-teal-950 ring-2 ring-teal-300",
    cardAdult:
      "border-teal-200/90 bg-gradient-to-b from-teal-50/90 to-white hover:border-teal-400",
    cardGs:
      "border-teal-300 bg-gradient-to-b from-teal-100 to-cyan-50/50 hover:border-teal-500",
    roomAdult:
      "border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-white",
    roomGs:
      "border-teal-300 bg-gradient-to-br from-teal-100 via-cyan-50/40 to-white",
  },
};

const PRACTICE_ICONS: Record<string, LucideIcon> = {
  "six-hands-on": Target,
  coding: Code2,
  sql: Code2,
  math: Puzzle,
  networking: Network,
  language: MessageCircle,
  lab: FlaskConical,
  simulation: Sparkles,
  presentation: Presentation,
  writing: SquarePen,
  game: Gamepad2,
  project: Layers,
};

const PRACTICE_MARKS: Record<string, string> = {
  "six-hands-on": "◎",
  coding: "</>",
  sql: "SQL",
  math: "∑",
  networking: "⬡",
  language: "Aa",
  lab: "⚗",
  simulation: "◈",
  presentation: "▣",
  writing: "¶",
  game: "◇",
  project: "⊞",
};

function topicVisualKind(hay: string): {
  Icon: LucideIcon;
  label: string;
} {
  const h = hay.toLowerCase();
  if (/java|python|code|program|software|cs\b|comput/.test(h)) {
    return { Icon: Code2, label: "Code" };
  }
  if (/math|algebra|calculus|geometry|statistic/.test(h)) {
    return { Icon: Puzzle, label: "Math" };
  }
  if (/bio|chem|physics|science|anatomy|cell/.test(h)) {
    return { Icon: FlaskConical, label: "Science" };
  }
  if (/network|cisco|tcp|routing/.test(h)) {
    return { Icon: Network, label: "Networking" };
  }
  if (/writ|english|essay|literature|language/.test(h)) {
    return { Icon: SquarePen, label: "Writing" };
  }
  return { Icon: BookOpen, label: "Topic" };
}

function PlaceCard({
  id,
  title,
  hint,
  selected,
  gradeSchool,
  onSelect,
}: {
  id: DestinationId;
  title: string;
  hint: string;
  selected: boolean;
  gradeSchool: boolean;
  onSelect: (id: DestinationId) => void;
}) {
  const visual = PLACE_VISUAL[id];
  const Icon = visual.Icon;
  return (
    <button
      type="button"
      data-study-destination={id}
      data-study-place-card={id}
      aria-pressed={selected}
      onClick={() => onSelect(id)}
      className={`group flex min-h-[7.25rem] flex-col items-start gap-2.5 rounded-2xl border px-3.5 py-3.5 text-left touch-manipulation transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
        selected
          ? "border-stone-800 bg-stone-900 text-white shadow-md"
          : gradeSchool
            ? visual.cardGs
            : visual.cardAdult
      }`}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${
            selected
              ? "bg-white/15 text-white"
              : gradeSchool
                ? visual.wellGs
                : visual.wellAdult
          }`}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`font-mono text-sm font-semibold tracking-tight ${
            selected
              ? "text-white/70"
              : gradeSchool
                ? "text-stone-500"
                : "text-stone-400"
          }`}
          aria-hidden
        >
          {visual.mark}
        </span>
      </span>
      <span>
        <span
          className={`block text-sm font-bold ${
            selected ? "text-white" : "text-stone-900"
          }`}
        >
          {title}
        </span>
        <span
          className={`mt-0.5 block text-[11px] leading-snug ${
            selected ? "text-stone-300" : "text-stone-600"
          }`}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}

function ActivityCard({
  item,
  gradeSchool,
  destination,
  layout = "rail",
}: {
  item: GalleryItem;
  gradeSchool: boolean;
  destination: DestinationId;
  layout?: "rail" | "grid";
}) {
  const Icon = item.Icon;
  const visual = PLACE_VISUAL[destination];
  const mark = item.mark;
  return (
    <Link
      role="listitem"
      href={item.href}
      data-study-activity={item.id}
      className={`flex flex-col gap-2 rounded-2xl border px-3 py-3 touch-manipulation transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
        layout === "rail"
          ? "w-[9.75rem] shrink-0 snap-start sm:w-[10.75rem]"
          : "min-h-[7.5rem] w-full"
      } ${
        gradeSchool
          ? "border-stone-200 bg-white shadow-sm hover:border-teal-400"
          : "border-stone-200/90 bg-white hover:border-stone-400 hover:shadow-sm"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            gradeSchool ? visual.wellGs : visual.wellAdult
          }`}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        {mark ? (
          <span
            className={`font-mono text-[11px] font-semibold ${
              gradeSchool ? "text-stone-600" : "text-stone-400"
            }`}
            aria-hidden
          >
            {mark}
          </span>
        ) : null}
      </span>
      <span className="text-sm font-bold leading-snug text-stone-900">
        {item.title}
      </span>
      <span className="text-[11px] leading-snug text-stone-600">
        {item.description}
      </span>
    </Link>
  );
}

function practiceToGalleryItem(
  item: PracticeLandscapeItem,
  courseId: string,
  topic: string | null,
  materialId?: string | null,
): GalleryItem {
  return {
    id: item.id,
    href: buildPracticeItemHref(item, { courseId, topic, materialId }),
    title: item.learnerTitle,
    description: item.description,
    Icon: PRACTICE_ICONS[item.id] ?? Target,
    mark: PRACTICE_MARKS[item.id],
  };
}

function ActivityDiscovery({
  destination,
  items,
  practiceSuggested,
  practiceMore,
  gradeSchool,
  useGrid,
}: {
  destination: DestinationId;
  items: GalleryItem[];
  practiceSuggested?: GalleryItem[];
  practiceMore?: GalleryItem[];
  gradeSchool: boolean;
  useGrid: boolean;
}) {
  if (destination === "practice") {
    const moreLabel =
      practiceSuggested && practiceSuggested.length > 0
        ? gradeSchool
          ? "More ways to practice"
          : "More practice"
        : gradeSchool
          ? "How do you want to practice?"
          : "How do you want to practice?";

    return (
      <div data-practice-all className="space-y-5">
        {practiceSuggested && practiceSuggested.length > 0 ? (
          <div data-practice-suggested>
            <StudyHaulCardRail
              label={
                gradeSchool
                  ? "Good ones for this topic"
                  : "Suggested for this topic"
              }
            >
              {practiceSuggested.map((item) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  gradeSchool={gradeSchool}
                  destination={destination}
                />
              ))}
            </StudyHaulCardRail>
          </div>
        ) : null}
        {useGrid && (practiceMore?.length ?? 0) > 0 && (practiceMore?.length ?? 0) <= 8 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-800">{moreLabel}</p>
            <div
              role="list"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              {(practiceMore ?? []).map((item) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  gradeSchool={gradeSchool}
                  destination={destination}
                  layout="grid"
                />
              ))}
            </div>
          </div>
        ) : (
          <StudyHaulCardRail label={moreLabel}>
            {(practiceMore ?? []).map((item) => (
              <ActivityCard
                key={item.id}
                item={item}
                gradeSchool={gradeSchool}
                destination={destination}
              />
            ))}
          </StudyHaulCardRail>
        )}
      </div>
    );
  }

  if (useGrid && items.length > 0 && items.length <= 6) {
    return (
      <div role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <ActivityCard
            key={item.id}
            item={item}
            gradeSchool={gradeSchool}
            destination={destination}
            layout="grid"
          />
        ))}
      </div>
    );
  }

  return (
    <StudyHaulCardRail
      label={gradeSchool ? "Pick one" : "Choose an activity"}
    >
      {items.map((item) => (
        <ActivityCard
          key={item.id}
          item={item}
          gradeSchool={gradeSchool}
          destination={destination}
        />
      ))}
    </StudyHaulCardRail>
  );
}

export function TopicStudyHaul({
  courseId,
  courseTitle,
  topic,
  materialId,
  sourceLabel,
  onChangeMaterial,
}: TopicStudyHaulProps) {
  const { settings } = useTheme();
  const gradeSchool = Boolean(settings.elementaryMode);
  const [destination, setDestination] = useState<DestinationId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const focus = topic?.trim() || null;

  const heading = focus || courseTitle;
  const courseLine = focus ? courseTitle : null;
  const contextHay = [focus, courseTitle].filter(Boolean).join(" ");
  const topicVisual = topicVisualKind(contextHay);

  // Keep engine registry referenced for wiring; learner UI uses contextual picks.
  listSupportedPracticeLandscape();
  const practiceChoices = listContextualPracticeChoices(contextHay);
  const primaryPracticeHref = resolveStudyRoomHref("practice", {
    courseId,
    topic: focus,
    materialId,
    courseTitle,
  });
  const primaryLearnHref = resolveStudyRoomHref("learn", {
    courseId,
    topic: focus,
    materialId,
    courseTitle,
  });
  const primaryCheckHref = resolveStudyRoomHref("check", {
    courseId,
    topic: focus,
    materialId,
    courseTitle,
  });
  const primaryRememberHref = resolveStudyRoomHref("remember", {
    courseId,
    topic: focus,
    materialId,
    courseTitle,
  });
  const primaryTutorHref = resolveStudyRoomHref("tutor", {
    courseId,
    topic: focus,
    materialId,
    courseTitle,
  });

  // Learner rooms: Study Haul picks the engine. No SIX/Feynman/catalog menus.
  const learnItems: GalleryItem[] = [
    {
      id: "teach-me",
      href: primaryLearnHref,
      title: "Teach Me",
      description: gradeSchool
        ? "Open the lesson for this topic."
        : "Open the lesson — Study Haul builds the teaching.",
      Icon: BookOpen,
      mark: "◇",
    },
    {
      id: "ask-question",
      href: primaryTutorHref,
      title: "Ask a Question",
      description: "Ask about a confusing part of this topic.",
      Icon: MessageCircle,
      mark: "?",
    },
  ];

  const checkItems: GalleryItem[] = [
    {
      id: "check-primary",
      href: primaryCheckHref,
      title: gradeSchool ? "Check yourself" : "Check this topic",
      description: gradeSchool
        ? "See what you remember."
        : "Retrieval check scoped to what you're learning now.",
      Icon: CheckCircle2,
      mark: "✓",
    },
    {
      id: "quiz",
      href: luckyQuizHref(courseId, materialId, focus),
      title: "Quiz",
      description: "Questions on this topic.",
      Icon: Puzzle,
      mark: "?",
    },
  ];

  const rememberItems: GalleryItem[] = [
    {
      id: "review-remember",
      href: primaryRememberHref,
      title: "Review & Remember",
      description: "Spaced review for this learning context.",
      Icon: Brain,
      mark: "↻",
    },
    {
      id: "flashcards",
      href: primaryCheckHref,
      title: "Flashcards",
      description: "Quick retrieval cards for this topic.",
      Icon: Layers,
      mark: "☰",
    },
    {
      id: "study-guide",
      href: coreStudyGuideHref({
        courseId,
        topic: focus,
        materialId,
      }),
      title: "Study Guide",
      description: "Structure notes for this topic.",
      Icon: BookOpen,
      mark: "≡",
    },
  ];

  const tutorItems: GalleryItem[] = [
    {
      id: "tutor-me",
      href: primaryTutorHref,
      title: "Start Talking",
      description: gradeSchool
        ? "Talk through what you're learning."
        : "Tutor already knows this topic and lesson context.",
      Icon: MessageCircle,
      mark: "…",
    },
  ];

  const destinations: Array<{
    id: DestinationId;
    title: string;
    hint: string;
  }> = [
    {
      id: "learn",
      title: "Learn",
      hint: gradeSchool ? "Get it explained" : "Understand the idea",
    },
    {
      id: "practice",
      title: "Practice",
      hint: gradeSchool ? "Try it yourself" : "Work with it",
    },
    {
      id: "check",
      title: "Check",
      hint: gradeSchool ? "Test yourself" : "See what you know",
    },
    {
      id: "remember",
      title: "Remember",
      hint: gradeSchool ? "Keep it in mind" : "Review & retain",
    },
    {
      id: "tutor",
      title: "Tutor Me",
      hint: gradeSchool ? "Talk it through" : "Get personal help",
    },
  ];

  function galleryFor(dest: DestinationId): {
    title: string;
    hint: string;
    items: GalleryItem[];
    practiceSuggested?: GalleryItem[];
    practiceMore?: GalleryItem[];
  } {
    switch (dest) {
      case "learn":
        return {
          title: gradeSchool ? "Learn" : "Learn & Understand",
          hint: gradeSchool
            ? "Open your lesson for this topic."
            : "Study Haul teaches this topic — you don't pick a method.",
          items: learnItems,
        };
      case "practice":
        return {
          title: "Practice",
          hint: gradeSchool
            ? "Practice this topic."
            : "Practice stays on this topic — Study Haul picks how.",
          items: [
            {
              id: "practice-primary",
              href: primaryPracticeHref,
              title: gradeSchool
                ? "Practice this"
                : focus
                  ? `Practice ${focus}`
                  : "Practice this topic",
              description:
                practiceChoices[0]?.description ??
                "Apply what you're learning now.",
              Icon: PRACTICE_ICONS[practiceChoices[0]?.id ?? "six-hands-on"] ?? Target,
              mark: PRACTICE_MARKS[practiceChoices[0]?.id ?? "six-hands-on"],
            },
          ],
          practiceSuggested: practiceChoices.map((i) =>
            practiceToGalleryItem(i, courseId, focus, materialId),
          ),
          // Never dump Coding/SQL/Math/Network as a generic catalog.
          practiceMore: [],
        };
      case "check":
        return {
          title: gradeSchool ? "Check" : "Check My Understanding",
          hint: gradeSchool
            ? "Check what you know about this topic."
            : "Check this concept — not the whole course.",
          items: checkItems,
        };
      case "remember":
        return {
          title: gradeSchool ? "Remember" : "Study & Remember",
          hint: gradeSchool
            ? "Keep this topic in mind."
            : "Retention for this learning context.",
          items: rememberItems,
        };
      case "tutor":
        return {
          title: "Tutor Me",
          hint: gradeSchool
            ? "Talk about what you're learning."
            : "Tutor inherits this course and topic.",
          items: tutorItems,
        };
    }
  }

  const enterDestination = (id: DestinationId) => {
    setDestination(id);
    setMenuOpen(false);
  };

  const exitDestination = () => {
    setDestination(null);
  };

  const gallery = destination ? galleryFor(destination) : null;
  const TopicIcon = topicVisual.Icon;
  const roomVisual = destination ? PLACE_VISUAL[destination] : null;
  const RoomIcon = roomVisual?.Icon;

  const menuLinks = [
    { id: "learn" as const, label: "Learn", action: () => enterDestination("learn") },
    {
      id: "practice" as const,
      label: "Practice",
      action: () => enterDestination("practice"),
    },
    { id: "check" as const, label: "Check", action: () => enterDestination("check") },
    {
      id: "remember" as const,
      label: "Remember",
      action: () => enterDestination("remember"),
    },
    { id: "tutor" as const, label: "Tutor Me", action: () => enterDestination("tutor") },
  ];

  return (
    <section
      data-hub-topic-study-haul
      data-hub-learning-intents
      data-hub-practice-landscape
      data-study-progressive
      data-study-place
      data-audience={gradeSchool ? "grade-school" : "adult"}
      data-audience-is-not-difficulty="true"
      className={`overflow-hidden rounded-3xl border shadow-sm ${
        gradeSchool
          ? "border-teal-300 bg-gradient-to-br from-teal-50 via-amber-50/50 to-rose-50/30"
          : "border-stone-200/90 bg-gradient-to-br from-stone-50 via-white to-teal-50/40"
      }`}
    >
      {/* Place chrome — menu always available */}
      <div className="relative flex items-center justify-between gap-3 border-b border-stone-200/60 px-5 py-3 sm:px-6">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
            gradeSchool ? "text-teal-800" : "text-stone-500"
          }`}
        >
          {gradeSchool ? "Study Haul" : "Study Haul"}
        </p>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="study-haul-internal-menu"
          aria-label="Study Haul menu"
          data-study-haul-menu-trigger
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-stone-200 bg-white/90 text-stone-700 touch-manipulation hover:bg-white"
        >
          {menuOpen ? (
            <X className="h-4 w-4" aria-hidden />
          ) : (
            <Menu className="h-4 w-4" aria-hidden />
          )}
        </button>

        {menuOpen ? (
          <nav
            id="study-haul-internal-menu"
            data-study-haul-internal-menu
            aria-label="Study Haul"
            className="absolute right-5 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 shadow-lg sm:right-6"
          >
            {menuLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                className="flex min-h-11 w-full items-center px-3.5 text-left text-sm font-semibold text-stone-800 touch-manipulation hover:bg-teal-50"
                onClick={link.action}
              >
                {link.label}
              </button>
            ))}
            <div className="my-1 border-t border-stone-100" />
            {destination ? (
              <button
                type="button"
                className="flex min-h-11 w-full items-center px-3.5 text-left text-sm font-semibold text-stone-800 touch-manipulation hover:bg-teal-50"
                onClick={() => {
                  exitDestination();
                  setMenuOpen(false);
                }}
              >
                Change how I learn
              </button>
            ) : null}
            {onChangeMaterial ? (
              <button
                type="button"
                data-study-change-material
                className="flex min-h-11 w-full items-center px-3.5 text-left text-sm font-semibold text-stone-800 touch-manipulation hover:bg-teal-50"
                onClick={() => {
                  onChangeMaterial();
                  setMenuOpen(false);
                }}
              >
                Change material
              </button>
            ) : null}
            <div className="my-1 border-t border-stone-100" />
            <Link
              href="/study/learner-model"
              className="flex min-h-11 items-center px-3.5 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-teal-50"
              onClick={() => setMenuOpen(false)}
            >
              Progress
            </Link>
          </nav>
        ) : null}
      </div>

      {/* DESTINATION ROOM — replaces landing (focused place, not expand-under) */}
      {destination && gallery && roomVisual ? (
        <div
          data-study-room={destination}
          data-study-gallery={destination}
          id={
            destination === "practice"
              ? "practice"
              : destination === "learn"
                ? "learn-understand"
                : destination === "check"
                  ? "check-understanding"
                  : destination === "remember"
                    ? "study-remember"
                    : "tutor-me"
          }
          className={`space-y-5 p-5 sm:p-6 ${
            gradeSchool ? roomVisual.roomGs : roomVisual.roomAdult
          }`}
        >
          <button
            type="button"
            data-study-room-back
            onClick={exitDestination}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-stone-600 touch-manipulation hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Study Haul
          </button>

          <header className="flex items-start gap-3">
            <span
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                gradeSchool ? roomVisual.wellGs : roomVisual.wellAdult
              }`}
              aria-hidden
            >
              {RoomIcon ? <RoomIcon className="h-6 w-6" /> : null}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                {heading}
              </p>
              <h2 className="mt-0.5 text-2xl font-black tracking-tight text-stone-900">
                {gallery.title}
              </h2>
              <p className="mt-1 text-sm text-stone-600">{gallery.hint}</p>
            </div>
          </header>

          {destination === "tutor" ? (
            <div className="rounded-2xl border border-teal-200/80 bg-white/90 p-4 sm:p-5">
              <p className="text-sm text-stone-600">
                {gradeSchool
                  ? "This is your tutoring spot. Start talking whenever you're ready."
                  : "A quiet room to talk through what you're learning — no new tutor system, same help."}
              </p>
              <Link
                href={primaryTutorHref}
                data-study-activity="tutor-me-primary"
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-teal-700 px-5 text-sm font-bold text-white touch-manipulation hover:bg-teal-800 sm:w-auto"
              >
                Start Talking
              </Link>
            </div>
          ) : null}

          <ActivityDiscovery
            destination={destination}
            items={gallery.items}
            practiceSuggested={gallery.practiceSuggested}
            practiceMore={gallery.practiceMore}
            gradeSchool={gradeSchool}
            useGrid={!gradeSchool}
          />
        </div>
      ) : (
        /* LANDING — place identity + What do you need? */
        <div data-study-landing className="space-y-6 p-5 sm:p-7">
          <header data-study-topic-identity className="flex items-start gap-4">
            <span
              className={`mt-0.5 inline-flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${
                gradeSchool
                  ? "bg-amber-200 text-amber-950 ring-2 ring-amber-300"
                  : "bg-stone-900 text-stone-50"
              }`}
              title={topicVisual.label}
              aria-hidden
            >
              <TopicIcon className="h-6 w-6" />
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide opacity-70">
                {topicVisual.label}
              </span>
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                data-study-what-context
                className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                  gradeSchool ? "text-teal-800" : "text-stone-500"
                }`}
              >
                What you&apos;re learning
                {sourceLabel ? ` · ${sourceLabel}` : ""}
              </p>
              {courseLine ? (
                <p className="mt-1 text-sm font-medium text-stone-600">
                  {courseLine}
                </p>
              ) : null}
              <h2 className="mt-0.5 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                {heading}
              </h2>
            </div>
          </header>

          <div className="space-y-3">
            <div>
              <h3
                data-study-need-prompt
                className={`text-base font-bold sm:text-lg ${
                  gradeSchool ? "text-teal-950" : "text-stone-900"
                }`}
              >
                How do you want to learn?
              </h3>
              <p className="mt-0.5 text-xs text-stone-500">
                {gradeSchool
                  ? "Pick a place in Study Haul."
                  : "Enter Learn, Practice, Check, Remember, or Tutor — one place at a time."}
              </p>
            </div>

            <div
              data-study-destinations
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
            >
              {destinations.map((dest) => (
                <PlaceCard
                  key={dest.id}
                  id={dest.id}
                  title={dest.title}
                  hint={dest.hint}
                  selected={false}
                  gradeSchool={gradeSchool}
                  onSelect={enterDestination}
                />
              ))}
            </div>
          </div>

          <div
            data-hub-guided-entry
            className="flex flex-wrap gap-2 border-t border-stone-200/70 pt-4"
          >
            <Link
              href={primaryTutorHref}
              data-hub-struggling-entry
              className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-xs font-semibold touch-manipulation ${
                gradeSchool
                  ? "border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100"
                  : "border-amber-200 bg-amber-50/80 text-amber-950 hover:bg-amber-50"
              }`}
            >
              {gradeSchool ? "I'm stuck" : "I'm struggling with this"}
            </Link>
            {onChangeMaterial ? (
              <button
                type="button"
                onClick={onChangeMaterial}
                className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 bg-white/80 px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation hover:bg-white"
              >
                Change material
              </button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
