import { Pressable, Text } from "react-native";
import { colors } from "@/src/theme/colors";
import { reportAiContent, type AiReportKind } from "@/src/lib/reportAi";

type Props = {
  kind: AiReportKind;
  entryId?: string;
  insightId?: string;
  className?: string;
};

/** In-app path to flag problematic AI output (Google Play AI-generated content policy). */
export function ReportAiButton({ kind, entryId, insightId, className }: Props) {
  return (
    <Pressable
      onPress={() => void reportAiContent(kind, { entryId, insightId })}
      accessibilityRole="button"
      accessibilityLabel="Report this AI content"
      hitSlop={8}
      className={className}
      style={{ minHeight: 44, justifyContent: "center", marginTop: 12 }}
    >
      <Text className="font-sansMedium text-sm" style={{ color: colors.muted }}>
        Report this AI response
      </Text>
    </Pressable>
  );
}
