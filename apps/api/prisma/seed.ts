/**
 * Development seed: realistic data for every part of the app.
 * WARNING: wipes all tables of the target database first.
 *
 *   pnpm --filter @ig/api db:seed
 *
 * Accounts: demo / Demo1234 (regular user), admin / Admin1234 (ADMIN)
 */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { v7 as uuidv7 } from "uuid";
import {
  AspectRatio,
  ConversationType,
  FollowStatus,
  MediaPurpose,
  MediaStatus,
  MediaType,
  MessageType,
  NotificationType,
  PrismaClient,
  StoryAudience,
  type Prisma,
} from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// ─── Deterministic randomness so every seed run produces the same data ─────────

let rngState = 20261028;
function random() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)]!;
const sample = <T>(items: readonly T[], count: number): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(0, i);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, Math.min(count, copy.length));
};
const chance = (probability: number) => random() < probability;

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW - ms);
/** UUID v7 whose timestamp matches createdAt, so cursor order equals time order */
const idAt = (date: Date) => uuidv7({ msecs: date.getTime() });

// ─── Reference data ───────────────────────────────────────────────────────────

const TOPICS = [
  { slug: "travel", nameRu: "Путешествия", nameEn: "Travel", tags: ["travel", "wanderlust", "mountains", "explore"] },
  { slug: "food", nameRu: "Еда", nameEn: "Food", tags: ["food", "foodie", "coffee", "breakfast"] },
  { slug: "code", nameRu: "Программирование", nameEn: "Coding", tags: ["coding", "javascript", "nextjs", "webdev"] },
  { slug: "design", nameRu: "Дизайн", nameEn: "Design", tags: ["design", "uiux", "typography", "minimal"] },
  { slug: "nature", nameRu: "Природа", nameEn: "Nature", tags: ["nature", "sunset", "forest", "ocean"] },
  { slug: "architecture", nameRu: "Архитектура", nameEn: "Architecture", tags: ["architecture", "city", "interior"] },
  { slug: "art", nameRu: "Искусство", nameEn: "Art", tags: ["art", "illustration", "painting"] },
  { slug: "fitness", nameRu: "Спорт", nameEn: "Fitness", tags: ["fitness", "running", "workout"] },
  { slug: "music", nameRu: "Музыка", nameEn: "Music", tags: ["music", "guitar", "concert"] },
  { slug: "fashion", nameRu: "Мода", nameEn: "Fashion", tags: ["fashion", "style", "ootd"] },
  { slug: "cars", nameRu: "Авто", nameEn: "Cars", tags: ["cars", "roadtrip"] },
  { slug: "pets", nameRu: "Питомцы", nameEn: "Pets", tags: ["pets", "cats", "dogs"] },
] as const;

const LOCATIONS = [
  { name: "Душанбе", city: "Душанбе", country: "Таджикистан", lat: 38.5598, lng: 68.787 },
  { name: "Памир", city: "Хорог", country: "Таджикистан", lat: 37.4897, lng: 71.5531 },
  { name: "Искандеркуль", city: "Согдийская область", country: "Таджикистан", lat: 39.0767, lng: 68.3714 },
  { name: "Самарканд", city: "Самарканд", country: "Узбекистан", lat: 39.6542, lng: 66.9597 },
  { name: "Алматы", city: "Алматы", country: "Казахстан", lat: 43.2389, lng: 76.8897 },
  { name: "Москва-Сити", city: "Москва", country: "Россия", lat: 55.7494, lng: 37.5376 },
  { name: "Стамбул, Галатская башня", city: "Стамбул", country: "Турция", lat: 41.0256, lng: 28.9742 },
  { name: "Дубай Марина", city: "Дубай", country: "ОАЭ", lat: 25.0805, lng: 55.1403 },
  { name: "Тбилиси", city: "Тбилиси", country: "Грузия", lat: 41.7151, lng: 44.8271 },
  { name: "Баку, Старый город", city: "Баку", country: "Азербайджан", lat: 40.3667, lng: 49.8352 },
];

