import { Text, View } from "react-native";
import { colors, shared } from "./styles";

type Status = "available" | "unavailable" | "planned";

const LABELS: Record<Status, string> = {
  available: "Available",
  unavailable: "Not connected yet",
  planned: "Planned"
};

const BACKGROUNDS: Record<Status, string> = {
  available: "#e2f2e8",
  unavailable: "#fbe3df",
  planned: colors.accentBg
};

const TEXT_COLORS: Record<Status, string> = {
  available: colors.success,
  unavailable: colors.error,
  planned: colors.primaryDark
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <View style={[shared.badge, { backgroundColor: BACKGROUNDS[status] }]}>
      <Text style={[shared.badgeText, { color: TEXT_COLORS[status] }]}>{LABELS[status]}</Text>
    </View>
  );
}
