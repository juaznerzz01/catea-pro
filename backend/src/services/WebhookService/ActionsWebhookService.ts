import AppError from "../../errors/AppError";
import { WebhookModel } from "../../models/Webhook";
import { sendMessageFlow } from "../../controllers/MessageController";
import { IConnections, INodes } from "./DispatchWebHookService";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import CreateContactService from "../ContactServices/CreateContactService";
import Contact from "../../models/Contact";
import CreateTicketService from "../TicketServices/CreateTicketService";
import CreateTicketServiceWebhook from "../TicketServices/CreateTicketServiceWebhook";
import { SendMessage } from "../../helpers/SendMessage";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import fs from "fs";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import path from "path";
import SendWhatsAppMedia from "../WbotServices/SendWhatsAppMedia";
import SendWhatsAppMediaFlow, {
  typeSimulation,
  getAudioDurationMs
} from "../WbotServices/SendWhatsAppMediaFlow";
import { randomizarCaminho } from "../../utils/randomizador";
import { SendMessageFlow } from "../../helpers/SendMessageFlow";
import formatBody from "../../helpers/Mustache";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import CreateMessageService, {
  MessageData
} from "../MessageServices/CreateMessageService";
import { randomString } from "../../utils/randomCode";
import ShowQueueService from "../QueueService/ShowQueueService";
import { getIO } from "../../libs/socket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import ShowTicketUUIDService from "../TicketServices/ShowTicketFromUUIDService";
import logger from "../../utils/logger";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import CompaniesSettings from "../../models/CompaniesSettings";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { delay } from "bluebird";
import typebotListener from "../TypebotServices/typebotListener";
import { getWbot } from "../../libs/wbot";
import { proto } from "baileys";
import { handleOpenAi } from "../IntegrationsServices/OpenAiService";
import { IOpenAi } from "../../@types/openai";
import { scheduleFlowTimeout } from "../../helpers/FlowTimeoutHelper";
import { scheduleFlowInterval, cancelFlowInterval, convertIntervalToMs } from "../../helpers/FlowIntervalHelper";
import { scheduleFlowAITimeout, cancelFlowAITimeout } from "../../helpers/FlowAITimeoutHelper";

interface IAddContact {
  companyId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  dataMore?: any;
}

