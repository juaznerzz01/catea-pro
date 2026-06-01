import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as TranslateController from "../controllers/TranslateController";

const translateRoutes = Router();

translateRoutes.post("/translate/message/:messageId", isAuth, TranslateController.translateMessage);
translateRoutes.get("/translate/settings", isAuth, TranslateController.getSettings);
translateRoutes.put("/translate/settings", isAuth, TranslateController.updateSettings);
translateRoutes.get("/translate/contact/:contactId/language", isAuth, TranslateController.getContactLanguage);

export default translateRoutes;