const FIRST_NAMES = [
  "Алекс", "Сара", "Камила", "Фаррух", "Мадина", "Джон", "Елена", "Тимур", "Нигина", "Рустам",
  "Зарина", "Давид", "Амир", "Лейла", "Иван", "Мария", "Сухроб", "Анна", "Бехруз", "Дилноза",
  "Максим", "Сабина", "Шахзод", "Вера", "Азиз", "Ольга", "Комрон", "Алия",
];
const HANDLES = [
  "alex_dev", "sarah_design", "kamila.travels", "farrukh.codes", "madina_art", "john_doe",
  "elena.photo", "timur_fit", "nigina.food", "rustam.cars", "zarina_style", "david.music",
  "amir.arch", "leila.pets", "ivan_nature", "maria.ui", "suhrob.dev", "anna.coffee",
  "behruz_runs", "dilnoza.design", "max_shots", "sabina.ootd", "shahzod.trip", "vera.paints",
  "aziz.beats", "olga_minimal", "komron.city", "aliya.sunset",
];
const BIOS = [
  "📍 Душанбе • Делюсь моментами",
  "Fullstack developer ⚡ React • Node • TypeScript",
  "Путешествую и снимаю ✈️📸",
  "UI/UX дизайнер • Минимализм — это стиль жизни",
  "Кофе, книги и хорошая музыка ☕🎧",
  "Спорт каждый день 💪",
  "Рисую то, что вижу 🎨",
  "",
];
const CAPTION_STARTS = [
  "Отличный день!",
  "Не мог(-ла) пройти мимо этого вида",
  "Новый проект готов 🚀",
  "Тот самый момент ✨",
  "Выходные удались",
  "Просто оставлю это здесь",
  "Вдохновение повсюду",
  "Сохраняйте, чтобы не потерять 📌",
  "Golden hour 🌅",
  "Маленькие радости",
];
const COMMENTS = [
  "Очень красиво! 😍", "Вау 🔥🔥🔥", "Где это?", "Шикарный кадр 👏", "Хочу туда!",
  "Супер 👍", "Вдохновляет ✨", "Это просто огонь", "Класс!", "Какая камера?",
  "Обожаю такие места", "❤️❤️❤️", "Очень стильно", "Сохранил(-а) себе", "Красота!",
];
const REPLIES = ["Спасибо! ❤️", "Согласен(-на) 😄", "Да, очень!", "Спасибо, рад(-а) что понравилось 🙏"];
const MESSAGES = [
  "Привет! Как дела?", "Видел(-а) твой последний пост 🔥", "Где это снимал(-а)?",
  "Давай встретимся на выходных", "Отправь, пожалуйста, ту фотку", "Ахах, точно 😂",
  "Ок, договорились 👍", "Спасибо!",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** picsum.photos serves a stable photo per seed; sizes mirror our WebP variants */
function imageMedia(
  ownerId: string,
  seed: string,
  width: number,
  height: number,
  createdAt: Date,
  purpose: MediaPurpose = MediaPurpose.POST
): Prisma.MediaCreateManyInput {
  const url = (w: number) => `https://picsum.photos/seed/${seed}/${w}/${Math.round((w * height) / width)}`;
  return {
    id: idAt(createdAt),
    ownerId,
    type: MediaType.IMAGE,
    purpose,
    status: MediaStatus.READY,
    originalKey: `seed/${seed}`,
    variants: { "1080": url(1080), "640": url(640), "320": url(320) },
    width,
    height,
    mime: "image/jpeg",
    sizeBytes: 250_000,
    createdAt,
  };
}

async function wipeDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
}

