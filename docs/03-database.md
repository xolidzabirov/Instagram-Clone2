# Схема базы данных (PostgreSQL 17 + Prisma)

Общие соглашения:
- `id`: UUID v7 (сортируется по времени, удобно для курсоров), генерируется в приложении.
- Время: `timestamptz`, поля `createdAt` и `updatedAt`.
- Мягкое удаление (`deletedAt`) — только для `User`, `Post`, `Comment` и `Message`.
- Расширения: `pg_trgm` (поиск), `postgis` (карта, этап P2).
- `username`, `email` и имена хэштегов хранятся в нижнем регистре (приложение приводит их при записи, CHECK-ограничения в БД не дают сохранить иначе). Так уникальность регистронезависимая, а trigram-индексы работают без `citext`.
- Счётчики денормализованы и обновляются в той же транзакции, что и действие.

## 1. Пользователи и сессии

### `users`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| username | varchar(30) UNIQUE | 1–30 символов `[a-z0-9._]`, нижний регистр |
| email | varchar(254) UNIQUE | нижний регистр |
| emailVerifiedAt | timestamptz? | |
| passwordHash | text | argon2id |
| fullName | varchar(64) | |
| bio | varchar(150) | |
| avatarMediaId | uuid? FK → media | |
| gender, pronouns | varchar? | |
| isPrivate | bool, default false | |
| isVerified | bool | галочка |
| role | enum `USER`, `ADMIN` | |
| status | enum `ACTIVE`, `DEACTIVATED`, `BANNED` | |
| language | enum `ru`, `en` | |
| postsCount, followersCount, followingCount | int | денормализация |
| lastSeenAt | timestamptz? | для «в сети» |
| createdAt, updatedAt, deletedAt | | |

Индексы: `gin (username gin_trgm_ops)`, `gin (fullName gin_trgm_ops)`.

### `user_links`
`id`, `userId` FK, `title`, `url`, `position` — до 5 ссылок в профиле.

### `sessions`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| userId | FK | |
| refreshTokenHash | text UNIQUE | sha256 токена |
| familyId | uuid | цепочка ротации: при повторном использовании токена отзывается вся семья |
| userAgent, ip, deviceName | text | для списка сессий |
| expiresAt, revokedAt, lastUsedAt | timestamptz | |

### `verification_codes`
`id`, `userId`, `type` (`EMAIL_VERIFY`, `PASSWORD_RESET`), `codeHash`, `expiresAt`, `usedAt`, `attempts`.

## 2. Социальный граф

### `follows`
| Поле | Тип | Примечание |
|---|---|---|
| followerId | FK users | PK (followerId, followingId) |
| followingId | FK users | |
| status | enum `ACCEPTED`, `PENDING` | `PENDING` — заявка к приватному аккаунту |
| isFavorite | bool | follower добавил following в «Избранное» |
| mutedPosts, mutedStories | bool | follower заглушил following |
| createdAt | | |

Индексы: `(followingId, status, createdAt)`, `(followerId, status, createdAt)`.

### `close_friends`
Список «Близкие друзья» принадлежит владельцу (кому показывать сторис с аудиторией `CLOSE_FRIENDS`).

`ownerId`, `friendId`, `createdAt` — PK (ownerId, friendId).

### `blocks`
`blockerId`, `blockedId`, `createdAt` — PK (blockerId, blockedId). Блокировка удаляет подписки в обе стороны.

### `restricts`
`ownerId`, `restrictedId`, `createdAt`.

## 3. Медиа

### `media`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| ownerId | FK users | |
| type | enum `IMAGE`, `VIDEO`, `AUDIO` | |
| status | enum `UPLOADING`, `PROCESSING`, `READY`, `FAILED` | |
| originalKey | text | ключ в S3 |
| variants | jsonb | `{ "1080": key, "640": key, "320": key }` или `{ "mp4": key, "poster": key }` |
| width, height | int | |
| durationMs | int? | видео и аудио |
| blurhash | varchar? | |
| mime, sizeBytes | | |
| createdAt | | |

Медиа без привязки к посту, сторис или сообщению старше 24 часов удаляется задачей `cleanup`.

## 4. Публикации

