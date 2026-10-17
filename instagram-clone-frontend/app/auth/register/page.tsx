"use client";

import Link from "next/link";
import { RegisterForm } from "@/src/features/auth";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 py-8">
      <div className="flex flex-col gap-3 w-full max-w-[350px]">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center gap-4 rounded-sm">
          <h1 className="font-bold text-3xl tracking-tight">Instagram</h1>
          <p className="text-zinc-500 font-semibold text-center text-sm">
            Зарегистрируйтесь, чтобы смотреть фото и видео ваших друзей.
          </p>
          <RegisterForm />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 text-center rounded-sm">
          <p className="text-sm">
            Есть аккаунт?{" "}
            <Link href="/auth/login" className="text-blue-500 font-semibold hover:underline">
              Вход
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
