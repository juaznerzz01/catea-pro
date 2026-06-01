/**
 * ContactReconcilerService
 *
 * Job periódico que:
 * 1. Resolve PendingIdentityResolutions quando mapeamento LID aparece
 * 2. Encontra e funde contatos duplicados via ContactIdentities
 * 3. Expira pendências antigas (>7 dias)
 *
 * Roda a cada 3 minutos via Bull queue.
 */

import { Op } from "sequelize";
import Contact from "../../models/Contact";
import ContactIdentity from "../../models/ContactIdentity";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import PendingIdentityResolution from "../../models/PendingIdentityResolution";
import { resolveLidToJidAsync, setLidMapping } from "../../libs/wbot";
import { getIO } from "../../libs/socket";
import logger from "../../utils/logger";
import { registerIdentities } from "../WbotServices/IdentityResolverService";

/**
 * Funde contato "source" no contato "target".
 * Move tickets e mensagens, faz soft-merge (não deleta, marca como merged).
 */
async function mergeContacts(
  sourceId: number,
  targetId: number,
  reason: string
): Promise<void> {
  const source = await Contact.findByPk(sourceId);
  const target = await Contact.findByPk(targetId);

  if (!source || !target) return;
  if (source.companyId !== target.companyId) return;
  if (source.id === target.id) return;

  const io = getIO();

  // Mover tickets
  const [ticketCount] = await Ticket.update(
    { contactId: target.id },
    { where: { contactId: source.id } }
  );

  // Mover mensagens
  const [messageCount] = await Message.update(
    { contactId: target.id },
    { where: { contactId: source.id } }
  );

  // Transferir identidades do source para o target
  try {
    await ContactIdentity.update(
      { contactId: target.id },
      { where: { contactId: source.id } }
    );
  } catch (e) {
    // Constraint violation = target já tem essa identidade. Deletar a duplicata.
    await ContactIdentity.destroy({ where: { contactId: source.id } });
  }

  // Copiar lid/jid do source para target se target não tem
  const updateData: any = {};
  if (!target.lid && source.lid) updateData.lid = source.lid;
  if (!target.jid && source.jid) updateData.jid = source.jid;
  if (Object.keys(updateData).length > 0) {
    await target.update(updateData);
  }

  // Soft merge: marcar source como merged (não deletar)
  await source.update({
    isMerged: true,
    mergedIntoContactId: target.id
  } as any);

  logger.info(
    `[Reconciler] Merge: contato ${source.id} (${source.name}/${source.number}) ` +
    `→ ${target.id} (${target.name}/${target.number}). ` +
    `${ticketCount} tickets, ${messageCount} msgs movidos. Razão: ${reason}`
  );

  // Notificar frontend
  io.of(`/workspace-${target.companyId}`)
    .emit(`company-${target.companyId}-contact`, {
      action: "update",
      contact: target
    });
}

/**
 * Etapa 1: Resolver PendingIdentityResolutions
 */
async function resolvePendingIdentities(): Promise<number> {
  let resolved = 0;

  const pendings = await PendingIdentityResolution.findAll({
    where: { status: "pending" },
    limit: 50
  });

  for (const pending of pendings) {
    try {
      const jid = await resolveLidToJidAsync(pending.lidValue);
      if (!jid) continue;

      const realNumber = jid.replace(/@.*/, "");

      // Buscar ou criar contato real
      let contact = await Contact.findOne({
        where: {
          companyId: pending.companyId,
          number: realNumber
        }
      });

      if (!contact) {
        // Buscar por identidade
        const identity = await ContactIdentity.findOne({
          where: {
            companyId: pending.companyId,
            identityValue: { [Op.in]: [jid, realNumber, pending.lidValue] }
          }
        });
        if (identity) {
          contact = await Contact.findByPk(identity.contactId);
        }
      }

      if (contact) {
        // Registrar identidades
        await registerIdentities(contact.id, pending.companyId, [
          { type: "lid", value: pending.lidValue },
          { type: "jid", value: jid },
          { type: "phone", value: realNumber, isPrimary: true }
        ]);

        await pending.update({
          status: "resolved",
          resolvedContactId: contact.id,
          resolvedAt: new Date()
        });

        resolved++;
        logger.info(
          `[Reconciler] Pendência ${pending.id} resolvida: LID ${pending.lidValue} → ` +
          `contato ${contact.id} (${contact.name})`
        );
      }
    } catch (e) {
      logger.warn(`[Reconciler] Erro ao resolver pendência ${pending.id}: ${e.message}`);
    }
  }

  return resolved;
}

