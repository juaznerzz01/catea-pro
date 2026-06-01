import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("Tickets");

    if (!tableDesc["aiMemory"]) {
      await queryInterface.addColumn("Tickets", "aiMemory", {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      });
    }

    if (!tableDesc["aiMemoryLastMessageId"]) {
      await queryInterface.addColumn("Tickets", "aiMemoryLastMessageId", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
      });
    }

    if (!tableDesc["aiMemoryUpdatedAt"]) {
      await queryInterface.addColumn("Tickets", "aiMemoryUpdatedAt", {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Tickets", "aiMemory");
    await queryInterface.removeColumn("Tickets", "aiMemoryLastMessageId");
    await queryInterface.removeColumn("Tickets", "aiMemoryUpdatedAt");
  }
};