export const ActionsWebhookService = async (
  whatsappId: number,
  idFlowDb: number,
  companyId: number,
  nodes: INodes[],
  connects: IConnections[],
  nextStage: string,
  dataWebhook: any,
  details: any,
  hashWebhookId: string,
  pressKey?: string,
  idTicket?: number,
  numberPhrase: "" | { number: string; name: string; email: string } = "",
  msg?: proto.IWebMessageInfo
): Promise<string> => {
  try {
    const io = getIO();
    let next = nextStage;
    console.log(
      "ActionWebhookService | 53",
      idFlowDb,
      companyId,
      nodes,
      connects,
      nextStage,
      dataWebhook,
      details,
      hashWebhookId,
      pressKey,
      idTicket,
      numberPhrase
    );
    let createFieldJsonName = "";

    const connectStatic = connects;
    if (numberPhrase === "") {
      const nameInput = details.inputs.find(item => item.keyValue === "nome");
      nameInput.data.split(",").map(dataN => {
        const lineToData = details.keysFull.find(item => item === dataN);
        let sumRes = "";
        if (!lineToData) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToData, dataWebhook);
        }
        createFieldJsonName = createFieldJsonName + sumRes;
      });
    } else {
      createFieldJsonName = numberPhrase.name;
    }

    let numberClient = "";

    if (numberPhrase === "") {
      const numberInput = details.inputs.find(
        item => item.keyValue === "celular"
      );

      numberInput.data.split(",").map(dataN => {
        const lineToDataNumber = details.keysFull.find(item => item === dataN);
        let createFieldJsonNumber = "";
        if (!lineToDataNumber) {
          createFieldJsonNumber = dataN;
        } else {
          createFieldJsonNumber = constructJsonLine(
            lineToDataNumber,
            dataWebhook
          );
        }

        numberClient = numberClient + createFieldJsonNumber;
      });
    } else {
      numberClient = numberPhrase.number;
    }

    numberClient = removerNaoLetrasNumeros(numberClient);

    if (numberClient.substring(0, 2) === "55") {
      if (parseInt(numberClient.substring(2, 4)) >= 31) {
        if (numberClient.length === 13) {
          numberClient =
            numberClient.substring(0, 4) + numberClient.substring(5, 13);
        }
      }
    }

    let createFieldJsonEmail = "";

    if (numberPhrase === "") {
      const emailInput = details.inputs.find(item => item.keyValue === "email");
      emailInput.data.split(",").map(dataN => {
        const lineToDataEmail = details.keysFull.find(item =>
          item.endsWith("email")
        );

        let sumRes = "";
        if (!lineToDataEmail) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToDataEmail, dataWebhook);
        }

        createFieldJsonEmail = createFieldJsonEmail + sumRes;
      });
    } else {
      createFieldJsonEmail = numberPhrase.email;
    }

    const lengthLoop = nodes.length;

    // ===== Seleção de conexão WhatsApp (respeitando whatsappId quando existir) =====
    let whatsapp: any;
    try {
      if (whatsappId) {
        // tenta a conexão específica
        whatsapp = await ShowWhatsAppService(whatsappId, companyId);
      }
      // se não encontrar/especificar, usa a padrão da empresa
      if (!whatsapp) {
        whatsapp = await GetDefaultWhatsApp(companyId);
      }
    } catch (e) {
      // fallback final para padrão
      whatsapp = await GetDefaultWhatsApp(companyId);
    }
    // ==============================================================================

    if (whatsapp.status !== "CONNECTED") {
      return;
    }

    let execCount = 0;

    let execFn = "";

    let ticket: any = null;

    let noAlterNext = false;

    for (var i = 0; i < lengthLoop; i++) {
      let nodeSelected: any;
      let ticketInit: Ticket;

      // ✅ Carregar ticket se idTicket fornecido e ticket ainda é null
      if (idTicket && !ticket) {
        ticket = await Ticket.findOne({
          where: { id: idTicket, whatsappId, companyId }
        });
      }

      if (pressKey) {
        console.log("UPDATE2...");
        if (pressKey === "parar") {
          console.log("UPDATE3...");
          if (idTicket) {
            console.log("UPDATE4...");
            ticketInit = await Ticket.findOne({
              where: { id: idTicket, whatsappId }
            });
            await ticket.update({
              status: "closed"
            });
          }
          break;
        }

        if (execFn === "") {
          console.log("UPDATE5...");
          // Load the actual node from the flow so we have full data (invalidOptionMessage, arrayOption, etc.)
          const actualNode = nodes.filter(node => node.id === next)[0];
          nodeSelected = actualNode || { type: "menu" };
        } else {
          console.log("UPDATE6...");
          nodeSelected = nodes.filter(node => node.id === execFn)[0];
        }
      } else {
        console.log("UPDATE7...");
        const otherNode = nodes.filter(node => node.id === next)[0];
        if (otherNode) {
          nodeSelected = otherNode;
        }
      }
        
      if (nodeSelected.type === "message") {
        
        let msg;
        
        const webhook = ticket?.dataWebhook;

        if (webhook && webhook.hasOwnProperty("variables")) {
          msg = {
            body: replaceMessages(webhook, nodeSelected.data.label)
          };
        } else {
          msg = {
            body: nodeSelected.data.label
          };
        }

        await SendMessage(whatsapp, {
          number: numberClient,
          body: msg.body
        });
        
        await intervalWhats("1");
      }
      console.log("273");
      if (nodeSelected.type === "typebot") {
        console.log("275");
        const wbot = getWbot(whatsapp.id);
        await typebotListener({
          wbot: wbot,
          msg,
          ticket,
          typebot: nodeSelected.data.typebotIntegration
        });
      }

      if (nodeSelected.type === "openai" || nodeSelected.type === "gemini") {
        const {
          name,
          prompt,
          voice,
          voiceKey,
          voiceRegion,
          maxTokens,
          temperature,
          apiKey,
          queueId,
          maxMessages,
          model
        } = nodeSelected.data.typebotIntegration as IOpenAi;

        // Marcar ticket para que a IA assuma a conversa de forma contínua
        await ticket.update({
          userId: null,
          companyId: companyId,
          flowWebhook: false,
          lastFlowId: nodeSelected.id,
          hashFlowId: null,
          flowStopped: idFlowDb.toString()
        });

        // Se tiver msg do cliente, já responder com IA
        if (msg) {
          const contact = await Contact.findOne({
            where: { number: numberClient, companyId }
          });

          const wbot = getWbot(whatsapp.id);

          const ticketTraking = await FindOrCreateATicketTrakingService({
            ticketId: ticket.id,
            companyId,
            userId: null,
            whatsappId: whatsapp?.id
          });

          await handleOpenAi(
            {
              name,
              prompt,
              voice: voice || "texto",
              voiceKey: voiceKey || "",
              voiceRegion: voiceRegion || "",
              model: model || "gpt-4o-mini",
              maxTokens,
              temperature,
              apiKey,
              queueId,
              maxMessages
            },
            msg,
            wbot,
            ticket,
            contact,
            null,
            ticketTraking
          );
        }

        break; // IA assumiu - sair do loop do fluxo
      }

      if (nodeSelected.type === "question") {
        const { message } = nodeSelected.data.typebotIntegration;
        const ticketDetails = await ShowTicketService(ticket.id, companyId);
        const bodyFila = formatBody(`${message}`, ticket.contact);
        await delay(3000);
        await typeSimulation(ticket, "composing");
        await SendWhatsAppMessage({
          body: bodyFila,
          ticket: ticketDetails,
          quotedMsg: null
        });
        SetTicketMessagesAsRead(ticketDetails);
        await ticketDetails.update({
          lastMessage: bodyFila
        });
        await ticket.update({
          userId: null,
          companyId: companyId,
          flowWebhook: false,                     // ✅ CRITICAL: Permite múltiplas perguntas
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });

        // Schedule timeout if configured
        const questionTimeoutSec = parseInt(nodeSelected.data?.timeoutSeconds || nodeSelected.data?.typebotIntegration?.timeoutSeconds || "0");
        if (questionTimeoutSec > 0) {
          const timeoutConnection = connects.find(
            c => c.source === nodeSelected.id && c.sourceHandle === "timeout"
          );
          if (timeoutConnection) {
            const contact = await Contact.findOne({ where: { number: numberClient, companyId } });
            await scheduleFlowTimeout({
              ticketId: ticket.id,
              companyId,
              whatsappId,
              nodeId: nodeSelected.id,
              flowId: idFlowDb,
              hashFlowId: hashWebhookId,
              timeoutSeconds: questionTimeoutSec,
              numberClient,
              contactName: contact?.name || createFieldJsonName,
              contactEmail: contact?.email || createFieldJsonEmail
            });
          }
        }

        // Schedule AI timeout if "ai" connection exists (uses its own timer)
        const questionAiSec = parseInt(nodeSelected.data?.aiTimeoutSeconds || nodeSelected.data?.typebotIntegration?.aiTimeoutSeconds || "0");
        if (questionAiSec > 0) {
          const aiConnection = connects.find(
            c => c.source === nodeSelected.id && c.sourceHandle === "ai"
          );
          if (aiConnection) {
            const contactAI = await Contact.findOne({ where: { number: numberClient, companyId } });
            await scheduleFlowAITimeout({
              ticketId: ticket.id,
              companyId,
              whatsappId,
              nodeId: nodeSelected.id,
              flowId: idFlowDb,
              hashFlowId: hashWebhookId,
              timeoutSeconds: questionAiSec,
              numberClient,
              contactName: contactAI?.name || createFieldJsonName,
              contactEmail: contactAI?.email || createFieldJsonEmail
            });
          }
        }

        break;
      }

      if (nodeSelected.type === "ticket") {
        const queueId = nodeSelected.data?.data?.id || nodeSelected.data?.id;
        const queue = await ShowQueueService(queueId, companyId);

        await ticket.update({
          status: "pending",
          queueId: queue.id,
          userId: ticket.userId,
          companyId: companyId,
          flowWebhook: true,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });

        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId,
          userId: ticket.userId
        });

        await UpdateTicketService({
          ticketData: {
            status: "pending",
            queueId: queue.id
          },
          ticketId: ticket.id,
          companyId
        });

        await CreateLogTicketService({
          ticketId: ticket.id,
          type: "queue",
          queueId: queue.id
        });

        let settings = await CompaniesSettings.findOne({
          where: {
            companyId: companyId
          }
        });

        const enableQueuePosition = settings.sendQueuePosition === "enabled";

        if (enableQueuePosition) {
          const count = await Ticket.findAndCountAll({
            where: {
              userId: null,
              status: "pending",
              companyId,
              queueId: queue.id,
              whatsappId: whatsapp.id,
              isGroup: false
            }
          });
          const qtd = count.count === 0 ? 1 : count.count;
          const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
          const ticketDetails = await ShowTicketService(ticket.id, companyId);
          const bodyFila = formatBody(`${msgFila}`, ticket.contact);
          await delay(3000);
          await typeSimulation(ticket, "composing");
          await SendWhatsAppMessage({
            body: bodyFila,
            ticket: ticketDetails,
            quotedMsg: null
          });
          SetTicketMessagesAsRead(ticketDetails);
          await ticketDetails.update({
            lastMessage: bodyFila
          });
        }
      }

      if (nodeSelected.type === "kanbanPhase") {
        const phaseId = nodeSelected.data?.data?.id || nodeSelected.data?.id;
        if (phaseId) {
          try {
            const MoveTicketLaneService = (await import("../TicketServices/MoveTicketLaneService")).default;
            await MoveTicketLaneService({
              ticketId: ticket.id,
              companyId: companyId,
              toLaneId: phaseId,
              sendGreeting: true
            });
            console.log(`✅ [FlowBuilder] Ticket ${ticket.id} movido para fase kanban ${phaseId}`);
          } catch (err) {
            console.error(`❌ [FlowBuilder] Erro ao mover fase kanban:`, err);
          }
        }

        // Schedule AI timeout for kanbanPhase
        const kanbanAiSec = parseInt(nodeSelected.data?.data?.aiTimeoutSeconds || nodeSelected.data?.aiTimeoutSeconds || "0");
        if (kanbanAiSec > 0) {
          const aiConnKanban = connects.find(c => c.source === nodeSelected.id && c.sourceHandle === "ai");
          if (aiConnKanban) {
            const contactKanban = await Contact.findOne({ where: { number: numberClient, companyId } });
            await ticket.update({ lastFlowId: nodeSelected.id, flowWebhook: false, flowStopped: idFlowDb.toString() });
            await scheduleFlowAITimeout({
              ticketId: ticket.id, companyId, whatsappId, nodeId: nodeSelected.id,
              flowId: idFlowDb, hashFlowId: hashWebhookId, timeoutSeconds: kanbanAiSec, numberClient,
              contactName: contactKanban?.name || createFieldJsonName, contactEmail: contactKanban?.email || createFieldJsonEmail
            });
            break;
          }
        }
      }

      if (nodeSelected.type === "addTag") {
        const tagIds = (nodeSelected.data?.data?.tags || nodeSelected.data?.tags || []).map((t: any) => t.id);
        if (tagIds.length > 0) {
          try {
            const ContactTag = (await import("../../models/ContactTag")).default;
            const Tag = (await import("../../models/Tag")).default;
            const contactId = ticket.contactId;

            if (contactId) {
              // Buscar tags atuais do contato
              const currentContactTags = await ContactTag.findAll({
                where: { contactId }
              });
              const currentTagIds = currentContactTags.map((ct: any) => ct.tagId);

              // Adicionar apenas as novas (sem remover as existentes)
              for (const tagId of tagIds) {
                if (!currentTagIds.includes(tagId)) {
                  await ContactTag.create({ contactId, tagId });
                }
              }

              // Recarregar contato com tags para emitir via socket
              const contactReloaded = await Contact.findByPk(contactId, {
                include: [{ model: Tag, as: "tags" }]
              });

              const io = getIO();
              io.of(`/workspace-${companyId}`)
                .emit(`company-${companyId}-contact`, {
                  action: "update",
                  contact: contactReloaded
                });

              // Emitir atualização do ticket também
              const updatedTicket = await ShowTicketService(ticket.id, companyId);
              io.of(`/workspace-${companyId}`)
                .emit(`company-${companyId}-ticket`, {
                  action: "update",
                  ticket: updatedTicket
                });
            }
            console.log(`✅ [FlowBuilder] Tags ${tagIds.join(",")} adicionadas ao contato ${contactId} do ticket ${ticket.id}`);
          } catch (err) {
            console.error(`❌ [FlowBuilder] Erro ao adicionar tags:`, err);
          }
        }

        // Schedule AI timeout for addTag
        const tagAiSec = parseInt(nodeSelected.data?.data?.aiTimeoutSeconds || nodeSelected.data?.aiTimeoutSeconds || "0");
        if (tagAiSec > 0) {
          const aiConnTag = connects.find(c => c.source === nodeSelected.id && c.sourceHandle === "ai");
          if (aiConnTag) {
            const contactTag = await Contact.findOne({ where: { number: numberClient, companyId } });
            await ticket.update({ lastFlowId: nodeSelected.id, flowWebhook: false, flowStopped: idFlowDb.toString() });
            await scheduleFlowAITimeout({
              ticketId: ticket.id, companyId, whatsappId, nodeId: nodeSelected.id,
              flowId: idFlowDb, hashFlowId: hashWebhookId, timeoutSeconds: tagAiSec, numberClient,
              contactName: contactTag?.name || createFieldJsonName, contactEmail: contactTag?.email || createFieldJsonEmail
            });
            break;
          }
        }
      }

      if (nodeSelected.type === "singleBlock") {
        for (var iLoc = 0; iLoc < nodeSelected.data.seq.length; iLoc++) {
          const elementNowSelected = nodeSelected.data.seq[iLoc];

          ticket = await Ticket.findOne({
            where: { id: idTicket, companyId }
          });

          if (elementNowSelected.includes("message")) {
            const bodyFor = nodeSelected.data.elements.filter(
              item => item.number === elementNowSelected
            )[0].value;
            const ticketDetails = await ShowTicketService(idTicket, companyId);
            let msg;
            const webhook = ticket?.dataWebhook;
            if (webhook && webhook.hasOwnProperty("variables")) {
              msg = replaceMessages(webhook.variables, bodyFor);
            } else {
              msg = bodyFor;
            }
            await delay(3000);
            await typeSimulation(ticket, "composing");
            await SendWhatsAppMessage({
              body: msg,
              ticket: ticketDetails,
              quotedMsg: null
            });
            SetTicketMessagesAsRead(ticketDetails);
            await ticketDetails.update({
              lastMessage: formatBody(bodyFor, ticket.contact)
            });
            await intervalWhats("1");
          }
          if (elementNowSelected.includes("interval")) {
            await intervalWhats(
              nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].value
            );
          }

          if (elementNowSelected.includes("img")) {
            await typeSimulation(ticket, "composing");
            await SendMessage(whatsapp, {
              number: numberClient,
              body: "",
              mediaPath: path.resolve(__dirname, "..", "..", "..", "public", nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value)
            });
            await intervalWhats("1");
          }

          if (elementNowSelected.includes("audio")) {
            const mediaDirectory = path.resolve(__dirname, "..", "..", "..", "public", nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value);
            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });
            const audioDuration = await getAudioDurationMs(mediaDirectory);
            await typeSimulation(ticket, "recording", audioDuration);
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt,
              isRecord: nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].record
            });
            await intervalWhats("1");
          }
          if (elementNowSelected.includes("video")) {
            const mediaDirectory = path.resolve(__dirname, "..", "..", "..", "public", nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value);
            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });
            await typeSimulation(ticket, "recording");
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });
            await intervalWhats("1");
          }
          
          // ---------- INÍCIO DO BLOCO ADICIONADO PARA DOCUMENTOS ----------
          if (elementNowSelected.includes("document")) {
            const mediaDirectory = path.resolve(__dirname, "..", "..", "..", "public", nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value);
            
            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            await typeSimulation(ticket, "composing");

            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });

            await intervalWhats("1");
          }
          // ---------- FIM DO BLOCO ADICIONADO PARA DOCUMENTOS ----------

        }

        // Schedule AI timeout for singleBlock if configured
        const singleBlockAiSec = parseInt(nodeSelected.data?.aiTimeoutSeconds || "0");
        console.log("[FLOW-AI-DEBUG] singleBlock aiTimeoutSeconds=", singleBlockAiSec, "nodeId=", nodeSelected.id, "data keys=", Object.keys(nodeSelected.data || {}));
        if (singleBlockAiSec > 0) {
          const aiConnSB = connects.find(
            c => c.source === nodeSelected.id && c.sourceHandle === "ai"
          );
          console.log("[FLOW-AI-DEBUG] aiConnection found:", !!aiConnSB, "all connects from node:", connects.filter(c => c.source === nodeSelected.id).map(c => c.sourceHandle));
          if (aiConnSB) {
            const contactSB = await Contact.findOne({ where: { number: numberClient, companyId } });
            // Update ticket to wait at this node
            await ticket.update({
              lastFlowId: nodeSelected.id,
              flowWebhook: false,
              flowStopped: idFlowDb.toString()
            });
            await scheduleFlowAITimeout({
              ticketId: ticket.id,
              companyId,
              whatsappId,
              nodeId: nodeSelected.id,
              flowId: idFlowDb,
              hashFlowId: hashWebhookId,
              timeoutSeconds: singleBlockAiSec,
              numberClient,
              contactName: contactSB?.name || createFieldJsonName,
              contactEmail: contactSB?.email || createFieldJsonEmail
            });
            break; // Parar o fluxo aqui para esperar o AI timeout
          }
        }
      }

      // ========================================================================
      // Interval node: pausa o fluxo por um tempo definido
      // ========================================================================
      if (nodeSelected.type === "interval") {
        const intervalData = nodeSelected.data;
        const delayMs = convertIntervalToMs(intervalData);
        const SHORT_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos

        if (delayMs <= SHORT_THRESHOLD_MS && !intervalData.businessHours?.enabled) {
          // Intervalo curto: espera inline (mesmo comportamento de antes)
          await intervalWhats((delayMs / 1000).toString());
        } else {
          // Intervalo longo ou com horário comercial: agenda job no Bull Queue
          const nextConnection = connects.find(c => c.source === nodeSelected.id);
          if (nextConnection) {
            await scheduleFlowInterval({
              ticketId: ticket.id,
              companyId,
              whatsappId,
              nodeId: nodeSelected.id,
              flowId: idFlowDb,
              hashFlowId: hashWebhookId,
              delayMs,
              numberClient,
              contactName: createFieldJsonName || "",
              contactEmail: createFieldJsonEmail || "",
              nextNodeId: nextConnection.target,
              businessHours: intervalData.businessHours || null
            });

            await ticket.update({
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });

            console.log(`[FLOW-INTERVAL] Agendado intervalo de ${delayMs}ms para ticket ${ticket.id}`);
            break;
          }
        }

        // Schedule AI timeout for interval
        const intervalAiSec = parseInt(nodeSelected.data?.aiTimeoutSeconds || "0");
        if (intervalAiSec > 0) {
          const aiConnInterval = connects.find(c => c.source === nodeSelected.id && c.sourceHandle === "ai");
          if (aiConnInterval) {
            const contactInterval = await Contact.findOne({ where: { number: numberClient, companyId } });
            await ticket.update({ lastFlowId: nodeSelected.id, flowWebhook: false, flowStopped: idFlowDb.toString() });
            await scheduleFlowAITimeout({
              ticketId: ticket.id, companyId, whatsappId, nodeId: nodeSelected.id,
              flowId: idFlowDb, hashFlowId: hashWebhookId, timeoutSeconds: intervalAiSec, numberClient,
              contactName: contactInterval?.name || createFieldJsonName, contactEmail: contactInterval?.email || createFieldJsonEmail
            });
            break;
          }
        }
      }

      let isRandomizer: boolean;
      if (nodeSelected.type === "randomizer") {
        const selectedRandom = randomizarCaminho(
          nodeSelected.data.percent / 100
        );
        const resultConnect = connects.filter(
          connect => connect.source === nodeSelected.id
        );
        console.log(`[FLOW-RANDOMIZER] percent=${nodeSelected.data.percent}% sorteado=${selectedRandom} conexoes=${resultConnect.map(c => c.sourceHandle).join(",")}`);
        const handleId = selectedRandom === "A" ? "a" : "b";
        let selectedConnection = resultConnect.find(item => item.sourceHandle === handleId);

        // Se a saída sorteada não está conectada, tentar a outra
        if (!selectedConnection) {
          const fallbackHandle = handleId === "a" ? "b" : "a";
          selectedConnection = resultConnect.find(item => item.sourceHandle === fallbackHandle);
        }

        if (selectedConnection) {
          next = selectedConnection.target;
          noAlterNext = true;
          isRandomizer = true;
        } else {
          // Nenhuma saída conectada — encerrar o fluxo
          console.log("[FLOW-RANDOMIZER] Nenhuma saída conectada no randomizador", nodeSelected.id);
          break;
        }
      }

      let isMenu: boolean;
      if (nodeSelected.type === "menu") {
        console.log("[FLOW-MENU-DEBUG] menu node reached", { pressKey, nodeType: nodeSelected.type, invalidOptionMessage: nodeSelected.data?.invalidOptionMessage, arrayOption: nodeSelected.data?.arrayOption });
        if (pressKey) {
          const filterOne = connectStatic.filter(
            confil => confil.source === next
          );
          const filterTwo = filterOne.filter(
            filt2 => filt2.sourceHandle === "a" + pressKey
          );
          if (filterTwo.length > 0) {
            execFn = filterTwo[0].target;
          } else {
            execFn = undefined;
          }
          if (execFn === undefined) {
            // Invalid option: send error message (if configured) + always re-send menu
            console.log("[FLOW-MENU-DEBUG] invalid option detected", { pressKey, execFn });
            const ticketDetailsInv = await ShowTicketService(ticket.id, companyId);

            // Send the invalid option message if configured
            const invalidMsg = nodeSelected.data?.invalidOptionMessage;
            if (invalidMsg && invalidMsg.trim() !== "") {
              await typeSimulation(ticket, "composing");
              await SendWhatsAppMessage({
                body: formatBody(invalidMsg, ticket.contact),
                ticket: ticketDetailsInv,
                quotedMsg: null
              });
              await intervalWhats("1");
            }

            // Always re-build and re-send the menu
            let optionsMenuRetry = "";
            nodeSelected.data.arrayOption.map(item => {
              optionsMenuRetry += `[${item.number}] ${item.value}\n`;
            });
            const menuRetry = `${nodeSelected.data.message}\n\n${optionsMenuRetry}`;
            const webhookRetry = ticket?.dataWebhook;
            let msgRetry;
            if (webhookRetry && webhookRetry.hasOwnProperty("variables")) {
              msgRetry = replaceMessages(webhookRetry, menuRetry);
            } else {
              msgRetry = menuRetry;
            }
            await typeSimulation(ticket, "composing");
            await SendWhatsAppMessage({
              body: msgRetry,
              ticket: ticketDetailsInv,
              quotedMsg: null
            });
            await ticketDetailsInv.update({
              lastMessage: formatBody(msgRetry, ticket.contact)
            });

            // Re-schedule timeout if configured (it was cancelled when user responded)
            const menuTimeoutSecRetry = parseInt(nodeSelected.data?.timeoutSeconds || "0");
            if (menuTimeoutSecRetry > 0) {
              const timeoutConnectionRetry = connects.find(
                c => c.source === nodeSelected.id && c.sourceHandle === "timeout"
              );
              if (timeoutConnectionRetry) {
                const contactRetry = await Contact.findOne({ where: { number: numberClient, companyId } });
                await scheduleFlowTimeout({
                  ticketId: ticket.id,
                  companyId,
                  whatsappId,
                  nodeId: nodeSelected.id,
                  flowId: idFlowDb,
                  hashFlowId: hashWebhookId,
                  timeoutSeconds: menuTimeoutSecRetry,
                  numberClient,
                  contactName: contactRetry?.name || "",
                  contactEmail: contactRetry?.email || ""
                });
              }
            }

            // Re-schedule AI timeout if "ai" connection exists
            const menuAiSecRetry = parseInt(nodeSelected.data?.aiTimeoutSeconds || "0");
            if (menuAiSecRetry > 0) {
              const aiConnectionRetry = connects.find(
                c => c.source === nodeSelected.id && c.sourceHandle === "ai"
              );
              if (aiConnectionRetry) {
                const contactAIRetry = await Contact.findOne({ where: { number: numberClient, companyId } });
                await scheduleFlowAITimeout({
                  ticketId: ticket.id,
                  companyId,
                  whatsappId,
                  nodeId: nodeSelected.id,
                  flowId: idFlowDb,
                  hashFlowId: hashWebhookId,
                  timeoutSeconds: menuAiSecRetry,
                  numberClient,
                  contactName: contactAIRetry?.name || "",
                  contactEmail: contactAIRetry?.email || ""
                });
              }
            }

            // Keep ticket waiting on this same menu node (don't advance)
            break;
          }
          pressKey = "999";
          const isNodeExist = nodes.filter(item => item.id === execFn);
          console.log(674, "menu");
          if (isNodeExist.length > 0) {
            isMenu = isNodeExist[0].type === "menu" ? true : false;
          } else {
            isMenu = false;
          }
        } else {
          console.log(681, "menu");
          let optionsMenu = "";
          nodeSelected.data.arrayOption.map(item => {
            optionsMenu += `[${item.number}] ${item.value}
`;
          });
          const menuCreate = `${nodeSelected.data.message}

${optionsMenu}`;
          const webhook = ticket?.dataWebhook;
          let msg;
          if (webhook && webhook.hasOwnProperty("variables")) {
            msg = {
              body: replaceMessages(webhook, menuCreate),
              number: numberClient,
              companyId: companyId
            };
          } else {
            msg = {
              body: menuCreate,
              number: numberClient,
              companyId: companyId
            };
          }
          const ticketDetails = await ShowTicketService(ticket.id, companyId);
          const messageData: MessageData = {
            wid: randomString(50),
            ticketId: ticket.id,
            body: msg.body,
            fromMe: true,
            read: true
          };
          await typeSimulation(ticket, "composing");

          await SendWhatsAppMessage({
            body: msg.body,
            ticket: ticketDetails,
            quotedMsg: null
          });
          SetTicketMessagesAsRead(ticketDetails);
          await ticketDetails.update({
            lastMessage: formatBody(msg.body, ticket.contact)
          });
          await intervalWhats("1");

          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          }

          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              dataWebhook: dataWebhook,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });

            // Schedule timeout if configured
            const menuTimeoutSec = parseInt(nodeSelected.data?.timeoutSeconds || "0");
            if (menuTimeoutSec > 0) {
              const timeoutConnection = connects.find(
                c => c.source === nodeSelected.id && c.sourceHandle === "timeout"
              );
              if (timeoutConnection) {
                const contact = await Contact.findOne({ where: { number: numberClient, companyId } });
                await scheduleFlowTimeout({
                  ticketId: ticket.id,
                  companyId,
                  whatsappId,
                  nodeId: nodeSelected.id,
                  flowId: idFlowDb,
                  hashFlowId: hashWebhookId,
                  timeoutSeconds: menuTimeoutSec,
                  numberClient,
                  contactName: contact?.name || createFieldJsonName,
                  contactEmail: contact?.email || createFieldJsonEmail
                });
              }
            }

            // Schedule AI timeout if "ai" connection exists
            const menuAiSec = parseInt(nodeSelected.data?.aiTimeoutSeconds || "0");
            if (menuAiSec > 0) {
              const aiConnectionMenu = connects.find(
                c => c.source === nodeSelected.id && c.sourceHandle === "ai"
              );
              if (aiConnectionMenu) {
                const contactAIMenu = await Contact.findOne({ where: { number: numberClient, companyId } });
                await scheduleFlowAITimeout({
                  ticketId: ticket.id,
                  companyId,
                  whatsappId,
                  nodeId: nodeSelected.id,
                  flowId: idFlowDb,
                  hashFlowId: hashWebhookId,
                  timeoutSeconds: menuAiSec,
                  numberClient,
                  contactName: contactAIMenu?.name || createFieldJsonName,
                  contactEmail: contactAIMenu?.email || createFieldJsonEmail
                });
              }
            }
          }
          break;
        }
      }

      let isContinue = false;
      if (pressKey === "999" && execCount > 0) {
        console.log(587, "ActionsWebhookService | 587");
        pressKey = undefined;
        let result = connects.filter(connect => connect.source === execFn)[0];
        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      } else {
        let result;
        if (isMenu) {
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
        } else if (isRandomizer) {
          isRandomizer = false;
          result = next;
        } else {
          result = connects.filter(connect => connect.source === next)[0];
        }
        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
        console.log(619, "ActionsWebhookService");
      }
      if (!pressKey && !isContinue) {
        const nextNode = connects.filter(
          connect => connect.source === nodeSelected.id
        ).length;
        console.log(626, "ActionsWebhookService");
        if (nextNode === 0) {
          console.log(654, "ActionsWebhookService");
          await Ticket.findOne({
            where: { id: idTicket, whatsappId, companyId: companyId }
          });
          await ticket.update({
            lastFlowId: nodeSelected.id,
            hashFlowId: null,
            flowWebhook: false,
            flowStopped: idFlowDb.toString()
          });

          // Schedule timeout if node has timeout configured and a timeout connection exists
          const endTimeoutSec = parseInt(nodeSelected.data?.timeoutSeconds || "0");
          if (endTimeoutSec > 0) {
            const timeoutConn = connects.find(
              c => c.source === nodeSelected.id && c.sourceHandle === "timeout"
            );
            if (timeoutConn) {
              const contactForTimeout = await Contact.findOne({ where: { number: numberClient, companyId } });
              await scheduleFlowTimeout({
                ticketId: ticket.id,
                companyId,
                whatsappId,
                nodeId: nodeSelected.id,
                flowId: idFlowDb,
                hashFlowId: hashWebhookId,
                timeoutSeconds: endTimeoutSec,
                numberClient,
                contactName: contactForTimeout?.name || createFieldJsonName,
                contactEmail: contactForTimeout?.email || createFieldJsonEmail
              });
            }
          }

          // Schedule AI timeout if "ai" connection exists
          const endAiSec = parseInt(nodeSelected.data?.aiTimeoutSeconds || "0");
          if (endAiSec > 0) {
            const aiConnEnd = connects.find(
              c => c.source === nodeSelected.id && c.sourceHandle === "ai"
            );
            if (aiConnEnd) {
              const contactForAI = await Contact.findOne({ where: { number: numberClient, companyId } });
              await scheduleFlowAITimeout({
                ticketId: ticket.id,
                companyId,
                whatsappId,
                nodeId: nodeSelected.id,
                flowId: idFlowDb,
                hashFlowId: hashWebhookId,
                timeoutSeconds: endAiSec,
                numberClient,
                contactName: contactForAI?.name || createFieldJsonName,
                contactEmail: contactForAI?.email || createFieldJsonEmail
              });
            }
          }

          break;
        }
      }
      isContinue = false;
      if (next === "") {
        break;
      }
      console.log(678, "ActionsWebhookService");
      console.log("UPDATE10...");
      ticket = await Ticket.findOne({
        where: { id: idTicket, whatsappId, companyId: companyId }
      });
      if (ticket.status === "closed") {
        io.of(`/workspace-${companyId}`)
          .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticketId: ticket.id
          });
      }
      console.log("UPDATE12...");
      await ticket.update({
        whatsappId: whatsappId,
        queueId: ticket?.queueId,
        userId: null,
        companyId: companyId,
        flowWebhook: true,
        lastFlowId: nodeSelected.id,
        hashFlowId: hashWebhookId,
        flowStopped: idFlowDb.toString()
      });
      noAlterNext = false;
      execCount++;
    }
    return "ds";
  } catch (error) {
    logger.error(error);
  }
};

