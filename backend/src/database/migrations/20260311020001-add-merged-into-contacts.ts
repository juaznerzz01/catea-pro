import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Soft merge: em vez de deletar contatos fantasma, marcar como merged
    await queryInterface.addColumn("Contacts", "mergedIntoContactId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: "Contacts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    await queryInterface.addColumn("Contacts", "isMerged", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Contacts", "mergedIntoContactId");
    await queryInterface.removeColumn("Contacts", "isMerged");
  }
};
