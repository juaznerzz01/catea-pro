// src/services/WbotServices/SendWhatsAppMedia.ts
import { WAMessage, AnyMessageContent } from "baileys";
import * as Sentry from "@sentry/node";
import fs, { unlinkSync } from "fs";
import { exec } from "child_process";
import path from "path";
import * as mime from "mime";

import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import User from "../../models/User";
import { getWbot } from "../../libs/wbot";
import { resolveOutgoingJid } from "./IdentityResolverService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import formatBody from "../../helpers/Mustache";
import getFfmpegPath from "../../config/ffmpeg";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  companyId?: number;
  body?: string;
  isPrivate?: boolean;
  isForwarded?: boolean;
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

// Garante pasta da empresa
const ensureCompanyFolder = (companyId: string) => {
  const dir = path.join(publicFolder, `company${companyId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// Heurística: alguns recipientes (ex.: .mpeg, .webm) podem vir como "video/*" mas serem usados como áudio.
// Aqui decidimos extrair o áudio e mandar como PTT nesses casos.
const looksLikeAudioContainer = (ext: string, mimetype: string) => {
  const e = ext.toLowerCase();
  const mt = (mimetype || "").toLowerCase();
  if (mt.startsWith("audio/")) return true;

  // Trata .mpeg/.mpg (muito comum o usuário enviar “Arquivo MPEG (.mpeg)” achando que é áudio)
  if (e === ".mpeg" || e === ".mpg") return true;

  // Gravações web via navegador costumam vir em webm (com áudio Opus). Se quiser sempre PTT, trate como áudio:
  if (e === ".webm" && mt.includes("webm")) return true;

  // Outros formatos de áudio comuns:
  if ([".mp3", ".m4a", ".aac", ".wav", ".oga", ".ogg"].includes(e)) return true;

  return false;
};

// Converte QUALQUER input para OGG/Opus 48k mono (excelente para WhatsApp PTT)
const processAudioToOpus = async (inputPath: string, companyId: string): Promise<string> => {
  const dir = ensureCompanyFolder(companyId);
  const outputPath = path.join(dir, `${Date.now()}.ogg`);
  const ffmpegBinary = getFfmpegPath();

  const cmd =
    `"${ffmpegBinary}" -y -i "${inputPath}" ` +
    `-vn -ar 48000 -ac 1 -c:a libopus -b:a 48k "${outputPath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, (error) => (error ? reject(error) : resolve(outputPath)));
  });
};

// Também usado por filas/rotas externas
export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  companyId?: string,
  body: string = " "
): Promise<AnyMessageContent | null> => {
  const mimeType = mime.getType(pathMedia) || "";
  const ext = path.extname(pathMedia || fileName || "").toLowerCase();

  try {
    let options: AnyMessageContent;

    if (looksLikeAudioContainer(ext, mimeType)) {
      const converted = await processAudioToOpus(pathMedia, companyId || "0");
      options = {
        audio: fs.readFileSync(converted),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      };
      // opcional: apagar o convertido se não quiser manter
      // unlinkSync(converted);
    } else if (mimeType.startsWith("video/")) {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: body || undefined,
        fileName
      };
    } else if (
      mimeType.startsWith("application/") ||
      mimeType.startsWith("text/") ||
      mimeType === "application/pdf"
    ) {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body || undefined,
        fileName,
        mimetype: mimeType
      };
    } else {
      // imagem (png/jpg/webp/gif…)
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body || undefined
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body = "",
  isPrivate = false,
  isForwarded = false
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await getWbot(ticket.whatsappId);
    const companyId = ticket.companyId.toString();

    const pathMedia = media.path;
    const mimeType = media.mimetype || "";
    const ext = path.extname(media.originalname || pathMedia || "").toLowerCase();
    let options: AnyMessageContent;
    const bodyMedia = ticket ? formatBody(body, ticket) : body;

    // ── Tradução automática: traduzir caption para idioma do contato ──
    let captionToSend = bodyMedia;
    let translatedBody: string | null = null;
    if (bodyMedia && bodyMedia.trim()) {
      try {
        const { isAutoTranslateEnabled, translateText } = await import("../TranslateService/TranslateService");
        const enabled = await isAutoTranslateEnabled(ticket.companyId);
        const contactRecord = await Contact.findByPk(ticket.contactId);
        if (enabled && contactRecord?.language) {
          let userLang = "pt-BR";
          if (ticket.userId) {
            const ticketUser = await User.findByPk(ticket.userId, { attributes: ["language"] });
            if (ticketUser?.language) userLang = ticketUser.language;
          }
          const translated = await translateText(bodyMedia, userLang, contactRecord.language, ticket.companyId);
          if (translated) {
            captionToSend = translated;
            translatedBody = translated;
          }
        }
      } catch (translateErr) {
        console.error("[SendWhatsAppMedia] Erro na tradução do caption:", translateErr);
      }
    }

    if (looksLikeAudioContainer(ext, mimeType)) {
      // Converte e envia como PTT
      const converted = await processAudioToOpus(pathMedia, companyId);
      options = {
        audio: fs.readFileSync(converted),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        // caption em PTT geralmente não aparece; opcional manter fora
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded }
      };
      // limpa arquivo convertido
      unlinkSync(converted);
    } else if (mimeType.startsWith("video/")) {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: captionToSend || undefined,
        fileName: media.originalname.replace("/", "-"),
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded }
      };
    } else if (
      mimeType.startsWith("application/") ||
      mimeType.startsWith("text/") ||
      mimeType === "application/pdf"
    ) {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: captionToSend || undefined,
        fileName: media.originalname.replace("/", "-"),
        mimetype: mimeType,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded }
      };
    } else {
      // imagem
      if (mimeType.includes("gif")) {
        options = {
          image: fs.readFileSync(pathMedia),
          caption: captionToSend || undefined,
          mimetype: "image/gif",
          gifPlayback: true,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded }
        };
      } else {
        options = {
          image: fs.readFileSync(pathMedia),
          caption: captionToSend || undefined,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded }
        };
      }
    }

    // Apenas registrar no banco (mensagem privada)
