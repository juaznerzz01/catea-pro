import * as Yup from "yup";
import moment from "moment-timezone";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import TimezoneService from "../TimezoneServices/TimezoneService";

interface Request {
  body: string;
  sendAt: string;
  contactId: number | string;
  companyId: number | string;
  userId?: number | string;
  ticketUserId?: number | string;
  queueId?: number | string;
  openTicket?: string;
  statusTicket?: string;
  whatsappId?: number | string;
  intervalo?: number;
  valorIntervalo?: number;
  enviarQuantasVezes?: number;
  tipoDias?: number;
  contadorEnvio?: number;
  assinar?: boolean;
}

const CreateService = async ({
  body,
  sendAt,
  contactId,
  companyId,
  userId,
  ticketUserId,
  queueId,
  openTicket,
  statusTicket,
  whatsappId,
  intervalo,
  valorIntervalo,
  enviarQuantasVezes,
  tipoDias,
  assinar,
  contadorEnvio
}: Request): Promise<Schedule> => {
  const schema = Yup.object().shape({
    body: Yup.string().required().min(5),
    sendAt: Yup.string().required()
  });

  try {
    await schema.validate({ body, sendAt });
  } catch (err: any) {
    throw new AppError(err.message);
  }

    // Obter timezone da empresa
  const timezone = await TimezoneService.getEffectiveTimezone(Number(companyId));

  // Converter sendAt do timezone da empresa para UTC
  const sendAtInCompanyTz = moment.tz(sendAt, timezone);
  const sendAtUTC = sendAtInCompanyTz.utc().format("YYYY-MM-DD HH:mm:ss");

  const schedule = await Schedule.create(
    {
      body,
      sendAt: sendAtUTC,
      contactId,
      companyId,
      userId,
      status: 'PENDENTE',
      ticketUserId,
      queueId,
      openTicket,
      statusTicket,
      whatsappId,
      intervalo,
      valorIntervalo,
      enviarQuantasVezes,
      tipoDias,
      assinar,
      contadorEnvio
    }
  );

  await schedule.reload();

  return schedule;
};

export default CreateService;
