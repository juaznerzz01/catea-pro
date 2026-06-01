import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("PendingIdentityResolutions", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Whatsapps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      lidValue: {
        type: DataTypes.STRING,
        allowNull: false
      },
      messageWid: {
        type: DataTypes.STRING,
        allowNull: true
      },
      messageDataJson: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      pushName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("pending", "resolved", "expired"),
        defaultValue: "pending",
        allowNull: false
      },
      resolvedContactId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    await queryInterface.addIndex("PendingIdentityResolutions", ["companyId", "lidValue", "status"], {
      name: "idx_pending_identity_lid_status"
    });

    await queryInterface.addIndex("PendingIdentityResolutions", ["status"], {
      name: "idx_pending_identity_status"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("PendingIdentityResolutions");
  }
};
