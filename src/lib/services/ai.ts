import Anthropic from "@anthropic-ai/sdk";

/**
 * Генерация текста поста через Claude API.
 *
 * Внешний сервис вызывается ТОЛЬКО на сервере (Route Handler /api/ai/generate),
 * ключ никогда не попадает в браузер. Если ANTHROPIC_API_KEY не задан,
 * используется детерминированный офлайн-генератор, чтобы функция работала в демо.
 */

export type AiTone = "casual" | "professional" | "funny";

export interface GenerateInput {
  topic: string;
  tone: AiTone;
  authorName: string;
}

export interface GenerateResult {
  text: string;
  source: "claude" | "fallback";
}

const TONE_HINTS: Record<AiTone, string> = {
  casual: "дружелюбный, разговорный, живой",
  professional: "экспертный, спокойный, по делу",
  funny: "лёгкий, с юмором и самоиронией",
};

const SYSTEM_PROMPT = `Ты помогаешь пользователю социальной сети Bailanysta написать короткий пост.
Правила:
- Пиши на языке темы пользователя (обычно русский). Если тема на английском — отвечай по-английски.
- Длина: 1–3 предложения, не более 400 символов.
- В конце добавь 1–3 релевантных хэштега.
- Не используй markdown, заголовки, кавычки вокруг текста и вступления вроде «Вот ваш пост».
- Отвечай только текстом поста.`;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generatePost(input: GenerateInput): Promise<GenerateResult> {
  const anthropic = getClient();
  if (!anthropic) return { text: fallbackGenerate(input), source: "fallback" };

  const response = await anthropic.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    // Серверный fallback: если модель отклонит запрос по политике,
    // API сам повторит его на резервной модели в рамках того же вызова.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Автор: ${input.authorName}\nТон: ${TONE_HINTS[input.tone]}\nТема: ${input.topic}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return { text: fallbackGenerate(input), source: "fallback" };
  }
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
  if (!text) return { text: fallbackGenerate(input), source: "fallback" };
  return { text, source: "claude" };
}

/** Офлайн-заглушка: собирает правдоподобный пост из шаблонов. */
export function fallbackGenerate({ topic, tone }: GenerateInput): string {
  const clean = topic.trim().replace(/\s+/g, " ");
  const tag = "#" + clean.split(" ").slice(0, 2).join("").replace(/[^\p{L}\p{N}_]/gu, "").toLowerCase();
  const templates: Record<AiTone, string[]> = {
    casual: [
      `Сегодня думал(а) про ${clean}. Чем больше копаю, тем интереснее становится. Кто ещё в теме? ${tag}`,
      `${clean} — это то, о чём хочется поговорить. Делитесь опытом в комментариях! ${tag} #bailanysta`,
    ],
    professional: [
      `Краткая заметка про ${clean}: ключевое — системный подход и измеримые результаты. Подробнее расскажу в следующих постах. ${tag}`,
      `Разбираю тему «${clean}». Главный вывод: начинать стоит с основ и не пропускать этап проверки гипотез. ${tag} #заметки`,
    ],
    funny: [
      `Пытался(ась) разобраться в теме «${clean}». Разобрался(ась) примерно на 40%, остальные 60% — уверенность. ${tag} #жиза`,
      `${clean}: инструкция из трёх шагов. Шаг первый — открыть вкладку. Остальные два пока в разработке. ${tag}`,
    ],
  };
  const options = templates[tone];
  const index = [...clean].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % options.length;
  return options[index];
}
