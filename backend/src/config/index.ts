export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  api: {
    prefix: process.env.API_PREFIX || '/api',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
    cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '60000', 10),
  },
};

export default config; 