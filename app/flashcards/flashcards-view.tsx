"use client";

import Link from "next/link";
import { FlashcardImportExport } from "@/components/flashcards/FlashcardImportExport";
import { StudyLoopStrip } from "@/components/study/StudyLoopStrip";
import { AdaptiveReturnStrip } from "@/components/study/AdaptiveReturnStrip";
import { StudyHubLearnerContext } from "@/components/study/StudyHubLearnerContext";
import { coreStudyPackHref, luckyQuizHref } from "@/lib/study/loop-hrefs";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layers, Loader2, Sparkles, Trash2 } from "lucide-react";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { confirmDeleteMany } from "@/lib/confirm-delete";
import { useSelectableIds } from "@/lib/selection/use-selectable-ids";

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
  topics?: string[];
  materials: Array<{ id: string; title: string; type: string }>;
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
  const courseIds = useMemo(() => courses.map((course) => course.id), [courses]);
  const [selectedCourseId, setSelectedCourseId] = useState(() =>
    resolveUrlCourseId(searchParams.get("courseId"), courseIds),
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [topicFocus, setTopicFocus] = useState("");
  const [cards, setCards] = useState(initialCards);
  const [managedCards, setManagedCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [adaptiveReturn, setAdaptiveReturn] = useState<{
    runId: string;
    notice?: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const managedIds = useMemo(
    () => managedCards.map((card) => card.id),
    [managedCards],
  );
  const cardSelection = useSelectableIds(managedIds);

  useEffect(() => {
    cardSelection.pruneTo(managedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managedIds.join("|")]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const flashcardAdaptiveRunId = searchParams.get("adaptiveRunId")?.trim() || "";
  const flashcardConceptId = searchParams.get("conceptId")?.trim() || "";

  useEffect(() => {
    const materialId = searchParams.get("materialId");
    const topic = searchParams.get("topic");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setSelectedCourseId(resolveUrlCourseId(searchParams.get("courseId"), courseIds));
    if (materialId) setSelectedMaterialId(materialId);
    if (topic) setTopicFocus(topic);
  }, [searchParams, courseIds]);

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

  const refreshManagedCards = useCallback(async () => {
    if (!selectedCourseId) {
      setManagedCards([]);
      return;
    }
    setManageLoading(true);
    try {
      const params = new URLSearchParams({
        courseId: selectedCourseId,
        scope: "all",
      });
      const response = await fetch(`/api/flashcards?${params}`);
      const data = await response.json();
      if (data.success) {
        setManagedCards(data.data);
      }
    } finally {
      setManageLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void refreshCards();
  }, [refreshCards]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    if (manageMode) void refreshManagedCards();
  }, [manageMode, refreshManagedCards]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );
  const focusTopic = resolveLoopFocusTopic(
    topicFocus.trim() || null,
    selectedCourse?.topics ?? [],
  );

  const courseMaterials = selectedCourse?.materials ?? [];

  useEffect(() => {
    if (!selectedMaterialId) return;
    if (!courseMaterials.some((material) => material.id === selectedMaterialId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setSelectedMaterialId("");
    }
  }, [courseMaterials, selectedMaterialId]);

  const generateCards = async () => {
    if (!selectedCourseId) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          materialId: selectedMaterialId || undefined,
          topic: topicFocus.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Failed to generate flashcards.");
      }
      await refreshCards();
      if (manageMode) await refreshManagedCards();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!window.confirm("Delete this flashcard?")) return;
    setDeletingId(cardId);
    try {
      const response = await fetch(`/api/flashcards/${cardId}`, { method: "DELETE" });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Failed to delete flashcard.");
      }
      setCards((current) => {
        const next = current.filter((card) => card.id !== cardId);
        setCurrentIndex((index) =>
          next.length === 0 ? 0 : Math.min(index, next.length - 1),
        );
        return next;
      });
      setManagedCards((current) => current.filter((card) => card.id !== cardId));
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete flashcard.");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllCards = async () => {
    if (!selectedCourseId) return;
    const courseTitle = selectedCourse?.title ?? "this class";
    if (
      !window.confirm(
        `Delete ALL flashcards for ${courseTitle}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingAll(true);
    try {
      const response = await fetch("/api/flashcards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Failed to delete flashcards.");
      }
      setCards([]);
      setManagedCards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      cardSelection.clear();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete flashcards.");
    } finally {
      setDeletingAll(false);
    }
  };

  const deleteSelectedCards = async () => {
    const ids = cardSelection.selectedIds;
    if (ids.length === 0) return;
    if (!confirmDeleteMany(ids.length, { noun: "flashcard" })) return;
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/flashcards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? "Failed to delete flashcards.");
      }
      const removed = new Set(ids);
      setManagedCards((current) => current.filter((card) => !removed.has(card.id)));
      setCards((current) => current.filter((card) => !removed.has(card.id)));
      cardSelection.clear();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete flashcards.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleReview = async (rating: "AGAIN" | "GOOD" | "EASY") => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    setReviewing(true);
    try {
      const adaptiveRunId = searchParams.get("adaptiveRunId")?.trim() || "";
      const adaptiveStepRaw = searchParams.get("adaptiveStep");
      const adaptiveStep =
        adaptiveStepRaw != null && adaptiveStepRaw !== ""
          ? Number(adaptiveStepRaw)
          : undefined;
      const hasAdaptive =
        Boolean(adaptiveRunId) &&
        adaptiveStep != null &&
        Number.isFinite(adaptiveStep) &&
        adaptiveStep >= 0;

      const response = await fetch("/api/flashcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentCard.id,
          rating,
          ...(hasAdaptive
            ? { adaptiveRunId, adaptiveStep }
            : {}),
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        adaptive?: {
          runId?: string;
          outcome?: string;
          reason?: string;
        };
      };

      // Phase 2P-1: return to Adaptive after bind (mirrors Quiz).
      if (
        hasAdaptive &&
        data.adaptive?.runId &&
        data.adaptive.outcome &&
        data.adaptive.outcome !== "error"
      ) {
        const notice =
          data.adaptive.outcome.startsWith("STOP_") ||
          data.adaptive.outcome === "ALREADY_PROCESSED"
            ? data.adaptive.outcome
            : undefined;
        setAdaptiveReturn({ runId: data.adaptive.runId, notice });
      } else if (hasAdaptive && data.adaptive?.outcome === "error") {
        console.error(
          "Adaptive flashcard bind failed:",
          data.adaptive.reason,
        );
        setAdaptiveReturn({ runId: adaptiveRunId });
      } else if (hasAdaptive) {
        setAdaptiveReturn({ runId: adaptiveRunId });
      }

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

      {flashcardAdaptiveRunId || flashcardConceptId ? (
        <StudyHubLearnerContext conceptId={flashcardConceptId || null} />
      ) : null}

      {courses.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedCourseId}
              onChange={(event) => {
                setSelectedCourseId(event.target.value);
                setSelectedMaterialId("");
              }}
              className="flex-1 rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <select
              value={selectedMaterialId}
              onChange={(event) => setSelectedMaterialId(event.target.value)}
              className="flex-1 rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">All course materials</option>
              {courseMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.title} ({material.type.toLowerCase()})
                </option>
              ))}
            </select>
          </div>
          <input
            value={topicFocus}
            onChange={(event) => setTopicFocus(event.target.value)}
            placeholder='Focus (optional) — e.g. "Chapter 1" or "Module 2"'
            className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => void generateCards()}
            disabled={generating || !selectedCourseId}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60 touch-manipulation"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {selectedMaterialId || topicFocus.trim()
              ? "Generate from selected material"
              : "Generate from class materials"}
          </button>
          <p className="text-[11px] text-stone-500">
            Upload a textbook chapter PDF in your course locker, pick it here, add a focus like
            “Chapter 1”, then generate. Those cards feed Flashcards, SIX, and Lucky.
          </p>
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

      {courses.length > 0 && selectedCourseId ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-stone-900">Manage cards</p>
              <p className="text-[11px] text-stone-500">
                View every card for this class and delete ones you don’t want.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={deletingAll || !selectedCourseId}
                onClick={() => void deleteAllCards()}
                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                {deletingAll ? "Deleting…" : "Delete all"}
              </button>
              <button
                type="button"
                onClick={() => setManageMode((value) => !value)}
                className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                {manageMode ? "Hide list" : "Show all cards"}
              </button>
            </div>
          </div>
          {manageMode ? (
            <div className="mt-3 space-y-3">
              {managedCards.length > 0 ? (
                <BulkSelectionBar
                  totalCount={managedCards.length}
                  selectedCount={cardSelection.selectedCount}
                  allSelected={cardSelection.allSelected}
                  someSelected={cardSelection.someSelected}
                  onToggleAll={cardSelection.toggleAll}
                  onClear={cardSelection.clear}
                  onDeleteSelected={() => void deleteSelectedCards()}
                  deleting={bulkDeleting}
                  noun="flashcard"
                />
              ) : null}
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {manageLoading ? (
                <p className="flex items-center gap-2 text-sm text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading cards…
                </p>
              ) : managedCards.length === 0 ? (
                <p className="text-sm text-stone-500">No flashcards for this class yet.</p>
              ) : (
                managedCards.map((card) => (
                  <div
                    key={card.id}
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${
                      cardSelection.isSelected(card.id)
                        ? "border-amber-300 bg-amber-50/70"
                        : "border-stone-100 bg-stone-50/70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-amber-600"
                      checked={cardSelection.isSelected(card.id)}
                      onChange={() => cardSelection.toggle(card.id)}
                      aria-label={`Select ${card.front}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-900">{card.front}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{card.back}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">
                        {card.topic.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={deletingId === card.id}
                      onClick={() => void deleteCard(card.id)}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      aria-label="Delete flashcard"
                      title="Delete"
                    >
                      {deletingId === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedCourseId && selectedCourse ? (
        <StudyLoopStrip
          courseId={selectedCourseId}
          courseTitle={selectedCourse.title}
          topics={selectedCourse.topics ?? []}
          focusTopic={focusTopic}
        />
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading cards…
        </p>
      ) : cards.length === 0 ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-6 py-12 text-center">
            <Layers className="mx-auto h-10 w-10 text-amber-500" />
            <p className="mt-4 font-semibold text-stone-800">No cards due</p>
            <p className="mt-2 text-sm text-stone-600">
              {selectedCourse
                ? `Nothing to review for ${selectedCourse.title} right now. Start with a Core study pack, then generate cards from Lucky topics.`
                : "Pick a class and generate cards to start reviewing."}
            </p>
            {selectedCourseId && selectedCourse ? (
              <div
                data-hub-chrome
                className="mt-4 flex flex-wrap justify-center gap-2"
              >
                <Link
                  href={coreStudyPackHref(selectedCourseId, focusTopic)}
                  className="inline-flex min-h-11 items-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-500 touch-manipulation"
                >
                  Core study pack
                </Link>
                <Link
                  href={luckyQuizHref(selectedCourseId, null, focusTopic)}
                  className="inline-flex min-h-11 items-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 touch-manipulation"
                >
                  Lucky quiz
                </Link>
              </div>
            ) : null}
          </div>
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
            <div className="space-y-3">
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
              <button
                type="button"
                disabled={deletingId === cards[currentIndex]?.id}
                onClick={() => void deleteCard(cards[currentIndex].id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                {deletingId === cards[currentIndex]?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete this card
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-sm text-stone-500">
                Tap to flip · swipe left/right for prev/next
              </p>
              <button
                type="button"
                disabled={deletingId === cards[currentIndex]?.id}
                onClick={() => void deleteCard(cards[currentIndex].id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete card
              </button>
            </div>
          )}

          {adaptiveReturn ? (
            <div
              data-adaptive-return-panel
              className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-950"
            >
              <AdaptiveReturnStrip
                runId={adaptiveReturn.runId}
                notice={adaptiveReturn.notice ?? null}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
