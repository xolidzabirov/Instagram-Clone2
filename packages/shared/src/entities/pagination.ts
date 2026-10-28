/** Cursor-paginated list: pass `nextCursor` back as `cursor` to get the next page */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
