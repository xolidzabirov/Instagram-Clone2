import type { Story } from "@ig/shared";

export const mockStories: Story[] = [
  {
    id: "story_1",
    author: {
      id: "u1",
      username: "alex_dev",
      fullName: "Alex",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      isVerified: true,
    },
    items: [
      {
        id: "si_1",
        type: "image",
        url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1080",
        duration: 5,
      },
      {
        id: "si_2",
        type: "image",
        url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1080",
        duration: 5,
      },
    ],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "story_2",
    author: {
      id: "u2",
      username: "travel_world",
      fullName: "Travel World",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
      isVerified: true,
    },
    items: [
      {
        id: "si_3",
        type: "image",
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080",
        duration: 5,
      },
    ],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "story_3",
    author: {
      id: "u3",
      username: "sarah_design",
      fullName: "Sarah Designer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
      isVerified: false,
    },
    items: [
      {
        id: "si_4",
        type: "image",
        url: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1080",
        duration: 5,
      },
    ],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    createdAt: new Date().toISOString(),
  },
];
