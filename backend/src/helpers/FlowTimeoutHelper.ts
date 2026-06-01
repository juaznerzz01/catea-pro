import Queue from "../libs/queue";
import cacheLayer from "../libs/cache";
import logger from "../utils/logger";

interface ScheduleTimeoutParams {
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

export const scheduleFlowTimeout = async (params: ScheduleTimeoutParams): Promise<void> => {
  const { ticketId, timeoutSeconds } = params;

  // Cancel any existing timeout for this ticket
  await cancelFlowTimeout(ticketId);

  try {
    const job = await Queue.add("FlowTimeoutJob", params, {
      delay: timeoutSeconds * 1000,
      removeOnComplete: true,
      removeOnFail: true
    });

    // Store job ID in Redis so we can cancel it later
    await cacheLayer.set(`flow-timeout:${ticketId}`, job.id.toString());

    logger.info(`[FlowTimeout] Agendado timeout de ${timeoutSeconds}s para ticket ${ticketId}, jobId=${job.id}`);
  } catch (error) {
    logger.error(`[FlowTimeout] Erro ao agendar timeout: ${error.message}`);
  }
};

export const cancelFlowTimeout = async (ticketId: number): Promise<void> => {
  try {
    const jobId = await cacheLayer.get(`flow-timeout:${ticketId}`);

    if (jobId) {
      // Find and remove the job from the queue
      const queueEntry = Queue.queues.find((q: any) => q.name === "FlowTimeoutJob");
      if (queueEntry) {
        const job = await queueEntry.bull.getJob(jobId);
        if (job) {
          await job.remove();
          logger.info(`[FlowTimeout] Timeout cancelado para ticket ${ticketId}, jobId=${jobId}`);
        }
      }
      await cacheLayer.del(`flow-timeout:${ticketId}`);
    }
  } catch (error) {
    logger.error(`[FlowTimeout] Erro ao cancelar timeout: ${error.message}`);
  }
};
