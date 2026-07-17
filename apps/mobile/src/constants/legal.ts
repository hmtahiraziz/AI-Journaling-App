/**
 * Legal document content shown in-app.
 * For Google Play Console, host the matching HTML under docs/legal/ and set
 * EXPO_PUBLIC_PRIVACY_URL / EXPO_PUBLIC_TERMS_URL to those public URLs.
 */

export const LEGAL_UPDATED = "July 17, 2026";

export const PRIVACY_POLICY = {
  title: "Privacy Policy",
  updated: LEGAL_UPDATED,
  sections: [
    {
      heading: "Who we are",
      body: "Journal IQ (“we”, “us”) is a private journaling app that helps you reflect with optional AI-assisted writing support. This policy explains what we collect, how we use it, and the choices you have.",
    },
    {
      heading: "Information we collect",
      body: "Account: email address, display name, password (stored as a one-way hash), and timezone.\n\nJournal content: entries you write, optional links to daily prompts, and AI reflections generated from your entries.\n\nMoods: check-in scores, labels, optional notes, and timestamps.\n\nInsights: weekly summaries derived from your moods and writing themes.\n\nDevice-local only (not uploaded to our servers): optional app lock PIN / biometrics preference, local notification reminder settings, and profile photo stored on your device.",
    },
    {
      heading: "How we use your information",
      body: "We use your data to provide the app: authenticate you, store and sync journals and moods, generate supportive AI reflections and weekly insights, send password-reset emails when you request them, and honor export or account-deletion requests.",
    },
    {
      heading: "AI processing",
      body: "When you request a reflection or weekly insight, relevant journal text and mood context may be sent to our AI provider (currently OpenAI) solely to generate that response. We instruct the model not to diagnose conditions or give medical or therapy advice. Do not include information you are not comfortable sending to our AI provider.",
    },
    {
      heading: "Not therapy or medical care",
      body: "Journal IQ is a journaling and reflection tool. It is not therapy, counseling, diagnosis, or medical advice, and it is not a crisis service. If you are in danger or need urgent help, contact local emergency services or a trusted person nearby.",
    },
    {
      heading: "Retention",
      body: "We keep your account data while your account is active. Journal entries, moods, and insights remain until you delete them or delete your account. Authentication tokens and password-reset tokens expire automatically. Server logs may be retained for a limited period for security and reliability.",
    },
    {
      heading: "Export and deletion",
      body: "You can export your account data as JSON from Settings. You can permanently delete your account from Settings; this erases your account and related journal, mood, insight, and auth data from our database (cascade delete).",
    },
    {
      heading: "Sharing",
      body: "We do not sell your journal content. We share data only with service providers needed to run Journal IQ (for example database hosting, email delivery, and AI generation), under contracts that limit use to providing those services, or when required by law.",
    },
    {
      heading: "Security",
      body: "Passwords are hashed. Access tokens are short-lived; refresh tokens are stored hashed. Transport should use HTTPS in production. No method of transmission or storage is 100% secure.",
    },
    {
      heading: "Children",
      body: "Journal IQ is not directed at children under 13 (or the minimum age required in your region). We do not knowingly collect personal information from children.",
    },
    {
      heading: "Changes",
      body: "We may update this policy. The “Last updated” date at the top will change when we do. Continued use after updates means you accept the revised policy.",
    },
    {
      heading: "Contact",
      body: "For privacy questions or requests, contact us at the support email listed on our Google Play Store listing (or the email you used when registering the developer account).",
    },
  ],
} as const;

export const TERMS_OF_SERVICE = {
  title: "Terms of Service",
  updated: LEGAL_UPDATED,
  sections: [
    {
      heading: "Agreement",
      body: "By creating an account or using Journal IQ, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the app.",
    },
    {
      heading: "The service",
      body: "Journal IQ provides private journaling, mood check-ins, optional daily prompts, local reminders, optional device lock, and AI-generated reflections and insights. Features may change as we improve the product.",
    },
    {
      heading: "Not medical or therapy advice",
      body: "Content in the app, including AI reflections and insights, is for personal reflection only. It is not professional medical, mental-health, or legal advice, and it does not create a clinician–patient relationship. Seek qualified professionals for health concerns.",
    },
    {
      heading: "Your account",
      body: "You are responsible for keeping your login credentials confidential and for activity under your account. Provide accurate information and use the app only for lawful purposes.",
    },
    {
      heading: "Your content",
      body: "You retain ownership of the journal entries and moods you create. You grant us a limited license to host, process, and display that content solely to operate Journal IQ (including AI features you request). You must have the right to submit the content you enter.",
    },
    {
      heading: "Acceptable use",
      body: "Do not attempt to break security, abuse AI endpoints, scrape the service, harass others, or use the app in ways that violate law. We may suspend or terminate accounts that abuse the service.",
    },
    {
      heading: "AI limitations",
      body: "AI output can be incomplete, inaccurate, or unhelpful. You should not rely on it for decisions about health, safety, or legal matters. Crisis-related language may trigger a fixed safety response with resource links; that response is not emergency assistance.",
    },
    {
      heading: "Availability",
      body: "We aim for reliable uptime but do not guarantee uninterrupted service. We may perform maintenance or update the app without notice.",
    },
    {
      heading: "Disclaimer of warranties",
      body: "Journal IQ is provided “as is” and “as available” without warranties of any kind, express or implied, to the fullest extent permitted by law.",
    },
    {
      heading: "Limitation of liability",
      body: "To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data or profits arising from your use of the app.",
    },
    {
      heading: "Termination",
      body: "You may stop using the app and delete your account at any time from Settings. We may suspend or end access if you violate these Terms or if we discontinue the service.",
    },
    {
      heading: "Changes",
      body: "We may update these Terms. Continued use after an update constitutes acceptance of the revised Terms. The “Last updated” date will reflect the latest version.",
    },
    {
      heading: "Contact",
      body: "Questions about these Terms can be sent to the support email on our Google Play Store listing.",
    },
  ],
} as const;

/** Optional hosted URLs for Play Console / external browsers. */
export const LEGAL_HOSTED = {
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || "",
  terms: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || "",
} as const;
