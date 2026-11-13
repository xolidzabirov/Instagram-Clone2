"use client";

import { useState, type ReactNode } from "react";
import { useFormatCount, useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Avatar, ChevronDownIcon } from "@/shared/ui";
import type { Slide } from "../model/types";

const CAPTION_MAX = 2200;

export interface PostDetails {
  caption: string;
  hideLikes: boolean;
  commentsDisabled: boolean;
}

interface DetailsPanelProps {
  user: { username: string; avatar: string | null };
  slides: Slide[];
  details: PostDetails;
  onChange: (patch: Partial<PostDetails>) => void;
  onAltText: (id: string, text: string) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-separator">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn("flex h-12 w-full items-center justify-between px-4 text-base", open && "font-semibold")}
      >
        {title}
        <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function Toggle({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 py-2">
      <span className="flex items-center justify-between gap-4 text-base">
        {title}
        <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span
          aria-hidden
          className="relative h-6 w-10 shrink-0 rounded-full bg-stroke transition-colors peer-checked:bg-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-background after:shadow after:transition-[left] peer-checked:after:left-[18px]"
        />
      </span>
      <span className="text-xs text-muted">{text}</span>
    </label>
  );
}

/** Right side of the last step: caption, alt texts and advanced settings */
export function DetailsPanel({ user, slides, details, onChange, onAltText }: DetailsPanelProps) {
  const t = useTranslations("create");
  const formatCount = useFormatCount();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <Avatar src={user.avatar} alt="" size="xs" />
        <span className="text-sm font-semibold">{user.username}</span>
      </div>
      <div className="border-b border-separator px-4 pb-2">
        <textarea
          value={details.caption}
          onChange={(event) => onChange({ caption: event.target.value })}
          maxLength={CAPTION_MAX}
          rows={7}
          placeholder={t("captionPlaceholder")}
          aria-label={t("caption")}
          className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted"
        />
        <p className="text-right text-xs text-muted">
          {formatCount(details.caption.length)}/{formatCount(CAPTION_MAX)}
        </p>
      </div>

      {slides.some((slide) => slide.kind === "image") && (
        <Section title={t("accessibility")}>
          <p className="mb-4 text-xs text-muted">{t("accessibilityText")}</p>
          <div className="flex flex-col gap-3">
            {slides.map((slide) =>
              slide.kind === "image" ? (
                <div key={slide.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slide.url} alt="" className="size-11 shrink-0 object-cover" />
                  <input
                    value={slide.altText}
                    maxLength={200}
                    onChange={(event) => onAltText(slide.id, event.target.value)}
                    placeholder={t("altPlaceholder")}
                    aria-label={t("altPlaceholder")}
                    className="h-11 min-w-0 flex-1 rounded-md border border-separator bg-transparent px-3 text-sm outline-none focus:border-stroke"
                  />
                </div>
              ) : null
            )}
          </div>
        </Section>
      )}

      <Section title={t("advanced")}>
        <Toggle
          title={t("hideLikesTitle")}
          text={t("hideLikesText")}
          checked={details.hideLikes}
          onChange={(value) => onChange({ hideLikes: value })}
        />
        <Toggle
          title={t("commentsOffTitle")}
          text={t("commentsOffText")}
          checked={details.commentsDisabled}
          onChange={(value) => onChange({ commentsDisabled: value })}
        />
      </Section>
    </div>
  );
}
