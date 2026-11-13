import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevUiPage } from "@/pages/dev-ui";

export const metadata: Metadata = { title: "UI kit", robots: { index: false } };

/** Component catalogue for development; not part of the production site */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevUiPage />;
}
