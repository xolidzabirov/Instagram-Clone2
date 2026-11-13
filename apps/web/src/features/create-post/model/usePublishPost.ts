"use client";

import type { AspectRatio, Post, UserProfile } from "@ig/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { uploadMedia } from "@/shared/api";
import { useSessionStore } from "@/entities/session";
import { postApi, postKeys, prependToFeeds } from "@/entities/post";
import { userKeys } from "@/entities/user";
import { renderSlide } from "../lib/render";
import type { Slide } from "./types";

export interface PublishInput {
  slides: Slide[];
  aspect: number;
  aspectRatio: AspectRatio;
  isReel: boolean;
  caption: string;
  hideLikes: boolean;
  commentsDisabled: boolean;
}

/**
 * Renders every photo, uploads all media in parallel (progress 0..1 over the total bytes), then
 * creates the post and puts it on top of the feed and the profile without a reload.
 */
export function usePublishPost() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (input: PublishInput): Promise<Post> => {
      setProgress(0);
      const files = await Promise.all(input.slides.map((slide) => renderSlide(slide, input.aspect)));
      const total = files.reduce((sum, file) => sum + file.size, 0);
      const sent = files.map(() => 0);

      const media = await Promise.all(
        files.map((file, index) =>
          uploadMedia(file, input.isReel ? "REEL" : "POST", (fraction) => {
            sent[index] = fraction * file.size;
            // Uploading is ~90% of the wait; processing and publishing the rest
            setProgress((0.9 * sent.reduce((sum, value) => sum + value, 0)) / total);
          })
        )
      );

      const altTexts = Object.fromEntries(
        input.slides.flatMap((slide, index) => (slide.altText.trim() ? [[media[index]!.id, slide.altText.trim()]] : []))
      );
      const post = await postApi.create({
        type: input.isReel ? "REEL" : "POST",
        mediaIds: media.map((item) => item.id),
        aspectRatio: input.aspectRatio,
        caption: input.caption.trim(),
        locationId: null,
        tags: [],
        altTexts,
        hideLikes: input.hideLikes,
        commentsDisabled: input.commentsDisabled,
      });
      setProgress(1);
      return post;
    },
    onSuccess: (post) => {
      prependToFeeds(queryClient, post);
      const { user, setUser } = useSessionStore.getState();
      if (!user) return;
      setUser({ ...user, postsCount: user.postsCount + 1 });
      queryClient.setQueryData<UserProfile>(userKeys.profile(user.username), (profile) =>
        profile ? { ...profile, postsCount: profile.postsCount + 1 } : profile
      );
      void queryClient.invalidateQueries({ queryKey: postKeys.grids(user.username) });
    },
  });

  return { publish: mutation.mutate, progress, ...mutation };
}
