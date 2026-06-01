import { NextFunction, Router } from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as MessageController from "../controllers/MessageController";
import SendWhatsAppTyping from "../services/WbotServices/SendWhatsAppTyping";

const messageRoutes = Router();

const upload = multer(uploadConfig);

// Typing indicator - envia "composing" para WhatsApp
messageRoutes.post("/typing/:ticketId", isAuth, async (req, res) => {
  const { ticketId } = req.params;
  const { companyId } = req.user;
  SendWhatsAppTyping(ticketId, companyId);
  return res.status(200).json({ ok: true });
});

messageRoutes.get("/messages/:ticketId", isAuth, MessageController.index);
messageRoutes.post("/messages/:ticketId", isAuth, upload.array("medias"), MessageController.store);
// messageRoutes.post("/forwardmessage",isAuth,MessageController.forwardmessage);
messageRoutes.delete("/messages/:messageId", isAuth, MessageController.remove);
messageRoutes.post("/messages/edit/:messageId", isAuth, MessageController.edit);

messageRoutes.get("/messages-allMe", isAuth, MessageController.allMe);
// Nova rota para transcrição
messageRoutes.get("/messages/transcribeAudio/:fileName", isAuth, MessageController.transcribeAudioMessage);
// Adicionando novas rotas para novas funções
messageRoutes.post("/messages/lista/:ticketId", isAuth, MessageController.sendListMessage);
messageRoutes.post("/messages/copy/:ticketId", isAuth, MessageController.sendCopyMessage);
messageRoutes.post("/messages/call/:ticketId", isAuth, MessageController.sendCALLMessage);
messageRoutes.post("/messages/url/:ticketId", isAuth, MessageController.sendURLMessage);
messageRoutes.post("/messages/PIX/:ticketId", isAuth, MessageController.sendPIXMessage);
messageRoutes.post('/message/forward', isAuth, MessageController.forwardMessage)
messageRoutes.post('/messages/:messageId/reactions', isAuth, MessageController.addReaction);
messageRoutes.post('/messages/:ticketId/ai-suggestions', isAuth, MessageController.aiSuggest);

export default messageRoutes;
