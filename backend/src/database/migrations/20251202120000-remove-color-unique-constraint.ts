import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint("Queues", "Queues_color_key");
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex("Queues", ["color", "companyId"], {
      name: "Queues_color_key",
      unique: true
    });
  }
};
