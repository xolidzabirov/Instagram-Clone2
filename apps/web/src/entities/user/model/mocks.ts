import type { UserPreview } from "@ig/shared";

// Temporary stand-in for the signed-in user until the auth API is wired up
export const mockCurrentUser: UserPreview = {
  id: "current_user",
  username: "kholid_official",
  fullName: "Kholid",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  isVerified: true,
};
