import { Link } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../lib/auth-context";
import { colors, shared } from "../lib/styles";

export default function AccountScreen() {
  const { session, isLoading, logout } = useAuth();

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  if (!session) {
    return (
      <View style={[shared.screen, shared.content]}>
        <Text style={shared.eyebrow}>Account</Text>
        <Text style={shared.title}>You&apos;re not logged in</Text>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={shared.buttonPrimary}>
            <Text style={shared.buttonPrimaryText}>Log in</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/auth/register" asChild>
          <TouchableOpacity style={shared.buttonGhost}>
            <Text style={shared.buttonGhostText}>Create account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <View style={[shared.screen, shared.content]}>
      <Text style={shared.eyebrow}>Account</Text>
      <Text style={shared.title}>{session.displayName}</Text>
      <Text style={shared.body}>
        {session.email} · role: {session.role}
      </Text>
      <Text style={shared.body}>
        Saved favorites and practice history are planned in Phase 12 and aren&apos;t implemented yet.
      </Text>
      <TouchableOpacity style={shared.buttonGhost} onPress={() => void logout()}>
        <Text style={shared.buttonGhostText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
