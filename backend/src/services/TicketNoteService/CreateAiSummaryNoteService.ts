import RefreshTicketAiMemoryService from "../TicketServices/RefreshTicketAiMemoryService";
import CreateTicketNoteService from "./CreateTicketNoteService";
import Ticket from "../../models/Ticket";

interface AiSummaryParams {
  ticketId: number;
  companyId: number;
  userId: number;
}

const CreateAiSummaryNoteService = async ({
  ticketId,
  companyId,
  userId
}: AiSummaryParams) => {
  const startTime = Date.now();

  // Atualizar memória IA
  const { memory } = await RefreshTicketAiMemoryService(ticketId, companyId);

  if (!memory) {
    throw new Error("Não foi possível gerar o resumo. Verifique se a API key está configurada e há mensagens no ticket.");
  }

  // Buscar contactId do ticket
  const ticket = await Ticket.findByPk(ticketId, { attributes: ["contactId"] });
  if (!ticket) {
    throw new Error("Ticket não encontrado");
  }

  // Formatar memória como texto legível
  const lines: string[] = ["[Resumo IA]", ""];

  if (memory.assunto) {
    lines.push(`📋 Assunto: ${memory.assunto}`);
  }

  if (memory.statusLead) {
    const statusEmoji: Record<string, string> = {
      frio: "❄️", morno: "🌤️", quente: "🔥", convertido: "✅", perdido: "❌"
    };
    lines.push(`${statusEmoji[memory.statusLead] || "📊"} Status do lead: ${memory.statusLead}`);
  }

  if (memory.sentimento) {
    const sentEmoji: Record<string, string> = {
      positivo: "😊", neutro: "😐", negativo: "😟", frustrado: "😤"
    };
    lines.push(`${sentEmoji[memory.sentimento] || "💬"} Sentimento: ${memory.sentimento}`);
  }

  if (memory.objecoes && memory.objecoes.length > 0) {
    lines.push(`\n⚠️ Objeções:`);
    memory.objecoes.forEach(o => lines.push(`  • ${o}`));
  }

  if (memory.produtosMencionados && memory.produtosMencionados.length > 0) {
    lines.push(`\n🏷️ Produtos mencionados:`);
    memory.produtosMencionados.forEach(p => lines.push(`  • ${p}`));
  }

  if (memory.proximaAcao) {
    lines.push(`\n➡️ Próxima ação: ${memory.proximaAcao}`);
  }

  if (memory.resumo) {
    lines.push(`\n📝 Resumo:`);
    lines.push(memory.resumo);
  }

  const noteText = lines.join("\n");

  // Criar nota no ticket
  const note = await CreateTicketNoteService({
    note: noteText,
    userId,
    contactId: ticket.contactId,
    ticketId
  });

  const duration = Date.now() - startTime;
  console.log(`[AiSummary] Nota criada ticketId=${ticketId} (${duration}ms)`);

  return note;
};

export default CreateAiSummaryNoteService;
