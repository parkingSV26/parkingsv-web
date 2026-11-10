# Parking SV

[English](README.md) | [Español](README.es.md)

**Public demo:** https://parkingsv.vercel.app/

Parking SV is a parking-discovery and management web application developed as a team project. This repository contains the Next.js web application.

## Related repositories

- **Next.js web application (this repository):** https://github.com/parkingSV26/parkingsv-web
- **Python implementation:** https://github.com/parkingSV26/PARKING-SV_PYTHON-
- **Public demo:** https://parkingsv.vercel.app/

The Python repository is maintained separately. The existence of that version should not be read as a claim that the same contributors implemented both codebases.

## Overview

The web application is a migration of the original site in `crud-php2/` toward an application built with Next.js 16 and React 19. The repository combines a visual foundation inherited from the PHP project with newer App Router screens and flows.

## Stack

- `Next.js 16.2.4`
- `React 19.2.4`
- `TypeScript 5`
- `MySQL` with `mysql2`
- `nodemailer` for transactional email
- `@node-rs/argon2` and `bcryptjs` for password compatibility

## Project status and scope

- `crud-php2/` remains in the repository as a functional and visual reference.
- The newer application is primarily organized in `app/`, `components/`, `src/` and `public/`.
- Multiple screens and navigation flows have been migrated.
- Login and parts of onboarding include demo-mode behavior.
- Some screens use database-backed data while others still use mock data.
- Parking publication remains a demo flow and does not persist a new real listing.

## Main routes

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

## Demo flow

The `/login` page includes two demo roles:

- `customer`: opens `/mis-reservas`
- `owner`: opens `/mis-parqueos`

Additional role-oriented routes:

- `/publicar-parqueo` is intended for `owner` users.
- `/mis-reservas` is intended for the `customer` role.
- `/mis-parqueos` and its reservations are intended for the `owner` role.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Environment variables

The app can run partially without the complete production infrastructure. The following variables are relevant to the full setup:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=

PENDING_VERIFICATION_SECRET=
SESSION_SECRET=
```

Use `.env.example` as a starting point when available. Never commit real credentials or production secrets.

## Repository structure

```text
app/                 Routes, pages, route handlers and feature logic
components/          Shared site header, footer and hooks
src/components/      Landing-page components and copy types
public/parkingsv/    Visual assets used by the migrated app
crud-php2/           Original PHP site used as a reference
```

## Development notes

- This project uses the Next.js App Router.
- Check the documentation matching the installed Next.js version before changing framework patterns.
- Pages and layouts are Server Components by default.
- Components using state, effects or `localStorage` should be Client Components.
- Some views retain demo data while backend integration is being completed.

## Migration notes

- When migrating a view from PHP, use `crud-php2/` as the visual reference.
- Keep browser-dependent behavior in small client components where practical.
- Document clearly whether a screen is primarily using demo data or database-backed data.