if (isPrivate === true) {
  const baseType = media.mimetype?.split("/")[0] ?? "document";

  const messageData = {
    wid: `PVT${companyId}${ticket.id}${(body || "").substring(0, 6)}`,
    ticketId: ticket.id,
    contactId: undefined,
    body: bodyMedia,
    fromMe: true,
    mediaUrl: media.filename,
    mediaType: baseType,
    read: true,
    quotedMsgId: null,
    ack: 2,
    remoteJid: null,
    participant: null,
    dataJson: null,
    ticketTrakingId: null,
    isPrivate
  };

  await CreateMessageService({ messageData, companyId: ticket.companyId });

  // Retorna um stub apenas para satisfazer a assinatura (quem chama não usa esse retorno)
  return {} as unknown as WAMessage;
}


    // Descobre o JID do contato
    const contactNumber = await Contact.findByPk(ticket.contactId);
    let number = await resolveOutgoingJid(contactNumber, ticket.isGroup);

    // Envia
    const sentMessage = await wbot.sendMessage(number, { ...options });

    await ticket.update({
      lastMessage: body && body !== media.filename ? body : bodyMedia,
      imported: null,
      fromMe: true
    });

    // Copiar arquivo do upload para public/companyX/
    const baseType = media.mimetype?.split("/")[0] ?? "document";
    const companyFolder = path.resolve(__dirname, "..", "..", "..", "public", `company${ticket.companyId}`);
    if (!fs.existsSync(companyFolder)) {
      fs.mkdirSync(companyFolder, { recursive: true });
      fs.chmodSync(companyFolder, 0o777);
    }
    const fileExt = path.extname(media.originalname || media.filename || ".bin");
    const savedName = `${Date.now()}_${path.basename(media.originalname || media.filename, fileExt).replace(/\s/g, "_")}${fileExt}`;
    try {
      fs.copyFileSync(media.path, path.join(companyFolder, savedName));
    } catch (copyErr) {
      console.error("Erro ao copiar mídia para public:", copyErr);
    }

    const messageData = {
      wid: sentMessage.key.id,
      ticketId: ticket.id,
      contactId: undefined,
      body: bodyMedia, // texto original (idioma do atendente)
      fromMe: true,
      mediaUrl: savedName,
      mediaType: baseType,
      read: true,
      quotedMsgId: null,
      ack: 1,
      remoteJid: number,
      participant: null,
      dataJson: JSON.stringify(sentMessage),
      ticketTrakingId: ticket.ticketTrakingId,
      isPrivate: false,
      isForwarded,
      companyId: ticket.companyId,
      translatedBody, // caption traduzido (idioma do contato)
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await CreateMessageService({ messageData, companyId: ticket.companyId });

    return sentMessage;
  } catch (err) {
    console.log(`ERRO AO ENVIAR MIDIA ${ticket.id} media ${media.originalname}`);
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
