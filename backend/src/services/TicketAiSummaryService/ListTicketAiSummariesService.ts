import TicketAiSummary from "../../models/TicketAiSummary";
import User from "../../models/User";

interface ListParams {
  ticketId: number;
  companyId: number;
}

const ListTicketAiSummariesService = async ({
  ticketId,
  companyId
}: ListParams): Promise<TicketAiSummary[]> => {
  const summaries = await TicketAiSummary.findAll({
    where: { ticketId, companyId },
    order: [["createdAt", "DESC"]],
    include: [
      { model: User, as: "user", attributes: ["id", "name"] }
    ]
  });

  return summaries;
};

export default ListTicketAiSummariesService;
