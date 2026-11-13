import type { Metadata, Viewport } from "next";
import { Grand_Hotel } from "next/font/google";
import "@/app/styles/globals.css";
import { Providers } from "@/app/providers";

// Script face for the wordmark only; all other text uses the platform font, like Instagram
const logoFont = Grand_Hotel({ weight: "400", subsets: ["latin"], variable: "--font-logo-script" });

export const metadata: Metadata = {
  title: { default: "Instagram", template: "%s • Instagram" },
  description: "Instagram Clone with FSD Architecture",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the bottom navigation pad itself above the iPhone home indicator
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes sets the theme class on <html> before React hydrates
    <html lang="ru" className={`${logoFont.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
