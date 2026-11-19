import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const display = Shippori_Mincho_B1({ subsets: ["latin"], weight: ["800"], variable: "--font-display", display: "swap" });
const body = Zen_Kaku_Gothic_New({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "AnimePlanet: anime statistics from MyAnimeList",
  description:
    "Scores, drop rates, hidden gems and episode-by-episode trends for every anime on MyAnimeList, refreshed weekly.",
};

export const viewport: Viewport = { themeColor: "#0c0a0a" };

/** Only the characters we actually render in Japanese, so the font download stays tiny. */
const JP_TEXT = "数で読むアニメ惑始";
const JP_FONT = `https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&display=swap&text=${encodeURIComponent(JP_TEXT)}`;

/** Runs before paint: restores the saved theme (dark by default) and flags that JS is available. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}document.documentElement.classList.add("js")`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={JP_FONT} />
      </head>
      <body>{children}</body>
    </html>
  );
}
