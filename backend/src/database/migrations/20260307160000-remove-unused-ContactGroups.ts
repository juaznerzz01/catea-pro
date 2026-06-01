import { QueryInterface, DataTypes } from "sequelize";

/**
 * Migration: Remove unused ContactGroups table
 *
 * Context:
 * - Table was created on 2024-01-02 but never used
 * - No model exists for ContactGroups
 * - Zero references in codebase (backend or frontend)
 * - See SPRINT2-CONTACTGROUPS-ANALYSIS.md for full investigation
 *
 * Risk: LOW
 * - No code uses this table
 * - No foreign keys reference it
 * - Migration is reversible via down()
 */
module.exports = {
  async up(queryInterface: QueryInterface) {
    console.log('⚠️  Removing unused ContactGroups table...');

    // Check if table exists before dropping
    const tables = await queryInterface.showAllTables();
    if (tables.includes('ContactGroups')) {
      await queryInterface.dropTable('ContactGroups');
      console.log('✅ ContactGroups table removed successfully');
    } else {
      console.log('ℹ️  ContactGroups table does not exist, skipping');
    }
  },

  async down(queryInterface: QueryInterface) {
    console.log('⚠️  Recreating ContactGroups table (rollback)...');

    // Recreate original table structure if rollback is needed
    await queryInterface.createTable('ContactGroups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      contactId: {
        type: DataTypes.INTEGER
      },
      companyId: {
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER
      },
    });

    console.log('✅ ContactGroups table recreated (structure only, no data)');
  }
};
