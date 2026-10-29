/**
 * Caption parsing shared by clients (highlighting) and the API (indexing).
 * Instagram limits: 30 hashtags and 20 mentions per caption.
 */

export const MAX_HASHTAGS = 30;
export const MAX_MENTIONS = 20;

const HASHTAG = /#([\p{L}\p{N}_]{1,100})/gu;
const MENTION = /(^|[^\p{L}\p{N}_.])@([a-zA-Z0-9._]{1,30})/gu;

/** Unique, lower-cased hashtags in order of appearance */
export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(HASHTAG)) {
    // A tag made only of digits ("#1") is not a hashtag on Instagram
    if (/^\d+$/.test(match[1]!)) continue;
    tags.add(match[1]!.toLowerCase());
    if (tags.size === MAX_HASHTAGS) break;
  }
  return [...tags];
}

/** Unique, lower-cased usernames mentioned with @ (not inside emails) */
export function extractMentions(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(MENTION)) {
    // Trailing dots end a sentence, they are not part of the username
    const name = match[2]!.replace(/\.+$/, "").toLowerCase();
    if (name.length >= 1) names.add(name);
    if (names.size === MAX_MENTIONS) break;
  }
  return [...names];
}
