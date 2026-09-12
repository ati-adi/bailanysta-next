"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return <EmptyState title="Что-то пошло не так" description={error.message} action={<Button onClick={reset}>Попробовать снова</Button>} />;
}
