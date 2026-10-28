import { HttpStatus } from "@nestjs/common";
import type { Paginated } from "@ig/shared";
import { AppError } from "../errors/app-error";

/** Position in a list ordered by (createdAt DESC, id DESC) */
export interface Cursor {
  createdAt: Date;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify([cursor.createdAt.toISOString(), cursor.id])).toString("base64url");
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const [createdAt, id] = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as [string, string];
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime()) || typeof id !== "string") throw new Error("bad cursor");
    return { createdAt: date, id };
  } catch {
    throw new AppError("INVALID_CURSOR", "Invalid pagination cursor", HttpStatus.BAD_REQUEST);
  }
}

/**
 * Callers fetch `limit + 1` rows: the extra row only tells whether another page exists.
 */
export function toPage<Row, Item>(
  rows: Row[],
  limit: number,
  cursorOf: (row: Row) => Cursor,
  map: (rows: Row[]) => Item[]
): Paginated<Item> {
  const pageRows = rows.slice(0, limit);
  const last = pageRows[pageRows.length - 1];
  return {
    items: map(pageRows),
    nextCursor: rows.length > limit && last ? encodeCursor(cursorOf(last)) : null,
  };
}
