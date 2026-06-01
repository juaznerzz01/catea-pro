import { WASocket, WAMessage } from "baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import Message from "../../models/Message";
// import OldMessage from "../../models/OldMessage";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import User from "../../models/User";

import formatBody from "../../helpers/Mustache";

interface Request {
  messageId: string;
  body: string;
}

const EditWhatsAppMessage = async ({
  messageId,
  body,
}: Request): Promise<{ ticket: Ticket, message: Message }> => {

  const message = await Message.findByPk(messageId, {
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"]
      }
    ]
  });

  if (!message) {
    throw new AppError("No message found with this ID.");
  }

  const { ticket } = message;

  const wbot = await GetTicketWbot(ticket);

  const msg = JSON.parse(message.dataJson);

  try {
    // ── Tradução automática: traduzir para idioma do contato ──
    let textToSend = body;
    try {
      const { isAutoTranslateEnabled, translateText } = await import("../TranslateService/TranslateService");
      const enabled = await isAutoTranslateEnabled(ticket.companyId);
      const contact = await Contact.findByPk(ticket.contactId);
      if (enabled && contact?.language) {
        let userLang = "pt-BR";
        if (ticket.userId) {
          const ticketUser = await User.findByPk(ticket.userId, { attributes: ["language"] });
          if (ticketUser?.language) userLang = ticketUser.language;
        }
        const translated = await translateText(body, userLang, contact.language, ticket.companyId);
        if (translated) {
          textToSend = translated;
        }
      }
    } catch (translateErr) {
      console.error("[EditWhatsAppMessage] Erro na tradução:", translateErr);
    }

    await wbot.sendMessage(message.remoteJid, {
      text: textToSend,
      edit: msg.key,
    }, {});


    // await OldMessage.upsert(oldMessage);
    const updateData: any = { body, isEdited: true };
    if (textToSend !== body) {
      updateData.translatedBody = textToSend;
    } else {
      updateData.translatedBody = null;
    }
    await message.update(updateData);

    await ticket.update({ lastMessage: body });
    await ticket.reload();
    
    return { ticket: message.ticket, message: message };
  } catch (err) {
    console.log(err);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }

};

export default EditWhatsAppMessage;
