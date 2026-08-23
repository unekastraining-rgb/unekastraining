"use client";

import { FlashcardImportExport } from "@/components/flashcards/FlashcardImportExport";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layers, Loader2, Sparkles } from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: {
    id: string;
    name: string;
    courseId: string;
  };
}

interface CourseOption {
  id: string;
  title: string;
}

interface FlashcardsViewProps {
  initialCards: Flashcard[];
  initialCourses: CourseOption[];
}

export function FlashcardsView({
  initialCards,
  initialCourses,
}: FlashcardsViewProps) {
  const searchParams = useSearchParams();
  const [courses] = useState(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialCourses[0]?.id ?? "",
  );
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const courseId = searchParams.get("courseId");
    if (courseId && courses.some((course) => course.id === courseId)) {
      setSelectedCourseId(courseId);
    }
  }, [searchParams, courses]);

  const refreshCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseId) params.set("courseId", selectedCourseId);
      const response = await fetch(`/api/flashcards?${params}`);
      const data = await response.json();
      if (data.success) {
        setCards(data.data);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    void refreshCards();
  }, [refreshCards]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const generateCards = async () => {
    if (!selectedCourseId) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Failed to generate flashcards.");
      }
      await refreshCards();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (rating: "AGAIN" | "GOOD" | "EASY") => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    setReviewing(true);
    try {
      await fetch("/api/flashcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: currentCard.id, rating }),
      });

      setIsFlipped(false);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        await refreshCards();
      }
    } catch (error) {
      console.error("Failed to record review:", error);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div
      className={`mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 ${
        studyMode ? "fixed inset-0 z-50 max-w-none bg-[#fff8f1] overflow-y-auto" : "max-w-2xl"
      }`}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Spaced repetition
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Flashcards</h1>
        <p className="mt-2 text-sm text-stone-600">
          Review due cards or generate new ones from course material.
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="flex-1 rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void generateCards()}
            disabled={generating || !selectedCourseId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate from class
          </button>
        </div>
      ) : (
        <p className="text-sm text-stone-600">
          Add a class first to generate flashcards from your materials.
        </p>
      )}

      {courses.length > 0 && selectedCourseId ? (
        <FlashcardImportExport
          courseId={selectedCourseId}
          courseTitle={selectedCourse?.title}
        />
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading cards…
        </p>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-6 py-12 text-center">
          <Layers className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-4 font-semibold text-stone-800">No cards due</p>
          <p className="mt-2 text-sm text-stone-600">
            {selectedCourse
              ? `Nothing to review for ${selectedCourse.title} right now.`
              : "Pick a class and generate cards to start reviewing."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>
              {selectedCourse?.title ?? "All classes"} · {cards.length} due
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStudyMode((value) => !value)}
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                {studyMode ? "Exit focus" : "Focus mode"}
              </button>
              <span>
                Card {currentIndex + 1} of {cards.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onPointerDown={(event) => {
              touchStart.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              if (!touchStart.current) {
                setIsFlipped(!isFlipped);
                return;
              }
              const dx = event.clientX - touchStart.current.x;
              const dy = event.clientY - touchStart.current.y;
              touchStart.current = null;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setIsFlipped(false);
                } else if (dx < 0 && currentIndex < cards.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  setIsFlipped(false);
                }
                return;
              }
              setIsFlipped(!isFlipped);
            }}
            className="flex min-h-[min(70vh,28rem)] cursor-pointer flex-col items-center justify-center rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm transition hover:border-orange-200 sm:min-h-80 sm:p-8"
          >
            <span className="mb-4 text-[10px] font-bold uppercase tracking-wider text-amber-600">
              {isFlipped ? "Answer" : "Question"}
            </span>
            <p className="text-lg font-semibold text-stone-900">
              {isFlipped ? cards[currentIndex].back : cards[currentIndex].front}
            </p>
            <p className="mt-4 text-xs text-stone-500">{cards[currentIndex].topic.name}</p>
          </button>

          {isFlipped ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(["AGAIN", "GOOD", "EASY"] as const).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  disabled={reviewing}
                  onClick={() => void handleReview(rating)}
                  className={`rounded-xl border px-3 py-4 text-sm font-semibold transition disabled:opacity-60 sm:px-4 sm:py-3 ${
                    rating === "AGAIN"
                      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : rating === "GOOD"
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {rating.charAt(0) + rating.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-stone-500">
              Tap to flip · swipe left/right for prev/next
            </p>
          )}
        </>
      )}
    </div>
  );
}
