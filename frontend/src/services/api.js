import axios from "axios";
import { BACKEND_URL } from "../config/env";

const CancelToken = axios.CancelToken;
let cancelTokenSource = null;

const api = axios.create({
	baseURL: BACKEND_URL,
	// ✅ Removido withCredentials: true (não é necessário com localStorage)
});

// Função para criar um novo cancelTokenSource
export const createCancelTokenSource = () => {
	cancelTokenSource = CancelToken.source();
	return cancelTokenSource;
};

// Função para cancelar todas as requisições pendentes
export const cancelAllRequests = (message = "Requisições canceladas") => {
	if (cancelTokenSource) {
		cancelTokenSource.cancel(message);
		cancelTokenSource = null;
	}
};

// ✅ Interceptor de REQUEST: adiciona Authorization header
api.interceptors.request.use(
	(config) => {
		// Adiciona o token de autenticação se existir
		const token = localStorage.getItem("token");
		if (token) {
			config.headers["Authorization"] = `Bearer ${token}`;
		}

		// Se não houver um cancelTokenSource, cria um novo
		if (!cancelTokenSource) {
			cancelTokenSource = CancelToken.source();
		}
		// Adiciona o token de cancelamento à configuração
		config.cancelToken = cancelTokenSource.token;
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// ✅ Flag para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach(prom => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

// ✅ Interceptor de RESPONSE: trata erros 401/403 e refresh token
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// Se a requisição foi cancelada, não faz nada
		if (axios.isCancel(error)) {
			return Promise.resolve();
		}

		// ✅ Trata erro 401 e 403 (token expirado/inválido) - tenta refresh
		if ((error?.response?.status === 401 || error?.response?.status === 403) && !originalRequest._retry) {
			if (isRefreshing) {
				// Se já está fazendo refresh, adiciona à fila
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(token => {
					originalRequest.headers['Authorization'] = `Bearer ${token}`;
					return api(originalRequest);
				}).catch(err => {
					return Promise.reject(err);
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const refreshToken = localStorage.getItem("refreshToken");

			if (!refreshToken) {
				localStorage.removeItem("token");
				localStorage.removeItem("refreshToken");
				localStorage.removeItem("user");
				api.defaults.headers.Authorization = undefined;
				isRefreshing = false;
				processQueue(new Error("No refresh token available"), null);

				// Redireciona para login (exceto em páginas públicas)
				const publicPages = ["/login", "/signup", "/forgot-password", "/reset-password"];
				setTimeout(() => {
					if (!publicPages.includes(window.location.pathname)) {
						window.location.href = "/login";
					}
				}, 100);

				return Promise.reject(new Error("No refresh token available"));
			}

			try {
				const { data } = await api.post("/auth/refresh_token", { refreshToken });

				if (data && data.token) {
					localStorage.setItem("token", data.token);
					localStorage.setItem("refreshToken", data.refreshToken);
					api.defaults.headers.Authorization = `Bearer ${data.token}`;

					processQueue(null, data.token);
					isRefreshing = false;

					// Retenta a requisição original
					originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
					return api(originalRequest);
				}
			} catch (refreshError) {
				localStorage.removeItem("token");
				localStorage.removeItem("refreshToken");
				localStorage.removeItem("user");
				api.defaults.headers.Authorization = undefined;
				processQueue(refreshError, null);
				isRefreshing = false;

				// Redireciona para login (exceto em páginas públicas)
				const publicPages = ["/login", "/signup", "/forgot-password", "/reset-password"];
				setTimeout(() => {
					if (!publicPages.includes(window.location.pathname)) {
						window.location.href = "/login";
					}
				}, 100);

				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export const openApi = axios.create({
	baseURL: BACKEND_URL
});

export default api;
