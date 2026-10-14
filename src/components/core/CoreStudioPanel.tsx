"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { formatExtractCoverageLines } from "@/lib/core/chapter-study-extract";
import { ALL_SHEETS_TARGET } from "@/lib/core/apply-studio-to-canvas";
import { CoreKnowledgeBridgePanel } from "@/components/core/CoreKnowledgeBridgePanel";
import { CoreLearningActionsPanel } from "@/components/core/CoreLearningActionsPanel";
import type { CoreStudioType } from "@/lib/core/studio-types";
import { friendlyUserFacingAiError } from "@/lib/ai/parse-json-response";
import { blurtingHref, sixChunkingHref, sixFeynmanHref } from "@/lib/study/loop-hrefs";

const STUDIO_ITEMS: Array<{
  type: CoreStudioType;
  emoji: string;
  label: string;
  description: string;
}> = [
  {
    type: "chapter-study",
    emoji: "📖",
    label: "Study this chapter",
    description:
      "AI pack: LOs, terms, frameworks, walkthroughs, test items — then Core → Lucky quiz",
  },
  {
    type: "briefing",
    emoji: "📰",
    label: "Briefing",
    description: "Executive summary with key terms",
  },
  {
    type: "study-guide",
    emoji: "📋",
    label: "Study guide (exam extract)",
    description:
      "Same study-worthy extract as chapter study, organized for review (not a generic summary)",
  },
  {
    type: "faq",
    emoji: "❓",
    label: "FAQ",
    description: "Question and answer pairs — saved to Locker (and flashcards)",
  },
  {
    type: "timeline",
    emoji: "📅",
    label: "Timeline",
    description: "Chronological events as an editable Core timeline block",
  },
  {
    type: "flashcards",
    emoji: "🎴",
    label: "Flashcard deck",
    description: "Front/back cards in Study / Locker",
  },
];

interface FlashcardPayload {
  title: string;
  cards: Array<{ front: string; back: string }>;
}

interface NotebookPageOption {
  id: string;
  label: string;
  pageNumber: number;
}

