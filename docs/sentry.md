# Sentry (production / EAS only)

Sentry is **not** wired into Expo Go. Importing `@sentry/react-native` into Metro alongside NativeWind triggers:

`Debug ID was not found in the bundle. Call options.sentryBundleCallback…`

## Enable for release builds

1. Create a Sentry React Native project; copy the DSN.
2. Set `EXPO_PUBLIC_SENTRY_DSN` (and `SENTRY_AUTH_TOKEN` as an EAS secret).
3. Add the Expo plugin back to `apps/mobile/app.json`:

```json
[
  "@sentry/react-native/expo",
  {
    "organization": "your-org",
    "project": "your-project"
  }
]
```

4. Replace `apps/mobile/src/lib/sentry.ts` with a real `Sentry.init` + `Sentry.wrap` implementation (see Sentry Expo docs), and only ship that in preview/production profiles.

Do **not** wrap `metro.config.js` with `withSentryConfig` while using NativeWind — use the Expo config plugin for source maps on EAS instead.
