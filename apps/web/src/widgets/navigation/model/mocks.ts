// Temporary data until search (BE-11) and notifications (BE-14) APIs exist

export interface SearchResult {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isVerified?: boolean;
  type: "user" | "hashtag";
  postCount?: number;
}

export const mockSearchResults: SearchResult[] = [
  {
    id: "u1",
    username: "alex_dev",
    fullName: "Alex | Fullstack Dev",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    isVerified: true,
    type: "user",
  },
  {
    id: "u2",
    username: "travel_world",
    fullName: "World Explorer & Nomad",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
    isVerified: true,
    type: "user",
  },
  {
    id: "u3",
    username: "sarah_design",
    fullName: "Sarah | UI/UX Designer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
    isVerified: false,
    type: "user",
  },
  {
    id: "u4",
    username: "elena_art",
    fullName: "Elena Petrova | Artist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
    isVerified: false,
    type: "user",
  },
  {
    id: "h1",
    username: "nextjs",
    fullName: "#nextjs",
    avatar: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120",
    type: "hashtag",
    postCount: 48200,
  },
  {
    id: "h2",
    username: "nature",
    fullName: "#nature",
    avatar: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120",
    type: "hashtag",
    postCount: 125000,
  },
];

export interface NotificationItem {
  id: string;
  user: {
    username: string;
    avatar: string;
  };
  type: "like" | "comment" | "follow";
  text: string;
  time: string;
  postImage?: string;
  isFollowing?: boolean;
  category: "today" | "week" | "earlier";
}

export const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    user: {
      username: "alex_dev",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    },
    type: "like",
    text: "понравилась ваша публикация.",
    time: "45 мин.",
    postImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120",
    category: "today",
  },
  {
    id: "n2",
    user: {
      username: "travel_world",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
    },
    type: "comment",
    text: "прокомментировал(-а): «Отличная архитектура проекта! 🔥»",
    time: "2 ч.",
    postImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120",
    category: "today",
  },
  {
    id: "n3",
    user: {
      username: "sarah_design",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
    },
    type: "follow",
    text: "подписался(-ась) на ваши обновления.",
    time: "1 д.",
    isFollowing: false,
    category: "week",
  },
  {
    id: "n4",
    user: {
      username: "elena_art",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
    },
    type: "like",
    text: "понравилась ваша публикация.",
    time: "3 д.",
    postImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120",
    category: "week",
  },
  {
    id: "n5",
    user: {
      username: "code_master",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120",
    },
    type: "follow",
    text: "подписался(-ась) на ваши обновления.",
    time: "1 нед.",
    isFollowing: true,
    category: "earlier",
  },
];
