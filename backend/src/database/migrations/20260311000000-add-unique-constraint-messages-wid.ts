import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Idempotência de mensagem: impedir duplicatas no nível do banco
    // Exclui mensagens privadas (PVT%) e wid nulo da constraint
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_wid_company_unique
      ON "Messages" (wid, "companyId")
      WHERE wid IS NOT NULL AND wid NOT LIKE 'PVT%';
    `);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_messages_wid_company_unique;
    `);
  }
};
