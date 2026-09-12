import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      title="Пользователь не найден"
      description="Возможно, он сменил логин или его никогда не было."
      action={<Link href="/" className="text-accent hover:underline">На главную</Link>}
    />
  );
}
