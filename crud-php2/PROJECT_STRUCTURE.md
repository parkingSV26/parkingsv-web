# Parking SV Project Structure

## Sistema actual (legacy)

El sistema actual sigue funcionando con paginas PHP sueltas en la raiz del proyecto, por ejemplo `index.php`, `parqueos-publicados.php`, `detalles-parqueo.php`, `reservar-parqueo.php`, `mi-cuenta.php` y otras similares.

- `conexion.php` mantiene la conexion actual a MySQL con `mysqli`.
- `includes/` contiene piezas reutilizables y endpoints activos del sistema.
- `includes/security.php` ya aporta sesiones seguras, CSRF y helpers, aunque no todas las paginas lo usan de forma consistente.
- El flujo actual depende de paginas individuales en la raiz y parametros GET como `archivo.php?id=#`.

## Arquitectura futura preparada

Se agrego una base aislada para migraciones futuras, sin conectarla todavia al sistema actual.

- `app/`: espacio para controladores, modelos, servicios, middleware y vistas.
- `app/views/errors/`: vistas futuras de error.
- `config/`: configuracion central futura de aplicacion, base de datos y manejo de errores.
- `routes/`: definicion futura de rutas.
- `storage/`: almacenamiento interno para logs y cache.
- `dev-tools/`: carpeta reservada para herramientas de desarrollo cuando sea seguro moverlas.

## Limitaciones actuales

El proyecto sigue siendo una arquitectura hibrida y legacy por decision de compatibilidad.

- Hay PHP mezclado con HTML en multiples paginas.
- Las sesiones no estan centralizadas por completo.
- Existen rutas inconsistentes o incompletas en algunas partes del codigo.
- La logica esta distribuida entre paginas de raiz, `includes/` y JavaScript por pagina.
- La nueva arquitectura fue preparada, pero todavia no reemplaza el flujo actual.
