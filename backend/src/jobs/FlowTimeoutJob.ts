import { Job } from "bull";
import Ticket from "../models/Ticket";
import { FlowBuilderModel } from "../models/FlowBuilder";
import { ActionsWebhookService } from "../services/WebhookService/ActionsWebhookService";
import { IConnections, INodes } from "../services/WebhookService/DispatchWebHookService";
import { WebhookModel } from "../models/Webhook";
import Contact from "../models/Contact";
import logger from "../utils/logger";
import cacheLayer from "../libs/cache";

interface FlowTimeoutData {
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

export default {
  key: "FlowTimeoutJob",
  async handle({ data }: Job<FlowTimeoutData>) {
    try {
      const { ticketId, companyId, whatsappId, nodeId, flowId, hashFlowId, numberClient, contactName, contactEmail } = data;

      logger.info(`[FlowTimeout] Verificando timeout para ticket ${ticketId}, node ${nodeId}`);

      // Check if ticket is still waiting at the same node
      const ticket = await Ticket.findOne({
        where: { id: ticketId, companyId }
      });

      if (!ticket) {
        logger.info(`[FlowTimeout] Ticket ${ticketId} nao encontrado, ignorando`);
        return;
      }

      // If ticket moved on (user responded, or flow changed), skip
      if (ticket.lastFlowId !== nodeId) {
        logger.info(`[FlowTimeout] Ticket ${ticketId} ja avancou (lastFlowId=${ticket.lastFlowId}, esperado=${nodeId}), ignorando`);
        return;
      }

      // If ticket is closed, skip
      if (ticket.status === "closed") {
        logger.info(`[FlowTimeout] Ticket ${ticketId} esta fechado, ignorando`);
        return;
      }

      // Load the flow
      const flow = await FlowBuilderModel.findOne({
        where: { id: flowId }
      });

      if (!flow) {
        logger.info(`[FlowTimeout] Flow ${flowId} nao encontrado, ignorando`);
        return;
      }

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      // Find the timeout connection from this node
      const timeoutConnection = connections.find(
        c => c.source === nodeId && c.sourceHandle === "timeout"
      );

      if (!timeoutConnection) {
        logger.info(`[FlowTimeout] Nenhuma conexao timeout encontrada para node ${nodeId}, ignorando`);
        return;
      }

      logger.info(`[FlowTimeout] Executando timeout para ticket ${ticketId}: node ${nodeId} -> ${timeoutConnection.target}`);

      // Clear the timeout key from Redis
      await cacheLayer.del(`flow-timeout:${ticketId}`);

      // Update ticket to follow timeout path
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

      // Execute flow from the timeout target
      await ActionsWebhookService(
        whatsappId,
        flowId,
        companyId,
        nodes,
        connections,
        timeoutConnection.target,
        null,
        "",
        hashFlowId || "",
        undefined,
        ticketId,
        mountDataContact
      );

    } catch (error) {
      logger.error(`[FlowTimeout] Erro: ${error.message}`);
      logger.error(error);
    }
  }
};
