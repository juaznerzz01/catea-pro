import express from "express";
import isAuth from "../middleware/isAuth";
import * as TicketAiSummaryController from "../controllers/TicketAiSummaryController";

const ticketAiSummaryRoutes = express.Router();

ticketAiSummaryRoutes.get(
  "/tickets/:ticketId/ai-summaries",
  isAuth,
  TicketAiSummaryController.index
);

ticketAiSummaryRoutes.post(
  "/tickets/:ticketId/ai-summaries",
  isAuth,
  TicketAiSummaryController.generate
);

export default ticketAiSummaryRoutes;
