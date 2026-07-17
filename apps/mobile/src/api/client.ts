import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export const TOKEN_KEYS = {
  access: "jiq_access_token",
  refresh: "jiq_refresh_token",
} as const;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

let refreshing: Promise<string | null> | null = null;

async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEYS.access);
}

export async function setTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEYS.access, accessToken);
  await SecureStore.setItemAsync(TOKEN_KEYS.refresh, refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
}

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    await clearTokens();
    return null;
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
