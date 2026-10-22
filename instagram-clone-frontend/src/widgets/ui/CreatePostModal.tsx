"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { FiX, FiImage, FiArrowLeft, FiMapPin, FiSmile } from "react-icons/fi";
import { useUIStore } from "@/src/features/ui";
import { usePostStore } from "@/src/features/post";

const PRESET_IMAGES = [
  {
    title: "Mountain Sunset",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080",
  },
  {
    title: "Cyberpunk City",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1080",
  },
  {
    title: "Minimal Interior",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1080",
  },
  {
    title: "Coffee & Coding",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080",
  },
];

const FILTERS = [
  { name: "Normal", class: "filter-normal" },
  { name: "Clarendon", class: "filter-clarendon" },
  { name: "Juno", class: "filter-juno" },
  { name: "Lark", class: "filter-lark" },
  { name: "Ludwig", class: "filter-ludwig" },
  { name: "B&W", class: "filter-bw" },
];

export function CreatePostModal() {
  const { isCreateModalOpen, closeCreateModal } = useUIStore();
  const addPost = usePostStore((s) => s.addPost);

  const [step, setStep] = useState<"select" | "filter" | "caption">("select");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("filter-normal");
  const [caption, setCaption] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setStep("filter");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedImage(url);
    setStep("filter");
  };

  const handleReset = () => {
    setStep("select");
    setSelectedImage("");
    setSelectedFilter("filter-normal");
    setCaption("");
    setLocation("");
    closeCreateModal();
  };

  const handlePublish = async () => {
    if (!selectedImage) return;
    setIsSubmitting(true);

    try {
      addPost({
        imageUrl: selectedImage,
        caption: caption.trim() || "Новая публикация",
        location: location.trim() || undefined,
        filterClass: selectedFilter,
      });

      handleReset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleReset}
    >
      {/* Close button outside modal */}
      <button
        onClick={handleReset}
        className="absolute top-4 right-4 text-white hover:opacity-80 p-2 z-50 cursor-pointer"
        aria-label="Закрыть"
      >
        <FiX className="w-7 h-7" />
      </button>

      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
          {step !== "select" ? (
            <button
              onClick={() => setStep(step === "caption" ? "filter" : "select")}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}

          <span>
            {step === "select" && "Создание публикации"}
            {step === "filter" && "Фильтры и редактирование"}
            {step === "caption" && "Создание новой публикации"}
          </span>

          {step === "filter" && (
            <button
              onClick={() => setStep("caption")}
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm"
            >
              Далее
            </button>
          )}

          {step === "caption" && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm disabled:opacity-50"
            >
              {isSubmitting ? "Публикация..." : "Поделиться"}
            </button>
          )}

          {step === "select" && <div className="w-5" />}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {step === "select" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[420px]">
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-600 dark:text-zinc-400">
                <FiImage className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Перетащите сюда фото или видео
              </h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm">
                Выберите файл с компьютера или используйте один из готовых примеров ниже
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors mb-8 shadow-sm"
              >
                Выбрать на компьютере
              </button>

              <div className="w-full max-w-md pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-3">
                  Быстрый выбор из примеров:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.title}
                      onClick={() => handleSelectPreset(preset.url)}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={preset.url}
                        alt={preset.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="100px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "filter" && (
            <div className="flex-1 flex flex-col md:flex-row h-full">
              {/* Image Preview */}
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[350px]">
                <div className={`relative w-full h-[450px] ${selectedFilter}`}>
                  <Image
                    src={selectedImage}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Filter Thumbnails */}
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Фильтры
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                  {FILTERS.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedFilter(f.class)}
                      className={`flex flex-col items-center gap-1.5 p-1 rounded-lg transition-all ${
                        selectedFilter === f.class
                          ? "ring-2 ring-blue-500 scale-105"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className={`relative w-16 h-16 rounded-md overflow-hidden ${f.class}`}>
                        <Image
                          src={selectedImage}
                          alt={f.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "caption" && (
            <div className="flex-1 flex flex-col md:flex-row h-full">
              {/* Image Preview Left */}
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[350px]">
                <div className={`relative w-full h-[450px] ${selectedFilter}`}>
                  <Image
                    src={selectedImage}
                    alt="Final Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Caption & Details Form Right */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  {/* Author preview */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 relative">
                      <Image
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                        alt="kholid_official"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      kholid_official
                    </span>
                  </div>

                  {/* Caption Input */}
                  <div className="relative">
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Добавьте подпись..."
                      rows={5}
                      className="w-full text-sm bg-transparent border-0 focus:ring-0 resize-none outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    />
                    <div className="flex items-center justify-between text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setCaption((prev) => prev + " ✨")}
                        className="hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <FiSmile className="w-5 h-5" />
                      </button>
                      <span className="text-xs">{caption.length}/2,200</span>
                    </div>
                  </div>

                  {/* Location Input */}
                  <div className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    <FiMapPin className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Укажите местоположение"
                      className="w-full text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    />
                  </div>
                </div>

                <div className="pt-4 text-xs text-zinc-400">
                  Ваша публикация появится в ленте и на вашей странице профиля.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
