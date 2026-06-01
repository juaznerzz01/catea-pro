import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("CompaniesSettings") as any;

    if (!tableDesc.aiAutoSummary) {
      await queryInterface.addColumn("CompaniesSettings", "aiAutoSummary", {
        type: DataTypes.STRING,
        defaultValue: "disabled",
        allowNull: true
      });
    }

    if (!tableDesc.aiAutoSummaryTime) {
      await queryInterface.addColumn("CompaniesSettings", "aiAutoSummaryTime", {
        type: DataTypes.STRING,
        defaultValue: "23:00",
        allowNull: true
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("CompaniesSettings", "aiAutoSummary");
    await queryInterface.removeColumn("CompaniesSettings", "aiAutoSummaryTime");
  }
};
