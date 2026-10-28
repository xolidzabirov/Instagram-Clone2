# API: REST + WebSocket

База: `/api/v1`. Формат JSON. Документация Swagger генерируется автоматически по адресу `/api/docs`.

## Общие правила

- **Авторизация:** заголовок `Authorization: Bearer <accessToken>`. 🔒 — нужна авторизация, 🔓 — доступно и гостю (с ограничениями приватности).
- **Пагинация:** `?cursor=<string>&limit=<1..50, по умолчанию 20>` → `{ "items": [...], "nextCursor": "..." | null }`.
- **Ошибки:** `{ "statusCode": 409, "code": "USERNAME_TAKEN", "message": "…", "details": {...} }`.
- **Валидация:** тела запросов проверяются Zod-схемами из `@ig/shared` (ответ 400 с `code: "VALIDATION_ERROR"` и `details` по полям).
- **Rate limit:** при превышении возвращается 429 и заголовок `Retry-After`.
- **Типы ответов** (`UserPreview`, `Post`, `Comment`…) объявлены в `@ig/shared` и используются фронтом напрямую.
- **Идемпотентность:** создание сообщений принимает `clientId`, создание постов — `Idempotency-Key`.

## Auth

| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | `{ email, fullName, username, password }` → `{ accessToken, user }` + cookie `ig_rt` |
| POST | `/auth/login` | `{ login, password }` (login = username или email) |
| POST | `/auth/refresh` | по cookie (web) или `{ refreshToken }` (mobile) → новая пара токенов |
| POST | `/auth/logout` 🔒 | отзыв текущей сессии |
| POST | `/auth/logout-all` 🔒 | отзыв всех сессий |
| POST | `/auth/verify-email` 🔒 | `{ code }` |
| POST | `/auth/verify-email/resend` 🔒 | |
| POST | `/auth/password/forgot` | `{ email }` — всегда 204 (не раскрываем, есть ли такой email) |
| POST | `/auth/password/reset` | `{ email, code, newPassword }` |
| POST | `/auth/password/change` 🔒 | `{ currentPassword, newPassword }` |
| GET | `/auth/sessions` 🔒 | список активных сессий |
| DELETE | `/auth/sessions/:id` 🔒 | завершить сессию |
| GET | `/auth/username-available?username=` | `{ available, suggestions[] }` |

## Users

| Метод | Путь | Описание |
|---|---|---|
| GET | `/users/me` 🔒 | `CurrentUser` |
| PATCH | `/users/me` 🔒 | `{ fullName, username, bio, links[], gender, pronouns, isPrivate, language }` |
| PUT | `/users/me/avatar` 🔒 | `{ mediaId }` |
| DELETE | `/users/me/avatar` 🔒 | |
| GET | `/users/:username` 🔓 | `UserProfile` (+ `relationship`: `{ following, followedBy, requested, blocking, isCloseFriend, isFavorite, muted }`) |
| GET | `/users/:username/posts` 🔓 | сетка постов (закреплённые первыми) |
| GET | `/users/:username/reels` 🔓 | |
| GET | `/users/:username/reposts` 🔓 | |
| GET | `/users/:username/tagged` 🔓 | |
| GET | `/users/me/saved` 🔒 | `?collectionId=` |
| GET | `/users/:username/followers` 🔒 | `?q=` поиск внутри списка |
| GET | `/users/:username/following` 🔒 | |
| GET | `/users/suggestions` 🔒 | рекомендации подписок |
| GET | `/users/:username/similar` 🔒 | похожие аккаунты |

## Follows и отношения

| Метод | Путь | Описание |
|---|---|---|
| POST | `/users/:id/follow` 🔒 | → `{ status: "ACCEPTED" \| "PENDING" }` |
| DELETE | `/users/:id/follow` 🔒 | отписаться или отменить заявку |
| DELETE | `/users/:id/follower` 🔒 | удалить подписчика |
| GET | `/follow-requests` 🔒 | входящие заявки |
| POST | `/follow-requests/:userId/accept` 🔒 | |
| POST | `/follow-requests/:userId/decline` 🔒 | |
| PUT / DELETE | `/users/:id/block` 🔒 | |
| PUT / DELETE | `/users/:id/restrict` 🔒 | |
| PATCH | `/users/:id/relationship` 🔒 | `{ isFavorite?, mutedPosts?, mutedStories? }` |
| GET | `/close-friends` 🔒 | |
| PUT / DELETE | `/close-friends/:userId` 🔒 | |
| GET | `/blocked` 🔒 | также `/restricted`, `/muted` |

