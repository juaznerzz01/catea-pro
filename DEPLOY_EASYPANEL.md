# Despliegue en Easypanel

Este proyecto queda preparado como un stack Docker con cuatro servicios: `frontend`, `backend`, `postgres` y `redis`.

## Dominios

Ejemplo:

- Frontend: `https://app.tu-dominio.com` -> servicio `frontend`, puerto interno `3000`
- Backend/API: `https://api.tu-dominio.com` -> servicio `backend`, puerto interno `3000`

No publiques puertos 80/443 dentro de los contenedores. Easypanel/Traefik debe hacer el proxy y emitir SSL.

## Environment Variables

En Easypanel, pega las variables de `.env.easypanel.example` y cambia como minimo:

- `BACKEND_URL=https://api.tu-dominio.com`
- `FRONTEND_URL=https://app.tu-dominio.com`
- `REACT_APP_BACKEND_URL=https://api.tu-dominio.com`
- `DB_PASS`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Credenciales iniciales incluidas para entrar:

- Usuario: `admin@chatia.local`
- Password: `Admin123456`

Cambialas despues del primer login o antes de desplegar.

## Persistencia

El `docker-compose.yml` define estos volumenes:

- `postgres_data`: base de datos PostgreSQL
- `redis_data`: colas/cache Redis
- `backend_public`: archivos subidos, audios, imagenes y media publica
- `backend_private`: archivos privados de configuracion

No borres estos volumenes al actualizar, porque ahi vive la informacion persistente.

## Arranque

El backend espera PostgreSQL y Redis, ejecuta migraciones y asegura el usuario admin en cada arranque. Puedes desactivar pasos con:

- `RUN_MIGRATIONS=false`
- `RUN_SEED_SETTINGS=false`
- `RUN_SEED_ADMIN=false`

Dejalos en `true` para la primera instalacion.
