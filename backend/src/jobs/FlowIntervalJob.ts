import { Job } from "bull";
import Ticket from "../models/Ticket";
import { FlowBuilderModel } from "../models/FlowBuilder";
import { ActionsWebhookService } from "../services/WebhookService/ActionsWebhookService";
import { IConnections, INodes } from "../services/WebhookService/DispatchWebHookService";
import logger from "../utils/logger";
import cacheLayer from "../libs/cache";
import { scheduleFlowInterval, getNextBusinessHoursMs } from "../helpers/FlowIntervalHelper";

interface FlowIntervalData {
  ticketId: number;
  companyId: number;
  whatsappId: number;
  nodeId: string;
  flowId: number;
  hashFlowId: string;
  delayMs: number;
  numberClient: string;
  contactName: string;
  contactEmail: string;
  nextNodeId: string;
  businessHours: { enabled: boolean; startTime: string; endTime: string; daysOfWeek: number[] } | null;
}

export default {
  key: "FlowIntervalJob",
  async handle({ data }: Job<FlowIntervalData>) {
    try {
      const { ticketId, companyId, whatsappId, nodeId, flowId, hashFlowId, numberClient, contactName, contactEmail, nextNodeId, businessHours } = data;

      logger.info(`[FlowInterval] Verificando intervalo para ticket ${ticketId}, node ${nodeId}`);

      // Check if ticket exists and is not closed
      const ticket = await Ticket.findOne({
        where: { id: ticketId, companyId }
      });

      if (!ticket) {
        logger.info(`[FlowInterval] Ticket ${ticketId} nao encontrado, ignorando`);
        return;
      }

      if (ticket.status === "closed") {
        logger.info(`[FlowInterval] Ticket ${ticketId} esta fechado, ignorando`);
        return;
      }

      // If ticket moved on (user responded, or flow changed), skip
      if (ticket.lastFlowId !== nodeId) {
        logger.info(`[FlowInterval] Ticket ${ticketId} ja avancou (lastFlowId=${ticket.lastFlowId}, esperado=${nodeId}), ignorando`);
        return;
      }

      // If businessHours is enabled and current time is outside business hours, re-schedule
      if (businessHours && businessHours.enabled) {
        const msUntilBusinessHours = getNextBusinessHoursMs(businessHours);

        if (msUntilBusinessHours > 0) {
          logger.info(`[FlowInterval] Fora do horario comercial para ticket ${ticketId}, reagendando em ${msUntilBusinessHours}ms`);
          await scheduleFlowInterval({ ...data, delayMs: msUntilBusinessHours });
          return;
        }
      }

      // Clear Redis key
      await cacheLayer.del(`flow-interval:${ticketId}`);

      // Load the flow
      const flow = await FlowBuilderModel.findOne({
        where: { id: flowId }
      });

      if (!flow) {
        logger.info(`[FlowInterval] Flow ${flowId} nao encontrado, ignorando`);
        return;
      }

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      logger.info(`[FlowInterval] Executando intervalo para ticket ${ticketId}: node ${nodeId} -> ${nextNodeId}`);

      // Update ticket to follow interval path
      await ticket.update({
        flowWebhook: true,
        lastFlowId: nodeId,
        hashFlowId: hashFlowId || "",
        flowStopped: flowId.toString()
      });

      const mountDataContact = {
        number: numberClient,
        name: contactName,
        email: contactEmail
      };

      // Execute flow from the nextNodeId
      await ActionsWebhookService(
        whatsappId,
        flowId,
        companyId,
        nodes,
        connections,
        nextNodeId,
        null,
        "",
        hashFlowId || "",
        undefined,
        ticketId,
        mountDataContact
      );

    } catch (error) {
      logger.error(`[FlowInterval] Erro: ${error.message}`);
      logger.error(error);
    }
  }
};
