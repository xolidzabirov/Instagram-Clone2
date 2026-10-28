# Архитектура

## 1. Стек

| Слой | Технологии |
|---|---|
| Монорепо | pnpm workspaces, Turborepo |
| Web | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, TanStack Query 5, Zustand 5 (только UI-состояние), react-hook-form + Zod, socket.io-client, next-intl |
| API | NestJS 12, Prisma ORM 7, PostgreSQL 17 (расширения `pg_trgm`, `PostGIS` для карты), Redis 7, BullMQ, Socket.IO (+ Redis adapter), argon2, JWT |
| Медиа | S3-совместимое хранилище (локально MinIO, в проде Cloudflare R2 или AWS S3), sharp (изображения), ffmpeg (видео), blurhash |
| Почта | Nodemailer; локально Mailpit (просмотр писем в браузере) |
| Общие пакеты | `@ig/shared` (типы, Zod-схемы, константы, enum'ы), `@ig/config` (tsconfig, prettier) |
| Тесты | Vitest + SWC + Supertest на отдельной тестовой БД (API), Vitest + Testing Library (web), Playwright (e2e) |
| Качество | ESLint, Steiger (линтер FSD), Prettier, Husky + lint-staged |
| Инфраструктура | Docker Compose (локально), GitHub Actions (CI), Sentry |
| Mobile (M12) | Expo, Expo Router, FlashList, Reanimated, expo-image, expo-video |

## 2. Монорепо

```
.
├── apps/
│   ├── web/                 # Next.js — FSD
│   ├── api/                 # NestJS
│   └── mobile/              # Expo (этап M12)
├── packages/
│   ├── shared/              # @ig/shared — контракт: типы DTO, Zod-схемы, enum'ы, лимиты
│   └── config/              # @ig/config — tsconfig-пресеты, prettier
├── docs/                    # эта документация
├── docker-compose.yml       # postgres, redis, minio, mailpit
├── turbo.json
└── pnpm-workspace.yaml
```

**Главное правило контракта:** все типы ответов API и схемы входных данных живут в `@ig/shared`. Бэкенд валидирует запросы этими же Zod-схемами, фронт использует их в формах и для типизации ответов. Ни одна сторона не объявляет свои копии типов.

## 3. Как web общается с API

```
Браузер ──► Next.js (web, :3000) ──rewrite /api/v1/* ──► NestJS (api, :3003)
        ◄── WebSocket (socket.io) напрямую к api :3003 /ws ──►
```

- Next.js проксирует `/api/v1/*` на бэкенд через `rewrites` в `next.config.ts`. Для браузера API находится на том же домене, поэтому refresh-cookie первого лица, без CORS-проблем, и `proxy.ts` может проверить наличие сессии.
- **Access-токен** (JWT, 15 минут) хранится только в памяти (Zustand), не в localStorage.
- **Refresh-токен** (непрозрачный, 30 дней) лежит в httpOnly cookie `ig_rt` с `Path=/api/v1/auth`, SameSite=Lax, Secure. Ротация при каждом обновлении; повторное использование старого токена отзывает всю цепочку сессии.
- При старте приложения web вызывает `POST /auth/refresh` и получает access-токен и текущего пользователя.
- `proxy.ts` (так в Next 16 называется бывший middleware) редиректит на `/login`, если cookie нет и маршрут защищён, и обратно на `/`, если пользователь уже вошёл и открыл `/login`.
- Мобильное приложение получает refresh-токен в теле ответа и хранит его в SecureStore (заголовок `X-Client: mobile`).

## 4. Frontend: Feature-Sliced Design

### 4.1 Слои

```
apps/web/
├── app/                 # ТОЛЬКО роутинг Next.js: тонкие page.tsx/layout.tsx, metadata
│   ├── (auth)/…
│   ├── (main)/…         # общий layout с навигацией
│   └── @modal/…         # parallel route для модалок (пост, сторис)
├── pages/README.md      # пустая заглушка: без неё Next примет src/pages за Pages Router
└── src/
    ├── app/             # провайдеры, layouts, глобальные стили, инициализация
    ├── pages/           # страницы: сборка виджетов, без бизнес-логики
    ├── widgets/         # крупные самостоятельные блоки (sidebar, feed, post-detail…)
    ├── features/        # действия пользователя (like-post, follow-user, send-message…)
    ├── entities/        # бизнес-сущности: api + model + ui (user, post, story…)
    └── shared/          # ui-kit, api-клиент, lib, config, i18n — без бизнес-логики
```

### 4.2 Правила

1. **Импорт только вниз**: `app → pages → widgets → features → entities → shared`. Слайсы одного слоя не импортируют друг друга. Исключение — сущности через `@x` (`entities/post/@x/user.ts`).
2. **Только публичный API**: импорт из `@/entities/post`, а не из `@/entities/post/ui/PostCard`.
3. **Сегменты слайса**: `ui/`, `model/` (сторы, хуки), `api/` (запросы, query keys, хуки TanStack Query), `lib/` (утилиты), `config/`.
4. **Серверное состояние живёт только в TanStack Query.** Zustand используется лишь для UI-состояния (открытые панели, плеер, черновики) и сессии.
5. **Мутации — это фичи.** Сущность отображает данные и даёт слоты (`likeSlot`, `actionsSlot`), фича вставляет туда кнопку с мутацией.
6. `app/*/page.tsx` содержит только `metadata` и `export default` страницы из `src/pages`.
7. Проверка правил: `steiger ./src` в CI.

### 4.3 Карта слайсов

| Слой | Слайсы |
|---|---|
| shared | `ui` (Button, Input, Textarea, Modal, Drawer, Sheet, Dropdown, Tabs, Avatar, Skeleton, Spinner, Toast, Carousel, VideoPlayer, InfiniteList, EmptyState), `api` (http-клиент, socket-клиент, queryClient), `lib` (cn, formatRelativeTime, formatCount, useIntersection, useDebounce), `config` (routes, env), `i18n` |
| entities | `session`, `user`, `post`, `comment`, `story`, `reel`, `notification`, `conversation`, `message`, `hashtag`, `location`, `collection`, `note`, `audio` |
| features | `auth` (login, register, logout, reset-password), `follow-user`, `block-user`, `like-post`, `save-post`, `repost-post`, `share-post`, `add-comment`, `like-comment`, `delete-comment`, `create-post`, `edit-post`, `delete-post`, `create-story`, `react-to-story`, `reply-to-story`, `edit-profile`, `upload-avatar`, `search`, `send-message`, `react-to-message`, `create-note`, `report-content`, `toggle-theme`, `change-language`, `manage-close-friends`, `manage-algorithm-topics` |
| widgets | `sidebar`, `bottom-nav`, `mobile-header`, `stories-tray`, `feed`, `suggestions`, `post-detail`, `story-viewer`, `reels-feed`, `explore-grid`, `profile-header`, `profile-tabs`, `search-panel`, `notifications-panel`, `chat-list`, `chat-thread`, `create-post-modal`, `comments-sheet` |
| pages | `home`, `explore`, `tag`, `location`, `reels`, `direct-inbox`, `direct-thread`, `post`, `profile`, `edit-profile`, `settings`, `notifications`, `login`, `register`, `verify-email`, `reset-password`, `map` |

## 5. Backend: модульный NestJS

### 5.1 Структура

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/              # guards, interceptors, filters, decorators, pipes (ZodValidationPipe), pagination
├── config/              # типизированный конфиг из env (Zod)
├── infra/
│   ├── prisma/          # PrismaService
│   ├── redis/           # клиент Redis, кэш
│   ├── queue/           # BullMQ (очереди и воркеры)
│   ├── storage/         # S3: presigned URL, удаление
│   ├── mail/            # отправка писем
│   └── realtime/        # Socket.IO gateway, Redis adapter, авторизация сокетов
└── modules/
    ├── auth/  users/  follows/  blocks/
    ├── media/  posts/  comments/  likes/  saves/  reposts/
    ├── feed/  explore/  search/  hashtags/  locations/
    ├── stories/  highlights/  reels/  audio/
    ├── notifications/  direct/  notes/
    ├── topics/          # «Ваш алгоритм»
    ├── reports/  admin/
    └── health/
```

### 5.2 Принципы

- **Модуль = controller + service + repository (через Prisma) + DTO из `@ig/shared`.**
- **События между модулями** через `@nestjs/event-emitter`: например, `post.liked` → модуль уведомлений создаёт уведомление и отправляет его в сокет. Модули не вызывают друг друга напрямую ради побочных эффектов.
- **Тяжёлая работа в очередях BullMQ:** `media` (обработка изображений и видео), `fanout` (кэш лент), `notifications` (push), `cleanup` (истёкшие сторис, мусор в S3).
- **Права доступа:** `PolicyService` — единая проверка «может ли viewer видеть owner» (приватность, блокировка), используется во всех выдачах.
- **Счётчики** (лайки, комментарии, подписчики) денормализованы в таблицах и обновляются в той же транзакции. Раз в сутки сверка (reconcile job).
- **Пагинация:** курсор = base64(`createdAt|id`), ответ `{ items, nextCursor }`.
- **Ошибки:** единый формат `{ statusCode, code, message, details? }`, где `code` — машинный код (`USERNAME_TAKEN`, `POST_NOT_FOUND`…).

### 5.3 Медиа-пайплайн

```
1. Клиент: POST /media/uploads { type, mime, size } → { uploadId, presignedUrl }
2. Клиент: PUT файл напрямую в S3 по presignedUrl (с прогрессом)
3. Клиент: POST /media/uploads/:id/complete
4. API: задача в очередь media → воркер:
   - фото: sharp → WebP 1080/640/320, blurhash, размеры, удаление EXIF
   - видео: ffmpeg → MP4 H.264 720p, постер, длительность
5. Media.status = READY → событие media.ready (сокет клиенту)
6. Клиент: POST /posts { mediaIds: [...] } — пост публикуется, когда все медиа READY
```

### 5.4 Лента и рекомендации

- **Лента подписок:** fan-out on read (запрос постов подписок с курсором) + кэш первой страницы в Redis на 60 с. Для масштаба учебного проекта этого достаточно; переход на fan-out on write описан как улучшение.
- **Ранжирование «Для вас» (эвристика):**
  `score = свежесть × (1 + log(лайки + 2·комментарии + 3·сохранения + 4·репосты)) × вес_темы_пользователя × бонус_избранного`
- **Темы («Ваш алгоритм»):** у поста есть темы (из хэштегов по словарю), у пользователя — веса тем (растут от взаимодействий, меняются вручную). Explore и Reels «Для вас» ранжируются с учётом этих весов.

### 5.5 Realtime (Socket.IO, namespace `/ws`)

- Авторизация по access-токену в `auth` при подключении.
- Комнаты: `user:{id}` (личные события), `conversation:{id}` (чат).
- Redis adapter, чтобы работало несколько инстансов API.
- Список событий — в [04-api.md](04-api.md#websocket).

## 6. Окружения и инфраструктура

| Сервис | Локально | Прод (рекомендация) |
|---|---|---|
| web | `pnpm dev`, :3000 | Vercel |
| api | `pnpm dev`, :3003 | Docker-контейнер на VPS, Railway или Fly.io |
| PostgreSQL | Docker :5432 | Managed Postgres (Neon, Supabase, RDS) |
| Redis | Docker :6379 | Upstash или Redis в контейнере |
| S3 | MinIO :9000 (консоль :9001) | Cloudflare R2 + CDN |
| Почта | Mailpit :8025 | Resend или SMTP |

Переменные окружения описываются в `.env.example` каждого приложения и валидируются Zod-схемой при старте.

## 7. Ключевые решения

| Решение | Почему |
|---|---|
| Монорепо с `@ig/shared` | Один контракт для web, mobile и api; изменение типа сразу ломает компиляцию всех потребителей |
| NestJS, а не Express | Модульность, DI, guards и gateway из коробки — проще держать порядок в большом API |
| Prisma | Типобезопасные запросы, миграции, удобная схема; для сложных выдач (лента, Explore) допустим `$queryRaw` |
| PostgreSQL для поиска (`pg_trgm`) | Достаточно для учебного масштаба, без отдельного Elasticsearch |
| Proxy через Next rewrites | Cookies первого лица, нет CORS, `proxy.ts` видит сессию |
| Access-токен в памяти | Защита от XSS-кражи токена (в отличие от localStorage) |
| TanStack Query для серверных данных | Кэш, инвалидация, оптимистичные обновления, бесконечные списки |
