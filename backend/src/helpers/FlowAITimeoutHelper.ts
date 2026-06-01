import Queue from "../libs/queue";
import cacheLayer from "../libs/cache";
import logger from "../utils/logger";

interface ScheduleAITimeoutParams {
  ticketId: number;
  companyId: number;
  whatsappId: number;
  nodeId: string;
  flowId: number;
  hashFlowId: string;
  timeoutSeconds: number;
  numberClient: string;
  contactName: string;
  contactEmail: string;
}

export const scheduleFlowAITimeout = async (params: ScheduleAITimeoutParams): Promise<void> => {
  const { ticketId, timeoutSeconds } = params;

  // Cancel any existing AI timeout for this ticket
  await cancelFlowAITimeout(ticketId);

  try {
    const job = await Queue.add("FlowAITimeoutJob", params, {
      delay: timeoutSeconds * 1000,
      removeOnComplete: true,
      removeOnFail: true
    });

    // Store job ID in Redis so we can cancel it later
    await cacheLayer.set(`flow-ai-timeout:${ticketId}`, job.id.toString());

    logger.info(`[FlowAITimeout] Agendado AI timeout de ${timeoutSeconds}s para ticket ${ticketId}, jobId=${job.id}`);
  } catch (error) {
    logger.error(`[FlowAITimeout] Erro ao agendar AI timeout: ${error.message}`);
  }
};

export const cancelFlowAITimeout = async (ticketId: number): Promise<void> => {
  try {
    const jobId = await cacheLayer.get(`flow-ai-timeout:${ticketId}`);

    if (jobId) {
      const queueEntry = Queue.queues.find((q: any) => q.name === "FlowAITimeoutJob");
      if (queueEntry) {
        const job = await queueEntry.bull.getJob(jobId);
        if (job) {
          await job.remove();
          logger.info(`[FlowAITimeout] AI timeout cancelado para ticket ${ticketId}, jobId=${jobId}`);
        }
      }
      await cacheLayer.del(`flow-ai-timeout:${ticketId}`);
    }
  } catch (error) {
    logger.error(`[FlowAITimeout] Erro ao cancelar AI timeout: ${error.message}`);
  }
};
