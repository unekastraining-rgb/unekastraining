/**
 * Shared multi-select helpers for list delete UX.
 */

import { useCallback, useMemo, useState } from "react";

export function useSelectableIds(allIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedCount = selected.size;
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selectedCount > 0 && !allSelected;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(allIds));
  }, [allIds]);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (allIds.length > 0 && allIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, [allIds]);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  /** Drop ids that are no longer in the list (after delete/refresh). */
  const pruneTo = useCallback((ids: string[]) => {
    const allowed = new Set(ids);
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
      }
      return next;
    });
  }, []);

  return {
    selectedIds,
    selectedCount,
    allSelected,
    someSelected,
    toggle,
    selectAll,
    clear,
    toggleAll,
    isSelected,
    pruneTo,
  };
}
