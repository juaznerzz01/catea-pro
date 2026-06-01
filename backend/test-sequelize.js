console.log('[TEST] 1. Iniciando teste Sequelize');

require('dotenv').config();
console.log('[TEST] 2. Dotenv carregado');

const { Sequelize } = require('sequelize');

console.log('[TEST] 3. Criando instância Sequelize...');
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5434,
  database: process.env.DB_NAME || 'chatia_dev',
  username: process.env.DB_USER || 'chatia',
  password: process.env.DB_PASS || 'chatia123dev',
  logging: console.log, // Ver queries
  pool: {
    max: 5,
    min: 0,
    acquire: 10000,
    idle: 10000
  }
});

console.log('[TEST] 4. Testando autenticação...');
sequelize.authenticate()
  .then(() => {
    console.log('[TEST] 5. ✅ Sequelize conectado!');
    return sequelize.close();
  })
  .then(() => {
    console.log('[TEST] 6. ✅ Conexão fechada!');
    process.exit(0);
  })
  .catch(err => {
    console.error('[TEST] ❌ ERRO Sequelize:', err.message);
    console.error(err);
    process.exit(1);
  });

// Timeout para forçar saída se travar
setTimeout(() => {
  console.error('[TEST] ❌ TIMEOUT! Sequelize travou!');
  process.exit(1);
}, 15000);
