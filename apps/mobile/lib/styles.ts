import { StyleSheet } from "react-native";

export const colors = {
  ink: "#202522",
  muted: "#68736d",
  bg: "#f7f4ee",
  surface: "#fffdf9",
  border: "#e3ddd1",
  borderStrong: "#cfc6b8",
  primary: "#e6634f",
  primaryDark: "#bd4939",
  accentBg: "#dcece4",
  success: "#28745a",
  error: "#b9473d",
  yellow: "#f3d887"
};

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    padding: 20,
    gap: 14
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 6
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 9,
    shadowColor: "#51483b",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  cardTitleAr: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "right"
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13
  },
  input: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    backgroundColor: colors.surface,
    fontSize: 15
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  },
  buttonGhost: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonGhostText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 15
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  emptyState: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    gap: 6
  },
  errorText: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 14
  }
});
