"use client";

import { useState, useEffect } from "react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/flashcards");
      const data = await res.json();
      if (data.success) {
        setCards(data.data);
      }
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (rating: string) => {
    // Here you would also send the spaced repetition score back to an API update route
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // loop back or handle session end
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-400 p-8">Loading review session...</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">No Flashcards Available</h1>
        <p className="text-zinc-400 mt-2">Generate cards from your notes or syllabus to start your review loop.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        <div className="flex justify-between items-center text-xs text-zinc-400">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>Spaced Repetition Active</span>
        </div>

        {/* Card Flip Container */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full h-80 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-zinc-700 transition-all shadow-xl relative select-none"
        >
          <span className="absolute top-4 left-4 text-[10px] tracking-wider uppercase text-indigo-400 font-semibold">
            {isFlipped ? "Answer" : "Question (Click to flip)"}
          </span>
          <p className="text-lg font-medium text-zinc-200">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        {/* Review Action Controls */}
        {isFlipped && (
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleNext("AGAIN")}
              className="py-3 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 text-rose-200 font-medium rounded-xl transition-colors text-sm"
            >
              Again
            </button>
            <button
              onClick={() => handleNext("GOOD")}
              className="py-3 bg-amber-950/40 border border-amber-900/50 hover:bg-amber-900/40 text-amber-200 font-medium rounded-xl transition-colors text-sm"
            >
              Good
            </button>
            <button
              onClick={() => handleNext("EASY")}
              className="py-3 bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 text-emerald-200 font-medium rounded-xl transition-colors text-sm"
            >
              Easy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}