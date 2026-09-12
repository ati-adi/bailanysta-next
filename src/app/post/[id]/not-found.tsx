import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return <EmptyState title="Пост не найден" description="Возможно, автор его удалил." action={<Link href="/" className="text-accent hover:underline">В ленту</Link>} />;
}