/**
 * Etapa 2: Encontrar e fundir contatos duplicados
 * Busca contatos que compartilham identidades mas têm IDs diferentes.
 */
async function findAndMergeDuplicates(): Promise<number> {
  let merged = 0;

  try {
    // Buscar identidades que apontam para contatos diferentes mas têm valor similar
    // Exemplo: mesmo número de telefone em dois contatos
    const duplicates: any[] = await ContactIdentity.sequelize.query(`
      SELECT ci1."contactId" as source_id, ci2."contactId" as target_id,
             ci1."identityValue", ci1."identityType",
             ci1."companyId"
      FROM "ContactIdentities" ci1
      JOIN "ContactIdentities" ci2
        ON ci1."companyId" = ci2."companyId"
        AND ci1."identityValue" = ci2."identityValue"
        AND ci1."contactId" > ci2."contactId"
      JOIN "Contacts" c1 ON c1.id = ci1."contactId" AND (c1."isMerged" IS NULL OR c1."isMerged" = false)
      JOIN "Contacts" c2 ON c2.id = ci2."contactId" AND (c2."isMerged" IS NULL OR c2."isMerged" = false)
      LIMIT 20;
    `, { type: "SELECT" as any }) as any[];

    for (const dup of duplicates) {
      await mergeContacts(
        dup.source_id,
        dup.target_id,
        `identidade compartilhada: ${dup.identityType}=${dup.identityValue}`
      );
      merged++;
    }

    // Também verificar: contatos com LID number (>13 dígitos) + contato real
    // que compartilham um mapeamento LID conhecido
    const ghostContacts = await Contact.findAll({
      where: {
        remoteJid: { [Op.like]: "%@lid" },
        [Op.or]: [
          { isMerged: false },
          { isMerged: null }
        ]
      },
      limit: 20
    });

    for (const ghost of ghostContacts) {
      const lid = ghost.lid || ghost.remoteJid;
      if (!lid) continue;

      const resolvedJid = await resolveLidToJidAsync(lid);
      if (!resolvedJid) continue;

      const realNumber = resolvedJid.replace(/@.*/, "");
      const realContact = await Contact.findOne({
        where: {
          companyId: ghost.companyId,
          number: realNumber,
          id: { [Op.ne]: ghost.id }
        }
      });

      if (realContact) {
        await mergeContacts(ghost.id, realContact.id, `LID ${lid} → ${resolvedJid}`);
        merged++;
      } else {
        // Não existe contato real — atualizar ghost com número correto
        await ghost.update({
          number: realNumber,
          remoteJid: resolvedJid,
          jid: resolvedJid,
          name: ghost.name === ghost.number ? realNumber : ghost.name
        });
        logger.info(
          `[Reconciler] Ghost ${ghost.id} atualizado: ${ghost.number} → ${realNumber}`
        );
      }
    }
  } catch (e) {
    logger.warn(`[Reconciler] Erro ao buscar duplicatas: ${e.message}`);
  }

  return merged;
}

/**
 * Etapa 3: Expirar pendências antigas (>7 dias)
 */
