/**
 * IdentityResolverService
 *
 * Resolvedor centralizado de identidade para mensagens WhatsApp.
 * Todo fluxo de processamento de mensagem DEVE passar por aqui.
 *
 * Regras:
 * 1. Contato é entidade; LID/JID/telefone são aliases
 * 2. Nunca criar contato novo só porque chegou @lid
 * 3. Merge automático só com confiança alta
 */

import { proto } from "baileys";
import { jidNormalizedUser } from "baileys";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import ContactIdentity from "../../models/ContactIdentity";
import PendingIdentityResolution from "../../models/PendingIdentityResolution";
import {
  resolveLidToJid,
  resolveLidToJidAsync,
  setLidMapping
} from "../../libs/wbot";
import logger from "../../utils/logger";

type Session = any; // WASocket + session extensions

export interface IdentityResolution {
  /** JID canônico (@s.whatsapp.net ou @g.us) — pode ser LID se não resolvido */
  canonicalJid: string;
  /** Número de telefone (só dígitos) — pode ser LID digits se não resolvido */
  resolvedNumber: string;
  /** Identificador LID, se conhecido */
  lid: string | null;
  /** Identificador JID real, se conhecido */
  jid: string | null;
  /** true se temos APENAS LID sem telefone real */
  isLidUnresolved: boolean;
  /** Fonte da resolução */
  resolutionSource: "remoteJidAlt" | "participantAlt" | "senderPn" | "lidMappingStore" | "cache" | "contactIdentities" | "onWhatsApp" | "unresolved" | "direct";
  /** Nome do contato (pushName ou número) */
  contactName: string;
  /** ID do contato existente encontrado, se houver */
  existingContactId: number | null;
  /** Se é grupo */
  isGroup: boolean;
}

/**
 * Extrai todos os candidatos de identidade de uma mensagem.
 * Coleta de: remoteJid, remoteJidAlt, participant, participantAlt, senderPn
 */
function extractIdentityCandidates(msg: proto.IWebMessageInfo): {
  remoteJid: string;
  remoteJidAlt: string | null;
  participant: string | null;
  participantAlt: string | null;
  senderPn: string | null;
} {
  const key = msg.key || {} as any;
  return {
    remoteJid: key.remoteJid || "",
    remoteJidAlt: (key as any)?.remoteJidAlt || null,
    participant: (msg as any)?.participant || key.participant || null,
    participantAlt: (key as any)?.participantAlt || null,
    senderPn: (key as any)?.senderPn || null
  };
}

/**
 * Tenta resolver um LID usando todas as fontes disponíveis.
 * Prioridade: remoteJidAlt > senderPn > LIDMappingStore > cache/Redis > DB identities > onWhatsApp
 */
async function resolveLid(
  lid: string,
  candidates: ReturnType<typeof extractIdentityCandidates>,
  wbot: Session,
  companyId: number
): Promise<{ jid: string | null; source: IdentityResolution["resolutionSource"] }> {

  // 1. remoteJidAlt (v7 - mais confiável)
  if (candidates.remoteJidAlt && !candidates.remoteJidAlt.endsWith("@lid")) {
    const resolved = jidNormalizedUser(candidates.remoteJidAlt);
    setLidMapping(jidNormalizedUser(lid), resolved);
    return { jid: resolved, source: "remoteJidAlt" };
  }

  // 2. senderPn
  if (candidates.senderPn) {
    const pn = candidates.senderPn.includes("@")
      ? candidates.senderPn
      : candidates.senderPn + "@s.whatsapp.net";
    const resolved = jidNormalizedUser(pn);
    setLidMapping(jidNormalizedUser(lid), resolved);
    return { jid: resolved, source: "senderPn" };
  }

  // 3. LIDMappingStore do Baileys v7
  if (wbot?.lidMappingStore) {
    try {
      const mapped = await wbot.lidMappingStore.toPhoneNumber(lid);
      if (mapped && !mapped.endsWith("@lid")) {
        const resolved = jidNormalizedUser(mapped);
        setLidMapping(jidNormalizedUser(lid), resolved);
        return { jid: resolved, source: "lidMappingStore" };
      }
    } catch (e) { /* falhou, próximo */ }
  }

  // 4. Cache memória + Redis
  const normalizedLid = jidNormalizedUser(lid);
  const cached = await resolveLidToJidAsync(normalizedLid);
  if (cached) {
    return { jid: cached, source: "cache" };
  }

  // 5. Tabela ContactIdentities — buscar por LID
  try {
    const identity = await ContactIdentity.findOne({
      where: {
        companyId,
        identityType: "lid",
        identityValue: normalizedLid
      }
    });
    if (identity) {
      // Encontrou contato pelo LID na tabela de aliases
      // Buscar o JID principal desse contato
      const jidIdentity = await ContactIdentity.findOne({
        where: {
          contactId: identity.contactId,
          identityType: "jid"
        }
      });
      if (jidIdentity) {
        setLidMapping(normalizedLid, jidIdentity.identityValue);
        return { jid: jidIdentity.identityValue, source: "contactIdentities" };
      }
      // Tem LID mas não tem JID — buscar phone
      const phoneIdentity = await ContactIdentity.findOne({
        where: {
          contactId: identity.contactId,
          identityType: "phone"
        }
      });
      if (phoneIdentity) {
        const jid = phoneIdentity.identityValue + "@s.whatsapp.net";
        setLidMapping(normalizedLid, jid);
        return { jid, source: "contactIdentities" };
      }
    }
  } catch (e) { /* tabela pode não existir ainda */ }

  // 6. onWhatsApp (último recurso - mas NÃO funciona com LIDs!)
  // LIDs não são números de telefone, então onWhatsApp não vai resolver
  // Mantemos por completude mas esperamos que falhe
  try {
    const lidNumber = lid.replace("@lid", "");
    // Só tentar se parece um número de telefone (<14 dígitos)
    if (lidNumber.length <= 13) {
      const [result] = await wbot.onWhatsApp(lidNumber);
      if (result?.jid) {
        const resolved = jidNormalizedUser(result.jid);
        setLidMapping(normalizedLid, resolved);
        return { jid: resolved, source: "onWhatsApp" };
      }
    }
  } catch (e) { /* falhou */ }

  return { jid: null, source: "unresolved" };
}

