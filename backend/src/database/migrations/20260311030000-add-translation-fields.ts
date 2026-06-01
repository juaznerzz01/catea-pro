import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Adicionar campo language no Contact (idioma detectado do contato)
    const contactColumns = await queryInterface.describeTable("Contacts");
    if (!contactColumns["language"]) {
      await queryInterface.addColumn("Contacts", "language", {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: null
      });
    }

    // Adicionar campos de tradução na Message
    const messageColumns = await queryInterface.describeTable("Messages");
    if (!messageColumns["translatedBody"]) {
      await queryInterface.addColumn("Messages", "translatedBody", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      });
    }
    if (!messageColumns["originalLanguage"]) {
      await queryInterface.addColumn("Messages", "originalLanguage", {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: null
      });
    }

    // Adicionar setting de tradução automática na CompaniesSettings
    const settingsColumns = await queryInterface.describeTable("CompaniesSettings");
    if (!settingsColumns["autoTranslate"]) {
      await queryInterface.addColumn("CompaniesSettings", "autoTranslate", {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: "disabled"
      });
    }
    if (!settingsColumns["translateApiKey"]) {
      await queryInterface.addColumn("CompaniesSettings", "translateApiKey", {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Contacts", "language");
    await queryInterface.removeColumn("Messages", "translatedBody");
    await queryInterface.removeColumn("Messages", "originalLanguage");
    await queryInterface.removeColumn("CompaniesSettings", "autoTranslate");
    await queryInterface.removeColumn("CompaniesSettings", "translateApiKey");
  }
};