### `posts`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| authorId | FK users | |
| type | enum `POST`, `REEL` | |
| caption | varchar(2200) | |
| locationId | FK locations? | |
| aspectRatio | enum `SQUARE`, `PORTRAIT_4_5`, `PORTRAIT_3_4`, `LANDSCAPE`, `VERTICAL_9_16` | |
| hideLikes, commentsDisabled | bool | |
| isArchived | bool | |
| pinnedAt | timestamptz? | закреп в профиле (до 3) |
| gridPosition | int? | ручная сортировка сетки (P2) |
| audioId | FK audio? | для Reels |
| likesCount, commentsCount, savesCount, repostsCount, sharesCount, viewsCount | int | |
| score | float | кэш ранжирования для Explore, пересчитывается фоном |
| createdAt, updatedAt, deletedAt | | |

Индексы: `(authorId, createdAt DESC)`, `(type, score DESC)`, `(locationId, createdAt DESC)`.

### `post_media`
`postId`, `mediaId`, `position` (0–19), `altText`, `caption` (подпись к слайду, P2). PK (postId, position).

### `post_tags` — отметки людей на фото
`postId`, `mediaId`, `userId`, `x`, `y` (0..1).

### `post_likes`
`userId`, `postId`, `createdAt` — PK (postId, userId), индекс `(userId, createdAt DESC)`.

### `saved_posts`
`userId`, `postId`, `collectionId?`, `createdAt` — PK (userId, postId).

### `collections`
`id`, `userId`, `name`, `coverPostId?`, `createdAt`.

### `reposts`
`userId`, `postId`, `createdAt` — PK (userId, postId).

### `post_views` (Reels и «Вы всё посмотрели»)
`userId`, `postId`, `viewedAt`. Храним последние 30 дней (партиционирование по месяцу — улучшение на будущее).

### `not_interested`
`userId`, `postId`, `createdAt` — исключение из рекомендаций.

## 5. Комментарии

### `comments`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| postId | FK | |
| authorId | FK | |
| parentId | FK comments? | ответ; глубина 1 (ответ на ответ привязывается к корневому комментарию с упоминанием) |
| text | varchar(1000) | |
| likesCount, repliesCount | int | |
| isPinned | bool | |
| isHidden | bool | скрыт фильтром «скрытые слова» или Restrict |
| createdAt, deletedAt | | |

Индексы: `(postId, parentId, createdAt)`.

### `comment_likes`
`userId`, `commentId`, `createdAt`.

## 6. Хэштеги, упоминания, места, темы

### `hashtags`
`id`, `name` UNIQUE (нижний регистр), `postsCount`. Индекс trigram по `name`.

### `post_hashtags`
`postId`, `hashtagId`.

### `mentions`
`id`, `sourceType` (`POST`, `COMMENT`, `STORY`), `sourceId`, `mentionedUserId`, `createdAt`.

### `locations`
`id`, `name`, `address`, `city`, `country`, `lat`, `lng`, `geom` (PostGIS point, P2), `postsCount`.

### `topics`
`id`, `slug`, `nameRu`, `nameEn` — словарь тем («Путешествия», «Код», «Еда»…).

### `hashtag_topics`
`hashtagId`, `topicId` — сопоставление хэштегов темам.

### `post_topics`
`postId`, `topicId`, `weight`.

### `user_topic_weights` («Ваш алгоритм»)
`userId`, `topicId`, `weight` (−1..1), `source` (`AUTO`, `MANUAL`), `updatedAt`.

## 7. Stories

### `stories`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| authorId | FK | |
| mediaId | FK | |
| audience | enum `ALL`, `CLOSE_FRIENDS` | |
| stickers | jsonb | упоминания, хэштег, ссылка, локация, с координатами |
| durationMs | int | |
| viewsCount | int | |
| expiresAt | timestamptz | createdAt + 24 ч |
| createdAt | | |

Индекс: `(authorId, expiresAt)`.

### `story_views`
`storyId`, `viewerId`, `viewedAt`, `reaction?` (эмодзи) — PK (storyId, viewerId).

### `story_hidden_from`
`ownerId`, `hiddenUserId`.

### `highlights`
`id`, `ownerId`, `title`, `coverMediaId`, `position`, `createdAt`.

### `highlight_items`
`highlightId`, `storyId`, `position`.

## 8. Reels и аудио

Reels — это `posts` с `type = REEL`.

### `audio`
`id`, `title`, `artist`, `mediaId`, `originalPostId?` (оригинальный звук из Reels), `usesCount`.

