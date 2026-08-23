import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";

import { SearchView } from "./search-view";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#fff8f1] text-stone-900">
      <HubBackBar title="Search" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading search…</div>}>
        <SearchView />
      </Suspense>
    </div>
  );
}
