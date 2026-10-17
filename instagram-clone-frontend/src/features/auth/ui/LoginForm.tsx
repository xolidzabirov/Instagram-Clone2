"use client";

import { useState } from "react";
import { loginSchema, type LoginInput } from "@/shared/domain/validators";
import { useAuth } from "../model/useAuth";

export function LoginForm() {
  const { login } = useAuth();
  const [form, setForm] = useState<LoginInput>({ login: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(form);
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
      await login(result.data);
    } catch {
      setErrors({ login: "Неверный логин или пароль" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <input
        type="text"
        placeholder="Телефон, имя пользователя или эл. адрес"
        value={form.login}
        onChange={(e) => setForm({ ...form, login: e.target.value })}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm focus:outline-none focus:border-zinc-400"
      />
      {errors.login && (
        <p className="text-xs text-red-500">{errors.login}</p>
      )}

      <input
        type="password"
        placeholder="Пароль"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm focus:outline-none focus:border-zinc-400"
      />
      {errors.password && (
        <p className="text-xs text-red-500">{errors.password}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !form.login || !form.password}
        className="w-full py-1.5 mt-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {isSubmitting ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}
