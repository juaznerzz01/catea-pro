console.log('[TEST] 1. Script iniciado');

console.log('[TEST] 2. Carregando dotenv...');
require('dotenv').config();
console.log('[TEST] 3. Dotenv carregado');
console.log('[TEST] 4. DB_HOST:', process.env.DB_HOST);
console.log('[TEST] 5. DB_PORT:', process.env.DB_PORT);
console.log('[TEST] 6. DB_NAME:', process.env.DB_NAME);

console.log('[TEST] 7. Testando conexão PostgreSQL...');
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || 'chatia_dev',
  user: process.env.DB_USER || 'chatia',
  password: process.env.DB_PASS || 'chatia123dev',
});

client.connect()
  .then(() => {
    console.log('[TEST] 8. ✅ PostgreSQL conectado!');
    return client.query('SELECT 1');
  })
  .then(() => {
    console.log('[TEST] 9. ✅ Query executada!');
    return client.end();
  })
  .then(() => {
    console.log('[TEST] 10. ✅ Conexão fechada!');
    console.log('[TEST] 11. Agora vou tentar importar o app.ts...');

    // Tenta importar o app compilado
    const app = require('./dist/app.js');
    console.log('[TEST] 12. ✅ App.js importado!');
    console.log('[TEST] 13. Tentando iniciar servidor...');

  })
  .catch(err => {
    console.error('[TEST] ❌ ERRO:', err.message);
    process.exit(1);
  });
