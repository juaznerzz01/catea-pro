import { Request, Response } from "express";
import CreateTicketAiSummaryService from "../services/TicketAiSummaryService/CreateTicketAiSummaryService";
import ListTicketAiSummariesService from "../services/TicketAiSummaryService/ListTicketAiSummariesService";
import Ticket from "../models/Ticket";

const resolveTicketId = async (ticketParam: string, companyId: number): Promise<number | null> => {
  const num = Number(ticketParam);
  if (!isNaN(num)) return num;
  const ticket = await Ticket.findOne({
    where: { uuid: ticketParam, companyId },
    attributes: ["id"]
  });
  return ticket ? ticket.id : null;
};

export const index = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId: ticketParam } = req.params;
  const { companyId } = req.user;

  const ticketId = await resolveTicketId(ticketParam, companyId);
  if (!ticketId) {
    return res.status(404).json({ error: "Ticket não encontrado" });
  }

  const summaries = await ListTicketAiSummariesService({
    ticketId,
    companyId
  });

  return res.status(200).json(summaries);
};

export const generate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId: ticketParam } = req.params;
  const { companyId, id: userId } = req.user;

  const ticketId = await resolveTicketId(ticketParam, companyId);
  if (!ticketId) {
    return res.status(404).json({ error: "Ticket não encontrado" });
  }

  try {
    const summary = await CreateTicketAiSummaryService({
      ticketId,
      companyId,
      userId: Number(userId),
      generatedBy: "manual"
    });

    return res.status(200).json(summary);
  } catch (err) {
    console.error("[AiSummary] Erro:", err);
    return res.status(500).json({
      error: err.message || "Erro ao gerar resumo IA"
    });
  }
};
