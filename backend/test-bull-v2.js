console.log('[TEST] 1. Testando Bull com config Redis explícita');
require('dotenv').config();

const Queue = require('bull');

console.log('[TEST] 2. Criando fila com config Redis...');
const testQueue = new Queue('test-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6380,
    password: process.env.REDIS_PASSWORD || 'redis123dev',
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
});

console.log('[TEST] 3. ✅ Fila criada!');

testQueue.on('ready', () => {
  console.log('[TEST] 4. ✅ Redis conectado via Bull!');
  testQueue.close().then(() => {
    console.log('[TEST] 5. ✅ Fila fechada!');
    process.exit(0);
  });
});

testQueue.on('error', (err) => {
  console.error('[TEST] ❌ ERRO Bull:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('[TEST] ❌ TIMEOUT! Bull não conectou em 10s');
  process.exit(1);
}, 10000);
