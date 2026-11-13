"use client";

import { usernameSchema, type UsernameAvailability } from "@ig/shared";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authApi } from "../api/authApi";

/** Checks a username while the user types (debounced), like Instagram's sign-up form */
export function useUsernameCheck(username: string) {
  const [debounced, setDebounced] = useState(username);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(username), 400);
    return () => clearTimeout(timer);
  }, [username]);

  const valid = usernameSchema.safeParse(debounced).success;
  const query = useQuery({
    queryKey: ["username-available", debounced.toLowerCase()],
    queryFn: ({ signal }) => authApi.usernameAvailable(debounced, signal),
    enabled: valid,
    staleTime: 30_000,
  });

  const settled = debounced === username;
  return {
    result: settled && valid ? (query.data as UsernameAvailability | undefined) : undefined,
    checking: !settled || query.isFetching,
  };
}
