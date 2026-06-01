import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("CompaniesSettings") as any;

    if (!tableDesc.aiSuggestionsPrompt) {
      await queryInterface.addColumn("CompaniesSettings", "aiSuggestionsPrompt", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("CompaniesSettings", "aiSuggestionsPrompt");
  }
};
