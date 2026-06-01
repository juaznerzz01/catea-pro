const bcrypt = require('bcryptjs');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
const adminPassword = process.env.ADMIN_PASSWORD || '123456';
const companyName = process.env.COMPANY_NAME || 'ChatIA';

// Gerar hash com salt 10 (mais seguro)
const passwordHash = bcrypt.hashSync(adminPassword, 10);

// Validar hash bcrypt gerado
if (!passwordHash || !/^\$2[aby]\$/.test(passwordHash)) {
  console.error('[ERROR] Falha ao gerar hash bcrypt válido');
  process.exit(1);
}

console.log('Email:', adminEmail);
console.log('Hash:', passwordHash);
console.log('Hash válido:', /^\$2[aby]\$/.test(passwordHash) ? 'SIM' : 'NÃO');

// Conectar ao PostgreSQL e criar o admin
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'chatia',
  user: process.env.DB_USER || 'chatia',
  password: process.env.DB_PASS || process.env.DB_PASSWORD
});

// Helper: verificar se tabela existe
async function tableExists(tableName) {
  const result = await client.query(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
    [tableName]
  );
  return result.rows[0].exists;
}

async function seedAdmin() {
  try {
    await client.connect();
    console.log('[INFO] Conectado ao PostgreSQL');

    // Detectar schema do projeto (community vs multi-tenant)
    const hasCompanies = await tableExists('Companies');
    const hasPlans = await tableExists('Plans');
    console.log('[INFO] Schema detectado:', hasCompanies ? 'multi-tenant' : 'community (simples)');

    let companyId = null;

    // Se o schema tem Plans e Companies (multi-tenant)
    if (hasPlans && hasCompanies) {
      // Garantir plano padrão
      const planCheck = await client.query('SELECT id FROM "Plans" WHERE id = 1');
      if (planCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO "Plans" (
            id, name, users, connections, queues, amount,
            "useWhatsapp", "useFacebook", "useInstagram", "useCampaigns",
            "useSchedules", "useInternalChat", "useExternalApi", "useKanban",
            "createdAt", "updatedAt"
          ) VALUES (
            1, 'Plano Padrão', 10, 10, 10, 100,
            true, true, true, true,
            true, true, true, true,
            NOW(), NOW()
          )
        `);
        console.log('[INFO] Plano padrão criado (ID=1)');
      }

      // Obter ou criar empresa
      const companyResult = await client.query('SELECT id FROM "Companies" ORDER BY id LIMIT 1');
      if (companyResult.rows.length === 0) {
        const insertCompany = await client.query(
          'INSERT INTO "Companies" (name, "planId", "createdAt", "updatedAt") VALUES ($1, 1, NOW(), NOW()) RETURNING id',
          [companyName]
        );
        companyId = insertCompany.rows[0].id;
        console.log('[INFO] Empresa criada com ID:', companyId);
      } else {
        companyId = companyResult.rows[0].id;
        console.log('[INFO] Usando empresa existente com ID:', companyId);
      }
    }

    // Verificar se admin já existe
    const checkAdmin = await client.query('SELECT id, email FROM "Users" WHERE email = $1', [adminEmail]);

    if (checkAdmin.rows.length > 0) {
      // Admin existe: atualizar senha
      const updateFields = [adminEmail, passwordHash, 'Admin'];
      let updateQuery = 'UPDATE "Users" SET email = $1, "passwordHash" = $2, name = $3';

      // Adicionar companyId se a tabela tem essa coluna
      const hasCompanyCol = await client.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'companyId')"
      );
      if (hasCompanyCol.rows[0].exists && companyId) {
        updateQuery += ', "companyId" = $4 WHERE email = $1';
        updateFields.push(companyId);
      } else {
        updateQuery += ' WHERE email = $1';
      }

      await client.query(updateQuery, updateFields);
      console.log('[INFO] Admin atualizado com sucesso!');
    } else {
      // Admin não existe: criar novo
      console.log('[INFO] Criando novo usuário admin...');

      // Detectar colunas disponíveis na tabela Users
      const colsResult = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'Users'"
      );
      const columns = colsResult.rows.map(r => r.column_name);

      const hasCompanyId = columns.includes('companyId');
      const hasSuper = columns.includes('super');

      let insertCols = ['name', 'email', '"passwordHash"', 'profile', '"tokenVersion"', '"createdAt"', '"updatedAt"'];
      let insertVals = ['$1', '$2', '$3', '$4', '0', 'NOW()', 'NOW()'];
      let insertParams = ['Admin', adminEmail, passwordHash, 'admin'];

      if (hasCompanyId && companyId) {
        insertCols.push('"companyId"');
        insertVals.push('$' + (insertParams.length + 1));
        insertParams.push(companyId);
      }
      if (hasSuper) {
        insertCols.push('super');
        insertVals.push('true');
      }

      await client.query(
        `INSERT INTO "Users" (${insertCols.join(', ')}) VALUES (${insertVals.join(', ')})`,
        insertParams
      );
      console.log('[INFO] Admin criado com sucesso!');
      console.log('[INFO] Email:', adminEmail);
    }

    // Criar Settings padrão se tabela existe e está vazia
    if (await tableExists('Settings')) {
      const settingsCount = await client.query('SELECT COUNT(*) FROM "Settings"');
      if (parseInt(settingsCount.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO "Settings" (key, value, "createdAt", "updatedAt") VALUES
          ('userCreation', 'enabled', NOW(), NOW()),
          ('CheckMsgIsGroup', 'enabled', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `);
        console.log('[INFO] Settings padrão criados');
      }
    }

    await client.end();
    console.log('[SUCCESS] Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Erro no seed:', error.message);
    process.exit(1);
  }
}

seedAdmin();