/**
 * Busca contato existente por qualquer alias conhecido.
 * Procura na tabela ContactIdentities primeiro, depois fallback para Contacts.
 */
async function findContactByIdentity(
  identityValues: string[],
  companyId: number
): Promise<Contact | null> {
  if (identityValues.length === 0) return null;

  // Filtrar valores vazios
  const values = identityValues.filter(v => v && v.length > 0);
  if (values.length === 0) return null;

  // 1. Buscar em ContactIdentities
  try {
    const identity = await ContactIdentity.findOne({
      where: {
        companyId,
        identityValue: { [Op.in]: values }
      }
    });
    if (identity) {
      const contact = await Contact.findByPk(identity.contactId);
      if (contact && !contact.getDataValue("isMerged")) {
        return contact;
      }
    }
  } catch (e) { /* tabela pode não existir ainda */ }

  // 2. Fallback: buscar direto em Contacts por number/lid/jid/remoteJid
  const numbers = values.map(v => v.replace(/@.*/, "")).filter(v => v.length > 0);
  const orKeys: any[] = [];
  for (const v of values) {
    if (v.endsWith("@lid")) orKeys.push({ lid: v });
    else if (v.includes("@")) orKeys.push({ jid: v });
  }
  for (const n of numbers) {
    orKeys.push({ number: n });
  }

  if (orKeys.length === 0) return null;

  const contact = await Contact.findOne({
    where: {
      companyId,
      [Op.or]: orKeys
    }
  });

  return contact;
}

/**
 * Registra aliases de um contato na tabela ContactIdentities.
 * Usa upsert para não duplicar.
 */
export async function registerIdentities(
  contactId: number,
  companyId: number,
  identities: Array<{ type: "lid" | "jid" | "phone"; value: string; isPrimary?: boolean }>
): Promise<void> {
  for (const { type, value, isPrimary } of identities) {
    if (!value || value.length === 0) continue;
    try {
      await ContactIdentity.upsert({
        companyId,
        contactId,
        identityType: type,
        identityValue: value.toLowerCase(),
        isPrimary: isPrimary || false,
        lastSeenAt: new Date()
      } as any);
    } catch (e) {
      // Constraint violation = outro contato já tem esse alias
      // Isso indica potencial duplicata — logar para reconciliador
      logger.warn(
        `[Identity] Alias ${type}:${value} já pertence a outro contato ` +
        `(tentando atribuir a contactId=${contactId}, companyId=${companyId})`
      );
    }
  }
}

/**
 * Resolve a identidade de uma mensagem recebida.
 *
 * Esta é a ÚNICA função que todo o sistema deve usar para determinar
 * de quem é uma mensagem e qual contato associar.
 */
