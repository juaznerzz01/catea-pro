import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("CompaniesSettings");

    if (!tableDesc["smtpHost"]) {
      await queryInterface.addColumn("CompaniesSettings", "smtpHost", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    }
    if (!tableDesc["smtpPort"]) {
      await queryInterface.addColumn("CompaniesSettings", "smtpPort", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "465"
      });
    }
    if (!tableDesc["smtpUser"]) {
      await queryInterface.addColumn("CompaniesSettings", "smtpUser", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    }
    if (!tableDesc["smtpPass"]) {
      await queryInterface.addColumn("CompaniesSettings", "smtpPass", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    }
    if (!tableDesc["smtpSecure"]) {
      await queryInterface.addColumn("CompaniesSettings", "smtpSecure", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "true"
      });
    }
    if (!tableDesc["smtpFrom"]) {
      await queryInterface.addColumn("CompaniesSettings", "smtpFrom", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("CompaniesSettings", "smtpHost");
    await queryInterface.removeColumn("CompaniesSettings", "smtpPort");
    await queryInterface.removeColumn("CompaniesSettings", "smtpUser");
    await queryInterface.removeColumn("CompaniesSettings", "smtpPass");
    await queryInterface.removeColumn("CompaniesSettings", "smtpSecure");
    await queryInterface.removeColumn("CompaniesSettings", "smtpFrom");
  }
};
