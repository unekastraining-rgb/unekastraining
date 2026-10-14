"use client";

import type { GlobalSearchResult, SearchResultType } from "@/lib/search/global-search";
import { SEARCH_TYPE_EMOJI, SEARCH_TYPE_LABELS } from "@/lib/search/search-meta";

interface SearchResultsListProps {
  results: GlobalSearchResult[];
  activeIndex?: number;
  onSelect: (item: GlobalSearchResult) => void;
  grouped?: boolean;
  compact?: boolean;
}

function renderSearchItem(
  item: GlobalSearchResult,
  index: number,
  activeIndex: number,
  compact: boolean,
  onSelect: (item: GlobalSearchResult) => void,
) {
  const isActive = index === activeIndex;

  return (
    <li key={`${item.type}-${item.id}`}>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className={`flex w-full items-start gap-3 rounded-xl px-2 text-left transition ${
          compact ? "py-2.5" : "py-3"
        } ${isActive ? "bg-orange-100 ring-1 ring-orange-200" : "hover:bg-orange-50"}`}
      >
        <span className="text-base">{SEARCH_TYPE_EMOJI[item.type]}</span>
        <span className="min-w-0">
          <span className={`block truncate font-semibold text-stone-900 ${compact ? "text-sm" : "text-base"}`}>
            {item.title}
          </span>
          <span className={`block truncate text-stone-500 ${compact ? "text-xs" : "text-sm"}`}>
            {item.subtitle}
          </span>
        </span>
      </button>
    </li>
  );
}

export function SearchResultsList({
  results,
  activeIndex = -1,
  onSelect,
  grouped = true,
  compact = false,
}: SearchResultsListProps) {
  if (results.length === 0) return null;

  if (!grouped) {
    return (
      <ul>
        {results.map((item, index) =>
          renderSearchItem(item, index, activeIndex, compact, onSelect),
        )}
      </ul>
    );
  }

  const groupedResults = results.reduce<Record<string, GlobalSearchResult[]>>((acc, item) => {
    acc[item.type] = acc[item.type] ?? [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const sections = Object.entries(groupedResults).reduce<
    Array<{ type: string; items: Array<{ item: GlobalSearchResult; index: number }> }>
  >((acc, [type, items]) => {
    const startIndex = acc.length === 0 ? 0 : acc[acc.length - 1].items[acc[acc.length - 1].items.length - 1].index + 1;
    const withIndex = items.map((item, offset) => ({ item, index: startIndex + offset }));
    acc.push({ type, items: withIndex });
    return acc;
  }, []);

  return (
    <>
      {sections.map(({ type, items }) => (
        <div key={type} className="mb-2 last:mb-0">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {SEARCH_TYPE_LABELS[type as SearchResultType]}
          </p>
          <ul>
            {items.map(({ item, index }) =>
              renderSearchItem(item, index, activeIndex, compact, onSelect),
            )}
          </ul>
        </div>
      ))}
    </>
  );
}
