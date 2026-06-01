import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import fs from "fs";
import path from "path";

import ListService from "../services/CampaignService/ListService";
import CreateService from "../services/CampaignService/CreateService";
import ShowService from "../services/CampaignService/ShowService";
import UpdateService from "../services/CampaignService/UpdateService";
import DeleteService from "../services/CampaignService/DeleteService";
import FindService from "../services/CampaignService/FindService";

import Campaign from "../models/Campaign";

import ContactTag from "../models/ContactTag";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import ContactList from "../models/ContactList";
import ContactListItem from "../models/ContactListItem";

import AppError from "../errors/AppError";
import { CancelService } from "../services/CampaignService/CancelService";
import { RestartService } from "../services/CampaignService/RestartService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  companyId: string | number;
};

type StoreData = {
  name: string;
  status: string;
  confirmation: boolean;
  scheduledAt: string;
  companyId: number;
  contactListId: number;
  tagListId: number | string;
  userId: number | string;
  queueId: number | string;
  statusTicket: string;
  openTicket: string;
};

type FindParams = {
  companyId: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const tagId = typeof data.tagListId === 'number' ? data.tagListId : (typeof data.tagListId === 'string' && !isNaN(Number(data.tagListId)) && data.tagListId !== '' ? Number(data.tagListId) : null);

  // Remove tagListId original (string|number) do spread para evitar conflito de tipo
  const { tagListId: _rawTag, ...cleanData } = data;

  if (tagId) {
    try {
      const contactTags = await ContactTag.findAll({ where: { tagId } });
      const contactIds = contactTags.map((ct) => ct.contactId);
      const contacts = await Contact.findAll({ where: { id: contactIds } });

      const formattedDate = new Date().toISOString();
      const contactList = await ContactList.create({
        name: `${cleanData.name} | TAG: ${tagId} - ${formattedDate}`,
        companyId
      });

      const contactListItems = contacts.map((contact) => ({
        name: contact.name,
        number: contact.number,
        email: contact.email,
        contactListId: contactList.id,
        companyId,
        isWhatsappValid: true,
        isGroup: contact.isGroup
      }));

      await ContactListItem.bulkCreate(contactListItems);

      const record = await CreateService({
        ...cleanData,
        companyId,
        contactListId: contactList.id,
        tagListId: tagId
      });

      const io = getIO();
      io.of(`/workspace-${companyId}`)
        .emit(`company-${companyId}-campaign`, { action: "create", record });

      return res.status(200).json(record);
    } catch (error) {
      console.error('Error creating campaign from tag:', error);
      return res.status(500).json({ error: 'Error creating contact list from tag' });
    }
  } else {
    const record = await CreateService({
      ...cleanData,
      companyId
    });

    const io = getIO();
    io.of(`/workspace-${companyId}`)
      .emit(`company-${companyId}-campaign`, { action: "create", record });

    return res.status(200).json(record);
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  const record = await ShowService(id, companyId);

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = req.body as StoreData;

  const { companyId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const tagId = typeof data.tagListId === 'number' ? data.tagListId : (typeof data.tagListId === 'string' && !isNaN(Number(data.tagListId)) && data.tagListId !== '' ? Number(data.tagListId) : null);

  const { tagListId: _rawTag2, ...cleanUpdateData } = data;
  let updateData: any = { ...cleanUpdateData, id, companyId, tagListId: tagId };

  // Se a tag mudou, recria a ContactList a partir da nova tag
  if (tagId) {
    try {
      const contactTags = await ContactTag.findAll({ where: { tagId } });
      const contactIds = contactTags.map((ct) => ct.contactId);
      const contacts = await Contact.findAll({ where: { id: contactIds } });

      const formattedDate = new Date().toISOString();
      const contactList = await ContactList.create({
        name: `${data.name} | TAG: ${tagId} - ${formattedDate}`,
        companyId
      });

      const contactListItems = contacts.map((contact) => ({
        name: contact.name,
        number: contact.number,
        email: contact.email,
        contactListId: contactList.id,
        companyId,
        isWhatsappValid: true,
        isGroup: contact.isGroup
      }));

      await ContactListItem.bulkCreate(contactListItems);

      updateData.contactListId = contactList.id;
    } catch (error) {
      console.error('Error updating campaign tag:', error);
    }
  }

  const record = await UpdateService(updateData);

  const io = getIO();
  io.of(`/workspace-${companyId}`)
    .emit(`company-${companyId}-campaign`, { action: "update", record });

  return res.status(200).json(record);
};

export const cancel = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  await CancelService(+id);

  return res.status(204).json({ message: "Cancelamento realizado" });
};

export const restart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  await RestartService(+id);

  return res.status(204).json({ message: "Reinício dos disparos" });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id, companyId);

  const io = getIO();
  io.of(`/workspace-${companyId}`)
    .emit(`company-${companyId}-campaign`, {
      action: "delete",
      id
    });

  return res.status(200).json({ message: "Campaign deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params = req.query as FindParams;
  const records: Campaign[] = await FindService(params);

  return res.status(200).json(records);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  try {
    const campaign = await Campaign.findByPk(id);
    campaign.mediaPath = file.filename;
    campaign.mediaName = file.originalname;
    await campaign.save();
    return res.send({ mensagem: "Mensagem enviada" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  try {
    const campaign = await Campaign.findByPk(id);
    const filePath = path.resolve("public", `company${companyId}`, campaign.mediaPath);
    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
      fs.unlinkSync(filePath);
    }

    campaign.mediaPath = null;
    campaign.mediaName = null;
    await campaign.save();
    return res.send({ mensagem: "Arquivo excluído" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};