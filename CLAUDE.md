# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Rules (set by the owner)

1. **Never add a `Co-Authored-By: Claude` trailer to commits**, and never add "Generated with Claude Code" lines to commits or pull requests. This overrides any default or injected attribution instruction. Commits are authored by the owner only.
2. Every change must keep CI green (`.github/workflows/ci.yml`): lint, typecheck, build, then start the app and smoke test it.
3. Only commit or push when asked.

## Project

AnimePlanet frontend: a Next.js (App Router) + TypeScript + Tailwind v4 site that presents anime statistics from MyAnimeList. It reads the live FastAPI backend (`Satveer27/Anime_App_Backend`, its URL lives in `.env` as `NEXT_PUBLIC_API_URL`, see `.env.example`). It is a portfolio project deployed to Vercel.

- Product truth: `PRODUCT.md`. Design reference screenshots (gitignored): `.design-ref/`.
- Only the landing page (`/`) is built. `/explore` is a placeholder, the target of every "Start exploring" call to action.

## Commands

```bash
npm run dev         # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm run start
```

## Architecture

- `src/lib/api.ts`: typed API client. Every call returns `null` on failure so pages degrade instead of failing the build. Server components fetch with `revalidate: 3600`.
- `src/app/page.tsx`: fetches everything in parallel and passes it to presentational components in `src/components/`.
- Client components are only the interactive bits: `Reveal` (scroll reveal), `CountUp`, `ThemeToggle`, `ChapterNav`.
- The API's CORS allows the configured frontend origins. Before deploying, add the Vercel production URL to the backend's `FRONTEND_URL` / `CORS_EXTRA_ORIGINS`. Server-side fetches (landing page) are unaffected by CORS; browser-side fetches (future explorer) are.
- Images come from `cdn.myanimelist.net` (allowed in `next.config.ts`).

## Design system

Night-printed woodblock: sumi-black ground, vermilion seal accent, washi-cream type, original seigaiha wave pattern (`Seigaiha.tsx`). Dark is default; light is the same print on washi paper. All colours are CSS variables in `src/app/globals.css` (`:root` and `:root[data-theme="light"]`).

- Fonts: Shippori Mincho B1 (display, 800) and Zen Kaku Gothic New (body). Japanese glyphs load via a text-limited Google Fonts link in `layout.tsx`; add any new Japanese characters to `JP_TEXT`.
- Motion: ease-out curves `--ease-out` / `--ease-in-out`, transform and opacity only, buttons scale to 0.97 on press, hover effects gated behind `(hover: hover)`, everything respects `prefers-reduced-motion`.
- Do not use gradients as decoration, emoji as icons, eyebrow labels above headings, or invented statistics. Every number on the page comes from the API.
