# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind, deployed to Vercel. Confirmed by the user.

## Users

Primary: anime fans who know MyAnimeList (MAL) and want to see the data behind scores: how an anime ranks, where it loses viewers, which are underrated. Secondary: recruiters and engineers evaluating this as a portfolio project; served by a small "built by" link, not by the page's main pitch.

## Product Purpose

AnimePlanet is an anime analytics site built on MAL data (about 23,000 anime). It serves search, per-anime statistics (score distribution, list status, drop rate, how a show ranks against similar ones, episode-by-episode score trend) and platform-wide statistics (counts and scores by year, type, season, tag, studio; hidden gems; most dropped). Data is refreshed on a weekly and monthly pipeline. Success: a visitor finds something they did not already know about an anime within seconds.

## Positioning

Per-anime "does it get good" episode score trend and drop-rate analytics built from MAL data, which MAL itself does not surface. Planned later: an agentic "mood search" (not built; do not present as live).

## Operating Context

Data comes from MAL through the Tenrai API into S3, cleaned into Postgres, served by a FastAPI backend (base URL in `.env` as NEXT_PUBLIC_API_URL; OpenAPI at /openapi.json). The API's CORS allows the configured frontend origins (including the local dev frontend), so the frontend calls the API directly; no proxy. The production Vercel origin must be added to the backend's FRONTEND_URL / CORS_EXTRA_ORIGINS before deploy.

## Capabilities and Constraints

Live endpoints: /api/v1/anime (search, filter, sort; images from cdn.myanimelist.net), /anime/{id}/statistics and /statistics/episodes, /statistics/by-year|by-type|by-season|by-tag|by-studio, /statistics/hidden-gems, /statistics/most-dropped, /filters, /studios, plus auth and user endpoints. Not built: mood search, MAL-username profile analysis, group watch-together. Only the landing page is being built first; the primary call to action is "Explore the data" which routes to a Browse/Explore page to be built next.

## Brand Commitments

Name: AnimePlanet (working name from the backend). MAL is the data source and must be credited honestly; the site is not affiliated with MAL.

## Evidence on Hand

Real data from the live API (counts, scores, hidden gems, most dropped, MAL cover images). No testimonials, customers or press; none may be invented.

## Product Principles

1. Show real numbers from the live API, never invented ones.
2. Every statistic should reveal something a MAL page does not.
3. Honest about scope: do not advertise unbuilt features as live.
4. Data is the hero; decoration is not.

## Accessibility & Inclusion

Meet WCAG AA contrast, keyboard access, and respect prefers-reduced-motion.
