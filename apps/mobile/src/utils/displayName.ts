/** True if the string looks like an email address. */
export function looksLikeEmail(value?: string | null) {
  return !!value?.trim().includes("@");
}

/**
 * First name for greetings — never uses email.
 * Falls back to "Friend" when name is missing or is an email.
 */
export function firstName(name?: string | null, _email?: string | null) {
  const raw = name?.trim();
  if (!raw || looksLikeEmail(raw)) return "Friend";
  return raw.split(/\s+/)[0];
}

/**
 * Full display name for profile/settings — never uses email.
 */
export function displayName(name?: string | null, fallback = "Friend") {
  const raw = name?.trim();
  if (!raw || looksLikeEmail(raw)) return fallback;
  return raw;
}

/** Value safe to pass to avatar initials — never an email. */
export function avatarName(name?: string | null) {
  const raw = name?.trim();
  if (!raw || looksLikeEmail(raw)) return null;
  return raw;
}
