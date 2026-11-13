"use client";

import type { AspectRatio } from "@ig/shared";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { ArrowLeftIcon, Button, CheckIcon, Modal, ModalAction, toast } from "@/shared/ui";
import { useSession } from "@/entities/session";
import { readFiles } from "../lib/render";
import { useCreatePostModal } from "../model/useCreatePostModal";
import { usePublishPost } from "../model/usePublishPost";
import { ASPECT_OPTIONS, REEL_ASPECT, type Slide, type Step } from "../model/types";
import { CropStep } from "./CropStep";
import { DetailsPanel, type PostDetails } from "./DetailsPanel";
import { EditPanel } from "./EditPanel";
import { SelectStep } from "./SelectStep";
import { SlideNav } from "./SlideNav";
import { SlideView } from "./SlideView";

const POST_VIDEO_MAX_S = 60;
const REEL_MAX_S = 180;

export function CreatePostModal() {
  const isOpen = useCreatePostModal((state) => state.isOpen);
  // Mounting per open gives every new post a fresh state
  return isOpen ? <CreatePostDialog /> : null;
}

/** The ratio Instagram picks for the first photo: wide → 16:9, about square → 1:1, else 4:5 */
function defaultRatio(slide: Slide): AspectRatio {
  const ratio = slide.width / slide.height;
  if (ratio > 1.3) return "LANDSCAPE";
  if (ratio > 0.9) return "SQUARE";
  return "PORTRAIT_4_5";
}

