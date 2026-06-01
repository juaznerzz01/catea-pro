// backend/src/routes/contactRoutes.ts

import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as ContactController from "../controllers/ContactController";
import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";
import * as ImportChatsContactsController from "../controllers/ImportChatsContactsController";

const contactRoutes = express.Router();
const upload = multer(uploadConfig);

contactRoutes.post("/contacts/import", isAuth, ImportPhoneContactsController.store);
contactRoutes.post("/contacts/import/chats", isAuth, ImportChatsContactsController.store);

contactRoutes.post("/contactsImport", isAuth, ContactController.importXls);
contactRoutes.get("/contacts", isAuth, ContactController.index);
contactRoutes.get("/contacts/filter-options", isAuth, ContactController.filterOptions);
contactRoutes.get("/contacts/list", isAuth, ContactController.list);
contactRoutes.get("/contacts/:contactId", isAuth, ContactController.show);
contactRoutes.post("/contacts", isAuth, ContactController.store);
// Rotas específicas ANTES da rota genérica :contactId
contactRoutes.put("/contacts/toggleAcceptAudio/:contactId", isAuth, ContactController.toggleAcceptAudio);
contactRoutes.put("/contacts/block/:contactId", isAuth, ContactController.blockUnblock);
contactRoutes.put("/contacts/toggleDisableBot/:contactId", isAuth, ContactController.toggleDisableBot);
contactRoutes.put("/contacts/toggleTranslate/:contactId", isAuth, ContactController.toggleContactTranslate);
contactRoutes.put("/contacts/language/:contactId", isAuth, ContactController.updateContactLanguage);

contactRoutes.put("/contacts/:contactId", isAuth, ContactController.update);

// Mova a rota de deleção em massa ANTES da rota de deleção de ID único.
contactRoutes.delete("/contacts/batch-delete", isAuth, ContactController.bulkRemove);
contactRoutes.delete("/contacts/:contactId", isAuth, ContactController.remove);

contactRoutes.get("/contacts", isAuth, ContactController.getContactVcard);
contactRoutes.get("/contacts/profile/:number", isAuth, ContactController.getContactProfileURL);
contactRoutes.post("/contacts/upload", isAuth, upload.array("file"), ContactController.upload);
contactRoutes.get("/contactTags/:contactId", isAuth, ContactController.getContactTags);
contactRoutes.put("/contact-wallet/:contactId", isAuth, ContactController.updateContactWallet);
contactRoutes.post("/contacts/:contactId/products", isAuth, ContactController.addProduct);
contactRoutes.put("/contacts/:contactId/products/:productId", isAuth, ContactController.updateProduct);
contactRoutes.delete("/contacts/:contactId/products/:productId", isAuth, ContactController.removeProduct);
// contactRoutes.get("/contacts/list-whatsapp", isAuth, ContactController.listWhatsapp);

export default contactRoutes;