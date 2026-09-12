import Link from "next/link";
import { HASHTAG_RE } from "@/lib/format";

/** Текст поста с кликабельными хэштегами (ведут в поиск). */
export function PostContent({ text }: { text: string }) {
  const parts = text.split(HASHTAG_RE);
  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <Link
            key={i}
            href={`/search?q=${encodeURIComponent(part)}`}
            className="font-medium text-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
