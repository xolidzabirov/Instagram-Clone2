"use client";

import { useState } from "react";
import { registerSchema, type RegisterInput } from "@ig/shared";
import { useAuth } from "../model/useAuth";

export function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(result.data);
    } catch {
      setErrors({ email: "Ошибка регистрации. Попробуйте другой email." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <input
        type="email"
        placeholder="Эл. адрес"
        value={form.email}
        onChange={update("email")}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm focus:outline-none focus:border-zinc-400"
      />
      {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}

      <input
        type="text"
        placeholder="Имя и фамилия"
        value={form.fullName}
        onChange={update("fullName")}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm focus:outline-none focus:border-zinc-400"
      />
      {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}

      <input
        type="text"
        placeholder="Имя пользователя"
        value={form.username}
        onChange={update("username")}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm focus:outline-none focus:border-zinc-400"
      />
      {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}

      <input
        type="password"
        placeholder="Пароль"
        value={form.password}
        onChange={update("password")}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm focus:outline-none focus:border-zinc-400"
      />
      {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

      <input
        type="password"
        placeholder="Подтвердите пароль"
        value={form.confirmPassword}
        onChange={update("confirmPassword")}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm focus:outline-none focus:border-zinc-400"
      />
      {errors.confirmPassword && (
        <p className="text-xs text-red-500">{errors.confirmPassword}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-1.5 mt-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
      </button>
    </form>
  );
}
