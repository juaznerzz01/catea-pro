import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ContactIdentities", {
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
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      identityType: {
        type: DataTypes.ENUM("lid", "jid", "phone"),
        allowNull: false
      },
      identityValue: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      lastSeenAt: {
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

    // Constraint: mesma identidade não pode pertencer a dois contatos na mesma empresa
    await queryInterface.addIndex("ContactIdentities", ["companyId", "identityType", "identityValue"], {
      unique: true,
      name: "idx_contact_identities_unique"
    });

    // Índice para busca rápida por valor de identidade (independente do tipo)
    await queryInterface.addIndex("ContactIdentities", ["companyId", "identityValue"], {
      name: "idx_contact_identities_lookup"
    });

    // Índice para busca por contato
    await queryInterface.addIndex("ContactIdentities", ["contactId"], {
      name: "idx_contact_identities_contact"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ContactIdentities");
  }
};
