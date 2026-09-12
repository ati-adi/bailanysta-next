import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return <EmptyState title="Страница не найдена" action={<Link href="/" className="text-accent hover:underline">На главную</Link>} />;
}
