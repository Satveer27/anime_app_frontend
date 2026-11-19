# AnimePlanet frontend

Anime statistics from MyAnimeList, built with Next.js, TypeScript and Tailwind. It reads the live AnimePlanet API (FastAPI, Postgres, Redis, Airflow pipeline).

Built: the landing page and the explorer (`/explore`) with search, filters shared through the URL, and a per-anime stat sheet drawer. The landing page It shows real data from the API: the catalogue size, an episode-by-episode score trend, the highest drop rates, hidden gems, a score distribution, the top 12 anime and the catalogue mix by type.

## Run it

```bash
npm install
cp .env.example .env         # then set NEXT_PUBLIC_API_URL to the real API
npm run dev                  # http://localhost:3000
```

```bash
npm run lint
npm run typecheck
npm run build && npm run start
```

## Deploy to Vercel

1. Import the repo in Vercel (framework: Next.js, no settings needed).
2. Set `NEXT_PUBLIC_API_URL` to the API base URL (including `/api/v1`).
3. Add the Vercel URL to the backend's `FRONTEND_URL` or `CORS_EXTRA_ORIGINS` so browser-side calls (the future explorer) are allowed by CORS. The landing page fetches on the server, so it works without this.

## CI

`.github/workflows/ci.yml` runs lint, typecheck and build, checks the backend health endpoint, then starts the app and fails if the landing page or `/explore` do not respond or the server logs an error.
