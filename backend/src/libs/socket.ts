import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import AppError from "../errors/AppError";
import logger from "../utils/logger";
import { instrument } from "@socket.io/admin-ui";
import { z } from "zod";
import jwt from "jsonwebtoken";
import SendWhatsAppTyping from "../services/WbotServices/SendWhatsAppTyping";

// Define namespaces permitidos
const ALLOWED_NAMESPACES = /^\/workspace-\d+$/;

// Esquemas de validação
// ✅ CORREÇÃO: Aceitar tanto UUID quanto IDs numéricos para compatibilidade
const userIdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^\d+$/, "ID deve ser UUID ou número"),
  z.number() // Aceita números diretamente também
]).optional();

const ticketIdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^\d+$/, "ID deve ser UUID ou número")
]);

const statusSchema = z.enum(["open", "closed", "pending", "group"]);

// ✅ CORREÇÃO CRÍTICA: JWT contém 'id' numérico, não 'userId' UUID
const jwtPayloadSchema = z.object({
  id: z.union([
    z.number(),  // Aceita número (caso atual)
    z.string()   // Aceita string (para compatibilidade)
  ]),
  userId: z.union([
    z.string().uuid(),
    z.string().regex(/^\d+$/),
    z.number()
  ]).optional(), // userId é opcional, pois o JWT usa 'id'
  companyId: z.union([
    z.number(),
    z.string()
  ]).optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

// Origens CORS permitidas
const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001"
    ];

// Adicionar suporte para origens HTTPS em produção
if (process.env.NODE_ENV === "production") {
  // Adicionar origens HTTPS se não estiverem na lista
  const httpsOrigins = ALLOWED_ORIGINS.map(origin =>
    origin.replace("http://", "https://")
  ).filter(origin => !ALLOWED_ORIGINS.includes(origin));
  ALLOWED_ORIGINS.push(...httpsOrigins);
}

// Adicionar v1.chatia.cloud se não estiver na lista
if (!ALLOWED_ORIGINS.some(origin => origin.includes("chatia.cloud"))) {
  ALLOWED_ORIGINS.push("https://v1.chatia.cloud", "http://v1.chatia.cloud");
}

// Ajuste da classe AppError para compatibilidade com Error
class SocketCompatibleAppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = "AppError";
    // Garante que a stack trace seja capturada
    Error.captureStackTrace?.(this, SocketCompatibleAppError);
  }
}

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  logger.info("🚀 [Socket.IO] Inicializando com origens permitidas:", ALLOWED_ORIGINS);

  io = new SocketIO(httpServer, {
    cors: {
      origin: true, // Permite todas as origens
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["authorization", "content-type"],
    },
    maxHttpBufferSize: 1e6, // Limita payload a 1MB
    pingTimeout: 20000,
    pingInterval: 25000,
    transports: ["polling", "websocket"], // Permitir ambos os transportes
  });

  // Middleware de autenticação JWT
  io.use((socket, next) => {
    const token = socket.handshake.query.token as string;
    const userId = socket.handshake.query.userId;

    logger.info("🔐 [Socket Auth] Tentativa de autenticação:", {
      hasToken: !!token,
      userId: userId,
      namespace: socket.nsp.name
    });

    if (!token) {
      logger.warn("❌ [Socket Auth] Tentativa de conexão sem token");
      return next(new SocketCompatibleAppError("Token ausente", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

      logger.info("🔍 [Socket Auth] Token decodificado:", {
        id: (decoded as any).id,
        companyId: (decoded as any).companyId,
        profile: (decoded as any).profile
      });

      const validatedPayload = jwtPayloadSchema.parse(decoded);
      socket.data.user = validatedPayload;

      logger.info("✅ [Socket Auth] Autenticação bem-sucedida:", {
        userId: validatedPayload.id,
        companyId: validatedPayload.companyId
      });

      next();
    } catch (err) {
      logger.error("❌ [Socket Auth] Falha na autenticação:", {
        error: err instanceof Error ? err.message : String(err),
        tokenSample: token ? token.substring(0, 20) + "..." : "no token"
      });
      return next(new SocketCompatibleAppError("Token inválido", 401));
    }
  });

  // Admin UI apenas em desenvolvimento
  const isAdminEnabled = process.env.SOCKET_ADMIN === "true" && process.env.NODE_ENV !== "production";
  if (isAdminEnabled && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    try {
      instrument(io, {
        auth: {
          type: "basic",
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD,
        },
        mode: "development",
        readonly: true,
      });
      logger.info("Socket.IO Admin UI inicializado em modo de desenvolvimento");
    } catch (error) {
      logger.error("Falha ao inicializar Socket.IO Admin UI", error);
    }
  } else if (isAdminEnabled) {
    logger.warn("Credenciais de administrador ausentes, Admin UI não inicializado");
  }

  // Namespaces dinâmicos com validação
  const workspaces = io.of((name, auth, next) => {
    if (ALLOWED_NAMESPACES.test(name)) {
      next(null, true);
    } else {
      logger.warn(`Tentativa de conexão a namespace inválido: ${name}`);
      next(new SocketCompatibleAppError("Namespace inválido", 403), false);
    }
  });

  workspaces.on("connection", (socket) => {
    const clientIp = socket.handshake.address;

    // Valida userId (mais flexível)
    let userId: string | number | undefined;
    const rawUserId = socket.handshake.query.userId;

    logger.info("🔍 [Socket Connection] Validando userId:", {
      rawUserId,
      type: typeof rawUserId,
      namespace: socket.nsp.name
    });

    try {
      // Se userId não foi enviado, é opcional, então apenas continue
      if (rawUserId) {
        userId = userIdSchema.parse(rawUserId);
      }
    } catch (error) {
      logger.warn(`⚠️ [Socket Connection] userId inválido mas continuando conexão:`, {
        userId: rawUserId,
        error: error instanceof Error ? error.message : String(error),
        clientIp
      });
      // NÃO desconectar - deixar continuar mesmo sem userId válido
      // socket.disconnect(true);
      // return;
    }

    logger.info(`✅ [Socket Connection] Cliente conectado:`, {
      namespace: socket.nsp.name,
      clientIp,
      userId,
      socketId: socket.id
    });

    // ✅ CORREÇÃO: Callback opcional
    socket.on("joinChatBox", (ticketId: string, callback?: (error?: string) => void) => {
      try {
        const validatedTicketId = ticketIdSchema.parse(ticketId);
        socket.join(validatedTicketId);
        logger.info(`Cliente entrou no canal de ticket ${validatedTicketId} no namespace ${socket.nsp.name}`);
        if (callback) callback();
      } catch (error) {
        logger.warn(`ticketId inválido: ${ticketId}`);
        if (callback) callback("ID de ticket inválido");
      }
    });

    // ✅ CORREÇÃO: Callback opcional
    socket.on("joinNotification", (callback?: (error?: string) => void) => {
      socket.join("notification");
      logger.info(`Cliente entrou no canal de notificações no namespace ${socket.nsp.name}`);
      if (callback) callback();
    });

    // ✅ CORREÇÃO: Callback opcional
    socket.on("joinTickets", (status: string, callback?: (error?: string) => void) => {
      try {
        const validatedStatus = statusSchema.parse(status);
        socket.join(validatedStatus);
        logger.info(`Cliente entrou no canal ${validatedStatus} no namespace ${socket.nsp.name}`);
        if (callback) callback();
      } catch (error) {
        logger.warn(`Status inválido: ${status}`);
        if (callback) callback("Status inválido");
      }
    });

    // ✅ CORREÇÃO: Callback opcional
    socket.on("joinTicketsLeave", (status: string, callback?: (error?: string) => void) => {
      try {
        const validatedStatus = statusSchema.parse(status);
        socket.leave(validatedStatus);
        logger.info(`Cliente saiu do canal ${validatedStatus} no namespace ${socket.nsp.name}`);
        if (callback) callback();
      } catch (error) {
        logger.warn(`Status inválido: ${status}`);
        if (callback) callback("Status inválido");
      }
    });

    // ✅ CORREÇÃO: Callback opcional
    socket.on("joinChatBoxLeave", (ticketId: string, callback?: (error?: string) => void) => {
      try {
        const validatedTicketId = ticketIdSchema.parse(ticketId);
        socket.leave(validatedTicketId);
        logger.info(`Cliente saiu do canal de ticket ${validatedTicketId} no namespace ${socket.nsp.name}`);
        if (callback) callback();
      } catch (error) {
        logger.warn(`ticketId inválido: ${ticketId}`);
        if (callback) callback("ID de ticket inválido");
      }
    });

    // Typing indicator - envia "composing" para o WhatsApp a cada tecla
    socket.on("typing", (data: { ticketId: string | number; companyId: number }) => {
      try {
        if (data?.ticketId && data?.companyId) {
          SendWhatsAppTyping(data.ticketId, data.companyId);
        }
      } catch (err) {
        // silencioso
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Cliente desconectado do namespace ${socket.nsp.name} (IP: ${clientIp})`);
    });

    socket.on("error", (error) => {
      logger.error(`Erro no socket do namespace ${socket.nsp.name}: ${error.message}`);
    });
  });

  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new SocketCompatibleAppError("Socket IO não inicializado", 500);
  }
  return io;
};