async function expireOldPendings(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [count] = await PendingIdentityResolution.update(
    { status: "expired" },
    {
      where: {
        status: "pending",
        createdAt: { [Op.lt]: sevenDaysAgo }
      }
    }
  );

  if (count > 0) {
    logger.info(`[Reconciler] ${count} pendências expiradas`);
  }

  return count;
}

/**
 * Ponto de entrada principal do reconciliador.
 * Chamado pelo Bull queue a cada 3 minutos.
 */
export async function runReconciler(): Promise<void> {
  const start = Date.now();

  try {
    const resolved = await resolvePendingIdentities();
    const merged = await findAndMergeDuplicates();
    const expired = await expireOldPendings();

    const duration = Date.now() - start;

    if (resolved > 0 || merged > 0 || expired > 0) {
      logger.info(
        `[Reconciler] Concluído em ${duration}ms: ` +
        `${resolved} resolvidos, ${merged} fundidos, ${expired} expirados`
      );
    }
  } catch (e) {
    logger.error(`[Reconciler] Erro: ${e.message}`);
  }
}

/**
 * Chamado imediatamente quando um novo mapeamento LID→JID é descoberto.
 * Mais rápido que esperar o reconciliador periódico.
 */
export async function onLidMappingDiscovered(lid: string, jid: string): Promise<void> {
  const lidNumber = lid.replace("@lid", "");
  const jidNumber = jid.replace(/@.*/, "");

  if (!lidNumber || !jidNumber || lidNumber === jidNumber) return;

  // 1. Resolver pendências imediatamente
  try {
    const pendings = await PendingIdentityResolution.findAll({
      where: { lidValue: lid, status: "pending" }
    });

    for (const pending of pendings) {
      let contact = await Contact.findOne({
        where: { companyId: pending.companyId, number: jidNumber }
      });

      if (contact) {
        await registerIdentities(contact.id, pending.companyId, [
          { type: "lid", value: lid },
          { type: "jid", value: jid }
        ]);
        await pending.update({
          status: "resolved",
          resolvedContactId: contact.id,
          resolvedAt: new Date()
        });
        logger.info(
          `[Reconciler] Pendência ${pending.id} resolvida imediatamente: ` +
          `LID ${lid} → contato ${contact.id}`
        );
      }
    }
  } catch (e) { /* tabela pode não existir ainda */ }

  // 2. Fundir ghost contacts imediatamente
  try {
    const ghost = await Contact.findOne({
      where: {
        [Op.or]: [
          { number: lidNumber },
          { lid: lid }
        ],
        [Op.and]: [
          { [Op.or]: [{ isMerged: false }, { isMerged: null }] }
        ]
      }
    });

    if (!ghost) return;
    if (ghost.number === jidNumber) return; // já tem número correto

    const real = await Contact.findOne({
      where: {
        companyId: ghost.companyId,
        number: jidNumber,
        id: { [Op.ne]: ghost.id }
      }
    });

    if (real) {
      await mergeContacts(ghost.id, real.id, `LID mapping ${lid} → ${jid}`);
    } else {
      // Não existe contato real — atualizar ghost com número correto
      await ghost.update({
        number: jidNumber,
        remoteJid: jid,
        lid: lid,
        jid: jid,
        name: ghost.name === lidNumber ? jidNumber : ghost.name
      });

      // Registrar identidades
      await registerIdentities(ghost.id, ghost.companyId, [
        { type: "phone", value: jidNumber, isPrimary: true },
        { type: "lid", value: lid },
        { type: "jid", value: jid }
      ]);

      logger.info(
        `[Reconciler] Ghost ${ghost.id} atualizado: ${lidNumber} → ${jidNumber}`
      );

      const io = getIO();
      io.of(`/workspace-${ghost.companyId}`)
        .emit(`company-${ghost.companyId}-contact`, {
          action: "update",
          contact: ghost
        });
    }
  } catch (e) {
    logger.warn(`[Reconciler] Erro ao fundir ghost: ${e.message}`);
  }
}

export default { runReconciler, onLidMappingDiscovered };
