import { Linking, Platform } from "react-native";
import { SUPPORT_EMAIL } from "@/src/constants/support";
import { toast } from "@/src/lib/toast";

export type AiReportKind = "reflection" | "weekly_insight";

/**
 * Opens the device mail client to report problematic AI output (Play AI content policy).
 * No journal body is pre-filled — user chooses what to share.
 */
export async function reportAiContent(kind: AiReportKind, meta?: { entryId?: string; insightId?: string }) {
  const kindLabel = kind === "reflection" ? "AI reflection" : "weekly AI insight";
  const subject = encodeURIComponent(`Journal IQ — report ${kindLabel}`);
  const lines = [
    `I want to report a problematic ${kindLabel}.`,
    "",
    meta?.entryId ? `Entry id: ${meta.entryId}` : null,
    meta?.insightId ? `Insight id: ${meta.insightId}` : null,
    "",
    "Please describe the issue below (do not paste private journal text unless necessary):",
    "",
    "",
    `— sent from Journal IQ (${Platform.OS})`,
  ].filter((l) => l !== null);

  const body = encodeURIComponent(lines.join("\n"));
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      toast.error(`Email us at ${SUPPORT_EMAIL}`);
      return;
    }
    await Linking.openURL(url);
    toast.info("Thanks — tell us what went wrong in the email");
  } catch {
    toast.error(`Please write to ${SUPPORT_EMAIL}`);
  }
}
