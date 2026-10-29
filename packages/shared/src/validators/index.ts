/**
 * Domain validators — barrel export
 */

export * from "./common";
export * from "./media";
export * from "./user";

export {
  createPostSchema,
  createCommentSchema,
  captionSchema,
  type CreatePostInput,
  type CreateCommentInput,
} from "./post";
