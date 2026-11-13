import Link from "next/link";
import { Fragment } from "react";

// Same rules as extractHashtags / extractMentions in @ig/shared
const TOKEN = /(#[\p{L}\p{N}_]{1,100})|((?<![\p{L}\p{N}_.])@[a-zA-Z0-9._]{1,30})/gu;

/** Caption / comment text with clickable #hashtags and @mentions (Instagram's dark-blue links) */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const token = match[0];
    if (token.startsWith("#")) {
      parts.push(
        <Link key={index} href={`/explore/tags/${encodeURIComponent(token.slice(1).toLowerCase())}`} className="text-link hover:underline">
          {token}
        </Link>
      );
      last = index + token.length;
    } else {
      // A trailing dot ends the sentence, it is not part of the username
      const name = token.slice(1).replace(/\.+$/, "");
      parts.push(
        <Link key={index} href={`/${name}`} className="text-link hover:underline">
          @{name}
        </Link>
      );
      last = index + 1 + name.length;
    }
  }
  if (last < text.length) parts.push(text.slice(last));

  return <Fragment>{parts}</Fragment>;
}
