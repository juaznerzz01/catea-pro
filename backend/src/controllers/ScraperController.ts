import { Request, Response } from "express";
import ScraperFolder from "../models/ScraperFolder";
import ScraperResult from "../models/ScraperResult";
import AppError from "../errors/AppError";
import { Op } from "sequelize";
import * as GoogleMapsScraper from "../services/ScraperService/GoogleMapsScraper";

// ========== FOLDERS ==========

export const listFolders = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const folders = await ScraperFolder.findAll({
    where: { companyId },
    include: [{
      model: ScraperResult,
      attributes: ["id"]
    }],
    order: [["createdAt", "DESC"]]
  });

  // Adiciona contagem de resultados
  const data = folders.map(f => ({
    ...f.toJSON(),
    resultsCount: f.results ? f.results.length : 0
  }));

  return res.json(data);
};

export const createFolder = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { name, description } = req.body;

  if (!name) throw new AppError("ERR_NO_NAME", 400);

  const folder = await ScraperFolder.create({
    name,
    description: description || "",
    companyId
  });

  return res.status(201).json(folder);
};

export const updateFolder = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderId } = req.params;
  const { name, description } = req.body;

  const folder = await ScraperFolder.findOne({
    where: { id: folderId, companyId }
  });

  if (!folder) throw new AppError("ERR_FOLDER_NOT_FOUND", 404);

  await folder.update({ name, description });

  return res.json(folder);
};

export const deleteFolder = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderId } = req.params;

  const folder = await ScraperFolder.findOne({
    where: { id: folderId, companyId }
  });

  if (!folder) throw new AppError("ERR_FOLDER_NOT_FOUND", 404);

  await folder.destroy();

  return res.json({ message: "Pasta removida" });
};

// ========== RESULTS ==========

export const listResults = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderId } = req.params;
  const { searchParam = "", pageNumber = "1" } = req.query as any;

  const limit = 50;
  const offset = limit * (parseInt(pageNumber) - 1);

  const where: any = { companyId, folderId };

  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { category: { [Op.iLike]: `%${searchParam}%` } },
      { phone: { [Op.iLike]: `%${searchParam}%` } },
      { address: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const { count, rows } = await ScraperResult.findAndCountAll({
    where,
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + rows.length;

  return res.json({ results: rows, count, hasMore });
};

export const storeResults = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderId } = req.params;
  const { results } = req.body;

  // Verifica se a pasta existe e pertence a empresa
  const folder = await ScraperFolder.findOne({
    where: { id: folderId, companyId }
  });

  if (!folder) throw new AppError("ERR_FOLDER_NOT_FOUND", 404);

  if (!results || !Array.isArray(results) || results.length === 0) {
    throw new AppError("ERR_NO_RESULTS", 400);
  }

  const records = results.map((r: any) => ({
    folderId: parseInt(folderId),
    companyId,
    name: r.name || r["Nome"] || "",
    category: r.category || r["Categoria"] || "",
    rating: r.rating || r["Avaliação"] || "",
    reviewCount: r.reviewCount || r["Qtd Avaliações"] || "",
    phone: r.phone || r["Telefone"] || "",
    address: r.address || r["Endereço"] || "",
    website: r.website || r["Website"] || "",
    hours: r.hours || r["Horários"] || "",
    plusCode: r.plusCode || r["Plus Code"] || "",
    mapsLink: r.mapsLink || r["Link Google Maps"] || ""
  }));

  await ScraperResult.bulkCreate(records);

  return res.status(201).json({ message: `${records.length} resultados salvos` });
};

export const deleteResult = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { resultId } = req.params;

  const result = await ScraperResult.findOne({
    where: { id: resultId, companyId }
  });

  if (!result) throw new AppError("ERR_RESULT_NOT_FOUND", 404);

  await result.destroy();

  return res.json({ message: "Resultado removido" });
};

export const deleteAllResults = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderId } = req.params;

  await ScraperResult.destroy({
    where: { folderId, companyId }
  });

  return res.json({ message: "Todos os resultados removidos" });
};

// ========== EXPORT ==========

export const exportResults = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderId } = req.params;

  const folder = await ScraperFolder.findOne({
    where: { id: folderId, companyId }
  });

  if (!folder) throw new AppError("ERR_FOLDER_NOT_FOUND", 404);

  const results = await ScraperResult.findAll({
    where: { folderId, companyId },
    order: [["name", "ASC"]],
    raw: true
  });

  const data = results.map((r: any) => ({
    Nome: r.name,
    Categoria: r.category,
    "Avaliação": r.rating,
    "Qtd Avaliações": r.reviewCount,
    Telefone: r.phone,
    "Endereço": r.address,
    Website: r.website,
    "Horários": r.hours,
    "Plus Code": r.plusCode,
    "Link Google Maps": r.mapsLink
  }));

  return res.json({ folder: folder.name, data });
};

// ========== SCRAPING ==========

export const startScrape = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { term, city, scrolls, folderId } = req.body;

  if (!term || !folderId) throw new AppError("ERR_MISSING_PARAMS", 400);

  const folder = await ScraperFolder.findOne({
    where: { id: folderId, companyId }
  });
  if (!folder) throw new AppError("ERR_FOLDER_NOT_FOUND", 404);

  const jobId = GoogleMapsScraper.startJob(
    term,
    city || "",
    scrolls || 30,
    companyId,
    folderId
  );

  return res.status(201).json({ jobId, message: "Scraping iniciado" });
};

export const listJobs = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const jobsList = GoogleMapsScraper.getJobs(companyId);
  return res.json(jobsList);
};

export const getJobResults = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { jobId } = req.params;

  const data = GoogleMapsScraper.getJobResults(jobId, companyId);
  if (data === null) throw new AppError("ERR_JOB_NOT_FOUND", 404);

  return res.json(data);
};
