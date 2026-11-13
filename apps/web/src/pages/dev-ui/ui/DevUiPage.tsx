"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useFormatCount, useRelativeTime, useTranslations } from "@/shared/i18n";
import {
  Avatar,
  BookmarkIcon,
  Button,
  CameraIcon,
  CountBadge,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  EmptyState,
  HeartIcon,
  IconButton,
  Input,
  Logo,
  LogoMark,
  LogoutIcon,
  Modal,
  ModalAction,
  MoreIcon,
  PasswordInput,
  SettingsIcon,
  Skeleton,
  Spinner,
  Tabs,
  tabPanelProps,
  Textarea,
  toast,
  useHeartBurst,
  VerifiedBadge,
} from "@/shared/ui";
import { LanguageSwitcher } from "@/features/change-language";
import { ThemeSwitcher } from "@/features/toggle-theme";

const SAMPLE_AGES = [5 * 60_000, 3 * 3_600_000, 2 * 86_400_000];
const subscribeNever = () => () => {};
let clientNow: number | undefined;
const getClientNow = () => (clientNow ??= Date.now());

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-separator py-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

/** Development-only catalogue of the UI kit (FE-2 acceptance) */
export function DevUiPage() {
  const t = useTranslations("common");
  const formatCount = useFormatCount();
  const relativeTime = useRelativeTime();
  const [modal, setModal] = useState<"none" | "dialog" | "sheet">("none");
  const [tab, setTab] = useState<"posts" | "reels" | "saved">("posts");
  const [caption, setCaption] = useState("Закат в горах #travel");
  const [loading, setLoading] = useState(false);
  const { trigger, burst } = useHeartBurst();
  // "Now" exists only in the browser: the page is prerendered, so the server sees no clock
  const now = useSyncExternalStore(subscribeNever, getClientNow, () => null);
  const samples = now ? SAMPLE_AGES.map((ago) => new Date(now - ago)) : [];

  return (
    <div className="w-full max-w-[935px] px-4 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 py-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-8" />
          <Logo />
          <span className="text-sm text-muted">UI kit</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <Section title="Buttons">
        <Button>Подписаться</Button>
        <Button variant="secondary">Редактировать профиль</Button>
        <Button variant="danger">Удалить</Button>
        <Button variant="ghost">Отмена</Button>
        <Button variant="link">Поделиться</Button>
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          Загрузить
        </Button>
        <Button disabled>Недоступно</Button>
        <Button size="sm" leftIcon={<CameraIcon className="size-4" />}>
          Small
        </Button>
        <IconButton aria-label="Ещё">
          <MoreIcon className="size-6" />
        </IconButton>
      </Section>

      <Section title="Inputs">
        <div className="flex w-full max-w-[268px] flex-col gap-1.5">
          <Input label="Телефон, имя пользователя или эл. адрес" defaultValue="alex_dev" />
          <PasswordInput label="Пароль" showLabel={t("showPassword")} hideLabel={t("hidePassword")} />
          <Input label="Эл. адрес" defaultValue="wrong@" error="Неверный формат email" />
        </div>
        <div className="w-full max-w-sm rounded-lg border border-separator p-3">
          <Textarea label="Подпись" placeholder="Добавьте подпись…" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2200} showCount />
        </div>
      </Section>

      <Section title="Avatars">
        <Avatar src={null} alt="" size="xs" />
        <Avatar src={null} alt="" size="sm" />
        <Avatar src={null} alt="" size="md" />
        <Avatar src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" alt="alex" size="lg" ring="unseen" />
        <Avatar src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200" alt="sarah" size="lg" ring="seen" />
        <Avatar src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200" alt="travel" size="lg" ring="close-friends" />
        <Avatar src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300" alt="alex" size="2xl" />
      </Section>

      <Section title="Badges & formatting">
        <span className="flex items-center gap-1 text-sm font-semibold">
          alex_dev <VerifiedBadge label={t("verified")} />
        </span>
        <span className="relative">
          <HeartIcon className="size-6" />
          <CountBadge count={3} />
        </span>
        <span className="relative">
          <HeartIcon className="size-6" />
          <CountBadge count={42} />
        </span>
        <span className="text-sm">
          {formatCount(9842)} · {formatCount(12_345)} · {formatCount(1_234_567)}
        </span>
        <span className="text-sm text-muted">
          {samples.map((date) => relativeTime(date)).join(" · ")}
        </span>
      </Section>

      <Section title="Overlays">
        <Button variant="secondary" onClick={() => setModal("dialog")}>
          Диалог
        </Button>
        <Button variant="secondary" onClick={() => setModal("sheet")}>
          Шторка
        </Button>
        <Dropdown
          trigger={(props) => (
            <Button variant="secondary" {...props}>
              Меню
            </Button>
          )}
        >
          <DropdownItem icon={<SettingsIcon />}>Настройки</DropdownItem>
          <DropdownItem icon={<BookmarkIcon />}>Сохранённое</DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={<LogoutIcon />} danger>
            Выйти
          </DropdownItem>
        </Dropdown>
        <Button variant="secondary" onClick={() => toast("Ссылка скопирована")}>
          Тост
        </Button>
        <Button variant="secondary" onClick={() => toast.error("Не удалось опубликовать", { action: { label: "Повторить", onClick: () => toast("Публикуем…") } })}>
          Тост с ошибкой
        </Button>
      </Section>

      <Section title="Tabs">
        <div className="w-full">
          <Tabs
            idBase="dev-tabs"
            ariaLabel="Разделы профиля"
            variant="profile"
            value={tab}
            onChange={setTab}
            items={[
              { value: "posts", label: "Публикации", icon: <CameraIcon /> },
              { value: "reels", label: "Reels", icon: <HeartIcon /> },
              { value: "saved", label: "Сохранённое", icon: <BookmarkIcon /> },
            ]}
          />
          <p {...tabPanelProps("dev-tabs", tab)} className="py-4 text-sm text-muted">
            Активная вкладка: {tab}
          </p>
        </div>
      </Section>

      <Section title="Loading, empty & like">
        <Spinner label={t("loading")} />
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <button
          type="button"
          onDoubleClick={trigger}
          className="relative flex size-40 items-center justify-center rounded-lg bg-control text-sm text-muted"
        >
          Двойной клик
          {burst}
        </button>
        <EmptyState
          icon={<CameraIcon />}
          title="Публикаций пока нет"
          description="Когда вы поделитесь фото, они появятся в профиле."
          action={<Button variant="link">Поделиться первым фото</Button>}
        />
      </Section>

      <Modal open={modal === "dialog"} onClose={() => setModal("none")} size="sm" ariaLabel="Отменить подписку?">
        <div className="flex flex-col items-center gap-3 px-8 pb-4 pt-8 text-center">
          <Avatar src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" alt="" size="xl" />
          <p className="text-sm">Отменить подписку на @alex_dev?</p>
        </div>
        <ModalAction tone="danger" onClick={() => setModal("none")}>
          Отменить подписку
        </ModalAction>
        <ModalAction onClick={() => setModal("none")}>{t("cancel")}</ModalAction>
      </Modal>

      <Modal open={modal === "sheet"} onClose={() => setModal("none")} variant="sheet" title="Комментарии" closeLabel={t("close")}>
        <div className="flex flex-col gap-4 p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Avatar src={null} alt="" size="sm" />
              <p className="text-sm">
                <b className="font-semibold">user_{i + 1}</b> Очень красиво! 🔥
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
