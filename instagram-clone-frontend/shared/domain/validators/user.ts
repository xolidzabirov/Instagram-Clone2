/**
 * User validation schemas — shared between frontend forms and API
 * Uses Zod for type-safe runtime validation
 */

import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Минимум 3 символа")
  .max(30, "Максимум 30 символов")
  .regex(
    /^[a-zA-Z0-9._]+$/,
    "Только буквы, цифры, точки и подчёркивания"
  );

export const emailSchema = z
  .string()
  .email("Неверный формат email");

export const passwordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(128, "Максимум 128 символов")
  .regex(/[A-Z]/, "Нужна хотя бы одна заглавная буква")
  .regex(/[0-9]/, "Нужна хотя бы одна цифра");

export const loginSchema = z.object({
  login: z.string().min(1, "Введите username или email"),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    fullName: z.string().min(2, "Минимум 2 символа").max(64),
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const editProfileSchema = z.object({
  fullName: z.string().min(2).max(64),
  username: usernameSchema,
  bio: z.string().max(150, "Максимум 150 символов").optional(),
  website: z.string().url("Неверный URL").optional().or(z.literal("")),
  email: emailSchema,
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Неверный формат телефона")
    .optional()
    .or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EditProfileInput = z.infer<typeof editProfileSchema>;
