import * as SecureStore from "expo-secure-store";
import { api, clearTokens, setTokens, TOKEN_KEYS } from "./client";

/** Keep in sync with packages/shared LEGAL_CONSENT_VERSION. */
export const LEGAL_CONSENT_VERSION = "2026-07-17";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  timezone?: string;
  createdAt?: string;
  consentLegalVersion?: string | null;
  consentLegalAt?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export async function signup(input: {
  name: string;
  email: string;
  password: string;
  acceptedLegalVersion?: string;
}) {
  const { data } = await api.post<AuthResponse>("/auth/signup", {
    ...input,
    acceptedLegalVersion: input.acceptedLegalVersion ?? LEGAL_CONSENT_VERSION,
  });
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function signin(input: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/signin", input);
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function signout() {
  try {
    const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
    await api.post("/auth/signout", refreshToken ? { refreshToken } : {});
  } finally {
    await clearTokens();
  }
}

export type ForgotPasswordResponse = {
  ok: boolean;
  /** Present only when the backend is running in NODE_ENV=development. */
  localReset?: { otp: string; token: string };
};

export async function forgotPassword(email: string) {
  const { data } = await api.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AuthUser & { timezone: string; createdAt: string } }>(
    "/me"
  );
  return data.user;
}

export async function updateProfile(input: { name?: string; timezone?: string }) {
  const { data } = await api.patch<{ user: AuthUser & { timezone: string; createdAt: string } }>(
    "/me",
    input
  );
  return data.user;
}

export type AccountExport = {
  exportedAt: string;
  app: string;
  user: AuthUser & { timezone?: string; createdAt?: string };
  journals: unknown[];
  moods: unknown[];
  insights: unknown[];
};

export async function exportAccountData(password: string) {
  const { data } = await api.post<AccountExport>("/me/export", { password });
  return data;
}

export async function deleteAccount(password: string) {
  const { data } = await api.delete<{ ok: boolean }>("/me", { data: { password } });
  await clearTokens();
  return data;
}
