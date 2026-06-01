import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const table = await queryInterface.describeTable("CompaniesSettings");

    if (!table["facebookAppId"]) {
      await queryInterface.addColumn("CompaniesSettings", "facebookAppId", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
      });
    }

    if (!table["facebookAppSecret"]) {
      await queryInterface.addColumn("CompaniesSettings", "facebookAppSecret", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
      });
    }

    if (!table["facebookVerifyToken"]) {
      await queryInterface.addColumn("CompaniesSettings", "facebookVerifyToken", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("CompaniesSettings", "facebookAppId");
    await queryInterface.removeColumn("CompaniesSettings", "facebookAppSecret");
    await queryInterface.removeColumn("CompaniesSettings", "facebookVerifyToken");
  }
};
