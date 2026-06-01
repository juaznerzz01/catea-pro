import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("CompaniesSettings");
    if (!tableDesc["sendWelcomeMessage"]) {
      await queryInterface.addColumn("CompaniesSettings", "sendWelcomeMessage", {
        type: DataTypes.STRING,
        defaultValue: "disabled",
        allowNull: true
      });
    }
    if (!tableDesc["welcomeMessageTemplate"]) {
      await queryInterface.addColumn("CompaniesSettings", "welcomeMessageTemplate", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("CompaniesSettings", "sendWelcomeMessage");
    await queryInterface.removeColumn("CompaniesSettings", "welcomeMessageTemplate");
  }
};
