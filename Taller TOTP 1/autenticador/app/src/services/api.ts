import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import { getRefreshToken, saveRefreshToken, deleteRefreshToken } from "./tokenVault";
import { store } from "../state/store";
import { clearElevatedToken, signOut } from "../state/userSlice";
import { setAccessToken } from "../state/userSlice";

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.40.11:4200";

export const api = axios.create({ baseURL });

// Cola clasica para repetir una sola vez las peticiones que fallaron durante la renovacion.
let isRefreshing = false;
const failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];
export let refreshCount = 0;

function processQueue(error: unknown | null, token?: string | null) {
  failedQueue.forEach((item) => {
    if (error) item.reject(error);
    else item.resolve(token ?? "");
  });
  failedQueue.length = 0;
}

function decodeJwtExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const state = store.getState().user;
  if (config.headers.Authorization) return config;
  if (config.url?.includes("/api/boveda-critica") && state.elevatedToken) {
    const exp = decodeJwtExp(state.elevatedToken);
    if (exp && exp > Math.floor(Date.now() / 1000)) {
      config.headers["x-elevated-token"] = state.elevatedToken;
    } else if (exp) {
      store.dispatch(clearElevatedToken());
    }
  }
  if (state.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
  return config;
});

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const response = error.response;
    const original = error.config as (RetryConfig & { headers?: Record<string, string> }) | undefined;
    if (
      response?.status !== 401 ||
      !original ||
      original._retry ||
      original.url?.includes("/auth/refresh")
    ) {
      throw error;
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject
        });
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No hay refresh token.");
      const responseData = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken });
      const token = responseData.data.access_token as string;
      await saveRefreshToken(responseData.data.refresh_token);
      store.dispatch(setAccessToken(token));
      refreshCount += 1;
      processQueue(null, token);
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError);
      await deleteRefreshToken();
      store.dispatch(signOut());
      router.replace("/login");
      throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
    } finally {
      isRefreshing = false;
    }
  }
);
