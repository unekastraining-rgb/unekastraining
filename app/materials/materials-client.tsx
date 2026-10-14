"use client";

import { useState } from "react";
import Link from "next/link";

type Hit = {
  id: string;
  title: string;
  type: string;
  courseId: string;
  courseTitle: string;
  excerpt: string | null;
  matchedOn: string;
};

export function MaterialsClientSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function runSearch() {
    const query = q.trim();
    if (query.length < 2) {
      setHits(null);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/materials?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { success?: boolean; materials?: Hit[] };
      setHits(data.materials ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2" data-materials-search>
      <div className="flex gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSearch();
          }}
          placeholder="Search materials…"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          data-materials-search-input
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={busy}
          className="rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Search"}
        </button>
      </div>
      {hits ? (
        <ul className="space-y-1 text-sm" data-materials-search-results>
          {hits.length === 0 ? (
            <li className="text-xs text-stone-500">No matches.</li>
          ) : (
            hits.map((hit) => (
              <li key={hit.id}>
                <Link
                  href={`/materials#${hit.id}`}
                  className="font-medium text-stone-900 underline-offset-2 hover:underline"
                >
                  {hit.title}
                </Link>
                <span className="text-xs text-stone-500"> · {hit.courseTitle}</span>
                {hit.excerpt ? (
                  <p className="text-xs text-stone-500 line-clamp-2">{hit.excerpt}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
