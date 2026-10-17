/**
 * Domain validators — barrel export
 */

export {
  loginSchema,
  registerSchema,
  editProfileSchema,
  usernameSchema,
  emailSchema,
  passwordSchema,
  type LoginInput,
  type RegisterInput,
  type EditProfileInput,
} from "./user";

export {
  createPostSchema,
  createCommentSchema,
  captionSchema,
  type CreatePostInput,
  type CreateCommentInput,
} from "./post";
