import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Backfill: criar ContactIdentity para cada contato existente
    // Usa INSERT ... ON CONFLICT DO NOTHING para ser idempotente
    const now = new Date().toISOString();

    // 1. number → phone (contatos com número real, não LID)
    await queryInterface.sequelize.query(`
      INSERT INTO "ContactIdentities" ("companyId", "contactId", "identityType", "identityValue", "isPrimary", "lastSeenAt", "createdAt", "updatedAt")
      SELECT "companyId", id, 'phone', number, true, NOW(), '${now}', '${now}'
      FROM "Contacts"
      WHERE number IS NOT NULL AND number != ''
        AND length(number) <= 13
      ON CONFLICT DO NOTHING;
    `);

    // 2. lid → lid
    await queryInterface.sequelize.query(`
      INSERT INTO "ContactIdentities" ("companyId", "contactId", "identityType", "identityValue", "isPrimary", "lastSeenAt", "createdAt", "updatedAt")
      SELECT "companyId", id, 'lid', lid, false, NOW(), '${now}', '${now}'
      FROM "Contacts"
      WHERE lid IS NOT NULL AND lid != ''
      ON CONFLICT DO NOTHING;
    `);

    // 3. jid → jid
    await queryInterface.sequelize.query(`
      INSERT INTO "ContactIdentities" ("companyId", "contactId", "identityType", "identityValue", "isPrimary", "lastSeenAt", "createdAt", "updatedAt")
      SELECT "companyId", id, 'jid', jid, false, NOW(), '${now}', '${now}'
      FROM "Contacts"
      WHERE jid IS NOT NULL AND jid != ''
      ON CONFLICT DO NOTHING;
    `);

    // 4. remoteJid como jid (se diferente do jid já registrado e não é @lid)
    await queryInterface.sequelize.query(`
      INSERT INTO "ContactIdentities" ("companyId", "contactId", "identityType", "identityValue", "isPrimary", "lastSeenAt", "createdAt", "updatedAt")
      SELECT "companyId", id, 'jid', "remoteJid", false, NOW(), '${now}', '${now}'
      FROM "Contacts"
      WHERE "remoteJid" IS NOT NULL AND "remoteJid" != ''
        AND "remoteJid" NOT LIKE '%@lid'
        AND ("jid" IS NULL OR "remoteJid" != jid)
      ON CONFLICT DO NOTHING;
    `);

    // 5. Contatos com número LID (>13 dígitos): registrar número como phone também
    // para que busca por número funcione
    await queryInterface.sequelize.query(`
      INSERT INTO "ContactIdentities" ("companyId", "contactId", "identityType", "identityValue", "isPrimary", "lastSeenAt", "createdAt", "updatedAt")
      SELECT "companyId", id, 'phone', number, false, NOW(), '${now}', '${now}'
      FROM "Contacts"
      WHERE number IS NOT NULL AND number != ''
        AND length(number) > 13
      ON CONFLICT DO NOTHING;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`DELETE FROM "ContactIdentities";`);
  }
};
