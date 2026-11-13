/**
 * Counters the way Instagram shows them: exact below 10 000 ("9 842"),
 * compact above ("12,3 тыс.", "1,2 млн" / "12.3K", "1.2M").
 */
export function formatCount(value: number, locale: string): string {
  if (Math.abs(value) < 10_000) return new Intl.NumberFormat(locale).format(value);
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export type RelativeTimeUnit = "now" | "minutes" | "hours" | "days" | "weeks";

export interface RelativeTime {
  unit: RelativeTimeUnit;
  count: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Age of a post or comment in Instagram's short form ("5 мин.", "3 ч.", "2 дн.", "6 нед.").
 * Returns the unit and number; the wording comes from the translations.
 */
export function getRelativeTime(date: Date | string, now: Date = new Date()): RelativeTime {
  // Clocks differ slightly between client and server: a "future" date is just "now"
  const elapsed = Math.max(0, now.getTime() - new Date(date).getTime());
  if (elapsed < MINUTE) return { unit: "now", count: 0 };
  if (elapsed < HOUR) return { unit: "minutes", count: Math.floor(elapsed / MINUTE) };
  if (elapsed < DAY) return { unit: "hours", count: Math.floor(elapsed / HOUR) };
  if (elapsed < WEEK) return { unit: "days", count: Math.floor(elapsed / DAY) };
  return { unit: "weeks", count: Math.floor(elapsed / WEEK) };
}
