import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const rawUrl = (process.env.EXPO_PUBLIC_API_URL || "").trim().replace(/\/$/, "");

function resolveApiUrl(): string {
  if (__DEV__) {
    return rawUrl || "http://localhost:4000";
  }
  if (!rawUrl) {
    throw new Error("EXPO_PUBLIC_API_URL must be set to an https:// API URL in production builds.");
  }
  if (!rawUrl.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_URL must use HTTPS in production builds.");
  }
  return rawUrl;
}

const API_URL = resolveApiUrl();

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
  // Device-local keychain when supported (no iCloud backup of tokens).
  const opts =
    "WHEN_UNLOCKED_THIS_DEVICE_ONLY" in SecureStore
      ? {
          keychainAccessible: (SecureStore as typeof SecureStore & {
            WHEN_UNLOCKED_THIS_DEVICE_ONLY: number;
          }).WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      : undefined;
  await SecureStore.setItemAsync(TOKEN_KEYS.access, accessToken, opts);
  await SecureStore.setItemAsync(TOKEN_KEYS.refresh, refreshToken, opts);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
}

export function getApiBaseUrl() {
  return API_URL;
}

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 15000 }
    );
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    await clearTokens();
    return null;
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Only attach Bearer to our API host (never leak to third-party URLs).
  const base = API_URL.replace(/\/$/, "");
  const reqUrl = config.baseURL
    ? `${config.baseURL}${config.url || ""}`
    : config.url || "";
  const absolute = reqUrl.startsWith("http") ? reqUrl : `${base}${config.url || ""}`;
  if (absolute.startsWith(base)) {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      // Do not retry refresh endpoint itself
      if (original.url?.includes("/auth/refresh")) {
        await clearTokens();
        return Promise.reject(error);
      }
      original._retry = true;
      refreshing =
        refreshing ??
        refreshAccessToken().finally(() => {
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