const constructJsonLine = (line: string, json: any) => {
  let valor = json;
  const chaves = line.split(".");
  if (chaves.length === 1) {
    return valor[chaves[0]];
  }
  for (const chave of chaves) {
    valor = valor[chave];
  }
  return valor;
};

function removerNaoLetrasNumeros(texto: string) {
  return texto.replace(/[^a-zA-Z0-9]/g, "");
}

const sendMessageWhats = async (
  whatsId: number,
  msg: any,
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
) => {
  sendMessageFlow(whatsId, msg, req);
  return Promise.resolve();
};

const intervalWhats = (time: string) => {
  const seconds = parseInt(time) * 1000;
  return new Promise(resolve => setTimeout(resolve, seconds));
};

const replaceMessages = (variables, message) => {
  return message.replace(
    /{{\s*([^{}\s]+)\s*}}/g,
    (match, key) => variables[key] || ""
  );
};

const replaceMessagesOld = (
  message: string,
  details: any,
  dataWebhook: any,
  dataNoWebhook?: any
) => {
  const matches = message.match(/\{([^}]+)\}/g);
  if (dataWebhook) {
    let newTxt = message.replace(/{+nome}+/, dataNoWebhook.nome);
    newTxt = newTxt.replace(/{+numero}+/, dataNoWebhook.numero);
    newTxt = newTxt.replace(/{+email}+/, dataNoWebhook.email);
    return newTxt;
  }
  if (matches && matches.includes("inputs")) {
    const placeholders = matches.map(match => match.replace(/\{|\}/g, ""));
    let newText = message;
    placeholders.map(item => {
      const value = details["inputs"].find(
        itemLocal => itemLocal.keyValue === item
      );
      const lineToData = details["keysFull"].find(itemLocal =>
        itemLocal.endsWith(`.${value.data}`)
      );
      const createFieldJson = constructJsonLine(lineToData, dataWebhook);
      newText = newText.replace(`{${item}}`, createFieldJson);
    });
    return newText;
  } else {
    return message;
  }
};
