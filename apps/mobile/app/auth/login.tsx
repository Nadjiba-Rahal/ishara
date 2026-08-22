import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../lib/auth-context";
import { shared } from "../../lib/styles";

export default function LoginScreen() {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    clearError();
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) router.replace("/account");
  }

  return (
    <View style={[shared.screen, shared.content]}>
      <Text style={shared.title}>Log in</Text>
      <Text style={shared.body}>Sign in with your ISHARA account.</Text>

      <View>
        <Text style={shared.label}>Email</Text>
        <TextInput
          style={shared.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      <View>
        <Text style={shared.label}>Password</Text>
        <TextInput style={shared.input} value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      {error ? <Text style={shared.errorText}>{error}</Text> : null}

      <TouchableOpacity style={shared.buttonPrimary} onPress={submit} disabled={submitting}>
        <Text style={shared.buttonPrimaryText}>{submitting ? "Please wait…" : "Log in"}</Text>
      </TouchableOpacity>

      <Link href="/auth/register" style={{ color: "#bd4939", fontWeight: "700" }}>
        No account yet? Create one
      </Link>
    </View>
  );
}
