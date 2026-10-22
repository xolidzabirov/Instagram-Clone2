# Instagram Clone 📸

Полнофункциональный клон Instagram: веб, бэкенд и мобильное приложение в одном монорепозитории. Фронтенд построен по архитектуре FSD (Feature-Sliced Design).

## 🚀 Стек технологий

- **Монорепо:** pnpm workspaces + Turborepo
- **Web:** Next.js 16 (App Router + Turbopack), React 19, TypeScript 5
- **Стилизация:** Tailwind CSS 4
- **Стейт-менеджмент:** Zustand 5
- **Асинхронные данные:** TanStack Query v5 (React Query)
- **HTTP клиент:** Axios (с JWT перехватчиками и авто-обновлением токенов)
- **Валидация:** Zod 4 (общие схемы в `@ig/shared`)
- **Иконки:** React Icons (Feather & FontAwesome)

## 📁 Структура монорепозитория

```
.
├── apps/
│   └── web/                 # Next.js фронтенд (FSD)
│       ├── app/             # Next.js App Router (страницы и роутинг)
│       ├── src/
│       │   ├── widgets/     # Комплексные блоки интерфейса (Sidebar, Feed, модалки...)
│       │   ├── features/    # Интерактивные фичи (auth, post, story)
│       │   └── entities/    # Бизнес-сущности (post, user, story)
│       └── shared/lib/      # apiClient, queryClient, utils
├── packages/
│   ├── shared/              # @ig/shared — типы сущностей и Zod-схемы (web, mobile, api)
│   └── config/              # @ig/config — общие tsconfig и prettier
├── pnpm-workspace.yaml
└── turbo.json
```

Планируется: `apps/api` (NestJS) и `apps/mobile` (Expo).

## 🛠 Запуск проекта

Требуется Node.js ≥ 20.9 и pnpm 10 (`npm i -g pnpm`).

```bash
pnpm install
pnpm dev          # запустить все приложения
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Полезные команды

| Команда | Что делает |
|---|---|
| `pnpm dev` | dev-режим всех приложений |
| `pnpm build` | production-сборка |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | проверка типов TypeScript |
| `pnpm --filter @ig/web dev` | запустить только web |
