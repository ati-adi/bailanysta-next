"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SearchBar({ compact = false, autoFocus = false }: { compact?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} role="search" className={compact ? "hidden md:block" : "w-full"}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск постов, #хэштегов, людей"
        autoFocus={autoFocus}
        aria-label="Поиск"
        className={`rounded-full border border-border bg-surface-2 px-4 text-sm outline-none placeholder:text-muted focus:border-accent ${
          compact ? "h-9 w-56" : "h-11 w-full"
        }`}
      />
    </form>
  );
}
