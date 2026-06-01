const buildRedisUri = () => {
  if (process.env.REDIS_URI) return process.env.REDIS_URI;

  const host = process.env.REDIS_HOST || "redis";
  const port = process.env.REDIS_PORT || "6379";
  const db = process.env.REDIS_DB || "0";
  const password = process.env.REDIS_PASSWORD
    ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@`
    : "";

  return `redis://${password}${host}:${port}/${db}`;
};

export const REDIS_URI_CONNECTION = buildRedisUri();
export const REDIS_OPT_LIMITER_MAX = process.env.REDIS_OPT_LIMITER_MAX || 1;
export const REDIS_OPT_LIMITER_DURATION = process.env.REDIS_OPT_LIMITER_DURATION || 3000;
export const REDIS_SECRET_KEY = process.env.REDIS_SECRET_KEY || "MULTI100";
export const REDIS_URI_MSG_CONN = process.env.REDIS_URI_ACK || REDIS_URI_CONNECTION;
