import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";

export const metadata: Metadata = { title: "Поиск" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return (
    <div className="space-y-4">
      <Suspense>
        <SearchBar autoFocus />
      </Suspense>
      <SearchResults key={q} query={q} />
    </div>
  );
}
