/**
 * User validation schemas — shared between frontend forms and API
 * Uses Zod for type-safe runtime validation
 */

import { z } from "zod";

/** Top-level web routes: a profile at /{username} must never shadow them */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  "about", "accounts", "api", "direct", "explore", "help", "instagram", "login", "map",
  "notifications", "p", "privacy", "register", "reels", "settings", "stories", "suggestions",
  "terms",
]);

/** Usernames are case-insensitive: everything is stored lower-cased */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Минимум 3 символа")
  .max(30, "Максимум 30 символов")
  .regex(/^[a-z0-9._]+$/, "Только буквы, цифры, точки и подчёркивания")
  .refine((username) => !RESERVED_USERNAMES.has(username), "Это имя пользователя недоступно");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Слишком длинный email")
  .pipe(z.email("Неверный формат email"));

export const passwordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(128, "Максимум 128 символов")
  .regex(/[A-Z]/, "Нужна хотя бы одна заглавная буква")
  .regex(/[0-9]/, "Нужна хотя бы одна цифра");

export const verificationCodeSchema = z.string().regex(/^\d{6}$/, "Код состоит из 6 цифр");

export const loginSchema = z.object({
  /** username or email */
  login: z.string().trim().toLowerCase().min(1, "Введите username или email").max(254),
  password: z.string().min(1, "Введите пароль").max(128),
});

/** Body of POST /auth/register */
export const registerRequestSchema = z.object({
  email: emailSchema,
  fullName: z.string().trim().min(1, "Введите имя").max(64, "Максимум 64 символа"),
  username: usernameSchema,
  password: passwordSchema,
});

/** Registration form: the request plus password confirmation */
export const registerSchema = registerRequestSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({ code: verificationCodeSchema });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: verificationCodeSchema,
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль").max(128),
  newPassword: passwordSchema,
});

/** Mobile clients send the refresh token in the body; web relies on the cookie */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).max(512).optional(),
});

export const usernameAvailabilityQuerySchema = z.object({
  username: z.string().max(100),
});

export const profileLinkSchema = z.object({
  title: z.string().trim().max(30, "Максимум 30 символов").default(""),
  url: z.url({ protocol: /^https?$/, error: "Неверный URL" }).max(2048),
});

/** PATCH /users/me — every field is optional, only sent fields change */
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().max(64, "Максимум 64 символа"),
    username: usernameSchema,
    bio: z.string().max(150, "Максимум 150 символов"),
    links: z.array(profileLinkSchema).max(5, "Максимум 5 ссылок"),
    gender: z.string().trim().max(32).nullable(),
    pronouns: z.string().trim().max(32).nullable(),
    isPrivate: z.boolean(),
    language: z.enum(["ru", "en"]),
  })
  .partial()
  .strict();

/** PATCH /users/:id/relationship — settings of an existing follow */
export const relationshipUpdateSchema = z
  .object({
    isFavorite: z.boolean(),
    mutedPosts: z.boolean(),
    mutedStories: z.boolean(),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

/** PUT /users/me/avatar */
export const setAvatarSchema = z.object({ mediaId: z.uuid() });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RelationshipUpdateInput = z.infer<typeof relationshipUpdateSchema>;
export type SetAvatarInput = z.infer<typeof setAvatarSchema>;