export async function resolveMessageIdentity(
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number
): Promise<IdentityResolution> {
  const candidates = extractIdentityCandidates(msg);
  const isGroup = candidates.remoteJid?.endsWith("@g.us") || false;
  const pushName = (msg as any).pushName || "";

  // Para grupos, o remoteJid é o grupo. O remetente é participant/participantAlt.
  // Aqui resolvemos o CHAT (remoteJid), não o remetente individual.
  let chatJid = candidates.remoteJid;
  let lid: string | null = null;
  let jid: string | null = null;
  let source: IdentityResolution["resolutionSource"] = "direct";
  let isLidUnresolved = false;

  if (chatJid.endsWith("@lid") && !isGroup) {
    // Tentar resolver LID
    lid = jidNormalizedUser(chatJid);
    const resolved = await resolveLid(chatJid, candidates, wbot, companyId);
    source = resolved.source;

    if (resolved.jid) {
      jid = resolved.jid;
      chatJid = resolved.jid;
      logger.info(
        `[Identity] LID resolvido: ${lid} → ${jid} (via ${source})`
      );
    } else {
      isLidUnresolved = true;
      logger.warn(
        `[Identity] LID não resolvido: ${lid} (todas as fontes falharam)`
      );
    }
  } else if (!isGroup) {
    // JID normal
    jid = jidNormalizedUser(chatJid);
  }

  const resolvedNumber = chatJid.replace(/\D/g, "");

  // Buscar contato existente por qualquer alias conhecido
  const identityValues: string[] = [];
  if (jid) identityValues.push(jid);
  if (lid) identityValues.push(lid);
  if (resolvedNumber) identityValues.push(resolvedNumber);

  let existingContactId: number | null = null;
  if (!isGroup) {
    const existing = await findContactByIdentity(identityValues, companyId);
    if (existing) {
      existingContactId = existing.id;
    }
  }

  return {
    canonicalJid: chatJid,
    resolvedNumber,
    lid,
    jid,
    isLidUnresolved,
    resolutionSource: source,
    contactName: pushName || resolvedNumber,
    existingContactId,
    isGroup
  };
}

/**
 * Resolve identidade do remetente em grupos (participant).
 */
export async function resolveParticipantIdentity(
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number
): Promise<IdentityResolution> {
  const candidates = extractIdentityCandidates(msg);

  let senderId = candidates.participant || msg.key?.participant || msg.key?.remoteJid || "";
  let lid: string | null = null;
  let jid: string | null = null;
  let source: IdentityResolution["resolutionSource"] = "direct";
  let isLidUnresolved = false;

  if (senderId.endsWith("@lid")) {
    lid = jidNormalizedUser(senderId);

    // participantAlt tem prioridade para grupos
    if (candidates.participantAlt && !candidates.participantAlt.endsWith("@lid")) {
      jid = jidNormalizedUser(candidates.participantAlt);
      senderId = jid;
      source = "participantAlt";
      setLidMapping(lid, jid);
    } else {
      // Mesma cadeia de resolução
      const resolved = await resolveLid(senderId, candidates, wbot, companyId);
      source = resolved.source;
      if (resolved.jid) {
        jid = resolved.jid;
        senderId = jid;
      } else {
        isLidUnresolved = true;
      }
    }
  } else {
    jid = jidNormalizedUser(senderId);
  }

  return {
    canonicalJid: senderId,
    resolvedNumber: senderId.replace(/\D/g, ""),
    lid,
    jid,
    isLidUnresolved,
    resolutionSource: source,
    contactName: (msg as any).pushName || senderId.replace(/\D/g, ""),
    existingContactId: null,
    isGroup: false
  };
}

/**
 * Cria ou resolve PendingIdentityResolution para um LID não resolvido.
 * Retorna true se a mensagem foi enfileirada (não deve ser processada agora).
 */
export async function queuePendingResolution(
  msg: proto.IWebMessageInfo,
  lid: string,
  companyId: number,
  whatsappId: number
): Promise<boolean> {
  try {
    // Verificar se já existe resolução pendente para este LID
    const existing = await PendingIdentityResolution.findOne({
      where: {
        companyId,
        lidValue: lid,
        status: "pending"
      }
    });

    const messageWid = msg.key?.id || null;
    const pushName = (msg as any)?.pushName || null;

    if (existing) {
      // Já existe pendência — só registrar mais uma mensagem
      // (podemos acumular mensagens no JSON ou criar registros separados)
      logger.info(`[Identity] LID ${lid} já tem resolução pendente (id=${existing.id})`);
      return true;
    }

    // Criar nova pendência
    await PendingIdentityResolution.create({
      companyId,
      whatsappId,
      lidValue: lid,
      messageWid,
      messageDataJson: JSON.stringify(msg),
      pushName,
      status: "pending"
    } as any);

    logger.info(`[Identity] Resolução pendente criada para LID ${lid}`);
    return true;
  } catch (e) {
    logger.warn(`[Identity] Erro ao criar resolução pendente: ${e.message}`);
    return false;
  }
}