export function CoreStudioPanel({
  courseId,
  materialId,
  topic,
  pages = [],
  activePageId = null,
  noteId = null,
  onInsert,
  pageSourceText = "",
  hasStudyExtract = false,
  onStudyThisPage,
  onInsertPractice,
  onInsertLearningPlan,
  onInsertExplanations,
  onGenerateQuiz,
  allSheetsSourceText = "",
  coldStart = false,
  onPracticeFlashcardsInCore,
  onBeforeLeaveToAdaptive,
}: {
  courseId: string;
  materialId: string | null;
  topic: string;
  pages?: NotebookPageOption[];
  activePageId?: string | null;
  /** Active notebook id for Knowledge bridge (optional). */
  noteId?: string | null;
  onInsert: (payload: {
    title: string;
    text: string;
    type: CoreStudioType;
    structured?: Record<string, unknown>;
    pageId?: string;
  }) => void;
  pageSourceText?: string;
  allSheetsSourceText?: string;
  hasStudyExtract?: boolean;
  onStudyThisPage?: (targetPageId: string) => Promise<void> | void;
  onInsertPractice?: () => boolean;
  onInsertLearningPlan?: () => boolean;
  onInsertExplanations?: () => boolean;
  onGenerateQuiz?: () => Promise<void> | void;
  coldStart?: boolean;
  /** Open flashcard practice in Core split (notes left, cards right). */
  onPracticeFlashcardsInCore?: (deck: FlashcardPayload) => void;
  /** Flush in-memory note before CORE → Adaptive. */
  onBeforeLeaveToAdaptive?: () => Promise<void> | void;
}) {
  const [loadingType, setLoadingType] = useState<CoreStudioType | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardDeck, setFlashcardDeck] = useState<FlashcardPayload | null>(null);
  const [flashcardPrompt, setFlashcardPrompt] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [targetPageId, setTargetPageId] = useState<string>(ALL_SHEETS_TARGET);
  const [pendingChapter, setPendingChapter] = useState<{
    title: string;
    text: string;
    structured: ChapterStudyExtract;
  } | null>(null);
  const [studyingPage, setStudyingPage] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (targetPageId === ALL_SHEETS_TARGET) return;
    if (targetPageId && pages.some((page) => page.id === targetPageId)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    if (activePageId) setTargetPageId(activePageId);
    else if (pages[0]?.id) setTargetPageId(pages[0].id);
    else setTargetPageId(ALL_SHEETS_TARGET);
  }, [activePageId, pages, targetPageId]);

  const usingAllSheets = targetPageId === ALL_SHEETS_TARGET;
  const selectedSourceText = usingAllSheets
    ? allSheetsSourceText.trim() || pageSourceText.trim()
    : pageSourceText.trim();
  const studyLabel = usingAllSheets ? "Study all sheets" : "Study this page";
  const studyHint = usingAllSheets
    ? "Try Study all sheets first, then Quiz."
    : "Try Study this page first, then Quiz.";

  async function generate(type: CoreStudioType) {
    const pageText = selectedSourceText;
    if (!courseId && !materialId && !pageText) {
      setError("Select a course or material first, or paste source into this notebook.");
      return;
    }

    setLoadingType(type);
    setError(null);
    setImportMessage(null);
    setFlashcardDeck(null);
    setPendingChapter(null);
    try {
      const response = await fetch("/api/core/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          courseId: courseId || undefined,
          materialId,
          topic,
          sourceText: usingAllSheets || !materialId ? pageText || undefined : undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Generation failed.");

      if (type === "chapter-study" || type === "study-guide") {
        setPendingChapter({
          title: data.data.title,
          text: data.data.noteText,
          structured: data.data.structured as ChapterStudyExtract,
        });
        return;
      }

      onInsert({
        title: data.data.title,
        text: data.data.noteText,
        type,
        structured: data.data.structured,
        pageId: usingAllSheets ? undefined : targetPageId || undefined,
      });
      if (type === "faq") {
        setImportMessage(`Saved to Locker as “${data.data.title}”.`);
      }
      if (type === "timeline") {
        setImportMessage(
          `Inserted a Timeline block on ${
            usingAllSheets
              ? "this notebook"
              : pages.find((page) => page.id === targetPageId)?.label ?? "this notebook"
          }.`,
        );
      }
      if (type === "flashcards") {
        const structured = data.data.structured as {
          title?: string;
          cards?: Array<{ front: string; back: string }>;
        };
        setFlashcardDeck({
          title: structured.title ?? data.data.title,
          cards: structured.cards ?? [],
        });
        setFlashcardPrompt(true);
      }
    } catch (err) {
      setError(friendlyUserFacingAiError(err, "Generation failed."));
    } finally {
      setLoadingType(null);
    }
  }

  function insertChapterStudy() {
    if (!pendingChapter) return;
    onInsert({
      title: pendingChapter.title,
      text: pendingChapter.text,
      type: "chapter-study",
      structured: pendingChapter.structured as unknown as Record<string, unknown>,
      pageId: usingAllSheets ? undefined : targetPageId || undefined,
    });
    setImportMessage(
      `Inserted into ${
        usingAllSheets
          ? "this notebook"
          : pages.find((page) => page.id === targetPageId)?.label ?? "this notebook"
      }. Formats: ${(pendingChapter.structured.recommendedFormats ?? []).join(", ") || "page notes"}.`,
    );
    setPendingChapter(null);
  }

  async function importToLucky() {
    if (!flashcardDeck || flashcardDeck.cards.length === 0) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const response = await fetch("/api/flashcards/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: flashcardDeck.title,
          cards: flashcardDeck.cards,
          courseId: courseId || undefined,
          materialId: materialId || undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Import failed.");
      setImportMessage(`Added ${data.data?.created ?? flashcardDeck.cards.length} cards to Lucky.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Assist Studio</p>
        <p className="text-[10px] text-stone-500">
          Pull study content from the selected material (e.g. Chapter 1) into this notebook.
          FAQ and flashcards go to Locker — timeline and study guides go onto the canvas.
        </p>
      </div>

      <CoreKnowledgeBridgePanel
        noteId={noteId}
        hasStudyExtract={hasStudyExtract}
        onBeforeLeaveToAdaptive={onBeforeLeaveToAdaptive}
      />

      <CoreLearningActionsPanel
        noteId={noteId}
        courseId={courseId}
        materialId={materialId}
      />

      {/* Core → Six → Lucky — Study Haul loop, not a ChatGPT/Quizlet clone */}
      <div
        data-canvas-inspector
        className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-teal-50/60 p-3 touch-manipulation"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
          Core → Six → Lucky
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-stone-600">
          Organize here, understand in Six, retain with Lucky quizzes.
          {coldStart
            ? " No notes yet? Photo a syllabus (OCR → topics), Blurt, or Study from topics."
            : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {onStudyThisPage ? (
            <button
              type="button"
              disabled={studyingPage || Boolean(loadingType)}
              onClick={() => {
                if (selectedSourceText.length < 40 && !courseId && !materialId) {
                  setError(
                    usingAllSheets
                      ? "Add text on your sheets, pick a class, or add course topics — then Study chapter."
                      : "Add text on this sheet, pick a class, or add course topics — then Study chapter.",
                  );
                  return;
                }
                setStudyingPage(true);
                setError(null);
                void Promise.resolve(onStudyThisPage(targetPageId))
                  .then(() => {
                    setImportMessage(
                      coldStart
                        ? "Cold-start study pack from topics — ready for Six or Lucky."
                        : usingAllSheets
                          ? "Study guide from all sheets — ready for Six or Lucky."
                          : "Study guide on the page — ready for Six or Lucky.",
                    );
                  })
                  .catch((err) => {
                    setError(friendlyUserFacingAiError(err, `Could not ${studyLabel.toLowerCase()}.`));
                  })
                  .finally(() => setStudyingPage(false));
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-[11px] font-bold text-white touch-manipulation hover:bg-teal-600 disabled:opacity-60 sm:flex-none"
            >
              {studyingPage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {coldStart ? "Study from topics" : "Study chapter"}
            </button>
          ) : null}
          {onGenerateQuiz ? (
            <button
              type="button"
              disabled={quizLoading}
              onClick={() => {
                if (!courseId) {
                  setError("Select a course in the Core header, then tap Lucky quiz.");
                  return;
                }
                setQuizLoading(true);
                setError(null);
                void Promise.resolve(onGenerateQuiz())
                  .then(() => {
                    setImportMessage("Lucky quiz ready — opening…");
                  })
                  .catch((err) => {
                    setError(friendlyUserFacingAiError(err, studyHint));
                  })
                  .finally(() => setQuizLoading(false));
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-violet-600 px-3 py-2 text-[11px] font-bold text-white touch-manipulation hover:bg-violet-500 disabled:opacity-60 sm:flex-none"
            >
              {quizLoading ? "Making quiz…" : "Lucky quiz"}
            </button>
          ) : null}
          {courseId ? (
            <>
              <Link
                href={sixChunkingHref(courseId, topic || "this page", materialId)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-teal-300 bg-white/80 px-3 py-2 text-[11px] font-bold text-teal-900 touch-manipulation hover:bg-white sm:flex-none"
              >
                Open Six
              </Link>
              <Link
                href={sixFeynmanHref(courseId, topic || "this page", materialId)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-violet-300 bg-white/80 px-3 py-2 text-[11px] font-bold text-violet-900 touch-manipulation hover:bg-white sm:flex-none"
              >
                Feynman
              </Link>
              <Link
                href={blurtingHref(courseId, materialId, topic || undefined)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-orange-300 bg-white/80 px-3 py-2 text-[11px] font-bold text-orange-900 touch-manipulation hover:bg-white sm:flex-none"
              >
                Blurt
              </Link>
            </>
          ) : null}
        </div>
      </div>

      {pages.length > 0 ? (
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Target sheet
          </span>
          <select
            value={targetPageId}
            onChange={(event) => setTargetPageId(event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800"
          >
            <option value={ALL_SHEETS_TARGET}>All sheets</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.label || `Page ${page.pageNumber}`}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-stone-500">
            All sheets uses every page as source. A single sheet inserts onto that page.
          </p>
        </label>
      ) : null}

      <div className="grid gap-2">
        {STUDIO_ITEMS.map((item) => (
          <button
            key={item.type}
            type="button"
            disabled={Boolean(loadingType)}
            onClick={() => void generate(item.type)}
            className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition hover:border-orange-200 hover:bg-orange-50/50 disabled:opacity-60 ${
            item.type === "chapter-study" || item.type === "study-guide"
              ? "border-teal-200 bg-teal-50/40"
              : "border-stone-100 bg-white"
            }`}
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-stone-800">{item.label}</span>
              <span className="block text-[10px] text-stone-500">{item.description}</span>
            </span>
            {loadingType === item.type ? (
              <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-orange-500" />
            ) : (
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-stone-300" />
            )}
          </button>
        ))}
      </div>

      {pendingChapter ? (
        <div className="space-y-2 rounded-2xl border border-teal-200 bg-teal-50/50 p-3">
          <p className="text-xs font-bold text-teal-900">{pendingChapter.title}</p>
          <p className="text-[10px] text-teal-800">
            {(pendingChapter.structured.learningObjectives?.length ?? 0)} LOs ·{" "}
            {(pendingChapter.structured.definitions?.length ?? 0)} definitions ·{" "}
            {(pendingChapter.structured.frameworks?.length ?? 0)} frameworks ·{" "}
            {(pendingChapter.structured.comparisons?.length ?? 0)} comparisons ·{" "}
            {(pendingChapter.structured.processesOrSteps?.length ?? 0)} processes ·{" "}
            {(pendingChapter.structured.workedExamples?.length ?? 0)} walkthroughs ·{" "}
            {(pendingChapter.structured.testYourself?.length ?? 0)} test items
          </p>
          {formatExtractCoverageLines(pendingChapter.structured).map((line) => (
            <p key={line} className="text-[10px] text-teal-700/90">
              {line}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={insertChapterStudy}
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white touch-manipulation"
            >
              Insert into notebook
            </button>
            {courseId ? (
              <button
                type="button"
                disabled={quizLoading}
                onClick={() => {
                  if (!pendingChapter) return;
                  setQuizLoading(true);
                  setError(null);
                  void fetch("/api/quizzes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      courseId,
                      materialId: materialId || undefined,
                      extract: pendingChapter.structured,
                      questionCount: 30,
                    }),
                  })
                    .then(async (response) => {
                      const data = await response.json();
                      if (!data.success || !data.data?.id) {
                        throw new Error(data.error ?? "Could not build Lucky quiz.");
                      }
                      setImportMessage("Lucky quiz ready — opening…");
                      window.location.href = `/quizzes/${data.data.id}`;
                    })
                    .catch((err) => {
                      setError(
                        friendlyUserFacingAiError(err, "Could not build Lucky quiz from chapter."),
                      );
                    })
                    .finally(() => setQuizLoading(false));
                }}
                className="inline-flex min-h-11 items-center rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white touch-manipulation disabled:opacity-60"
              >
                {quizLoading ? "Quiz…" : "Lucky quiz from chapter"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setPendingChapter(null)}
              className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-800 touch-manipulation"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {flashcardDeck ? (
        <div className="space-y-2 rounded-2xl border border-orange-100 bg-orange-50/40 p-3">
          <p className="text-xs font-semibold text-stone-800">
            {flashcardDeck.cards.length} cards ready
          </p>
          {flashcardPrompt ? (
            <div className="space-y-2 rounded-xl border border-orange-200 bg-white p-3">
              <p className="text-xs font-semibold text-stone-800">Where do you want to practice?</p>
              <button
                type="button"
                onClick={() => {
                  onPracticeFlashcardsInCore?.(flashcardDeck);
                  setFlashcardPrompt(false);
                }}
                className="flex w-full min-h-11 items-center justify-center rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white touch-manipulation"
              >
                Practice in Core (split)
              </button>
              <Link
                href={
                  courseId
                    ? `/flashcards?courseId=${encodeURIComponent(courseId)}`
                    : "/flashcards"
                }
                className="flex w-full min-h-11 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900 touch-manipulation"
              >
                Open Flashcards screen
              </Link>
              <button
                type="button"
                onClick={() => setFlashcardPrompt(false)}
                className="w-full text-[10px] font-semibold text-stone-500 touch-manipulation hover:underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <button
            type="button"
            disabled={importing}
            onClick={() => void importToLucky()}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 touch-manipulation"
          >
            {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Add to Lucky / SIX
          </button>
          {!flashcardPrompt ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onPracticeFlashcardsInCore?.(flashcardDeck);
                }}
                className="min-h-11 text-[10px] font-semibold text-orange-800 touch-manipulation hover:underline"
              >
                Practice in Core →
              </button>
              <Link
                href={
                  courseId
                    ? `/flashcards?courseId=${encodeURIComponent(courseId)}`
                    : "/flashcards"
                }
                className="min-h-11 text-[10px] font-semibold text-teal-700 touch-manipulation"
              >
                Open Flashcards →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2 rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          From this notebook
        </p>
        <p className="text-[10px] text-stone-500">
          {usingAllSheets
            ? "Study all sheets builds a guide from every page, then you can Quiz."
            : "Study this page builds a guide from the selected sheet, then you can Quiz."}{" "}
          FAQ and flashcards stay in Locker.
        </p>
        {onStudyThisPage ? (
          <button
            type="button"
            disabled={studyingPage || Boolean(loadingType)}
            onClick={() => {
              if (selectedSourceText.length < 40 && !courseId && !materialId) {
                setError(
                  usingAllSheets
                    ? "Add text on your sheets (or pick a course/material) before Study all sheets."
                    : "Add text on this sheet (or pick a course/material) before Study this page.",
                );
                return;
              }
              setStudyingPage(true);
              setError(null);
              void Promise.resolve(onStudyThisPage(targetPageId))
                .then(() => {
                  setImportMessage(
                    usingAllSheets
                      ? "Study guide laid out from all sheets. Original material stays in Locker."
                      : "Study guide laid out as editable Core blocks. Original material stays in Locker.",
                  );
                })
                .catch((err) => {
                  setError(friendlyUserFacingAiError(err, `Could not ${studyLabel.toLowerCase()}.`));
                })
                .finally(() => setStudyingPage(false));
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-teal-200 bg-white px-3 py-2 text-left text-xs font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-60"
          >
            {studyingPage ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {studyLabel}
          </button>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
            {onInsertPractice ? (
              <button
                type="button"
                onClick={() => {
                  const ok = onInsertPractice();
                  setImportMessage(
                    ok
                      ? "Practice questions added as an editable Q&A block."
                      : `Create a study guide first (${studyLabel}).`,
                  );
                }}
                className="rounded-xl border border-stone-200 bg-white px-2 py-2 text-[11px] font-semibold text-stone-800 hover:bg-stone-50"
              >
                Practice
              </button>
            ) : null}
            {onInsertExplanations ? (
              <button
                type="button"
                onClick={() => {
                  const ok = onInsertExplanations();
                  setImportMessage(
                    ok
                      ? "Explanations added as editable Core objects."
                      : `Create a study guide first (${studyLabel}).`,
                  );
                }}
                className="rounded-xl border border-stone-200 bg-white px-2 py-2 text-[11px] font-semibold text-stone-800 hover:bg-stone-50"
              >
                Explanations
              </button>
            ) : null}
            {onInsertLearningPlan ? (
              <button
                type="button"
                onClick={() => {
                  const ok = onInsertLearningPlan();
                  setImportMessage(
                    ok
                      ? "Learning plan added as an editable sequence."
                      : `Create a study guide first (${studyLabel}).`,
                  );
                }}
                className="rounded-xl border border-stone-200 bg-white px-2 py-2 text-[11px] font-semibold text-stone-800 hover:bg-stone-50"
              >
                Learning plan
              </button>
            ) : null}
            {onGenerateQuiz ? (
              <button
                type="button"
                disabled={quizLoading}
                onClick={() => {
                  if (!courseId) {
                    setError("Select a course in the Core header, then tap Quiz.");
                    return;
                  }
                  setQuizLoading(true);
                  setError(null);
                  void Promise.resolve(onGenerateQuiz())
                    .then(() => {
                      setImportMessage("Quiz created — opening Lucky…");
                    })
                    .catch((err) => {
                      setError(friendlyUserFacingAiError(err, studyHint));
                    })
                    .finally(() => setQuizLoading(false));
                }}
                className="rounded-xl border border-violet-200 bg-violet-50 px-2 py-2 text-[11px] font-semibold text-violet-950 hover:bg-violet-100 disabled:opacity-60"
              >
                {quizLoading ? "Quiz…" : "Quiz"}
              </button>
            ) : null}
        </div>
        {!hasStudyExtract ? (
          <p className="text-[10px] text-stone-500">
            Quiz uses notebook text and course materials. Optional: <strong>{studyLabel}</strong> first for a richer bank.
          </p>
        ) : null}
      </div>

      {importMessage ? <p className="text-[10px] font-medium text-teal-700">{importMessage}</p> : null}
      {error ? (
        <p className="text-[10px] font-medium text-rose-600">
          {friendlyUserFacingAiError(error, studyHint)}
        </p>
      ) : null}
    </div>
  );
}
