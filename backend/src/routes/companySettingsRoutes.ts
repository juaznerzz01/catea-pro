/** 
 * @TercioSantos-0 |
 * routes/configurações das empresas |å
 */
import express from "express";
import isAuth from "../middleware/isAuth";

import * as CompanySettingsController from "../controllers/CompanySettingsController";

const companySettingsRoutes = express.Router();

companySettingsRoutes.get("/companySettings/:companyId", isAuth, CompanySettingsController.show);
companySettingsRoutes.get("/companySettingOne/", isAuth, CompanySettingsController.showOne);
companySettingsRoutes.put("/companySettings/", isAuth, CompanySettingsController.update);
companySettingsRoutes.post("/companySettings/test-smtp", isAuth, CompanySettingsController.testSmtp);
companySettingsRoutes.post("/companySettings/send-test-email", isAuth, CompanySettingsController.sendTestEmail);

export default companySettingsRoutes;