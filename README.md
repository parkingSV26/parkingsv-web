# Parking SV

Migración del sitio original en `crud-php2/` hacia una app con `Next.js 16` y `React 19`.

## Resumen

Parking SV mezcla una base visual heredada del proyecto PHP con nuevas pantallas en App Router. El objetivo actual del repo es avanzar la migración de experiencia, rutas y flujos principales sin perder compatibilidad visual con la versión original.

## Stack

- `Next.js 16.2.4`
- `React 19.2.4`
- `TypeScript 5`
- `MySQL` con `mysql2`
- `nodemailer` para correo transaccional
- `@node-rs/argon2` y `bcryptjs` para compatibilidad de contraseñas

## Estado del proyecto

- `crud-php2/` sigue dentro del repo como referencia funcional y visual.
- La app nueva vive sobre todo en `app/`, `components/`, `src/` y `public/`.
- Varias pantallas ya están migradas y conectadas entre sí.
- El login y parte del onboarding funcionan en modo demo por cookie.
- Algunas pantallas ya consumen base de datos y otras todavía usan datos mock.
- La publicación de parqueos sigue siendo demo y no guarda una publicación nueva real.

## Rutas principales

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

## Flujo demo

En `/login` existen dos cuentas demo listas para probar el producto:

- `customer`: aterriza en `/mis-reservas`
- `owner`: aterriza en `/mis-parqueos`

Además:

- `/publicar-parqueo` solo permite acceso a usuarios `owner`
- `/mis-reservas` está orientada al rol `customer`
- `/mis-parqueos` y sus reservas están orientadas al rol `owner`

## Desarrollo local

```bash
npm install
npm run dev
```

Luego abre `http://localhost:3000`.

## Variables de entorno

La app puede correr parcialmente sin toda la infraestructura final, pero estas variables son las más relevantes:

```bash
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

Puedes usar `.env.example` como base.

## Estructura rápida

```text
app/                 Rutas, páginas, route handlers y lógica por feature
components/          Header, footer y hooks compartidos del sitio
src/components/      Componentes de la landing y tipos de copy
public/parkingsv/    Assets visuales usados por la app migrada
crud-php2/           Sitio original en PHP usado como referencia
node_modules/next/dist/docs/
                     Documentación local de la versión actual de Next.js
```

## Convenciones importantes

- Este proyecto usa `App Router`.
- Antes de cambiar patrones de Next.js, revisa la documentación local en `node_modules/next/dist/docs/`.
- En esta versión de Next, páginas y layouts son `Server Components` por defecto.
- Los componentes con estado, efectos o `localStorage` deben quedarse como `Client Components`.
- Varias vistas conservan datos demo para no bloquear la migración visual mientras se completa el backend.

## Notas para migración

- Si migras una vista desde PHP, toma `crud-php2/` como fuente de verdad visual.
- Si una ruta depende del navegador, intenta mover esa parte a un componente cliente pequeño.
- Si una pantalla mezcla datos demo y datos reales, documenta claramente cuál de los dos domina el flujo.
