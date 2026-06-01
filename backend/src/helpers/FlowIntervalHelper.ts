import Queue from "../libs/queue";
import cacheLayer from "../libs/cache";
import logger from "../utils/logger";
import moment from "moment-timezone";

interface ScheduleIntervalParams {
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

export const scheduleFlowInterval = async (params: ScheduleIntervalParams): Promise<void> => {
  const { ticketId, delayMs } = params;

  // Cancel any existing interval for this ticket
  await cancelFlowInterval(ticketId);

  try {
    const job = await Queue.add("FlowIntervalJob", params, {
      delay: delayMs,
      removeOnComplete: true,
      removeOnFail: true
    });

    // Store job ID in Redis so we can cancel it later
    await cacheLayer.set(`flow-interval:${ticketId}`, job.id.toString());

    logger.info(`[FlowInterval] Agendado intervalo de ${delayMs}ms para ticket ${ticketId}, jobId=${job.id}`);
  } catch (error) {
    logger.error(`[FlowInterval] Erro ao agendar intervalo: ${error.message}`);
  }
};

export const cancelFlowInterval = async (ticketId: number): Promise<void> => {
  try {
    const jobId = await cacheLayer.get(`flow-interval:${ticketId}`);

    if (jobId) {
      // Find and remove the job from the queue
      const queueEntry = Queue.queues.find((q: any) => q.name === "FlowIntervalJob");
      if (queueEntry) {
        const job = await queueEntry.bull.getJob(jobId);
        if (job) {
          await job.remove();
          logger.info(`[FlowInterval] Intervalo cancelado para ticket ${ticketId}, jobId=${jobId}`);
        }
      }
      await cacheLayer.del(`flow-interval:${ticketId}`);
    }
  } catch (error) {
    logger.error(`[FlowInterval] Erro ao cancelar intervalo: ${error.message}`);
  }
};

export const convertIntervalToMs = (data: { sec?: number; value?: number; unit?: string }): number => {
  // Old format: { sec }
  if (data.sec !== undefined && data.sec !== null) {
    return data.sec * 1000;
  }

  // New format: { value, unit }
  if (data.value !== undefined && data.unit) {
    const { value, unit } = data;

    switch (unit) {
      case "seconds":
        return value * 1000;
      case "minutes":
        return value * 60 * 1000;
      case "hours":
        return value * 60 * 60 * 1000;
      case "days":
        return value * 24 * 60 * 60 * 1000;
      default:
        logger.warn(`[FlowInterval] Unidade desconhecida: ${unit}, usando segundos`);
        return value * 1000;
    }
  }

  return 0;
};

export const getNextBusinessHoursMs = (businessHours: { startTime: string; endTime: string; daysOfWeek: number[] }): number => {
  const tz = "America/Sao_Paulo";
  const now = moment().tz(tz);

  const { startTime, endTime, daysOfWeek } = businessHours;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  // Check up to 8 days ahead to find the next valid business hours window
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const candidate = now.clone().add(dayOffset, "days");
    const dayOfWeek = candidate.day(); // 0=Sunday, 1=Monday, ...

    if (!daysOfWeek.includes(dayOfWeek)) {
      continue;
    }

    const windowStart = candidate.clone().hour(startHour).minute(startMin).second(0).millisecond(0);
    const windowEnd = candidate.clone().hour(endHour).minute(endMin).second(0).millisecond(0);

    // If today and we are before the end of business hours
    if (dayOffset === 0) {
      // Currently within business hours
      if (now.isSameOrAfter(windowStart) && now.isBefore(windowEnd)) {
        return 0;
      }
      // Before business hours start today
      if (now.isBefore(windowStart)) {
        return windowStart.diff(now);
      }
      // After business hours end today, continue to next day
      continue;
    }

    // Future day: return ms until start of business hours
    return windowStart.diff(now);
  }

  // Fallback: 24 hours
  logger.warn(`[FlowInterval] Nao foi possivel encontrar proximo horario comercial, usando 24h`);
  return 24 * 60 * 60 * 1000;
};
