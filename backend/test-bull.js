console.log('[TEST] 1. Testando Bull + Redis');
require('dotenv').config();

const Queue = require('bull');

console.log('[TEST] 2. REDIS_URI:', process.env.REDIS_URI);

try {
  console.log('[TEST] 3. Criando fila Bull...');
  const testQueue = new Queue('test-queue', process.env.REDIS_URI, {
    redis: {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    }
  });

  console.log('[TEST] 4. ✅ Fila criada!');

  testQueue.on('ready', () => {
    console.log('[TEST] 5. ✅ Redis conectado!');
    testQueue.close().then(() => {
      console.log('[TEST] 6. ✅ Fila fechada!');
      process.exit(0);
    });
  });

  testQueue.on('error', (err) => {
    console.error('[TEST] ❌ ERRO Bull:', err.message);
    process.exit(1);
  });

} catch (e) {
  console.error('[TEST] ❌ ERRO ao criar fila:', e.message);
  console.error(e.stack);
  process.exit(1);
}

setTimeout(() => {
  console.error('[TEST] ❌ TIMEOUT! Bull não conectou em 15s');
  process.exit(1);
}, 15000);
