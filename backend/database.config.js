// Configuração simplificada do banco de dados para migrations
require('dotenv').config();

const dbConfig = {
  username: process.env.DB_USER || 'chatia',
  password: process.env.DB_PASS || process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'chatia',
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 100,
    min: parseInt(process.env.DB_POOL_MIN) || 15,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 600000
  }
};

module.exports = {
  development: dbConfig,
  production: dbConfig
};
