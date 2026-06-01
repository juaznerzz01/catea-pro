import { delay } from "baileys";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import { resolveOutgoingJid } from "./IdentityResolverService";
import logger from "../../utils/logger";
// Controle de debounce por ticket para evitar spam de presenceUpdate
const typingTimers: Map<number, NodeJS.Timeout> = new Map();

const SendWhatsAppTyping = async (ticketId: string | number, companyId: number): Promise<void> => {
  try {
    // Buscar por id numérico ou uuid
    const whereClause: any = { companyId };
    if (!isNaN(Number(ticketId))) {
      whereClause.id = Number(ticketId);
    } else {
      whereClause.uuid = String(ticketId);
    }

    const ticket = await Ticket.findOne({
      where: whereClause,
      include: [{ model: Contact, as: "contact" }],
    });

    if (!ticket) {
      logger.warn(`[SendWhatsAppTyping] Ticket não encontrado: ${ticketId}`);
      return;
    }

    if (!ticket.whatsappId || ticket.channel !== "whatsapp") {
      return;
    }

    const contact = ticket.contact;
    if (!contact) return;

    const wbot = await GetTicketWbot(ticket);
    const number = await resolveOutgoingJid(contact, ticket.isGroup);

    // Limpar timer anterior para este ticket
    const existingTimer = typingTimers.get(ticket.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Enviar composing
    await wbot.presenceSubscribe(number);
    await delay(100);
    await wbot.sendPresenceUpdate("composing", number);

    // Parar de digitar automaticamente após 3s sem nova tecla
    const timer = setTimeout(async () => {
      try {
        await wbot.sendPresenceUpdate("paused", number);
      } catch (err) {
        // ignora erro ao pausar
      }
      typingTimers.delete(ticket.id);
    }, 3000);

    typingTimers.set(ticket.id, timer);
  } catch (err) {
    logger.warn(`[SendWhatsAppTyping] Erro ao enviar typing para ticket ${ticketId}: ${err}`);
  }
};

export default SendWhatsAppTyping;
