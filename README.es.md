# Parking SV

[English](README.md) | [Español](README.es.md)

**Demo pública:** https://parkingsv.vercel.app/

Parking SV es una aplicación web de descubrimiento y gestión de parqueos desarrollada como proyecto en equipo. Este repositorio contiene la aplicación web construida con Next.js.

## Repositorios relacionados

- **Aplicación web Next.js (este repositorio):** https://github.com/parkingSV26/parkingsv-web
- **Implementación en Python:** https://github.com/parkingSV26/PARKING-SV_PYTHON-
- **Demo pública:** https://parkingsv.vercel.app/

El repositorio de Python se mantiene por separado. La existencia de esa versión no implica que los mismos colaboradores hayan implementado ambas bases de código.

## Descripción general

La aplicación web es una migración del sitio original ubicado en `crud-php2/` hacia una aplicación con Next.js 16 y React 19. El repositorio combina una base visual heredada del proyecto PHP con nuevas pantallas y flujos en App Router.

## Tecnologías

- `Next.js 16.2.4`
- `React 19.2.4`
- `TypeScript 5`
- `MySQL` con `mysql2`
- `nodemailer` para correo transaccional
- `@node-rs/argon2` y `bcryptjs` para compatibilidad de contraseñas

## Estado y alcance del proyecto

- `crud-php2/` permanece en el repositorio como referencia funcional y visual.
- La aplicación nueva se organiza principalmente en `app/`, `components/`, `src/` y `public/`.
- Se han migrado varias pantallas y flujos de navegación.
- El inicio de sesión y parte del proceso de registro incluyen comportamiento de demostración.
- Algunas pantallas utilizan datos de la base de datos y otras todavía utilizan datos simulados.
- La publicación de parqueos continúa siendo un flujo de demostración y no guarda una nueva publicación real.

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

## Flujo de demostración

La página `/login` incluye dos roles de demostración:

- `customer`: abre `/mis-reservas`
- `owner`: abre `/mis-parqueos`

Rutas adicionales según el rol:

- `/publicar-parqueo` está destinada a usuarios `owner`.
- `/mis-reservas` está orientada al rol `customer`.
- `/mis-parqueos` y sus reservas están orientadas al rol `owner`.

## Ejecución local

```bash
npm install
npm run dev
```

Después abre http://localhost:3000.

## Variables de entorno

La aplicación puede ejecutarse parcialmente sin toda la infraestructura de producción. Estas variables son relevantes para la configuración completa:

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

Utiliza `.env.example` como punto de partida cuando esté disponible. Nunca subas credenciales reales ni secretos de producción.

## Estructura del repositorio

```text
app/                 Rutas, páginas, route handlers y lógica por funcionalidad
components/          Encabezado, pie de página y hooks compartidos
src/components/      Componentes de la landing y tipos de contenido
public/parkingsv/    Recursos visuales utilizados por la aplicación migrada
crud-php2/           Sitio PHP original utilizado como referencia
```

## Notas de desarrollo

- Este proyecto utiliza Next.js App Router.
- Antes de cambiar patrones del framework, consulta la documentación correspondiente a la versión instalada.
- Las páginas y layouts son Server Components por defecto.
- Los componentes que utilizan estado, efectos o `localStorage` deben ser Client Components.
- Algunas vistas conservan datos de demostración mientras se completa la integración del backend.

## Notas de migración

- Al migrar una vista desde PHP, utiliza `crud-php2/` como referencia visual.
- Mantén el comportamiento que depende del navegador en componentes cliente pequeños cuando sea posible.
- Documenta claramente si una pantalla utiliza principalmente datos de demostración o datos de la base de datos.
