import io from "socket.io-client";
import { BACKEND_URL } from "../config/env";

class SocketWorker {
  constructor(companyId , userId) {
    // ✅ CORREÇÃO CRÍTICA: Validar ANTES de criar/retornar instância
    if (!companyId || !userId) {
      throw new Error("SocketWorker requires companyId and userId");
    }

    // Se já existe instância com os MESMOS dados, reutilizar
    if (SocketWorker.instance &&
        SocketWorker.instance.companyId === companyId &&
        SocketWorker.instance.userId === userId) {
      return SocketWorker.instance;
    }

    // Se existe instância mas com dados DIFERENTES, desconectar e recriar
    if (SocketWorker.instance) {
      SocketWorker.instance.disconnect();
    }

    // Criar nova instância
    this.companyId = companyId;
    this.userId = userId;
    this.socket = null;
    this.eventListeners = {}; // Armazena os ouvintes de eventos registrados

    // Configurar socket imediatamente
    this.configureSocket();

    SocketWorker.instance = this;

    return this;
  }

  configureSocket() {
    // ✅ CORREÇÃO: Usar namespace /workspace-{companyId} para compatibilidade com backend
    // ✅ CORREÇÃO CRÍTICA: Adicionar token JWT no handshake
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    if (!this.companyId || !this.userId) {
      return;
    }

    const userIdString = String(this.userId);

    this.socket = io(`${BACKEND_URL}/workspace-${this?.companyId}` , {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],  // ✅ Forçar WebSocket primeiro
      pingTimeout: 20000,                     // ✅ Sincronizar com backend
      pingInterval: 25000,                    // ✅ Sincronizar com backend
      query: {
        userId: userIdString,  // ✅ Enviar como string
        token: token  // ✅ Adicionar token para autenticação
      }
    });

    this.socket.on("connect", () => {
    });

    this.socket.on("connect_error", (error) => {
      if (error.message === "Token inválido" || error.message === "Token ausente") {
        const newToken = localStorage.getItem("token");
        if (newToken && newToken !== token) {
          this.configureSocket();
        }
      }
    });

    this.socket.on("disconnect", () => {
      this.reconnectAfterDelay();
    });
  }

  // Adiciona um ouvinte de eventos
  on(event, callback) {
    this.connect();

    if (!this.socket) {
      return;
    }

    this.socket.on(event, callback);

    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  // Emite um evento
  emit(event, data, callback) {
    this.connect();

    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  // Desconecta um ou mais ouvintes de eventos
  off(event, callback) {
    this.connect();
    if (this.eventListeners[event]) {
      if (callback) {
        this.socket.off(event, callback);
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      } else {
        this.eventListeners[event].forEach(cb => this.socket.off(event, cb));
        delete this.eventListeners[event];
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null
      this.instance = null
    }
  }

  reconnectAfterDelay() {
    setTimeout(() => {
      if (!this.socket || !this.socket.connected) {
        this.connect();
      }
    }, 1000);
  }

  // Garante que o socket esteja conectado
  connect() {
    if (!this.socket) {
      this.configureSocket();
    }
  }

  forceReconnect() {

  }
}

const instance = (companyId, userId) => new SocketWorker(companyId, userId);

export default instance;