## Media

| Метод | Путь | Описание |
|---|---|---|
| POST | `/media/uploads` 🔒 | `{ type, mime, sizeBytes, purpose: "POST" \| "STORY" \| "AVATAR" \| "MESSAGE" \| "REEL" }` → `{ mediaId, uploadUrl, headers }` |
| POST | `/media/:id/complete` 🔒 | запускает обработку |
| GET | `/media/:id` 🔒 | статус и варианты |

## Posts

| Метод | Путь | Описание |
|---|---|---|
| POST | `/posts` 🔒 | `{ type, mediaIds[], caption, locationId?, aspectRatio, tags[{mediaId,userId,x,y}], altTexts{}, hideLikes, commentsDisabled }` |
| GET | `/posts/:id` 🔓 | `Post` |
| PATCH | `/posts/:id` 🔒 | подпись, отметки, геометка, настройки |
| DELETE | `/posts/:id` 🔒 | |
| POST / DELETE | `/posts/:id/archive` 🔒 | |
| POST / DELETE | `/posts/:id/pin` 🔒 | |
| PUT | `/users/me/grid-order` 🔒 | `{ postIds[] }` (P2) |
| PUT / DELETE | `/posts/:id/like` 🔒 | |
| GET | `/posts/:id/likes` 🔒 | кто лайкнул |
| PUT / DELETE | `/posts/:id/save` 🔒 | `{ collectionId? }` |
| PUT / DELETE | `/posts/:id/repost` 🔒 | |
| POST | `/posts/:id/view` 🔒 | просмотр (Reels, «вы всё посмотрели»), батч допустим |
| POST | `/posts/:id/not-interested` 🔒 | |
| POST | `/posts/:id/share` 🔒 | `{ conversationIds[], text? }` → отправка в Direct |
| GET / POST | `/collections` 🔒 | |
| PATCH / DELETE | `/collections/:id` 🔒 | |

## Comments

| Метод | Путь | Описание |
|---|---|---|
| GET | `/posts/:id/comments` 🔓 | корневые комментарии (закреплённые первыми) |
| GET | `/comments/:id/replies` 🔓 | |
| POST | `/posts/:id/comments` 🔒 | `{ text, parentId? }` |
| DELETE | `/comments/:id` 🔒 | автор комментария или автор поста |
| PUT / DELETE | `/comments/:id/like` 🔒 | |
| PUT / DELETE | `/comments/:id/pin` 🔒 | только автор поста |

## Feed, Explore, Search

| Метод | Путь | Описание |
|---|---|---|
| GET | `/feed?mode=home\|following\|favorites` 🔒 | home = подписки + рекомендации; following = хронология |
| GET | `/explore` 🔒 | мозаика (`{ items: [{ post, layout: "SMALL" \| "LARGE" }] }`) |
| GET | `/reels/feed?tab=for-you\|friends` 🔒 | |
| GET | `/search?q=&type=all\|users\|hashtags\|locations` 🔒 | |
| GET / POST / DELETE | `/search/history` 🔒 | `DELETE /search/history/:id`, `DELETE /search/history` — очистить всё |
| GET | `/hashtags/:name` 🔓 | `{ name, postsCount }` |
| GET | `/hashtags/:name/posts?sort=top\|recent` 🔓 | |
| GET | `/locations/:id` 🔓 | и `/locations/:id/posts` |
| GET | `/locations/search?q=` 🔒 | для выбора геометки |
| GET | `/map/posts?bbox=` 🔒 | посты на карте (P2) |
| GET | `/topics/me` 🔒 | «Ваш алгоритм»: мои темы и веса |
| PUT / DELETE | `/topics/me/:topicId` 🔒 | `{ weight }` (добавить, усилить, убрать) |

## Stories и Highlights

