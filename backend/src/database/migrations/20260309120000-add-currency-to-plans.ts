import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Plans", "currency", {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "BRL"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Plans", "currency");
  }
};
