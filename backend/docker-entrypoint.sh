#!/bin/sh
set -e

: "${HOST:=0.0.0.0}"
: "${PORT:=3000}"
: "${DB_HOST:=postgres}"
: "${DB_PORT:=5432}"
: "${DB_NAME:=chatia}"
: "${DB_USER:=chatia}"

echo "[entrypoint] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until node -e "
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'chatia',
  user: process.env.DB_USER || 'chatia',
  password: process.env.DB_PASS || process.env.DB_PASSWORD
});
client.connect().then(() => client.end()).catch(() => process.exit(1));
"; do
  sleep 2
done

if [ -n "${REDIS_HOST:-}" ]; then
  echo "[entrypoint] Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT:-6379}..."
  until node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB || 0),
  connectTimeout: 3000,
  maxRetriesPerRequest: 1
});
redis.ping().then(() => redis.quit()).catch(() => process.exit(1));
"; do
    sleep 2
  done
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  npx sequelize-cli db:migrate
fi

if [ "${RUN_SEED_ADMIN:-true}" = "true" ]; then
  echo "[entrypoint] Ensuring admin user..."
  node seed_admin.js
fi

if [ "${RUN_SEED_SETTINGS:-true}" = "true" ]; then
  echo "[entrypoint] Ensuring default settings..."
  node seed_settings.js
fi

echo "[entrypoint] Starting backend on ${HOST}:${PORT}..."
exec "$@"
