import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // flowbuilderAI: enabled/disabled toggle
    const tableDesc = await queryInterface.describeTable("CompaniesSettings");

    if (!tableDesc["flowbuilderAI"]) {
      await queryInterface.addColumn("CompaniesSettings", "flowbuilderAI", {
        type: DataTypes.STRING,
        defaultValue: "disabled",
        allowNull: false
      });
    }

    // flowbuilderAIApiKey: OpenAI API key for flow AI output
    if (!tableDesc["flowbuilderAIApiKey"]) {
      await queryInterface.addColumn("CompaniesSettings", "flowbuilderAIApiKey", {
        type: DataTypes.TEXT,
        defaultValue: "",
        allowNull: true
      });
    }

    // flowbuilderAIPrompt: custom prompt for flow AI output
    if (!tableDesc["flowbuilderAIPrompt"]) {
      await queryInterface.addColumn("CompaniesSettings", "flowbuilderAIPrompt", {
        type: DataTypes.TEXT,
        defaultValue: "",
        allowNull: true
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("CompaniesSettings", "flowbuilderAI");
    await queryInterface.removeColumn("CompaniesSettings", "flowbuilderAIApiKey");
    await queryInterface.removeColumn("CompaniesSettings", "flowbuilderAIPrompt");
  }
};
