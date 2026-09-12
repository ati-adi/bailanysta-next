import { withErrors, ok, fail, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { generatePost, isAiConfigured, type AiTone } from "@/lib/services/ai";

const TONES: AiTone[] = ["casual", "professional", "funny"];

/** POST /api/ai/generate { topic, tone } — вызывает Claude API только с сервера. */
export const POST = withErrors(async (request) => {
  const user = await requireUser();
  const body = await readJson<{ topic?: string; tone?: string }>(request);
  const topic = (body.topic ?? "").trim();
  if (topic.length < 2 || topic.length > 200) return fail("Тема: от 2 до 200 символов", 400);
  const tone = TONES.includes(body.tone as AiTone) ? (body.tone as AiTone) : "casual";
  const result = await generatePost({ topic, tone, authorName: user.displayName });
  return ok({ ...result, configured: isAiConfigured() });
});
