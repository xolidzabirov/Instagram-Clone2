import type { ApiError } from "@/shared/api";
import type { Messages } from "@/shared/i18n";

type AuthErrorKey = keyof Messages["auth"]["errors"];

/** Maps API error codes (docs/04-api.md) to the message shown under an auth form */
export function authErrorKey(error: ApiError): AuthErrorKey {
  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "invalidCredentials";
    case "ACCOUNT_BANNED":
      return "banned";
    case "USERNAME_TAKEN":
      return "usernameTaken";
    case "EMAIL_TAKEN":
      return "emailTaken";
    case "INVALID_CODE":
      return "invalidCode";
    case "TOO_MANY_ATTEMPTS":
      return "tooManyAttempts";
    case "TOO_MANY_REQUESTS":
      return "tooManyRequests";
    case "NETWORK_ERROR":
      return "network";
    default:
      return "generic";
  }
}

/** Where to go after logging in: the page the visitor wanted, if it is on this site */
export function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
