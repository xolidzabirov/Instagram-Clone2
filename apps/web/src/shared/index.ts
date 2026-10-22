export type {
  User,
  UserPreview,
  CurrentUser,
  Post,
  PostImage,
  PostPreview,
  FeedItem,
  Comment,
  Story,
  StoryItem,
  StoryRing,
  Notification,
  NotificationType,
} from "@ig/shared";

export {
  loginSchema,
  registerSchema,
  editProfileSchema,
  usernameSchema,
  emailSchema,
  passwordSchema,
  createPostSchema,
  createCommentSchema,
  captionSchema,
  type LoginInput,
  type RegisterInput,
  type EditProfileInput,
  type CreatePostInput,
  type CreateCommentInput,
} from "@ig/shared";

export * from "@/shared/lib/apiClient";
export * from "@/shared/lib/queryClient";
export * from "@/shared/lib/utils";
