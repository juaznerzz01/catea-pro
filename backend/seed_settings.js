const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "chatia",
  process.env.DB_USER || "chatia",
  process.env.DB_PASS || process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "postgres",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false
  }
);

async function seedSettings() {
  try {
    await sequelize.authenticate();
    console.log("✓ Conectado ao PostgreSQL");

    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Settings'
      );
    `);

    if (!results[0].exists) {
      console.log("⚠️  Tabela Settings não existe ainda");
      process.exit(0);
    }

    // Configurações globais (sem companyId)
    const globalSettings = [
      { key: "userCreation", value: "enabled" },
      { key: "currency", value: "BRL" }
    ];

    // Configurações por empresa (com companyId)
    const companySettings = [
      { key: "appName", value: process.env.COMPANY_NAME || "ChatIA" },
      { key: "primaryColorLight", value: process.env.REACT_APP_PRIMARY_COLOR || "#6B46C1" },
      { key: "primaryColorDark", value: process.env.REACT_APP_PRIMARY_DARK || "#4C1D95" }
    ];

    // Criar configurações globais
    for (const setting of globalSettings) {
      const [existing] = await sequelize.query(
        "SELECT * FROM \"Settings\" WHERE key = :key AND \"companyId\" IS NULL",
        { replacements: { key: setting.key } }
      );

      if (existing.length === 0) {
        await sequelize.query(
          `INSERT INTO "Settings" (key, value, "createdAt", "updatedAt")
           VALUES (:key, :value, NOW(), NOW())`,
          { replacements: setting }
        );
        console.log(`  ✓ Criada (global): ${setting.key} = ${setting.value}`);
      }
    }

    // Obter companyId da primeira empresa
    const [companies] = await sequelize.query("SELECT id FROM \"Companies\" ORDER BY id LIMIT 1");
    const companyId = companies.length > 0 ? companies[0].id : 1;

    const [companiesSettingsTable] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'CompaniesSettings'
      );
    `);

    if (companiesSettingsTable[0].exists) {
      const [companySettingsRows] = await sequelize.query(
        "SELECT id FROM \"CompaniesSettings\" WHERE \"companyId\" = :companyId LIMIT 1",
        { replacements: { companyId } }
      );

      if (companySettingsRows.length === 0) {
        await sequelize.query(
          `INSERT INTO "CompaniesSettings" (
            "companyId",
            "hoursCloseTicketsAuto",
            "chatBotType",
            "acceptCallWhatsapp",
            "userRandom",
            "sendGreetingMessageOneQueues",
            "sendSignMessage",
            "sendFarewellWaitingTicket",
            "userRating",
            "sendGreetingAccepted",
            "CheckMsgIsGroup",
            "sendQueuePosition",
            "scheduleType",
            "acceptAudioMessageContact",
            "sendMsgTransfTicket",
            "enableLGPD",
            "requiredTag",
            "lgpdDeleteMessage",
            "lgpdHideNumber",
            "lgpdConsent",
            "lgpdLink",
            "lgpdMessage",
            "DirectTicketsToWallets",
            "closeTicketOnTransfer",
            "transferMessage",
            "greetingAcceptedMessage",
            "AcceptCallWhatsappMessage",
            "sendQueuePositionMessage",
            "showNotificationPending",
            "overrideDefaultTimezone",
            "createDemoUser",
            "createdAt",
            "updatedAt"
          ) VALUES (
            :companyId,
            '9999999999',
            'text',
            'enabled',
            'enabled',
            'enabled',
            'enabled',
            'disabled',
            'disabled',
            'enabled',
            'enabled',
            'enabled',
            'disabled',
            'enabled',
            'enabled',
            'disabled',
            'disabled',
            'disabled',
            'disabled',
            'disabled',
            '',
            '',
            false,
            false,
            '',
            '',
            '',
            '',
            false,
            false,
            'disabled',
            NOW(),
            NOW()
          )`,
          { replacements: { companyId } }
        );
        console.log(`  CompaniesSettings criado para empresa ${companyId}`);
      }
    }

    // Criar configurações por empresa
    for (const setting of companySettings) {
      const [existing] = await sequelize.query(
        "SELECT * FROM \"Settings\" WHERE key = :key AND \"companyId\" = :companyId",
        { replacements: { key: setting.key, companyId } }
      );

      if (existing.length === 0) {
        await sequelize.query(
          `INSERT INTO "Settings" (key, value, "companyId", "createdAt", "updatedAt")
           VALUES (:key, :value, :companyId, NOW(), NOW())`,
          { replacements: { ...setting, companyId } }
        );
        console.log(`  ✓ Criada (company ${companyId}): ${setting.key} = ${setting.value}`);
      }
    }

    console.log("✓ Configurações padrão criadas!");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error.message);
    process.exit(1);
  }
}

seedSettings();