| Метод | Путь | Описание |
|---|---|---|
| GET | `/stories/tray` 🔒 | кружки: `[{ user, hasUnseen, hasCloseFriends, latestAt }]` |
| GET | `/stories/users/:userId` 🔒 | активные сторис пользователя |
| POST | `/stories` 🔒 | `{ mediaId, audience, stickers[] }` |
| DELETE | `/stories/:id` 🔒 | |
| POST | `/stories/:id/view` 🔒 | |
| GET | `/stories/:id/viewers` 🔒 | только автор |
| PUT | `/stories/:id/reaction` 🔒 | `{ emoji }` → сообщение в Direct |
| POST | `/stories/:id/reply` 🔒 | `{ text }` → сообщение в Direct |
| GET | `/stories/archive` 🔒 | |
| GET | `/users/:userId/highlights` 🔓 | |
| POST / PATCH / DELETE | `/highlights[/:id]` 🔒 | `{ title, coverMediaId, storyIds[] }` |

## Audio

| Метод | Путь | Описание |
|---|---|---|
| GET | `/audio/:id` 🔓 | и `/audio/:id/reels` |

## Direct

| Метод | Путь | Описание |
|---|---|---|
| GET | `/conversations?folder=primary\|requests` 🔒 | |
| POST | `/conversations` 🔒 | `{ userIds[], title? }` — для одного пользователя вернёт существующий чат |
| GET | `/conversations/:id` 🔒 | |
| PATCH | `/conversations/:id` 🔒 | название, аватар, `isMuted`, `isPinned` |
| POST | `/conversations/:id/members` 🔒 | добавить участников (группа) |
| DELETE | `/conversations/:id/members/me` 🔒 | выйти |
| POST | `/conversations/:id/accept` 🔒 | принять запрос |
| GET | `/conversations/:id/messages` 🔒 | курсор назад по времени |
| POST | `/conversations/:id/messages` 🔒 | `{ clientId, type, text?, mediaId?, sharedPostId?, replyToId?, scheduledAt? }` |
| PATCH | `/messages/:id` 🔒 | редактирование (15 минут) |
| DELETE | `/messages/:id` 🔒 | отмена отправки |
| PUT / DELETE | `/messages/:id/reaction` 🔒 | `{ emoji }` |
| POST | `/conversations/:id/read` 🔒 | `{ messageId }` |
| GET | `/notes` 🔒 | заметки друзей |
| POST / DELETE | `/notes[/:id]` 🔒 | |

## Notifications

| Метод | Путь | Описание |
|---|---|---|
| GET | `/notifications` 🔒 | сгруппированные, с разделами по времени |
| GET | `/notifications/unread-count` 🔒 | `{ notifications, messages }` |
| POST | `/notifications/read` 🔒 | отметить всё прочитанным |
| GET / PATCH | `/notifications/settings` 🔒 | |
| POST / DELETE | `/push/subscriptions` 🔒 | web push (VAPID) и Expo-токены |

## Settings и модерация

| Метод | Путь | Описание |
|---|---|---|
| GET / PATCH | `/settings/privacy` 🔒 | |
| POST | `/reports` 🔒 | `{ targetType, targetId, reason, details? }` |
| GET | `/admin/reports` 🔒👮 | только `ADMIN` |
| POST | `/admin/reports/:id/resolve` 🔒👮 | `{ action: "HIDE" \| "BAN_USER" \| "REJECT" }` |
| GET | `/health` | liveness и readiness |

<a id="websocket"></a>
## WebSocket (Socket.IO, namespace `/ws`)

Подключение: `io(WS_URL + "/ws", { auth: { token: accessToken } })`. При истечении токена клиент переподключается с новым.

### Сервер → клиент
| Событие | Данные | Когда |
|---|---|---|
| `notification:new` | `Notification` | новое уведомление |
| `notification:unread` | `{ notifications, messages }` | изменился счётчик |
| `message:new` | `Message` | новое сообщение в чате |
| `message:updated` | `Message` | редактирование, удаление, реакция |
| `conversation:updated` | `ConversationPreview` | новое последнее сообщение, переименование |
| `conversation:read` | `{ conversationId, userId, messageId }` | собеседник прочитал |
| `typing` | `{ conversationId, userId, isTyping }` | |
| `presence` | `{ userId, online, lastSeenAt }` | для собеседников |
| `media:ready` | `{ mediaId, status }` | медиа обработано |

### Клиент → сервер
| Событие | Данные |
|---|---|
| `conversation:join` / `conversation:leave` | `{ conversationId }` (открыт или закрыт чат) |
| `typing` | `{ conversationId, isTyping }` |

Отправка сообщений идёт через REST (надёжнее и с идемпотентностью), а доставка — через сокет.
