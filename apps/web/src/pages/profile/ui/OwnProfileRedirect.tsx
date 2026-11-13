"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { profileRoute } from "@/shared/config";
import { useSession } from "@/entities/session";

/** `/profile` → `/{your username}` (the session is restored by the layout's SessionGate) */
export function OwnProfileRedirect() {
  const user = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(profileRoute(user.username));
  }, [user, router]);

  return null;
}
