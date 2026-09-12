import { randomBytes } from "node:crypto";

/** Короткий сортируемый по времени идентификатор: timestamp(base36) + случайный хвост. */
export function newId(): string {
  return Date.now().toString(36) + randomBytes(6).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}
