import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import CompaniesSettings from "../models/CompaniesSettings";
import { handleMessage } from "../services/FacebookServices/facebookMessageListener";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token) {
    // Verificar no .env (fallback)
    const envToken = process.env.VERIFY_TOKEN || "whaticket";
    if (token === envToken) {
      return res.status(200).send(challenge);
    }

    // Verificar se alguma empresa configurou esse token
    const setting = await CompaniesSettings.findOne({
      where: { facebookVerifyToken: token }
    });
    if (setting) {
      return res.status(200).send(challenge);
    }
  }

  return res.status(403).json({ message: "Forbidden" });
};

export const webHook = async (req: Request, res: Response): Promise<Response> => {
  const { body } = req;

  // LOG: ver tudo que chega no webhook
  console.log("[Webhook] POST recebido:", JSON.stringify(body).substring(0, 500));

  // PASSO 1: Responda imediatamente para evitar timeout da plataforma.
  res.status(200).json({ message: "EVENT_RECEIVED" });

  try {
    if (body.object === "page" || body.object === "instagram") {
      console.log("[Webhook] Processando object:", body.object, "entries:", body.entry?.length);
      const channel = body.object === "page" ? "facebook" : "instagram";

      for (const entry of body.entry) {
        try {
          const getTokenPage = await Whatsapp.findOne({
            where: {
              facebookPageUserId: entry.id,
              channel
            }
          });

          if (getTokenPage) {
            for (const data of entry.messaging) {
              try {
                await handleMessage(getTokenPage, data, channel, getTokenPage.companyId);
              } catch (handleError) {
                console.error("Erro capturado dentro do handleMessage:", handleError);
              }
            }
          }
        } catch (dbError) {
          console.error("Erro ao consultar o Whatsapp no banco de dados:", dbError);
        }
      }
    }
  } catch (error) {
    console.error("Erro geral no processamento do webhook:", error);
  }

  return;
};
