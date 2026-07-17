import { Redirect } from "expo-router";

/** Placeholder tab — center FAB navigates to write; this screen is never shown. */
export default function CreateTabPlaceholder() {
  return <Redirect href="/(app)/write" />;
}
