import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("Messages");
    if (!tableDesc["transcription"]) {
      await queryInterface.addColumn("Messages", "transcription", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Messages", "transcription");
  }
};
