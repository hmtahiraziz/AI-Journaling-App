/**
 * Password-reset deep links arrive as:
 *   journaliq://reset-password?token=...
 *   journaliq:///reset-password?token=...
 *   journaliq:///(auth)/reset-password?token=...
 *
 * Expo Router maps these to /(auth)/reset-password when the path contains reset-password.
 */
export function extractResetTokenFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const normalized = url.includes("://") ? url : `journaliq://${url}`;
    const parsed = new URL(normalized);
    const fromQuery = parsed.searchParams.get("token");
    if (fromQuery?.trim()) return fromQuery.trim();

    // Some clients put the query on a path segment oddly; scan raw string.
    const match = url.match(/[?&]token=([^&#]+)/i);
    if (match?.[1]) return decodeURIComponent(match[1]).trim();
  } catch {
    const match = url.match(/[?&]token=([^&#]+)/i);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]).trim();
      } catch {
        return match[1].trim();
      }
    }
  }
  return null;
}

export function isResetPasswordUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /reset-password/i.test(url);
}
