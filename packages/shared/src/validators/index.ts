/**
 * Domain validators — barrel export
 */

export * from "./user";

export {
  createPostSchema,
  createCommentSchema,
  captionSchema,
  type CreatePostInput,
  type CreateCommentInput,
} from "./post";
