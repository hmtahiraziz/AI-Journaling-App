import { Modal, Pressable, Text, View } from "react-native";
import { Button } from "@/src/components/Button";
import { colors, radii } from "@/src/theme/colors";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Soft destructive — ink text on glass, not system red alert. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Centered glass confirm — matches night / liquid-glass app theme. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading,
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 28,
          backgroundColor: "rgba(0,10,26,0.72)",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={loading ? undefined : onCancel}
        />
        <View
          style={{
            borderRadius: radii.card,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.glassBorder,
            backgroundColor: "rgba(1,18,47,0.96)",
            padding: 22,
          }}
        >
          <Text
            className="font-display text-2xl mb-2"
            style={{ color: colors.ink }}
          >
            {title}
          </Text>
          <Text
            className="font-sans text-base mb-6"
            style={{ color: colors.muted, lineHeight: 22 }}
          >
            {message}
          </Text>

          <View style={{ gap: 10 }}>
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              variant={destructive ? "secondary" : "primary"}
            />
            <Button
              title={cancelLabel}
              onPress={onCancel}
              disabled={loading}
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
