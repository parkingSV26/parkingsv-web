# Parking SV — Parking Discovery & Management

[English](README.md) | [Español](README.es.md)

**Live application:** https://parkingsv.vercel.app/  
**Web application source:** https://github.com/parkingSV26/parkingsv-web  
**Related Python prototype:** https://github.com/parkingSV26/PARKING-SV_PYTHON-

## Product overview

Parking SV is a team-developed web application concept for connecting drivers who need parking with owners who want to publish and manage parking spaces. It brings parking discovery, location details and role-oriented account experiences into one web interface.

The application is designed around two main audiences:

- **Drivers:** explore published parking options, review location and pricing information, save places and access reservation-related areas.
- **Parking owners:** manage their parking information and access owner-oriented tools for listings and reservations.

## Main product areas

- Public landing page and parking catalogue.
- Parking detail views with location, schedule, rates, capacity, services, restrictions, images and review information when available.
- Account registration, sign-in, email-verification and profile-related screens.
- Customer-oriented areas for saved parking, reservations, notifications and preferences.
- Owner-oriented areas for managing parking spaces and related reservations.
- Plans and advertising sections.

The actual behavior of each flow depends on its current integration status; the scope notes below distinguish implemented data flows from demonstration interfaces.

## How the application works

The web application uses the **Next.js App Router** and React components to render its pages and interactive experiences. Route handlers and server-side modules organize application operations. Supabase is used for authentication/session integration and relational data access.

The parking data layer queries published records from Supabase and maps related tables—such as locations, categories, images, capacity, fees, services, restrictions and reviews—into the model used by the interface. Server-side Supabase clients are kept separate from browser-facing code, and the application uses the Supabase SSR integration to manage server-rendered sessions.

The repository also contains **crud-php2/**, the earlier PHP implementation retained as a functional and visual reference during the migration.

## Technology stack

- **Next.js 16** — App Router, pages and route handlers.
- **React 19** — reusable interface components.
- **TypeScript 5** — typed application logic and data models.
- **Tailwind CSS 4** — styling and layout utilities.
- **Supabase** — PostgreSQL data access, authentication/session integration and storage.
- **@supabase/ssr** and **@supabase/supabase-js** — server-side and client library integration.
- **Argon2 / bcryptjs** — password-hash compatibility utilities present in the project.

## Current implementation scope

Parking SV is an evolving team project rather than a claim that every proposed product workflow is already production-complete.

- Published parking information is read through the Supabase-backed data layer.
- The repository contains API and server-side modules for accounts, authentication, favorites, notifications, preferences, parking records and reservations.
- Some interfaces and flows still use demonstration or placeholder data.
- The parking-publication experience should be treated as a prototype flow unless its persistence is verified in the current deployment.
- A visible screen or route does not, by itself, guarantee real-time availability, a confirmed booking, payment processing or production-grade operation.

This distinction matters when evaluating the project: the repository demonstrates full-stack application structure and ongoing integration work, while its production scope remains under development.

## Local development

### Requirements

- Node.js compatible with the installed Next.js version.
- npm.
- A Supabase project for database-backed features.

### Setup

~~~bash
npm ci
~~~

Create a local **.env.local** file with the environment values used by the application:

~~~env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_AVATARS_BUCKET=avatars
SUPABASE_PARKINGS_BUCKET=parkings
SITE_URL=http://localhost:3000
~~~

The service-role key is server-only and must never be exposed in browser code or committed to the repository.

Start the development server:

~~~bash
npm run dev
~~~

Open http://localhost:3000.

Other available checks:

~~~bash
npm run lint
npm run build
~~~

## Repository layout

~~~text
app/                 App Router pages, route handlers and feature modules
components/          Shared interface components
src/lib/supabase/    Supabase client, server and environment helpers
src/components/      Landing-page components and content types
public/              Static assets
crud-php2/           Earlier PHP implementation used as a reference
~~~

## Project context

Parking SV was developed collaboratively. This repository documents the Next.js web application; the Python repository is a separate codebase with its own source history and should not be treated as the same implementation or as proof that the same contributors built both versions.
