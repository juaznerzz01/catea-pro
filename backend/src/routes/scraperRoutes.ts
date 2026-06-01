import express from "express";
import isAuth from "../middleware/isAuth";
import * as ScraperController from "../controllers/ScraperController";

const scraperRoutes = express.Router();

// Folders
scraperRoutes.get("/scraper/folders", isAuth, ScraperController.listFolders);
scraperRoutes.post("/scraper/folders", isAuth, ScraperController.createFolder);
scraperRoutes.put("/scraper/folders/:folderId", isAuth, ScraperController.updateFolder);
scraperRoutes.delete("/scraper/folders/:folderId", isAuth, ScraperController.deleteFolder);

// Results
scraperRoutes.get("/scraper/folders/:folderId/results", isAuth, ScraperController.listResults);
scraperRoutes.post("/scraper/folders/:folderId/results", isAuth, ScraperController.storeResults);
scraperRoutes.delete("/scraper/folders/:folderId/results", isAuth, ScraperController.deleteAllResults);
scraperRoutes.delete("/scraper/results/:resultId", isAuth, ScraperController.deleteResult);

// Export
scraperRoutes.get("/scraper/folders/:folderId/export", isAuth, ScraperController.exportResults);

// Scraping (Google Maps)
scraperRoutes.post("/scraper/scrape", isAuth, ScraperController.startScrape);
scraperRoutes.get("/scraper/jobs", isAuth, ScraperController.listJobs);
scraperRoutes.get("/scraper/job-results/:jobId", isAuth, ScraperController.getJobResults);

export default scraperRoutes;
