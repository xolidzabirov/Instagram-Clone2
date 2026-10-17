/**
 * Post validation schemas — shared between frontend and API
 */

import { z } from "zod";

export const captionSchema = z
  .string()
  .max(2200, "Максимум 2200 символов")
  .optional()
  .or(z.literal(""));

export const createPostSchema = z.object({
  images: z
    .array(
      z.object({
        file: z.instanceof(File).optional(),
        url: z.string().url().optional(),
        width: z.number().positive(),
        height: z.number().positive(),
        altText: z.string().max(200).optional(),
      })
    )
    .min(1, "Добавьте хотя бы одно фото")
    .max(10, "Максимум 10 фото"),
  caption: captionSchema,
  location: z.string().max(100).optional(),
  tags: z.array(z.string()).max(30, "Максимум 30 тегов").optional(),
  disableComments: z.boolean().optional(),
  hideLikesCount: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  text: z
    .string()
    .min(1, "Комментарий не может быть пустым")
    .max(1000, "Максимум 1000 символов"),
  parentId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
