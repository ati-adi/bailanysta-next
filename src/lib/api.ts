import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { ValidationError } from "./services/users";

/** Единый формат ответов API и маппинг доменных ошибок в HTTP-статусы. */

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError("Некорректный JSON в теле запроса");
  }
}

type Handler<Ctx> = (request: Request, ctx: Ctx) => Promise<NextResponse>;

/** Оборачивает обработчик: превращает известные ошибки в ответы со статусом, остальное — в 500. */
export function withErrors<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (err) {
      if (err instanceof AuthError) return fail(err.message, 401);
      if (err instanceof ValidationError) return fail(err.message, err.status);
      console.error("[api]", err);
      return fail("Внутренняя ошибка сервера", 500);
    }
  };
}
