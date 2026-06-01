import { Request, Response } from "express";
import Message from "../models/Message";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import User from "../models/User";
import CompaniesSettings from "../models/CompaniesSettings";
import {
  translateText,
  detectAndTranslate,
  isAutoTranslateEnabled,
  invalidateTranslateCache
} from "../services/TranslateService/TranslateService";

/**
 * Traduzir uma mensagem específica manualmente
 * POST /translate/message/:messageId
 */
export const translateMessage = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  try {
    const message = await Message.findOne({
      where: { id: messageId, companyId },
      include: [
        {
          model: Ticket,
          as: "ticket",
          attributes: ["id", "userId", "contactId"]
        }
      ]
    });

    if (!message) {
      return res.status(404).json({ error: "Mensagem não encontrada" });
    }

    if (!message.body || message.body.length < 3) {
      return res.status(400).json({ error: "Mensagem muito curta para traduzir" });
    }

    // Buscar idioma do atendente
    let userLang = "pt-BR";
    const user = await User.findByPk(req.user.id, { attributes: ["language"] });
    if (user?.language) userLang = user.language;

    const result = await detectAndTranslate(message.body, userLang, companyId);
    if (!result) {
      return res.status(500).json({ error: "Falha ao traduzir" });
    }

    // Salvar tradução na mensagem
    if (result.translatedText) {
      await message.update({
        translatedBody: result.translatedText,
        originalLanguage: result.detectedLanguage
      });
    }

    return res.status(200).json({
      translatedBody: result.translatedText,
      originalLanguage: result.detectedLanguage,
      messageId: message.id
    });
  } catch (error) {
    console.error("[TranslateController] Erro:", error);
    return res.status(500).json({ error: "Erro ao traduzir mensagem" });
  }
};

/**
 * Obter configurações de tradução da empresa
 * GET /translate/settings
 */
export const getSettings = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  try {
    const settings = await CompaniesSettings.findOne({
      where: { companyId },
      attributes: ["autoTranslate", "translateApiKey"]
    });

    return res.status(200).json({
      autoTranslate: settings?.autoTranslate || "disabled",
      hasApiKey: !!settings?.translateApiKey
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar configurações" });
  }
};

/**
 * Atualizar configurações de tradução
 * PUT /translate/settings
 */
export const updateSettings = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { autoTranslate, translateApiKey } = req.body;

  try {
    const settings = await CompaniesSettings.findOne({ where: { companyId } });
    if (!settings) {
      return res.status(404).json({ error: "Configurações não encontradas" });
    }

    const updateData: any = {};
    if (autoTranslate !== undefined) updateData.autoTranslate = autoTranslate;
    if (translateApiKey !== undefined) updateData.translateApiKey = translateApiKey;

    await settings.update(updateData);

    // Invalidar cache de instância OpenAI
    invalidateTranslateCache(companyId);

    return res.status(200).json({
      autoTranslate: settings.autoTranslate,
      hasApiKey: !!settings.translateApiKey
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
};

/**
 * Obter idioma de um contato
 * GET /translate/contact/:contactId/language
 */
export const getContactLanguage = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  try {
    const contact = await Contact.findOne({
      where: { id: contactId, companyId },
      attributes: ["id", "name", "language"]
    });

    if (!contact) {
      return res.status(404).json({ error: "Contato não encontrado" });
    }

    return res.status(200).json({
      contactId: contact.id,
      name: contact.name,
      language: contact.language
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar idioma do contato" });
  }
};
