# Parking SV — Descubrimiento y gestión de parqueos

[English](README.md) | [Español](README.es.md)

**Aplicación pública:** https://parkingsv.vercel.app/  
**Código de la aplicación web:** https://github.com/parkingSV26/parkingsv-web  
**Prototipo relacionado en Python:** https://github.com/parkingSV26/PARKING-SV_PYTHON-

## Descripción del producto

Parking SV es un concepto de aplicación web desarrollado en equipo para conectar a conductores que necesitan estacionamiento con propietarios que desean publicar y gestionar espacios. Reúne el descubrimiento de parqueos, la consulta de sus detalles y experiencias de cuenta según el tipo de usuario.

La aplicación contempla dos públicos principales:

- **Conductores:** exploran opciones publicadas, consultan ubicación y tarifas, guardan lugares y acceden a las secciones relacionadas con reservas.
- **Propietarios:** gestionan la información de sus espacios y acceden a herramientas orientadas a publicaciones y reservas.

## Áreas principales

- Página pública y catálogo de parqueos.
- Fichas de parqueos con ubicación, horarios, tarifas, capacidad, servicios, restricciones, imágenes y reseñas cuando están disponibles.
- Pantallas de registro, inicio de sesión, verificación de correo y perfil.
- Áreas para clientes: parqueos guardados, reservas, notificaciones y preferencias.
- Áreas para propietarios: gestión de parqueos y reservas relacionadas.
- Secciones de planes y anuncios.

El comportamiento real de cada flujo depende de su estado de integración. Las notas de alcance distinguen las funciones conectadas a datos de las interfaces de demostración.

## Cómo funciona la aplicación

La aplicación web utiliza **Next.js App Router** y componentes de React para construir sus páginas e interacciones. Los route handlers y módulos del servidor organizan las operaciones. Supabase proporciona la integración de autenticación/sesiones y el acceso a datos relacionales.

La capa de datos consulta en Supabase los parqueos publicados y transforma tablas relacionadas —ubicaciones, categorías, imágenes, capacidades, tarifas, servicios, restricciones y reseñas— en el modelo que utiliza la interfaz. Los clientes de Supabase con privilegios de servidor se mantienen separados del código que se ejecuta en el navegador; la integración SSR gestiona las sesiones de páginas renderizadas en el servidor.

El repositorio también conserva **crud-php2/**, la implementación PHP anterior, como referencia funcional y visual durante la migración.

## Tecnologías

- **Next.js 16** — App Router, páginas y route handlers.
- **React 19** — componentes reutilizables de interfaz.
- **TypeScript 5** — lógica y modelos de datos tipados.
- **Tailwind CSS 4** — estilos y utilidades de maquetación.
- **Supabase** — acceso a datos PostgreSQL, integración de autenticación/sesiones y almacenamiento.
- **@supabase/ssr** y **@supabase/supabase-js** — integración de clientes de servidor y librería.
- **Argon2 / bcryptjs** — utilidades de compatibilidad para hashes de contraseñas presentes en el proyecto.

## Alcance de la implementación actual

Parking SV es un proyecto colaborativo en evolución; no se afirma que todos los flujos propuestos estén terminados para producción.

- La capa de datos consulta en Supabase la información de parqueos publicados.
- El repositorio contiene módulos de API y servidor para cuentas, autenticación, favoritos, notificaciones, preferencias, registros de parqueos y reservas.
- Algunas interfaces y flujos todavía utilizan datos de demostración o marcadores provisionales.
- La experiencia de publicación de parqueos debe considerarse un flujo de prototipo mientras no se verifique su persistencia en el despliegue actual.
- La existencia de una pantalla o ruta no garantiza disponibilidad en tiempo real, una reserva confirmada, procesamiento de pagos ni operación lista para producción.

Esta distinción permite evaluar el proyecto con precisión: el repositorio demuestra estructura de aplicación full-stack y trabajo de integración en curso, mientras el alcance de producción continúa en desarrollo.

## Ejecución local

### Requisitos

- Node.js compatible con la versión instalada de Next.js.
- npm.
- Un proyecto de Supabase para las funciones conectadas a la base de datos.

### Configuración

~~~bash
npm ci
~~~

Crea un archivo local **.env.local** con las variables utilizadas por la aplicación:

~~~env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_AVATARS_BUCKET=avatars
SUPABASE_PARKINGS_BUCKET=parkings
SITE_URL=http://localhost:3000
~~~

La clave de servicio debe permanecer exclusivamente en el servidor. Nunca debe exponerse en el navegador ni subirse al repositorio.

Inicia el servidor de desarrollo:

~~~bash
npm run dev
~~~

Abre http://localhost:3000.

Comprobaciones disponibles:

~~~bash
npm run lint
npm run build
~~~

## Estructura del repositorio

~~~text
app/                 Páginas App Router, route handlers y módulos funcionales
components/          Componentes compartidos de interfaz
src/lib/supabase/    Clientes y utilidades de Supabase
src/components/      Componentes de la página principal y tipos de contenido
public/              Recursos estáticos
crud-php2/           Implementación PHP anterior utilizada como referencia
~~~

## Contexto del proyecto

Parking SV se desarrolló de forma colaborativa. Este repositorio documenta la aplicación web Next.js; el repositorio Python es una base de código independiente, con su propio historial, y no debe interpretarse como la misma implementación ni como evidencia de que los mismos colaboradores desarrollaron ambas versiones.