/** Recomputes every denormalized counter from the real rows */
async function recomputeCounters() {
  await prisma.$executeRaw`
    UPDATE users u SET
      "postsCount"     = (SELECT count(*) FROM posts p WHERE p."authorId" = u.id AND p."deletedAt" IS NULL AND NOT p."isArchived"),
      "followersCount" = (SELECT count(*) FROM follows f WHERE f."followingId" = u.id AND f.status = 'ACCEPTED'),
      "followingCount" = (SELECT count(*) FROM follows f WHERE f."followerId" = u.id AND f.status = 'ACCEPTED')`;
  await prisma.$executeRaw`
    UPDATE posts p SET
      "likesCount"    = (SELECT count(*) FROM post_likes l WHERE l."postId" = p.id),
      "commentsCount" = (SELECT count(*) FROM comments c WHERE c."postId" = p.id AND c."deletedAt" IS NULL),
      "savesCount"    = (SELECT count(*) FROM saved_posts s WHERE s."postId" = p.id),
      "repostsCount"  = (SELECT count(*) FROM reposts r WHERE r."postId" = p.id)`;
  await prisma.$executeRaw`
    UPDATE comments c SET
      "likesCount"   = (SELECT count(*) FROM comment_likes l WHERE l."commentId" = c.id),
      "repliesCount" = (SELECT count(*) FROM comments r WHERE r."parentId" = c.id AND r."deletedAt" IS NULL)`;
  await prisma.$executeRaw`
    UPDATE hashtags h SET "postsCount" = (SELECT count(*) FROM post_hashtags ph WHERE ph."hashtagId" = h.id)`;
  await prisma.$executeRaw`
    UPDATE locations l SET "postsCount" = (SELECT count(*) FROM posts p WHERE p."locationId" = l.id)`;
  await prisma.$executeRaw`
    UPDATE stories s SET "viewsCount" = (SELECT count(*) FROM story_views v WHERE v."storyId" = s.id)`;
  // Explore ranking placeholder until the BE-11 scoring job exists
  await prisma.$executeRaw`
    UPDATE posts SET score =
      ln(1 + "likesCount" + 2 * "commentsCount" + 3 * "savesCount" + 4 * "repostsCount")
      / power(1 + extract(epoch FROM (now() - "createdAt")) / 86400.0, 0.5)`;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Wiping database…");
  await wipeDatabase();

  console.log("Reference data…");
  const topicIdBySlug = new Map<string, string>();
  const hashtagIdByName = new Map<string, string>();
  const hashtagTopics: Prisma.HashtagTopicCreateManyInput[] = [];
  for (const topic of TOPICS) {
    const id = uuidv7();
    topicIdBySlug.set(topic.slug, id);
    for (const tag of topic.tags) {
      const hashtagId = uuidv7();
      hashtagIdByName.set(tag, hashtagId);
      hashtagTopics.push({ hashtagId, topicId: id });
    }
  }
  await prisma.topic.createMany({
    data: TOPICS.map(({ slug, nameRu, nameEn }) => ({ id: topicIdBySlug.get(slug)!, slug, nameRu, nameEn })),
  });
  await prisma.hashtag.createMany({
    data: [...hashtagIdByName].map(([name, id]) => ({ id, name })),
  });
  await prisma.hashtagTopic.createMany({ data: hashtagTopics });

  const locations = LOCATIONS.map((l) => ({ id: uuidv7(), ...l }));
  await prisma.location.createMany({ data: locations });

  console.log("Users…");
  const [demoHash, adminHash, userHash] = await Promise.all([
    hash("Demo1234"),
    hash("Admin1234"),
    hash("Password1"),
  ]);

  type SeedUser = { id: string; username: string; topics: string[]; isPrivate: boolean };
  const users: SeedUser[] = [];
  const userRows: Prisma.UserCreateManyInput[] = [];
  const avatarRows: Prisma.MediaCreateManyInput[] = [];

  const addUser = (
    username: string,
    fullName: string,
    passwordHash: string,
    extra: Partial<Prisma.UserCreateManyInput> = {}
  ) => {
    const createdAt = ago(int(90, 400) * DAY);
    const id = idAt(createdAt);
    const avatarId = uuidv7({ msecs: createdAt.getTime() + 1 });
    const avatarUrl = `https://i.pravatar.cc/320?u=${username}`;
    avatarRows.push({
      id: avatarId,
      ownerId: id,
      type: MediaType.IMAGE,
      purpose: MediaPurpose.AVATAR,
      status: MediaStatus.READY,
      originalKey: `seed/avatar/${username}`,
      variants: { "320": avatarUrl, "150": `https://i.pravatar.cc/150?u=${username}` },
      width: 320,
      height: 320,
      mime: "image/jpeg",
      sizeBytes: 30_000,
      createdAt,
    });
    userRows.push({
      id,
      username,
      email: `${username.replace(/\./g, "_")}@instagram.local`,
      emailVerifiedAt: createdAt,
      passwordHash,
      fullName,
      bio: pick(BIOS),
      avatarMediaId: avatarId,
      isVerified: chance(0.15),
      createdAt,
      ...extra,
    });
    const user: SeedUser = {
      id,
      username,
      topics: sample(TOPICS.map((t) => t.slug), int(2, 4)),
      isPrivate: Boolean(extra.isPrivate),
    };
    users.push(user);
    return user;
  };

  const demo = addUser("demo", "Demo User", demoHash, {
    bio: "Тестовый аккаунт Instagram Clone 👋",
    isVerified: true,
  });
  const admin = addUser("admin", "Administrator", adminHash, { role: "ADMIN" });
  HANDLES.forEach((handle, i) =>
    addUser(handle, FIRST_NAMES[i % FIRST_NAMES.length]!, userHash, { isPrivate: i % 9 === 4 })
  );
  const regularUsers = users.filter((u) => u.id !== admin.id);

  // Avatars reference owners and users reference avatars: insert users first, then link
  await prisma.user.createMany({ data: userRows.map((u) => ({ ...u, avatarMediaId: null })) });
  await prisma.media.createMany({ data: avatarRows });
  await prisma.$transaction(
    userRows.map((u) =>
      prisma.user.update({ where: { id: u.id! }, data: { avatarMediaId: u.avatarMediaId } })
    )
  );
  await prisma.privacySettings.createMany({ data: users.map((u) => ({ userId: u.id })) });
  await prisma.notificationSettings.createMany({ data: users.map((u) => ({ userId: u.id })) });

  console.log("Follows…");
  const follows: Prisma.FollowCreateManyInput[] = [];
  const followSet = new Set<string>();
  const addFollow = (followerId: string, followingId: string, status: FollowStatus = FollowStatus.ACCEPTED) => {
    const key = `${followerId}:${followingId}`;
    if (followerId === followingId || followSet.has(key)) return;
    followSet.add(key);
    follows.push({
      followerId,
      followingId,
      status,
      isFavorite: status === FollowStatus.ACCEPTED && chance(0.08),
      createdAt: ago(int(1, 80) * DAY),
    });
  };
  for (const user of regularUsers) {
    for (const target of sample(regularUsers, int(6, 16))) {
      addFollow(user.id, target.id, target.isPrivate && chance(0.3) ? FollowStatus.PENDING : FollowStatus.ACCEPTED);
    }
  }
  for (const target of sample(regularUsers, 18)) addFollow(demo.id, target.id);
  for (const follower of sample(regularUsers, 15)) addFollow(follower.id, demo.id);
  await prisma.follow.createMany({ data: follows });

  const acceptedFollowersOf = (userId: string) =>
    follows.filter((f) => f.followingId === userId && f.status === FollowStatus.ACCEPTED).map((f) => f.followerId);

  await prisma.closeFriend.createMany({
    data: sample(acceptedFollowersOf(demo.id), 4).map((friendId) => ({ ownerId: demo.id, friendId })),
  });

  console.log("Posts…");
  const media: Prisma.MediaCreateManyInput[] = [];
  const posts: Prisma.PostCreateManyInput[] = [];
  const postMedia: Prisma.PostMediaCreateManyInput[] = [];
  const postHashtags: Prisma.PostHashtagCreateManyInput[] = [];
  const postTopics: Prisma.PostTopicCreateManyInput[] = [];
  const postsByAuthor = new Map<string, string[]>();

  for (const author of regularUsers) {
    const count = author.id === demo.id ? 12 : int(5, 14);
    for (let i = 0; i < count; i++) {
      const createdAt = ago(int(1, 60 * 24) * HOUR);
      const postId = idAt(createdAt);
      const topicSlug = pick(author.topics);
      const topic = TOPICS.find((t) => t.slug === topicSlug)!;
      const tags = sample(topic.tags, int(1, 3));
      const slides = chance(0.25) ? int(2, 5) : 1;

      for (let position = 0; position < slides; position++) {
        const m = imageMedia(author.id, `${postId}-${position}`, 1080, 1440, createdAt);
        m.id = uuidv7({ msecs: createdAt.getTime() + position + 1 });
        media.push(m);
        postMedia.push({ postId, mediaId: m.id, position });
      }

      posts.push({
        id: postId,
        authorId: author.id,
        caption: `${pick(CAPTION_STARTS)} ${tags.map((t) => `#${t}`).join(" ")}`,
        locationId: chance(0.5) ? pick(locations).id : null,
        aspectRatio: AspectRatio.PORTRAIT_3_4,
        createdAt,
        pinnedAt: author.id === demo.id && i === 0 ? createdAt : null,
      });
      for (const tag of tags) postHashtags.push({ postId, hashtagId: hashtagIdByName.get(tag)! });
      postTopics.push({ postId, topicId: topicIdBySlug.get(topicSlug)! });
      postsByAuthor.set(author.id, [...(postsByAuthor.get(author.id) ?? []), postId]);
    }
  }
  await prisma.media.createMany({ data: media });
  await prisma.post.createMany({ data: posts });
  await prisma.postMedia.createMany({ data: postMedia });
  await prisma.postHashtag.createMany({ data: postHashtags });
  await prisma.postTopic.createMany({ data: postTopics });

  console.log("Likes, saves, reposts, comments…");
  const likes: Prisma.PostLikeCreateManyInput[] = [];
  const saves: Prisma.SavedPostCreateManyInput[] = [];
  const reposts: Prisma.RepostCreateManyInput[] = [];
  const comments: Prisma.CommentCreateManyInput[] = [];
  const commentLikes: Prisma.CommentLikeCreateManyInput[] = [];

  for (const post of posts) {
    const postCreated = (post.createdAt as Date).getTime();
    const since = (offset: number) => new Date(Math.min(NOW, postCreated + offset));
    const audience = regularUsers.filter((u) => u.id !== post.authorId);

    for (const liker of sample(audience, int(0, 20))) {
      likes.push({ userId: liker.id, postId: post.id!, createdAt: since(int(1, 48) * HOUR) });
    }
    for (const saver of sample(audience, int(0, 3))) {
      saves.push({ userId: saver.id, postId: post.id!, createdAt: since(int(1, 72) * HOUR) });
    }
    if (chance(0.08)) {
      reposts.push({ userId: pick(audience).id, postId: post.id!, createdAt: since(int(2, 72) * HOUR) });
    }

    for (let c = 0; c < int(0, 5); c++) {
      const createdAt = since(int(5, 60 * 24) * 60_000);
      const commentId = idAt(createdAt);
      comments.push({ id: commentId, postId: post.id!, authorId: pick(audience).id, text: pick(COMMENTS), createdAt });
      for (const liker of sample(audience, int(0, 4))) {
        commentLikes.push({ userId: liker.id, commentId });
      }
      if (chance(0.3)) {
        const replyAt = new Date(Math.min(NOW, createdAt.getTime() + int(10, 600) * 60_000));
        comments.push({
          id: idAt(replyAt),
          postId: post.id!,
          authorId: post.authorId,
          parentId: commentId,
          text: pick(REPLIES),
          createdAt: replyAt,
        });
      }
    }
  }
  await prisma.postLike.createMany({ data: likes });
  await prisma.savedPost.createMany({ data: saves });
  await prisma.repost.createMany({ data: reposts });
  await prisma.comment.createMany({ data: comments });
  await prisma.commentLike.createMany({ data: commentLikes });

  const demoCollection = await prisma.collection.create({ data: { userId: demo.id, name: "Вдохновение" } });
  const demoSaves = await prisma.savedPost.findMany({ where: { userId: demo.id }, take: 3 });
  for (const save of demoSaves) {
    await prisma.savedPost.update({
      where: { userId_postId: { userId: demo.id, postId: save.postId } },
      data: { collectionId: demoCollection.id },
    });
  }

  console.log("Stories…");
  const storyMedia: Prisma.MediaCreateManyInput[] = [];
  const stories: Prisma.StoryCreateManyInput[] = [];
  const storyViews: Prisma.StoryViewCreateManyInput[] = [];
  for (const author of sample(regularUsers, 14).concat(demo)) {
    for (let s = 0; s < int(1, 3); s++) {
      const createdAt = ago(int(10, 20 * 60) * 60_000);
      const m = imageMedia(author.id, `story-${author.username}-${s}`, 1080, 1920, createdAt, MediaPurpose.STORY);
      storyMedia.push(m);
      const storyId = uuidv7({ msecs: createdAt.getTime() + 1 });
      stories.push({
        id: storyId,
        authorId: author.id,
        mediaId: m.id!,
        audience: author.id === demo.id && s === 0 ? StoryAudience.CLOSE_FRIENDS : StoryAudience.ALL,
        createdAt,
        expiresAt: new Date(createdAt.getTime() + DAY),
      });
      for (const viewer of sample(acceptedFollowersOf(author.id), int(0, 8))) {
        storyViews.push({ storyId, viewerId: viewer, reaction: chance(0.1) ? "🔥" : null });
      }
    }
  }
  await prisma.media.createMany({ data: storyMedia });
  await prisma.story.createMany({ data: stories });
  await prisma.storyView.createMany({ data: storyViews, skipDuplicates: true });

  const demoStory = stories.find((s) => s.authorId === demo.id)!;
  await prisma.highlight.create({
    data: {
      ownerId: demo.id,
      title: "Поездки",
      coverMediaId: demoStory.mediaId,
      items: { create: [{ storyId: demoStory.id!, position: 0 }] },
    },
  });

  console.log("Direct…");
  const demoFollowing = follows.filter((f) => f.followerId === demo.id).map((f) => f.followingId);
  for (const partnerId of demoFollowing.slice(0, 4)) {
    const [a, b] = [demo.id, partnerId].sort();
    const startedAt = ago(int(1, 10) * DAY);
    const conversation = await prisma.conversation.create({
      data: {
        id: idAt(startedAt),
        type: ConversationType.DIRECT,
        directKey: `${a}:${b}`,
        createdById: demo.id,
        createdAt: startedAt,
        members: { create: [{ userId: demo.id }, { userId: partnerId }] },
      },
    });
    let lastAt = startedAt.getTime();
    let lastId = "";
    for (let m = 0; m < int(2, 7); m++) {
      lastAt = Math.min(NOW - 60_000, lastAt + int(1, 180) * 60_000);
      const message = await prisma.message.create({
        data: {
          id: uuidv7({ msecs: lastAt }),
          conversationId: conversation.id,
          senderId: chance(0.5) ? demo.id : partnerId,
          type: MessageType.TEXT,
          text: pick(MESSAGES),
          clientId: `seed-${conversation.id}-${m}`,
          createdAt: new Date(lastAt),
        },
      });
      lastId = message.id;
    }
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageId: lastId, lastMessageAt: new Date(lastAt) },
    });
  }
  await prisma.note.create({
    data: {
      authorId: demoFollowing[0]!,
      text: "Кто на концерт в субботу? 🎶",
      expiresAt: new Date(NOW + 20 * HOUR),
    },
  });

  console.log("Notifications…");
  const demoPostIds = new Set(postsByAuthor.get(demo.id));
  const notifications: Prisma.NotificationCreateManyInput[] = [
    ...likes
      .filter((l) => demoPostIds.has(l.postId))
      .slice(0, 25)
      .map((l) => ({
        recipientId: demo.id,
        actorId: l.userId,
        type: NotificationType.LIKE,
        postId: l.postId,
        groupKey: `LIKE:post:${l.postId}`,
        createdAt: l.createdAt as Date,
        readAt: chance(0.6) ? new Date() : null,
      })),
    ...comments
      .filter((c) => demoPostIds.has(c.postId) && c.authorId !== demo.id && !c.parentId)
      .slice(0, 10)
      .map((c) => ({
        recipientId: demo.id,
        actorId: c.authorId,
        type: NotificationType.COMMENT,
        postId: c.postId,
        commentId: c.id,
        groupKey: `COMMENT:${c.id}`,
        createdAt: c.createdAt as Date,
      })),
    ...follows
      .filter((f) => f.followingId === demo.id)
      .map((f) => ({
        recipientId: demo.id,
        actorId: f.followerId,
        type: NotificationType.FOLLOW,
        groupKey: `FOLLOW:${f.followerId}`,
        createdAt: f.createdAt as Date,
      })),
  ];
  await prisma.notification.createMany({ data: notifications });

  await prisma.userTopicWeight.createMany({
    data: demo.topics.map((slug) => ({ userId: demo.id, topicId: topicIdBySlug.get(slug)!, weight: 0.6 })),
  });

  console.log("Counters…");
  await recomputeCounters();

  const summary = {
    users: users.length,
    follows: follows.length,
    posts: posts.length,
    media: media.length + avatarRows.length + storyMedia.length,
    likes: likes.length,
    comments: comments.length,
    stories: stories.length,
    notifications: notifications.length,
  };
  console.table(summary);
  console.log("Done. Log in as demo / Demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
