import { Suspense } from "react";
import { ProfileFallback, ProfilePage } from "@/pages/profile";

// The username is only known at request time: the fallback is the prerendered shell
export default function Page() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfilePage tab="posts" />
    </Suspense>
  );
}
