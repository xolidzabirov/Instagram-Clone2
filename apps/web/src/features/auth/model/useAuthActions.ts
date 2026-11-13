"use client";

import type { LoginInput, RegisterRequest } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config";
import { sessionApi, useSessionStore } from "@/entities/session";
import { nextPath } from "./errors";

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: LoginInput) => sessionApi.login(input),
    onSuccess: (auth) => {
      useSessionStore.getState().setSession(auth);
      router.replace(nextPath());
    },
  });
}

/** Creates the account and signs in right away; the email can be confirmed later */
export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: RegisterRequest) => sessionApi.register(input),
    onSuccess: (auth) => {
      useSessionStore.getState().setSession(auth);
      router.replace(ROUTES.home);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    // Even if the API is unreachable the user is signed out locally
    mutationFn: () => sessionApi.logout().catch(() => undefined),
    onSettled: () => {
      useSessionStore.getState().clear();
      // Another account must never see this account's cached data
      queryClient.clear();
      router.replace(ROUTES.login);
    },
  });
}
