import { api, clearTokens, setTokens } from "./client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  timezone?: string;
  createdAt?: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export async function signup(input: { name: string; email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/signup", input);
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
    await api.post("/auth/signout", {});
  } finally {
    await clearTokens();
  }
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
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

export async function exportAccountData() {
  const { data } = await api.get<AccountExport>("/me/export");
  return data;
}

export async function deleteAccount() {
  const { data } = await api.delete<{ ok: boolean }>("/me");
  await clearTokens();
  return data;
}
