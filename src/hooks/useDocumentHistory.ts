"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 80;
const COALESCE_MS = 450;

export type SetDocOptions = {
  /** When false, update present without pushing history (mirrors / external sync). */
  history?: boolean;
};

/**
 * Document undo/redo. The first edit in a burst pushes the prior snapshot to
 * `past` immediately (so Undo works right away). Further edits within
 * COALESCE_MS update present only (one undo step for a drag).
 */
export function useDocumentHistory<T>(initial: T) {
  const [state, setState] = useState(() => ({
    present: initial,
    past: [] as T[],
    future: [] as T[],
    coalescing: false,
  }));

  const coalesceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const replaceDoc = useCallback((next: T) => {
    if (coalesceTimer.current) {
      clearTimeout(coalesceTimer.current);
      coalesceTimer.current = null;
    }
    setState({ present: next, past: [], future: [], coalescing: false });
  }, []);

  const setDoc = useCallback(
    (updater: T | ((current: T) => T), options?: SetDocOptions) => {
      const trackHistory = options?.history !== false;

      setState((current) => {
        const next =
          typeof updater === "function"
            ? (updater as (current: T) => T)(current.present)
            : updater;
        if (Object.is(next, current.present)) return current;

        if (!trackHistory) {
          return { ...current, present: next };
        }

        if (current.coalescing) {
          return { ...current, present: next, future: [] };
        }

        if (coalesceTimer.current) clearTimeout(coalesceTimer.current);
        coalesceTimer.current = setTimeout(() => {
          coalesceTimer.current = null;
          setState((latest) =>
            latest.coalescing ? { ...latest, coalescing: false } : latest,
          );
        }, COALESCE_MS);

        return {
          present: next,
          past: [...current.past.slice(-(MAX_HISTORY - 1)), current.present],
          future: [],
          coalescing: true,
        };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    if (coalesceTimer.current) {
      clearTimeout(coalesceTimer.current);
      coalesceTimer.current = null;
    }
    setState((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) {
        return current.coalescing ? { ...current, coalescing: false } : current;
      }
      return {
        present: previous,
        past: current.past.slice(0, -1),
        future: [current.present, ...current.future].slice(0, MAX_HISTORY),
        coalescing: false,
      };
    });
  }, []);

  const redo = useCallback(() => {
    if (coalesceTimer.current) {
      clearTimeout(coalesceTimer.current);
      coalesceTimer.current = null;
    }
    setState((current) => {
      const next = current.future[0];
      if (!next) return current;
      return {
        present: next,
        past: [...current.past.slice(-(MAX_HISTORY - 1)), current.present],
        future: current.future.slice(1),
        coalescing: false,
      };
    });
  }, []);

  return {
    doc: state.present,
    setDoc,
    replaceDoc,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
