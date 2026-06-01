console.log('[TEST] 1. Testando IORedis direto');
require('dotenv').config();

const Redis = require('ioredis');

const redisURI = process.env.REDIS_URI;
console.log('[TEST] 2. REDIS_URI:', redisURI);

try {
  console.log('[TEST] 3. Tentando conectar com URI...');
  const client = new Redis(redisURI, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });

  client.on('connect', () => {
    console.log('[TEST] 4. ✅ Conectado!');
  });

  client.on('ready', () => {
    console.log('[TEST] 5. ✅ Ready!');
    client.ping((err, result) => {
      if (err) {
        console.error('[TEST] ❌ ERRO ping:', err.message);
        process.exit(1);
      }
      console.log('[TEST] 6. ✅ PONG:', result);
      client.quit();
      process.exit(0);
    });
  });

  client.on('error', (err) => {
    console.error('[TEST] ❌ ERRO Redis:', err.message);
    process.exit(1);
  });

} catch (e) {
  console.error('[TEST] ❌ ERRO criar cliente:', e.message);
  process.exit(1);
}

setTimeout(() => {
  console.error('[TEST] ❌ TIMEOUT! Redis não conectou em 10s');
  process.exit(1);
}, 10000);
