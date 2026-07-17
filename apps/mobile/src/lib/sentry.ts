/**
 * Crash reporting stub for Expo Go / local Metro.
 *
 * `@sentry/react-native` is left as a dependency for EAS release builds, but we
 * do not import it here — its Metro serializer conflicts with NativeWind and
 * breaks Expo Go bundling.
 *
 * To enable Sentry on a production/preview build:
 * 1. Set EXPO_PUBLIC_SENTRY_DSN
 * 2. Add `@sentry/react-native/expo` plugin in app.json (org + project)
 * 3. Init with `Sentry.init` in a release-only entry (see docs/sentry.md)
 */

export const sentryEnabled = false;

export function initSentry() {
  // no-op in Expo Go
}

export function withSentry<T extends React.ComponentType<unknown>>(Component: T): T {
  return Component;
}
