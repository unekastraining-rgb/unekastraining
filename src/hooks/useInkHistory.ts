"use client";

import { useCallback, useState } from "react";

import type { SketchStroke } from "@/lib/core/note-types";

interface InkHistoryState {
  strokes: SketchStroke[];
  past: SketchStroke[][];
  future: SketchStroke[][];
}

export function useInkHistory(initial: SketchStroke[] = []) {
  const [state, setState] = useState<InkHistoryState>({
    strokes: initial,
    past: [],
    future: [],
  });

  const commit = useCallback((next: SketchStroke[]) => {
    setState((current) => ({
      strokes: next,
      past: [...current.past, current.strokes],
      future: [],
    }));
  }, []);

  const replaceStrokes = useCallback((next: SketchStroke[]) => {
    setState({
      strokes: next,
      past: [],
      future: [],
    });
  }, []);

  const undo = useCallback(() => {
    setState((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) return current;
      return {
        strokes: previous,
        past: current.past.slice(0, -1),
        future: [current.strokes, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((current) => {
      const next = current.future[0];
      if (!next) return current;
      return {
        strokes: next,
        past: [...current.past, current.strokes],
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    strokes: state.strokes,
    setStrokes: commit,
    replaceStrokes,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
