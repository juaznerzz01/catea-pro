import { Op } from "sequelize";
import { getIO } from "../../libs/socket";
import CompaniesSettings from "../../models/CompaniesSettings";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import fs from "fs";
import path, { join } from "path";
import logger from "../../utils/logger";
import { isNil } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import * as Sentry from "@sentry/node";
import { normalizePhoneNumber } from "../../utils/normalizePhoneNumber";
import { resolveLidToJidAsync } from "../../libs/wbot";

const axios = require('axios');

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  channel?: string;
  extraInfo?: ExtraInfo[];
  remoteJid?: string;
  whatsappId?: number;
  wbot?: any;
  source?: string;
  isInAgenda?: boolean;
  lid?: string | null;
  jid?: string | null;
}

const downloadProfileImage = async ({
  profilePicUrl,
  companyId,
  contact
}) => {
  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  let filename;


  const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    fs.chmodSync(folder, 0o777);
  }

  try {

    const response = await axios.get(profilePicUrl, {
      responseType: 'arraybuffer'
    });

    filename = `${new Date().getTime()}.jpeg`;
    fs.writeFileSync(join(folder, filename), response.data);

  } catch (error) {
    console.error(error)
  }

  return filename
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  channel = "whatsapp",
  companyId,
  extraInfo = [],
  remoteJid = "",
  whatsappId,
  wbot,
  source = "auto_created",
  isInAgenda = false,
  lid = null,
  jid = null
}: Request): Promise<Contact> => {
  try {
    let createContact = false;
    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

    // Normaliza o número antes de buscar no banco
    // Se a feature flag estiver ativa, o banco guarda números no formato E.164 (+55...)
    let number: string;
    if (isGroup) {
      number = rawNumber;
    } else if (process.env.FEATURE_CONTACTS_NORMALIZE_E164 === 'true') {
      // Normaliza para E.164 para buscar no banco
      const normalized = normalizePhoneNumber(rawNumber);
      number = normalized || rawNumber.replace(/[^0-9]/g, "");
    } else {
      // Sem feature flag, só remove caracteres que não são dígitos
      number = rawNumber.replace(/[^0-9]/g, "");
    }

    const io = getIO();
    let contact: Contact | null;

    // Busca contato por número OU lid OU jid OU remoteJid para evitar conversas duplicadas
    const orKeys: any[] = [];
    orKeys.push({ number });
    if (lid) orKeys.push({ lid: String(lid).toLowerCase() });
    if (jid) orKeys.push({ jid: String(jid).toLowerCase() });
    if (remoteJid) orKeys.push({ remoteJid });

    contact = await Contact.findOne({
      where: { companyId, [Op.or]: orKeys }
    });

    let updateImage = (!contact || contact?.profilePicUrl !== profilePicUrl && profilePicUrl !== "") && wbot || false;

    console.log(93, "CreateUpdateContactService", { updateImage })

    if (contact) {
      // Guard: não sobrescrever remoteJid real (@s.whatsapp.net) com @lid
      if (remoteJid) {
        const hasRealJid = contact.remoteJid && contact.remoteJid.includes("@") && !contact.remoteJid.endsWith("@lid");
        const incomingIsLid = remoteJid.endsWith("@lid");
        if (!(hasRealJid && incomingIsLid)) {
          contact.remoteJid = remoteJid;
        }
      }
      contact.profilePicUrl = profilePicUrl || null;
      contact.isGroup = isGroup;
      // Salva o lid/jid no contato se ainda não tiver
      // Se outro contato fantasma já tem esse lid/jid, mergeia ele para cá
      if (lid && !contact.lid) {
        const lidLower = String(lid).toLowerCase();
        const ghost = await Contact.findOne({
          where: { companyId, lid: lidLower, id: { [Op.ne]: contact.id } }
        });
        if (ghost) {
          logger.info(`[CreateOrUpdateContact] Merging ghost contact ${ghost.id} (lid=${lidLower}) into real contact ${contact.id}`);
          // Move tickets and messages from ghost to real contact
          const { Ticket: TicketModel } = require("../../models/Ticket");
          const { Message: MessageModel } = require("../../models/Message");
          await (contact.sequelize || Contact.sequelize).query(
            `UPDATE "Tickets" SET "contactId" = :realId WHERE "contactId" = :ghostId`,
            { replacements: { realId: contact.id, ghostId: ghost.id } }
          );
          await (contact.sequelize || Contact.sequelize).query(
            `UPDATE "Messages" SET "contactId" = :realId WHERE "contactId" = :ghostId`,
            { replacements: { realId: contact.id, ghostId: ghost.id } }
          );
          await ghost.destroy();
          logger.info(`[CreateOrUpdateContact] Ghost contact ${ghost.id} deleted after merge`);
        }
        contact.lid = lidLower;
      }
      if (jid && !contact.jid) {
        const jidLower = String(jid).toLowerCase();
        const ghostJid = await Contact.findOne({
          where: { companyId, jid: jidLower, id: { [Op.ne]: contact.id } }
        });
        if (ghostJid) {
          logger.info(`[CreateOrUpdateContact] Merging ghost contact ${ghostJid.id} (jid=${jidLower}) into real contact ${contact.id}`);
          await (contact.sequelize || Contact.sequelize).query(
            `UPDATE "Tickets" SET "contactId" = :realId WHERE "contactId" = :ghostId`,
            { replacements: { realId: contact.id, ghostId: ghostJid.id } }
          );
          await (contact.sequelize || Contact.sequelize).query(
            `UPDATE "Messages" SET "contactId" = :realId WHERE "contactId" = :ghostId`,
            { replacements: { realId: contact.id, ghostId: ghostJid.id } }
          );
          await ghostJid.destroy();
          logger.info(`[CreateOrUpdateContact] Ghost contact ${ghostJid.id} deleted after merge`);
        }
        contact.jid = jidLower;
      }
      // Se achou o contato pelo lid/jid mas o número é diferente,
      // mantém o número real que já estava salvo (não troca pelo número LID)
      if (contact.number && contact.number !== number && lid) {
        number = contact.number;
      }
      if (isNil(contact.whatsappId)) {
        const whatsapp = await Whatsapp.findOne({
          where: { id: whatsappId, companyId }
        });

        console.log(104, "CreateUpdateContactService")

        if (whatsapp) {
          contact.whatsappId = whatsappId;
        }
      }
      const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");

      let fileName, oldPath = "";
      if (contact.urlPicture) {
        console.log(114, "CreateUpdateContactService")

        oldPath = path.resolve(contact.urlPicture.replace(/\\/g, '/'));
        fileName = path.join(folder, oldPath.split('\\').pop());
      }
      if (!fs.existsSync(fileName) || contact.profilePicUrl === "") {
        if (wbot && ['whatsapp'].includes(channel)) {
          try {
            console.log(120, "CreateUpdateContactService")
            profilePicUrl = await wbot.profilePictureUrl(remoteJid, "image");
          } catch (e) {
            Sentry.captureException(e);
            profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
          }
          contact.profilePicUrl = profilePicUrl;
          updateImage = true;
        }
      }

      if (contact.name === number) {
        contact.name = name;
      }

      await contact.save();
      await contact.reload();

    } else if (wbot && ['whatsapp'].includes(channel)) {
      const settings = await CompaniesSettings.findOne({ where: { companyId } });
      const { acceptAudioMessageContact } = settings;
      let newRemoteJid = remoteJid;

      if (!remoteJid && remoteJid !== "") {
        newRemoteJid = isGroup ? `${rawNumber}@g.us` : `${rawNumber}@s.whatsapp.net`;
      }

      try {
        profilePicUrl = await wbot.profilePictureUrl(remoteJid, "image");
      } catch (e) {
        Sentry.captureException(e);
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      }

      // Se o número parece ser LID (>13 dígitos), tentar resolver antes de criar
      let finalNumber = number;
      let finalLid = lid ? String(lid).toLowerCase() : null;
      if (!isGroup && number.length > 13 && newRemoteJid.endsWith("@lid")) {
        finalLid = finalLid || newRemoteJid;

        // Tentar resolver LID para número real via cache/Redis
        const resolvedJid = await resolveLidToJidAsync(
          newRemoteJid.includes("@") ? newRemoteJid : `${number}@lid`
        );
        if (resolvedJid && !resolvedJid.endsWith("@lid")) {
          const resolvedNumber = resolvedJid.replace(/@.*/, "");
          logger.info(`[CreateContact] LID ${number} resolvido para ${resolvedNumber}`);

          // Verificar se já existe contato com o número resolvido
          const existingByNumber = await Contact.findOne({
            where: { companyId, number: resolvedNumber }
          });
          if (existingByNumber) {
            // Contato real já existe - atualizar lid e retornar
            if (!existingByNumber.lid) {
              await existingByNumber.update({ lid: finalLid });
            }
            contact = existingByNumber;
            // Emitir update para frontend
            io.of(`/workspace-${companyId}`)
              .emit(`company-${companyId}-contact`, { action: "update", contact });
            return contact;
          }

          // Não existe contato real - criar com número correto
          finalNumber = resolvedNumber;
          newRemoteJid = resolvedJid;
        } else {
          logger.warn(`[CreateContact] Número LID detectado: ${number}. Não foi possível resolver.`);
        }
      }

      contact = await Contact.create({
        name,
        number: finalNumber,
        email,
        isGroup,
        companyId,
        channel,
        acceptAudioMessage: acceptAudioMessageContact === 'enabled' ? true : false,
        remoteJid: newRemoteJid,
        profilePicUrl,
        urlPicture: "",
        whatsappId,
        source,
        isInAgenda,
        lid: finalLid,
        jid: jid ? String(jid).toLowerCase() : null
      });

      createContact = true;
    } else if (['facebook', 'instagram'].includes(channel)) {
      contact = await Contact.create({
        name,
        number,
        email,
        isGroup,
        companyId,
        channel,
        profilePicUrl,
        urlPicture: "",
        whatsappId,
        source,
        isInAgenda
      });
    }



    if (updateImage) {


      let filename;

      filename = await downloadProfileImage({
        profilePicUrl,
        companyId,
        contact
      })


      await contact.update({
        urlPicture: filename,
        pictureUpdated: true
      });

      await contact.reload();
    } else {
      if (['facebook', 'instagram'].includes(channel)) {
        let filename;

        filename = await downloadProfileImage({
          profilePicUrl,
          companyId,
          contact
        })


        await contact.update({
          urlPicture: filename,
          pictureUpdated: true
        });

        await contact.reload();
      }
    }

    if (createContact) {
      logger.info({
        action: 'contact_created',
        resource: 'contact',
        resourceId: contact.id,
        source: contact.source,
        isInAgenda: contact.isInAgenda,
        companyId: contact.companyId,
        normalizedNumber: contact.number,
        featureFlag: process.env.FEATURE_CONTACTS_FIX === 'true'
      });

      // Emite evento para o frontend atualizar a lista de contatos
      io.of(`/workspace-${companyId}`)
        .emit(`company-${companyId}-contact`, {
          action: "create",
          contact
        });
    } else {

      // Emite evento para o frontend atualizar a lista de contatos
      io.of(`/workspace-${companyId}`)
        .emit(`company-${companyId}-contact`, {
          action: "update",
          contact
        });

    }

    return contact;
  } catch (err) {
    logger.error("Error to find or create a contact:", err);
    throw err;
  }
};

export default CreateOrUpdateContactService;
