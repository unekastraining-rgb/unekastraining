"use client";

import Link from "next/link";

export type CatalogItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  meta?: string;
};

/**
 * Shared catalog stage for Games / Practice / Six destinations.
 * Split: rail of groups + launch stage (not a centered card dump).
 */
export function CapabilityCatalogView({
  eyebrow,
  title,
  description,
  items,
  emptyLabel = "Nothing available yet.",
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: CatalogItem[];
  emptyLabel?: string;
}) {
  return (
    <div
      className="grid min-h-[70vh] gap-0 lg:grid-cols-[minmax(0,16rem)_1fr]"
      data-capability-catalog
    >
      <aside className="border-b border-stone-200 bg-stone-50/80 px-4 py-6 lg:border-b-0 lg:border-r">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">{title}</h1>
        <p className="mt-2 text-sm text-stone-600">{description}</p>
        <p className="mt-4 text-xs text-stone-500">
          {items.length} available
        </p>
      </aside>
      <main className="px-4 py-6 sm:px-6">
        {items.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-10"
            data-catalog-empty
          >
            <p className="text-sm font-semibold text-stone-800">{emptyLabel}</p>
            <p className="mt-2 text-sm text-stone-600">
              Open Learning Studio to build a lesson first, or return to the Hub
              and pick another study tool.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/study/teach-me"
                className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white touch-manipulation"
              >
                Open Learning Studio
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 touch-manipulation"
              >
                Back to Hub
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  data-catalog-item={item.id}
                  className="flex min-h-[7.5rem] flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md touch-manipulation"
                >
                  <div>
                    <p className="font-semibold text-stone-900">{item.title}</p>
                    <p className="mt-1 text-sm text-stone-600 line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                  {item.meta ? (
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                      {item.meta}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
