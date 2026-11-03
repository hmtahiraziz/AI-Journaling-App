/**
 * Public support contact — keep in sync with Privacy Policy / Play Console.
 * Replace with your real address before store submission.
 */
export const SUPPORT_EMAIL = "support@journaliq.app";

/** Optional public HTTPS URL for account-deletion requests (Play Data safety). */
export const ACCOUNT_DELETION_URL =
  process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL?.trim() || "";

export const AI_DISCLOSURE_SHORT =
  "Turning this on sends your journal text to our AI provider (OpenAI) to generate a short reflection. You can save without AI anytime.";

export const AI_DISCLOSURE_INSIGHT =
  "Weekly insights may send recent journal snippets and mood labels to our AI provider (OpenAI).";
