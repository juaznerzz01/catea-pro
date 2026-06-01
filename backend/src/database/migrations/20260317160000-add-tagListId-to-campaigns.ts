import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("Campaigns");
    if (!tableDesc["tagListId"]) {
      await queryInterface.addColumn("Campaigns", "tagListId", {
        type: DataTypes.INTEGER,
        references: { model: "Tags", key: "id" },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Campaigns", "tagListId");
  }
};
