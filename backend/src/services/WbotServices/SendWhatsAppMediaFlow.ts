import { WAMessage, AnyMessageContent, WAPresence } from "baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import * as mime from "mime";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import { resolveOutgoingJid } from "./IdentityResolverService";
import getFfmpegPath from "../../config/ffmpeg";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  body?: string;
}

interface RequestFlow {
  media: string;
  ticket: Ticket;
  body?: string;
  isFlow?: boolean;
  isRecord?: boolean;
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudioToOpus = async (audio: string): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.ogg`;
  return new Promise((resolve, reject) => {
    const ffmpegBinary = getFfmpegPath();
    // Decodifica para PCM via pipe e recodifica para Opus/OGG limpo.
    // Isso evita o erro "Error parsing Opus packet header" que ocorre
    // com áudios gravados pelo navegador (WebM com .ogg extension).
    const cmd =
      `"${ffmpegBinary}" -y -i "${audio}" -vn -f s16le -ar 48000 -ac 1 pipe:1 2>/dev/null | ` +
      `"${ffmpegBinary}" -y -f s16le -ar 48000 -ac 1 -i pipe:0 -c:a libopus -b:a 48k "${outputAudio}"`;
    exec(cmd, { shell: "/bin/sh" }, (error, _stdout, _stderr) => {
      if (error) reject(error);
      resolve(outputAudio);
    });
  });
};

const getAudioDurationMs = async (filePath: string): Promise<number> => {
  return new Promise((resolve) => {
    const ffmpegBinary = getFfmpegPath();
    const ffprobeBinary = ffmpegBinary.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");
    exec(
      `"${ffprobeBinary}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      (error, stdout) => {
        if (error || !stdout.trim()) {
          // Fallback: tenta com ffmpeg se ffprobe não existir
          exec(
            `"${ffmpegBinary}" -i "${filePath}" 2>&1 | grep "Duration"`,
            (err2, stdout2) => {
              if (err2 || !stdout2) {
                resolve(5000); // fallback 5s
                return;
              }
              const match = stdout2.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
              if (match) {
                const hours = parseInt(match[1]);
                const minutes = parseInt(match[2]);
                const seconds = parseInt(match[3]);
                const ms = parseInt(match[4]) * 10;
                resolve((hours * 3600 + minutes * 60 + seconds) * 1000 + ms);
              } else {
                resolve(5000);
              }
            }
          );
          return;
        }
        const seconds = parseFloat(stdout.trim());
        resolve(isNaN(seconds) ? 5000 : Math.round(seconds * 1000));
      }
    );
  });
};

const nameFileDiscovery = (pathMedia: string) => {
  const spliting = pathMedia.split('/')
  const first = spliting[spliting.length - 1]
  return first.split(".")[0]
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export const typeSimulation = async (
  ticket: Ticket,
  presence: WAPresence,
  durationMs: number = 5000
) => {
  const wbot = await GetTicketWbot(ticket);

  let contact = await Contact.findOne({
    where: {
      id: ticket.contactId,
    }
  });

  const presenceJid = await resolveOutgoingJid(contact, ticket.isGroup);
  await wbot.sendPresenceUpdate(presence, presenceJid);

  const simulationTime = Math.max(2000, Math.min(durationMs, 30000));
  await delay(simulationTime);

  await wbot.sendPresenceUpdate('paused', presenceJid);
}

const SendWhatsAppMediaFlow = async ({
  media,
  ticket,
  body,
  isFlow = false,
  isRecord = false
}: RequestFlow): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);

    const mimetype = mime.getType(media) || "application/octet-stream";
    const pathMedia = media

    const typeMessage = mimetype.split("/")[0];
    const mediaName = nameFileDiscovery(media)

    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: body,
        fileName: mediaName
      };
    } else if (typeMessage === "audio") {
      const convert = await processAudioToOpus(pathMedia);
      const audioBuffer = fs.readFileSync(convert);
      try { fs.unlinkSync(convert); } catch (_) {}
      options = {
        audio: audioBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      };
    } else if (typeMessage === "document" || typeMessage === "text") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body,
        fileName: mediaName,
        mimetype: mimetype
      };
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body,
        fileName: mediaName,
        mimetype: mimetype
      };
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body
      };
    }

    let contact = await Contact.findOne({
      where: {
        id: ticket.contactId,
      }
    });

    let number = await resolveOutgoingJid(contact, ticket.isGroup);

    const sentMessage = await wbot.sendMessage(number, {
        ...options
      }
    );

    await ticket.update({ lastMessage: mediaName });

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export { getAudioDurationMs };
export default SendWhatsAppMediaFlow;