/**
 * Resolve o JID correto para ENVIO de mensagens.
 *
 * Quando o contato tem remoteJid @lid, precisamos resolver para @s.whatsapp.net
 * antes de enviar, senão a mensagem vai para o endereço errado.
 *
 * Cadeia de resolução:
 * 1. contact.jid (preenchido por reconciliação)
 * 2. ContactIdentities (jid ou phone → JID)
 * 3. cache/Redis via resolveLidToJidAsync
 * 4. contact.number → montar JID (último recurso)
 */
export async function resolveOutgoingJid(
  contact: Contact,
  isGroup: boolean
): Promise<string> {
  // Grupos: sempre usar remoteJid como está
  if (isGroup || contact.remoteJid?.endsWith("@g.us")) {
    return contact.remoteJid || `${contact.number}@g.us`;
  }

  // Determinar número de envio
  let number: string;

  if (contact.remoteJid && contact.remoteJid.includes("@") && !contact.remoteJid.endsWith("@lid")) {
    // remoteJid já é um JID real — usar diretamente
    return contact.remoteJid;
  }

  // remoteJid é @lid ou vazio — tentar resolver
  const lidJid = contact.remoteJid;

  // 1. Contato já tem JID resolvido (preenchido por reconciliação)
  if (contact.jid && !contact.jid.endsWith("@lid")) {
    logger.info(`[OutgoingJid] Usando contact.jid para ${contact.id}: ${contact.jid}`);
    return contact.jid;
  }

  // 2. ContactIdentities — buscar JID ou phone
  if (contact.id) {
    try {
      const jidIdentity = await ContactIdentity.findOne({
        where: { contactId: contact.id, identityType: "jid" }
      });
      if (jidIdentity?.identityValue && !jidIdentity.identityValue.endsWith("@lid")) {
        logger.info(`[OutgoingJid] Resolvido via ContactIdentity jid para ${contact.id}: ${jidIdentity.identityValue}`);
        return jidIdentity.identityValue;
      }

      const phoneIdentity = await ContactIdentity.findOne({
        where: { contactId: contact.id, identityType: "phone" }
      });
      if (phoneIdentity?.identityValue) {
        const resolved = phoneIdentity.identityValue + "@s.whatsapp.net";
        logger.info(`[OutgoingJid] Resolvido via ContactIdentity phone para ${contact.id}: ${resolved}`);
        return resolved;
      }
    } catch (e) { /* tabela pode não existir */ }
  }

  // 3. Cache/Redis
  if (lidJid && lidJid.endsWith("@lid")) {
    const resolved = await resolveLidToJidAsync(jidNormalizedUser(lidJid));
    if (resolved && !resolved.endsWith("@lid")) {
      logger.info(`[OutgoingJid] Resolvido via cache para ${contact.id}: ${resolved}`);
      return resolved;
    }
  }

  // 4. Último recurso: usar contact.number
  if (contact.number && contact.number.length <= 13) {
    number = `${contact.number}@s.whatsapp.net`;
    logger.warn(`[OutgoingJid] Fallback para número para ${contact.id}: ${number}`);
    return number;
  }

  // Nada funcionou — retornar o que temos (pode ser @lid)
  logger.error(`[OutgoingJid] Não foi possível resolver JID para envio do contato ${contact.id}`);
  return lidJid || `${contact.number}@s.whatsapp.net`;
}

/**
 * Resolve remoteJid para persistência em mensagens.
 *
 * Usado nos blocos verifyMessage/verifyMediaMessage para salvar
 * o remoteJid correto no registro de Message.
 */
export function resolveRemoteJidForMessage(
  remoteJid: string,
  msg: proto.IWebMessageInfo,
  isGroup: boolean
): string {
  if (!remoteJid?.endsWith("@lid")) return remoteJid;

  // Tentar senderPn
  const senderPn = (msg as any)?.key?.senderPn;
  if (senderPn) {
    return senderPn + (isGroup ? "@g.us" : "@s.whatsapp.net");
  }

  // Tentar remoteJidAlt
  const remoteJidAlt = (msg as any)?.key?.remoteJidAlt;
  if (remoteJidAlt && !remoteJidAlt.endsWith("@lid")) {
    return remoteJidAlt;
  }

  // Tentar cache síncrono
  const resolved = resolveLidToJid(jidNormalizedUser(remoteJid));
  if (resolved) return resolved;

  // Não resolvido — retornar original
  return remoteJid;
}
