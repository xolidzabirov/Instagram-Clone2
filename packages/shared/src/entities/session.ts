/**
 * Auth contract — responses of /auth/* endpoints
 */

import type { CurrentUser } from "./user";

export interface AuthResponse {
  accessToken: string;
  /** Seconds until the access token expires */
  expiresIn: number;
  /**
   * Only for mobile clients (`X-Client: mobile`).
   * Web clients receive the refresh token as an httpOnly cookie instead.
   */
  refreshToken?: string;
  user: CurrentUser;
}

export interface SessionInfo {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export interface UsernameAvailability {
  available: boolean;
  /** Present when unavailable: why, so the form can show the right message */
  reason?: "TAKEN" | "INVALID";
  suggestions: string[];
}
