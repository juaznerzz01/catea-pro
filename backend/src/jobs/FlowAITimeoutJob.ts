import { Job } from "bull";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import Message from "../models/Message";
import CompaniesSettings from "../models/CompaniesSettings";
import { getWbot } from "../libs/wbot";
import logger from "../utils/logger";
import cacheLayer from "../libs/cache";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import CreateMessageService from "../services/MessageServices/CreateMessageService";
import { getIO } from "../libs/socket";
import { randomString } from "../utils/randomCode";

interface FlowAITimeoutData {
  ticketId: number;
  companyId: number;
  whatsappId: number;
  nodeId: string;
  flowId: number;
  hashFlowId: string;
  numberClient: string;
  contactName: string;
  contactEmail: string;
}

const DEFAULT_PROMPT = `Você é um assistente virtual inteligente. Analise o histórico completo da conversa abaixo e continue o atendimento de forma natural, prestativa e amigável.
O cliente parou de responder após a última mensagem do sistema. Sua tarefa é:
1. Entender o contexto da conversa
2. Identificar o que o cliente precisa
3. Enviar uma mensagem retomando o atendimento de forma natural
4. A partir de agora, você assumirá o controle total da conversa

Seja conciso, educado e proativo.`;

export default {
  key: "FlowAITimeoutJob",
  async handle({ data }: Job<FlowAITimeoutData>) {
    try {
      const { ticketId, companyId, whatsappId, nodeId, flowId, numberClient, contactName } = data;

      logger.info(`[FlowAITimeout] Verificando AI timeout para ticket ${ticketId}, node ${nodeId}`);

      // Check if ticket is still waiting at the same node
      const ticket = await Ticket.findOne({
        where: { id: ticketId, companyId }
      });

      if (!ticket) {
        logger.info(`[FlowAITimeout] Ticket ${ticketId} nao encontrado, ignorando`);
        return;
      }

      if (ticket.lastFlowId !== nodeId) {
        logger.info(`[FlowAITimeout] Ticket ${ticketId} ja avancou (lastFlowId=${ticket.lastFlowId}, esperado=${nodeId}), ignorando`);
        return;
      }

      if (ticket.status === "closed") {
        logger.info(`[FlowAITimeout] Ticket ${ticketId} esta fechado, ignorando`);
        return;
      }

      // Check company settings for AI feature
      const settings = await CompaniesSettings.findOne({
        where: { companyId }
      });

      if (!settings || settings.flowbuilderAI !== "enabled" || !settings.flowbuilderAIApiKey) {
        logger.info(`[FlowAITimeout] Saida IA desabilitada ou sem API key para company ${companyId}, ignorando`);
        return;
      }

      const apiKey = settings.flowbuilderAIApiKey.replace(/^["']|["']$/g, "").trim();
      const customPrompt = settings.flowbuilderAIPrompt || "";

      // Load conversation history
      const messages = await Message.findAll({
        where: { ticketId: ticket.id },
        order: [["createdAt", "ASC"]],
        limit: 50
      });

      if (messages.length === 0) {
        logger.info(`[FlowAITimeout] Nenhuma mensagem encontrada para ticket ${ticketId}, ignorando`);
        return;
      }

      const openai = new OpenAI({ apiKey });
      const publicFolder = path.resolve(__dirname, "..", "..", "public", `company${companyId}`);

      // Build message history for GPT (including audio transcriptions and image captions)
      const historyMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

      const promptText = customPrompt
        ? `${DEFAULT_PROMPT}\n\nInstruções adicionais:\n${customPrompt}`
        : DEFAULT_PROMPT;

      historyMessages.push({
        role: "system",
        content: `${promptText}\n\nNome do cliente: ${contactName || "Cliente"}`
      });

      for (const message of messages) {
        const role: "user" | "assistant" = message.fromMe ? "assistant" : "user";

        // Text messages
        if (message.mediaType === "conversation" || message.mediaType === "extendedTextMessage") {
          if (message.body) {
            historyMessages.push({ role, content: message.body });
          }
          continue;
        }

        // Audio messages - transcribe with Whisper
        if (message.mediaType === "audio" && message.mediaUrl) {
          const audioPath = path.join(publicFolder, message.mediaUrl);
          if (fs.existsSync(audioPath)) {
            try {
              const file = fs.createReadStream(audioPath) as any;
              const transcription = await openai.audio.transcriptions.create({
                model: "whisper-1",
                file: file,
              });
              if (transcription.text) {
                historyMessages.push({ role, content: `[Áudio transcrito]: ${transcription.text}` });
                logger.info(`[FlowAITimeout] Audio transcrito para ticket ${ticketId}: ${transcription.text.substring(0, 60)}...`);
              }
            } catch (e: any) {
              logger.warn(`[FlowAITimeout] Erro ao transcrever audio: ${e?.message || e}`);
            }
          }
          continue;
        }

        // Image/video with caption
        if ((message.mediaType === "image" || message.mediaType === "video") && message.body) {
          // Check if body is a caption (not just a filename)
          const isFilename = /^\d+_\d+\.(jpeg|jpg|png|webp|mp4|gif)$/i.test(message.body?.trim() || "");
          if (!isFilename && message.body.trim().length > 0) {
            const mediaLabel = message.mediaType === "image" ? "Imagem" : "Vídeo";
            historyMessages.push({ role, content: `[${mediaLabel} com legenda]: ${message.body}` });
          } else {
            const mediaLabel = message.mediaType === "image" ? "uma imagem" : "um vídeo";
            historyMessages.push({ role, content: `[Cliente enviou ${mediaLabel}]` });
          }
          continue;
        }

        // Contact card
        if (message.mediaType === "contactMessage" && message.body) {
          historyMessages.push({ role, content: `[Cartão de contato enviado]: ${message.body}` });
          continue;
        }

        // Document/application
        if (message.mediaType === "application" && message.body) {
          historyMessages.push({ role, content: `[Documento enviado]: ${message.body}` });
          continue;
        }
      }

      logger.info(`[FlowAITimeout] Chamando GPT para ticket ${ticketId} com ${historyMessages.length} mensagens`);

      const chat = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: historyMessages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseText = chat.choices[0]?.message?.content;

      if (!responseText) {
        logger.error(`[FlowAITimeout] GPT nao retornou resposta para ticket ${ticketId}`);
        return;
      }

      logger.info(`[FlowAITimeout] GPT respondeu para ticket ${ticketId}: ${responseText.substring(0, 80)}...`);

      // Send response via WhatsApp
      const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
      const wbot = getWbot(whatsapp.id);
      const contact = await Contact.findOne({ where: { number: numberClient, companyId } });

      if (!contact) {
        logger.error(`[FlowAITimeout] Contato ${numberClient} nao encontrado, ignorando`);
        return;
      }

      const jid = `${numberClient}@s.whatsapp.net`;

      // Typing simulation
      await wbot.sendPresenceUpdate("composing", jid);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await wbot.sendPresenceUpdate("paused", jid);

      // Send message
      const sentMessage = await wbot.sendMessage(jid, { text: `\u200e ${responseText}` });

      // Save message to DB (without importing wbotMessageListener to avoid circular deps)
      try {
        const messageId = sentMessage?.key?.id || randomString(32);
        await CreateMessageService({
          messageData: {
            wid: messageId,
            ticketId: ticket.id,
            contactId: contact.id,
            body: responseText,
            fromMe: true,
            mediaType: "conversation",
            read: true,
          },
          companyId
        });
      } catch (e: any) {
        logger.warn(`[FlowAITimeout] Erro ao salvar mensagem: ${e?.message || e}`);
      }

      // Clear the AI timeout key from Redis
      await cacheLayer.del(`flow-ai-timeout:${ticketId}`);

      // Put ticket in AI mode - store AI config in dataWebhook
      const oldDataWebhook = ticket.dataWebhook || {};
      await ticket.update({
        userId: null,
        flowWebhook: false,
        lastFlowId: nodeId,
        flowStopped: flowId.toString(),
        dataWebhook: {
          ...(typeof oldDataWebhook === "object" ? oldDataWebhook : {}),
          flowAIMode: true,
          flowAIApiKey: apiKey,
          flowAIPrompt: customPrompt
        }
      });

      // Emit socket event so frontend updates
      try {
        const io = getIO();
        io.of(`/workspace-${companyId}`).emit(`appMessage-${ticket.id}`, {
          action: "create",
          message: { ticketId: ticket.id, body: responseText, fromMe: true },
          ticket: { id: ticket.id },
          contact: { id: contact.id }
        });
      } catch (_) {}

      logger.info(`[FlowAITimeout] IA assumiu ticket ${ticketId} com sucesso`);

    } catch (error) {
      logger.error(`[FlowAITimeout] Erro: ${error.message}`);
      logger.error(error);
    }
  }
};
