console.log('[TEST] 1. Iniciando teste de imports');
require('dotenv').config();

console.log('[TEST] 2. REDIS_URI:', process.env.REDIS_URI);
console.log('[TEST] 3. REDIS_URI_ACK:', process.env.REDIS_URI_ACK);

try {
  console.log('[TEST] 4. Importando bootstrap...');
  require('./dist/bootstrap.js');
  console.log('[TEST] 5. ✅ Bootstrap importado!');
} catch (e) {
  console.error('[TEST] ❌ ERRO no bootstrap:', e.message);
  process.exit(1);
}

try {
  console.log('[TEST] 6. Importando database...');
  const db = require('./dist/database');
  console.log('[TEST] 7. ✅ Database importado!');
} catch (e) {
  console.error('[TEST] ❌ ERRO no database:', e.message);
  process.exit(1);
}

try {
  console.log('[TEST] 8. Importando queues...');
  const queues = require('./dist/queues.js');
  console.log('[TEST] 9. ✅ Queues importado!');

  // Dar tempo para Bull conectar
  setTimeout(() => {
    console.log('[TEST] 10. ✅ Queues inicializadas!');

    try {
      console.log('[TEST] 11. Importando app...');
      const app = require('./dist/app.js');
      console.log('[TEST] 12. ✅ App importado!');
      process.exit(0);
    } catch (e) {
      console.error('[TEST] ❌ ERRO no app:', e.message);
      console.error(e.stack);
      process.exit(1);
    }
  }, 5000);

} catch (e) {
  console.error('[TEST] ❌ ERRO nas queues:', e.message);
  console.error(e.stack);
  process.exit(1);
}

// Timeout final
setTimeout(() => {
  console.error('[TEST] ❌ TIMEOUT GLOBAL!');
  process.exit(1);
}, 30000);
