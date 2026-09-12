import Link from "next/link";
import { trendingHashtags } from "@/lib/services/posts";

/** Серверный компонент: популярные хэштеги. Обращается к сервисному слою напрямую. */
export async function Trending() {
  const tags = await trendingHashtags(8);
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Тренды:</span>
      {tags.map(({ tag, count }) => (
        <Link
          key={tag}
          href={`/search?q=${encodeURIComponent(tag)}`}
          className="rounded-full border border-border bg-surface px-3 py-1 text-accent transition-colors hover:bg-surface-2"
        >
          {tag} <span className="text-muted">{count}</span>
        </Link>
      ))}
    </div>
  );
}
