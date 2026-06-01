import * as Sentry from "@sentry/node";
import makeWASocket, {
  AuthenticationState,
  Browsers,
  DisconnectReason,
  WAMessage,
  WAMessageKey,
  WASocket,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  type GroupMetadata
} from "baileys";
import { LIDMappingStore } from "baileys/lib/Signal/lid-mapping";
import { FindOptions } from "sequelize/types";
import Whatsapp from "../models/Whatsapp";
import logger from "../utils/logger";
import MAIN_LOGGER from "baileys/lib/Utils/logger";
import { useMultiFileAuthState } from "../helpers/useMultiFileAuthState";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import cacheLayer from "./cache";
import ImportWhatsAppMessageService from "../services/WhatsappService/ImportWhatsAppMessageService";
import { add } from "date-fns";
import moment from "moment";
import { getTypeMessage, isValidMsg } from "../services/WbotServices/wbotMessageListener";
import { addLogs } from "../helpers/addLogs";
import NodeCache from 'node-cache';
import { Store } from "./store";

const msgRetryCounterCache = new NodeCache({
  stdTTL: 600,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});
const msgCache = new NodeCache({
  stdTTL: 60,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "error";

// Cache global de mapeamento LID → JID (número real)
// Quando o WhatsApp usa LIDs, precisamos resolver para o número real
// Cache em memória + Redis para persistir entre restarts
const lidToJidCache = new Map<string, string>();

export const resolveLidToJid = (lid: string): string | undefined => {
  return lidToJidCache.get(lid);
};

// Resolver LID com fallback para Redis (async)
export const resolveLidToJidAsync = async (lid: string): Promise<string | undefined> => {
  // Tentar cache em memória primeiro
  const cached = lidToJidCache.get(lid);
  if (cached) return cached;
  // Tentar Redis
  try {
    const redisValue = await cacheLayer.get(`lid:${lid}`);
    if (redisValue) {
      lidToJidCache.set(lid, redisValue);
      return redisValue;
    }
  } catch (e) {
    // Redis indisponível, usar apenas memória
  }
  return undefined;
};

export const setLidMapping = (lid: string, jid: string): void => {
  lidToJidCache.set(lid, jid);
  // Persistir no Redis para sobreviver a restarts
  try {
    cacheLayer.set(`lid:${lid}`, jid);
  } catch (e) {
    // Redis indisponível, cache em memória basta
  }
  logger.info(`LID mapeado: ${lid} → ${jid}`);

  // Delegar merge/resolução ao ContactReconcilerService
  // Import dinâmico para evitar dependência circular no startup
  import("../services/ContactServices/ContactReconcilerService")
    .then(({ onLidMappingDiscovered }) =>
      onLidMappingDiscovered(lid, jid).catch(e =>
        logger.warn(`[Auto-merge] Erro: ${e.message}`)
      )
    )
    .catch(() => {});
};

// Carrega todos os mapeamentos LID do Redis para memória
const loadRedisLidMappings = async () => {
  try {
    const keys = await cacheLayer.getKeys("lid:*");
    if (!keys || keys.length === 0) return;

    let count = 0;
    for (const key of keys) {
      const jid = await cacheLayer.get(key);
      if (!jid) continue;
      const lid = key.replace("lid:", "");
      if (!lid.endsWith("@lid")) continue;
      lidToJidCache.set(lid, jid);
      count++;
    }
    logger.info(`[LID] ${count} mapeamentos carregados do Redis`);
  } catch (e) {
    // Redis indisponível
  }
};

type Session = WASocket & {
  id?: number;
  companyId?: number;
  store?: Store | any;
  _contactsCache?: Map<string, any>;
  lidMappingStore?: LIDMappingStore;
};

const sessions: Session[] = [];

const retriesQrCodeMap = new Map<number, number>();

export default function msg() {
  return {
    get: (key: WAMessageKey) => {
      const { id } = key;
      if (!id) return;
      let data = msgCache.get(id);
      if (data) {
        try {
          let msg = JSON.parse(data as string);
          return msg?.message;
        } catch (error) {
          logger.error(error);
        }
      }
    },
    save: (msg: WAMessage) => {
      const { id } = msg.key;
      const msgtxt = JSON.stringify(msg);
      try {
        msgCache.set(id as string, msgtxt);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const restartWbot = async (
  companyId: number,
  session?: any
): Promise<void> => {
  try {
    const options: FindOptions = {
      where: {
        companyId,
      },
      attributes: ["id"],
    };

    const whatsapp = await Whatsapp.findAll(options);

    whatsapp.map(async c => {
      const sessionIndex = sessions.findIndex(s => s.id === c.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].ws.close(); // Remove the `undefined` argument
      }
    });
  } catch (err) {
    logger.error(err);
  }
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        sessions[sessionIndex].logout();
        sessions[sessionIndex].ws.close();
      }

      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

export var dataMessages: any = {};

export const msgDB = msg();

export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      (async () => {
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id }
        });

        if (!whatsappUpdate) return;

        const { id, name, allowGroup, companyId } = whatsappUpdate;

        // Baileys v7: usa fetchLatestBaileysVersion (sem argumentos)
        let waVersion: [number, number, number];
        try {
          const { version, isLatest } = await fetchLatestBaileysVersion();
          waVersion = version;
          logger.info(`WA Web v${version.join(".")} | isLatest: ${isLatest}`);
        } catch (e: any) {
          waVersion = [2, 3000, 1027934701];
          logger.warn(`fetchLatestBaileysVersion falhou (${e?.message}). Usando fallback ${waVersion.join(".")}`);
        }

        logger.info(`Iniciando sessão ${name} com Baileys v7`);
        let retriesQrCode = 0;

        let wsocket: Session = null;
        const { state, saveCreds } = await useMultiFileAuthState(whatsapp);
        const signalKeyStore = makeCacheableSignalKeyStore(state.keys, logger);

        wsocket = makeWASocket({
          version: waVersion,
          logger: loggerBaileys,
          printQRInTerminal: false,
          auth: {
            creds: state.creds,
            keys: signalKeyStore,
          },
          generateHighQualityLinkPreview: false,
          linkPreviewImageThumbnailWidth: 128,

          shouldIgnoreJid: (jid) => {
            if (!jid) return true;
            return isJidBroadcast(jid) || (!allowGroup && isJidGroup(jid)) || jid.includes('newsletter')
          },
          browser: Browsers.ubuntu("Chrome"),
          defaultQueryTimeoutMs: 45_000,
          msgRetryCounterCache,
          markOnlineOnConnect: false,
          retryRequestDelayMs: 1_000,
          maxMsgRetryCount: 3,
          emitOwnEvents: true,
          fireInitQueries: true,
          syncFullHistory: false,
          transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3_000 },
          connectTimeoutMs: 60_000,
          keepAliveIntervalMs: 20_000,
          qrTimeout: 120_000,
          getMessage: msgDB.get,
        });

        // LID Mapping Store (Baileys v7 nativo)
        const noopLogger = {
          debug: (..._args: any[]) => {},
          info: (..._args: any[]) => {},
          warn: (..._args: any[]) => {},
          error: (..._args: any[]) => {}
        };
        const lidMappingStore = new LIDMappingStore(signalKeyStore as any, noopLogger as any);

        wsocket._contactsCache = new Map<string, any>();
        (wsocket as any).store = { contacts: {} };
        wsocket.lidMappingStore = lidMappingStore;




        setTimeout(async () => {
          const wpp = await Whatsapp.findByPk(whatsapp.id);
          // console.log("Status:::::",wpp.status)
          if (wpp?.importOldMessages && wpp.status === "CONNECTED") {
            let dateOldLimit = new Date(wpp.importOldMessages).getTime();
            let dateRecentLimit = new Date(wpp.importRecentMessages).getTime();

            addLogs({
              fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, forceNewFile: true,
              text: `Aguardando conexão para iniciar a importação de mensagens:
  Whatsapp nome: ${wpp.name}
  Whatsapp Id: ${wpp.id}
  Criação do arquivo de logs: ${moment().format("DD/MM/YYYY HH:mm:ss")}
  Selecionado Data de inicio de importação: ${moment(dateOldLimit).format("DD/MM/YYYY HH:mm:ss")} 
  Selecionado Data final da importação: ${moment(dateRecentLimit).format("DD/MM/YYYY HH:mm:ss")} 
  `})

            const statusImportMessages = new Date().getTime();

            await wpp.update({
              statusImportMessages
            });
            wsocket.ev.on("messaging-history.set", async (messageSet: any) => {
              //if(messageSet.isLatest){

              const statusImportMessages = new Date().getTime();

              await wpp.update({
                statusImportMessages
              });
              const whatsappId = whatsapp.id;
              let filteredMessages = messageSet.messages
              let filteredDateMessages = []
              filteredMessages.forEach(msg => {
                const timestampMsg = Math.floor(msg.messageTimestamp["low"] * 1000)
                if (isValidMsg(msg) && dateOldLimit < timestampMsg && dateRecentLimit > timestampMsg) {
                  if (msg.key?.remoteJid.split("@")[1] != "g.us") {
                    addLogs({
                      fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Não é Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                    filteredDateMessages.push(msg)
                  } else {
                    if (wpp?.importOldMessagesGroups) {
                      addLogs({
                        fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                      filteredDateMessages.push(msg)
                    }
                  }
                }

              });


              if (!dataMessages?.[whatsappId]) {
                dataMessages[whatsappId] = [];

                dataMessages[whatsappId].unshift(...filteredDateMessages);
              } else {
                dataMessages[whatsappId].unshift(...filteredDateMessages);
              }

              setTimeout(async () => {
                const wpp = await Whatsapp.findByPk(whatsappId);




                io.of(`/workspace-${companyId}`)
                  .emit(`importMessages-${wpp.companyId}`, {
                    action: "update",
                    status: { this: -1, all: -1 }
                  });



                io.of(`/workspace-${companyId}`)
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
                //console.log(JSON.stringify(wpp, null, 2));
              }, 500);

              setTimeout(async () => {


                const wpp = await Whatsapp.findByPk(whatsappId);

                if (wpp?.importOldMessages) {
                  let isTimeStamp = !isNaN(
                    new Date(Math.floor(parseInt(wpp?.statusImportMessages))).getTime()
                  );

                  if (isTimeStamp) {
                    const ultimoStatus = new Date(
                      Math.floor(parseInt(wpp?.statusImportMessages))
                    ).getTime();
                    const dataLimite = +add(ultimoStatus, { seconds: +45 }).getTime();

                    if (dataLimite < new Date().getTime()) {
                      //console.log("Pronto para come?ar")
                      ImportWhatsAppMessageService(wpp.id)
                      wpp.update({
                        statusImportMessages: "Running"
                      })

                    } else {
                      //console.log("Aguardando inicio")
                    }
                  }
                }
                io.of(`/workspace-${companyId}`)
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
              }, 1000 * 45);

            });
          }

        }, 2500);




        wsocket.ev.on(
          "connection.update",
          async (update) => {
            const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;

            if (connection) {
              logger.info(
                `Socket ${name} Connection Update ${connection} ${lastDisconnect ? lastDisconnect.error.message : ""}`
              );
            }

            if (connection === "close") {
              const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

              if (statusCode === 403 || statusCode === DisconnectReason.loggedOut) {
                // Sessão invalidada - limpar tudo e aguardar novo QR
                logger.info(`Socket ${name} - Sessão invalidada (${statusCode}), limpando credenciais...`);
                await whatsapp.update({ status: "PENDING", session: "" });
                await DeleteBaileysService(whatsapp.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);
                io.of(`/workspace-${companyId}`)
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                removeWbot(id, false);
                setTimeout(
                  () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                  2000
                );
              } else {
                // Desconexão temporária (stream error, timeout, etc) - reconectar rápido
                logger.info(`Socket ${name} - Desconexão temporária (${statusCode}), reconectando em 500ms...`);
                removeWbot(id, false);
                setTimeout(
                  () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                  500
                );
              }
            }

            if (connection === "open") {
              await whatsapp.update({
                status: "CONNECTED",
                qrcode: "",
                retries: 0,
                number:
                  wsocket.type === "md"
                    ? jidNormalizedUser((wsocket as WASocket).user.id).split("@")[0]
                    : "-"
              });

              logger.info(`Socket ${name} CONNECTED - aguardando notificações offline...`);

              io.of(`/workspace-${companyId}`)
                .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });

              const sessionIndex = sessions.findIndex(
                s => s.id === whatsapp.id
              );
              if (sessionIndex === -1) {
                wsocket.id = whatsapp.id;
                sessions.push(wsocket);
              }

              resolve(wsocket);
            }

            // Log quando todas notificações offline foram recebidas
            if (receivedPendingNotifications === true) {
              logger.info(`Socket ${name} - ✅ Todas notificações offline recebidas e processadas`);
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                await whatsappUpdate.update({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                await DeleteBaileysService(whatsappUpdate.id);
                await cacheLayer.delFromPattern(`sessions:${whatsapp.id}:*`);
                io.of(`/workspace-${companyId}`)
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsappUpdate
                  });
                wsocket.ev.removeAllListeners("connection.update");
                wsocket.ws.close();
                wsocket = null;
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                await whatsapp.update({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0,
                  number: ""
                });
                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );

                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                io.of(`/workspace-${companyId}`)
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
              }
            }
          }
        );
        wsocket.ev.on("creds.update", saveCreds);

        // Mapear LID → número real quando o WhatsApp compartilha a associação
        wsocket.ev.on("chats.phoneNumberShare" as any, (update: any) => {
          // O evento pode vir como objeto unico ou array
          const updates = Array.isArray(update) ? update : [update];
          for (const u of updates) {
            if (u?.lid && u?.jid) {
              setLidMapping(
                jidNormalizedUser(u.lid),
                jidNormalizedUser(u.jid)
              );
            }
          }
        });

        // Capturar LID de atualizações de contatos
        wsocket.ev.on("contacts.update", (updates: any[]) => {
          for (const contact of updates) {
            if (contact?.id && contact?.lid) {
              setLidMapping(
                jidNormalizedUser(contact.lid),
                jidNormalizedUser(contact.id)
              );
            }
          }
        });

        // Também capturar LID do próprio usuário logado
        if (wsocket.user?.lid) {
          const myLid = jidNormalizedUser(wsocket.user.lid);
          const myJid = jidNormalizedUser(wsocket.user.id);
          setLidMapping(myLid, myJid);
        }

        // Carregar mapeamentos LID do Redis e tentar auto-merge de fantasmas antigos
        loadRedisLidMappings().catch(e =>
          logger.warn(`[LID] Erro ao carregar mapeamentos do Redis: ${e.message}`)
        );

        // wsocket.store = store;
        // store.bind(wsocket.ev);
      })();
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      reject(error);
    }
  });
};