function CreatePostDialog() {
  const t = useTranslations("create");
  const common = useTranslations("common");
  const close = useCreatePostModal((state) => state.close);
  const user = useSession();
  const [step, setStep] = useState<Step>("select");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("PORTRAIT_4_5");
  const [details, setDetails] = useState<PostDetails>({ caption: "", hideLikes: false, commentsDisabled: false });
  const [confirm, setConfirm] = useState<"close" | "back" | null>(null);
  const publish = usePublishPost();

  // Object URLs live as long as the dialog
  const slidesRef = useRef(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);
  useEffect(() => () => slidesRef.current.forEach((slide) => URL.revokeObjectURL(slide.url)), []);

  const isReel = slides.length === 1 && slides[0]!.kind === "video" && slides[0]!.height > slides[0]!.width;
  const aspect = isReel ? REEL_ASPECT : ASPECT_OPTIONS.find((option) => option.ratio === aspectRatio)!.value;
  const slide = slides[Math.min(index, slides.length - 1)];

  const addFiles = async (files: File[]) => {
    const { slides: added, skipped } = await readFiles(files, 20 - slides.length);
    const all = [...slides, ...added];
    const reel = all.length === 1 && all[0]!.kind === "video" && all[0]!.height > all[0]!.width;
    const limit = reel ? REEL_MAX_S : POST_VIDEO_MAX_S;
    const fitting = added.filter((item) => item.durationMs === null || item.durationMs <= limit * 1000);
    added.filter((item) => !fitting.includes(item)).forEach((item) => URL.revokeObjectURL(item.url));

    if (fitting.length < added.length) toast.error(t("tooLong", { seconds: limit }));
    else if (skipped > 0) toast.error(t("unsupported"));
    if (fitting.length === 0) return;

    if (slides.length === 0) setAspectRatio(defaultRatio(fitting[0]!));
    setSlides((current) => [...current, ...fitting]);
    setIndex(slides.length);
    setStep("crop");
  };

  const updateSlide = (patch: Partial<Slide>) =>
    setSlides((current) => current.map((item, position) => (position === index ? { ...item, ...patch } : item)));

  const removeSlide = (id: string) => {
    const removed = slides.find((item) => item.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    const rest = slides.filter((item) => item.id !== id);
    setSlides(rest);
    setIndex((value) => Math.max(0, Math.min(value, rest.length - 1)));
    if (rest.length === 0) setStep("select");
  };

  const moveSlide = (from: number, to: number) => {
    setSlides((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
    setIndex(to);
  };

  const discard = () => {
    slides.forEach((item) => URL.revokeObjectURL(item.url));
    setSlides([]);
    setIndex(0);
    setStep("select");
  };

  const requestClose = () => {
    if (step === "sharing" && publish.isPending) return;
    if (slides.length > 0 && step !== "sharing") setConfirm("close");
    else close();
  };

  const goBack = () => {
    if (step === "crop") setConfirm("back");
    else if (step === "edit") setStep("crop");
    else if (step === "details") setStep("edit");
  };

  const share = () => {
    setStep("sharing");
    publish.publish({ slides, aspect, aspectRatio: isReel ? "VERTICAL_9_16" : aspectRatio, isReel, ...details });
  };

  const title =
    step === "select"
      ? t("title")
      : step === "crop"
        ? t("cropTitle")
        : step === "edit"
          ? t("editTitle")
          : step === "details"
            ? isReel
              ? t("reelTitle")
              : t("detailsTitle")
            : publish.isSuccess
              ? t("sharedTitle")
              : t("sharingTitle");

  const action =
    step === "crop" || step === "edit"
      ? { label: t("next"), onClick: () => setStep(step === "crop" ? "edit" : "details") }
      : step === "details"
        ? { label: t("share"), onClick: share }
        : null;

  const withPanel = step === "edit" || step === "details";

  return (
    <Modal open onClose={requestClose} ariaLabel={title} size="auto" closeOnBackdrop className="rounded-xl">
      <div
        className={cn(
          "flex flex-col",
          withPanel
            ? "[--area:min(calc(100vw_-_32px),50dvh)] md:[--area:min(calc(100dvh_-_140px),calc(100vw_-_420px),760px)]"
            : "[--area:min(calc(100dvh_-_140px),calc(100vw_-_32px),760px)]"
        )}
      >
        <header className="relative flex h-[43px] shrink-0 items-center justify-center border-b border-separator px-12">
          {(step === "crop" || step === "edit" || step === "details") && (
            <button type="button" aria-label={t("back")} onClick={goBack} className="absolute left-2 p-2 hover:opacity-60">
              <ArrowLeftIcon className="size-6" />
            </button>
          )}
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="absolute right-4 text-sm font-semibold text-primary hover:text-link"
            >
              {action.label}
            </button>
          )}
        </header>

        <div className="flex flex-col md:flex-row">
          <div className="relative size-[var(--area)] shrink-0 overflow-hidden">
            {step === "select" && <SelectStep onFiles={(files) => void addFiles(files)} />}

            {step === "crop" && slide && (
              <CropStep
                slides={slides}
                index={index}
                onIndexChange={setIndex}
                aspect={aspect}
                aspectRatio={aspectRatio}
                isReel={isReel}
                onAspectChange={setAspectRatio}
                onCropChange={(crop) => updateSlide({ crop })}
                onAddFiles={(files) => void addFiles(files)}
                onRemove={removeSlide}
                onMove={moveSlide}
              />
            )}

            {withPanel && slide && (
              <div className="relative size-full bg-control">
                <SlideView slide={slide} aspect={aspect} />
                <SlideNav index={index} total={slides.length} onChange={setIndex} />
              </div>
            )}

            {step === "sharing" && (
              <div className="flex size-full flex-col items-center justify-center gap-5 p-6 text-center">
                {publish.isSuccess ? (
                  <>
                    <span className="flex size-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[3px]">
                      <span className="flex size-full items-center justify-center rounded-full bg-elevated">
                        <CheckIcon className="size-12 text-[#d62976]" />
                      </span>
                    </span>
                    <p className="text-xl">{isReel ? t("reelShared") : t("shared")}</p>
                    <Link href={`/p/${publish.data.id}`} onClick={close} className="text-sm font-semibold text-primary">
                      {t("viewPost")}
                    </Link>
                  </>
                ) : publish.isError ? (
                  <>
                    <p className="max-w-xs text-sm text-muted">{t("failed")}</p>
                    <Button size="sm" onClick={share}>
                      {t("retry")}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="relative flex size-24 items-center justify-center">
                      <span className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)] [mask:radial-gradient(farthest-side,transparent_calc(100%_-_4px),#000_calc(100%_-_3px))]" />
                      <span className="text-sm font-semibold">{Math.round(publish.progress * 100)}%</span>
                    </span>
                    <p className="text-xl">{t("sharing")}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {withPanel && slide && (
            <aside className="h-[min(40dvh,320px)] w-[var(--area)] border-separator max-md:border-t md:h-[var(--area)] md:w-[340px] md:border-l">
              {step === "edit" ? (
                <EditPanel slide={slide} onChange={updateSlide} />
              ) : (
                <DetailsPanel
                  user={{ username: user?.username ?? "", avatar: user?.avatar ?? null }}
                  slides={slides}
                  details={details}
                  onChange={(patch) => setDetails((current) => ({ ...current, ...patch }))}
                  onAltText={(id, text) =>
                    setSlides((current) => current.map((item) => (item.id === id ? { ...item, altText: text } : item)))
                  }
                />
              )}
            </aside>
          )}
        </div>
      </div>

      {confirm && (
        <Modal open onClose={() => setConfirm(null)} size="sm" ariaLabel={t("discardTitle")}>
          <div className="flex flex-col items-center gap-2 px-8 pb-6 pt-8 text-center">
            <h2 className="text-xl">{t("discardTitle")}</h2>
            <p className="text-sm text-muted">{t("discardText")}</p>
          </div>
          <ModalAction
            tone="danger"
            onClick={() => {
              const wasClosing = confirm === "close";
              setConfirm(null);
              if (wasClosing) close();
              else discard();
            }}
          >
            {t("discard")}
          </ModalAction>
          <ModalAction onClick={() => setConfirm(null)}>{common("cancel")}</ModalAction>
        </Modal>
      )}
    </Modal>
  );
}
