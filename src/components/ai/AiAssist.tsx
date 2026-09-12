"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { api } from "@/lib/api-client";

type Tone = "casual" | "professional" | "funny";
const TONES: Array<{ value: Tone; label: string }> = [
  { value: "casual", label: "Дружелюбно" },
  { value: "professional", label: "По делу" },
  { value: "funny", label: "С юмором" },
];

/** Панель «Сгенерировать с AI»: тема + тон → текст подставляется в композер. */
export function AiAssist({ onResult }: { onResult: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("casual");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setNote(null);
    try {
      const res = await api.post<{ text: string; source: "claude" | "fallback" }>("/api/ai/generate", { topic, tone });
      onResult(res.text);
      setNote(res.source === "claude" ? "Сгенерировано Claude" : "AI-ключ не настроен — использован офлайн-шаблон");
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
        </svg>
        Помощь AI
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-xl border border-border bg-surface-2 p-3">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="О чём написать? Например: утренняя пробежка" maxLength={200} />
          <div className="flex flex-wrap items-center gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tone === t.value ? "border-accent bg-accent text-white" : "border-border bg-surface text-muted hover:text-text"
                }`}
              >
                {t.label}
              </button>
            ))}
            <Button size="sm" className="ml-auto" onClick={generate} loading={busy} disabled={topic.trim().length < 2}>
              Сгенерировать
            </Button>
          </div>
          {note && <p className="text-xs text-muted">{note}</p>}
        </div>
      )}
    </div>
  );
}
