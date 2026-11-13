import { Suspense } from "react";
import { PostCardSkeleton } from "@/entities/post";
import { PostPage } from "@/pages/post";

// The post id is only known at request time: the skeleton is the prerendered shell
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[470px] md:pt-8">
          <PostCardSkeleton />
        </div>
      }
    >
      <PostPage />
    </Suspense>
  );
}
