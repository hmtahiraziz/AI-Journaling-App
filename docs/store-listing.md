# Journal IQ — Google Play store listing copy

Use this when filling out Play Console. Update contact email before submit.

## Short description (≤80 characters)

Private AI journaling for mood, prompts, and gentle reflection—not therapy.

## Full description

Journal IQ is a private space to write, check in with your mood, and receive short, supportive AI reflections.

What you get
• Daily writing prompts or free-write anytime
• Mood check-ins and weekly patterns
• Gentle AI reflections after you write
• Optional PIN or biometric app lock
• Local daily reminders
• Export your data or delete your account anytime

Important
Journal IQ is a supportive journaling companion — not therapy, diagnosis, counseling, or medical care. AI reflections are observational and non-clinical. If you are in crisis or need urgent help, contact local emergency services or a trusted person nearby.

Your entries stay private to your account. When you request a reflection or weekly insight, relevant text may be processed by our AI provider solely to generate that response.

## Promo / feature graphic note

Keep hero art calm and personal (journal / quiet moment). Avoid clinical or medical imagery.

## Privacy Policy / Terms URLs

Host `docs/legal/privacy.html` and `docs/legal/terms.html` on a public HTTPS origin, then paste those URLs into Play Console and set:

```
EXPO_PUBLIC_PRIVACY_URL=https://your-domain.com/privacy
EXPO_PUBLIC_TERMS_URL=https://your-domain.com/terms
EXPO_PUBLIC_ACCOUNT_DELETION_URL=https://your-domain.com/delete-account
```

Also set production API in EAS (`eas.json` → production.env or EAS secrets):

```
EXPO_PUBLIC_API_URL=https://your-api.example.com
```

Support email used in-app: `support@journaliq.app` (update `src/constants/support.ts` if you change it).