## 9. Direct

### `conversations`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| type | enum `DIRECT`, `GROUP` | |
| title | varchar? | для групп |
| avatarMediaId | FK? | |
| createdById | FK | |
| lastMessageId | FK? | для сортировки списка |
| lastMessageAt | timestamptz | индекс |
| createdAt | | |

Для `DIRECT` уникальность пары обеспечивает поле `directKey` = `min(userA,userB):max(userA,userB)` UNIQUE.

### `conversation_members`
| Поле | Тип | Примечание |
|---|---|---|
| conversationId, userId | PK | |
| role | enum `ADMIN`, `MEMBER` | |
| status | enum `ACTIVE`, `REQUEST`, `LEFT` | `REQUEST` — входящий запрос от неподписанного |
| lastReadMessageId | FK? | статус «прочитано» |
| isMuted, isPinned | bool | |
| joinedAt | | |

### `messages`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| conversationId | FK | |
| senderId | FK | |
| type | enum `TEXT`, `MEDIA`, `VOICE`, `POST_SHARE`, `PROFILE_SHARE`, `STORY_REPLY`, `STORY_REACTION`, `LIKE` (сердечко) | |
| text | varchar(2000)? | |
| mediaId | FK? | |
| sharedPostId, sharedUserId, storyId | FK? | |
| replyToId | FK messages? | |
| editedAt, deletedAt | | |
| scheduledAt | timestamptz? | отложенная отправка (P2) |
| clientId | varchar | идемпотентность: повтор при плохой связи не создаёт дубль |
| createdAt | | |

Индексы: `(conversationId, createdAt DESC)`, UNIQUE `(senderId, clientId)`.

### `message_reactions`
`messageId`, `userId`, `emoji`, `createdAt` — PK (messageId, userId).

### `notes`
`id`, `authorId`, `text` (60), `audience` (`FOLLOWERS_YOU_FOLLOW_BACK`, `CLOSE_FRIENDS`), `expiresAt`, `createdAt`.

## 10. Уведомления

### `notifications`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid PK | |
| recipientId | FK | |
| actorId | FK | |
| type | enum `LIKE`, `COMMENT`, `COMMENT_REPLY`, `COMMENT_LIKE`, `MENTION`, `TAG`, `FOLLOW`, `FOLLOW_REQUEST`, `FOLLOW_ACCEPTED`, `REPOST`, `STORY_MENTION` | |
| postId, commentId, storyId | FK? | |
| groupKey | varchar | для группировки: `LIKE:post:{id}` |
| readAt | timestamptz? | |
| createdAt | | |

Индексы: `(recipientId, createdAt DESC)`, `(recipientId, readAt)`.

### `push_subscriptions`
`id`, `userId`, `endpoint`, `p256dh`, `auth`, `platform` (`WEB`, `EXPO`), `expoToken?`, `createdAt`.

### `notification_settings`
`userId` PK, `likes`, `comments`, `follows`, `messages`, `mentions` (enum `OFF`, `FOLLOWING`, `EVERYONE`), `pushEnabled`.

## 11. Настройки, поиск, модерация

### `privacy_settings`
`userId` PK, `allowComments` (`EVERYONE`, `FOLLOWING`, `FOLLOWERS`, `OFF`), `allowMentions`, `allowMessages`, `hiddenWords` text[], `hideLikeCounts`.

### `search_history`
`id`, `userId`, `type` (`USER`, `HASHTAG`, `LOCATION`, `QUERY`), `targetId?`, `query?`, `createdAt`.

### `reports`
`id`, `reporterId`, `targetType` (`POST`, `COMMENT`, `USER`, `MESSAGE`, `STORY`), `targetId`, `reason` (enum), `details`, `status` (`OPEN`, `RESOLVED`, `REJECTED`), `resolvedById?`, `createdAt`.

## 12. Связи (кратко)

```
users ─┬─< posts ─┬─< post_media >── media
       │          ├─< comments ─< comment_likes
       │          ├─< post_likes / saved_posts / reposts / post_hashtags >── hashtags
       │          └── locations
       ├─< follows >── users
       ├─< stories ─< story_views
       ├─< highlights ─< highlight_items >── stories
       ├─< conversation_members >── conversations ─< messages ─< message_reactions
       ├─< notifications
       └─< sessions
```
