"use client";

import Link from "next/link";
import { LoginForm } from "@/src/features/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="flex flex-col gap-3 w-full max-w-[350px]">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center gap-6 rounded-sm">
          <h1 className="font-bold text-3xl tracking-tight">Instagram</h1>
          <LoginForm />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 text-center rounded-sm">
          <p className="text-sm">
            У вас ещё нет аккаунта?{" "}
            <Link href="/auth/register" className="text-blue-500 font-semibold hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
