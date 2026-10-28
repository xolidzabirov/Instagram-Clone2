import { z } from "zod";

export const paginationSchema = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Pagination plus an optional search string, e.g. followers lists */
export const searchablePaginationSchema = paginationSchema.extend({
  q: z.string().trim().max(50).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchablePaginationInput = z.infer<typeof searchablePaginationSchema>;
