import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { PetalField } from "@/components/PetalField";
import { ScrollTop } from "@/components/ScrollTop";

const body = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const accent = Playfair_Display({ subsets: ["latin"], weight: ["700"], style: ["italic"], variable: "--font-accent", display: "swap" });

export const metadata: Metadata = {
  title: "AnimePlanet: anime statistics from MyAnimeList",
  description:
    "Scores, drop rates, hidden gems and episode-by-episode trends for every anime on MyAnimeList, refreshed weekly.",
};

export const viewport: Viewport = { themeColor: "#0c0a0a" };

/** Only the Japanese characters we render, so the brush-font download stays tiny. */
const JP_TEXT = "数ドン始星";
const JP_FONT = `https://fonts.googleapis.com/css2?family=Yuji+Boku&family=Noto+Serif+JP:wght@700&display=swap&text=${encodeURIComponent(JP_TEXT)}`;

/** Runs before paint: restores the saved theme (dark by default) and flags that JS is available. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}document.documentElement.classList.add("js")`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${body.variable} ${accent.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={JP_FONT} />
      </head>
      <body>
        <PetalField />
        <ScrollTop />
        {children}
      </body>
    </html>
  );
}
