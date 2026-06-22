# Parking SV

Migration of the original site in `crud-php2/` into a `Next.js 16` and `React 19` app.

## Overview

Parking SV combines the visual language of the original PHP project with new screens built in the App Router. The current goal of this repo is to keep moving the experience, routes, and core flows forward without losing compatibility with the original version.

## Stack

- `Next.js 16.2.4`
- `React 19.2.4`
- `TypeScript 5`
- `Supabase` via `@supabase/supabase-js` and `@supabase/ssr`
- `@node-rs/argon2` and `bcryptjs` for password compatibility

## Project Status

- `crud-php2/` is still in the repo as a functional and visual reference.
- The new app lives mostly in `app/`, `components/`, `src/`, and `public/`.
- Several screens have already been migrated and wired together.
- Login and part of onboarding work in demo mode through a cookie.
- Some screens already read from the database, while others still use mock data.
- Parking publication is still a demo flow and does not persist a real new listing yet.

## Main Routes

- `/`
- `/parqueos`
- `/parqueos/[slug]`
- `/sobre-nosotros`
- `/login`
- `/register`
- `/verify-email`
- `/mi-cuenta`
- `/mis-reservas`
- `/mis-parqueos`
- `/mis-parqueos/[parkingId]/reservas`
- `/guardados`
- `/guardados/carpeta/[id]`
- `/notificaciones`
- `/configuracion`
- `/publicar-parqueo`
- `/planes`

## Demo Flow

There are two demo accounts available at `/login`:

- `customer`: lands on `/mis-reservas`
- `owner`: lands on `/mis-parqueos`

Also:

- `/publicar-parqueo` only allows `owner` users
- `/mis-reservas` is oriented to the `customer` role
- `/mis-parqueos` and its reservations are oriented to the `owner` role

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment Variables

The app can run partially without the full production setup, but these variables are the most relevant:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_AVATARS_BUCKET=
SUPABASE_PARKINGS_BUCKET=
SITE_URL=
```

You can use `.env.example` as a starting point.

## Quick Structure

```text
app/                 Routes, pages, route handlers, and feature-specific logic
components/          Shared header, footer, and hooks for the site
src/components/      Landing page components and copy types
public/parkingsv/    Visual assets used by the migrated app
crud-php2/           Original PHP site kept as a reference
node_modules/next/dist/docs/
                     Local documentation for the current Next.js version
```

## Important Conventions

- This project uses the `App Router`.
- Before changing Next.js patterns, check the local docs in `node_modules/next/dist/docs/`.
- In this Next version, pages and layouts are `Server Components` by default.
- Components that use state, effects, or `localStorage` should stay as `Client Components`.
- Several views still keep demo data so the visual migration can move ahead while the backend is finished.

## Migration Notes

- If you migrate a view from PHP, treat `crud-php2/` as the visual source of truth.
- If a route depends on the browser, try moving that part into a small client component.
- If a screen mixes demo data with real data, document which one drives the flow.
