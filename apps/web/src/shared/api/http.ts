import axios, { type AxiosRequestConfig } from "axios";
import { API_URL } from "@/shared/config";
import { toApiError } from "./errors";

/**
 * How the HTTP client reaches the session without importing it (shared must not depend
 * on entities). entities/session plugs itself in with `configureAuth`.
 */
interface AuthHooks {
  getAccessToken: () => string | null;
  /** Gets a new access token; resolves null when there is no session any more */
  refresh: () => Promise<string | null>;
  onSessionLost: () => void;
}

let auth: AuthHooks = {
  getAccessToken: () => null,
  refresh: async () => null,
  onSessionLost: () => {},
};

export function configureAuth(hooks: AuthHooks) {
  auth = hooks;
}

export const http = axios.create({ baseURL: API_URL, timeout: 20_000 });

http.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

/** Codes after which a fresh access token may help (docs/04-api.md, auth error codes) */
const REFRESHABLE = new Set(["TOKEN_EXPIRED", "UNAUTHORIZED"]);

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = toApiError(error);
    const config = error.config as RetriableConfig | undefined;
    const isAuthCall = config?.url?.startsWith("/auth/");

    if (apiError.status === 401 && config && !config._retried && !isAuthCall && REFRESHABLE.has(apiError.code)) {
      config._retried = true;
      const token = await auth.refresh();
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
        return http(config);
      }
      auth.onSessionLost();
    } else if (apiError.status === 401 && apiError.code === "SESSION_REVOKED") {
      auth.onSessionLost();
    }
    throw apiError;
  }
);
