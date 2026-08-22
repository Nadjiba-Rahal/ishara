import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../lib/auth-context";
import { shared } from "../../lib/styles";

export default function RegisterScreen() {
  const { register, error, clearError } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    clearError();
    setSubmitting(true);
    const ok = await register(email, password, displayName);
    setSubmitting(false);
    if (ok) router.replace("/account");
  }

  return (
    <View style={[shared.screen, shared.content]}>
      <Text style={shared.title}>Create your account</Text>
      <Text style={shared.body}>Track practice progress and contribute to the dictionary.</Text>

      <View>
        <Text style={shared.label}>Display name</Text>
        <TextInput style={shared.input} value={displayName} onChangeText={setDisplayName} />
      </View>
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
        <Text style={shared.buttonPrimaryText}>{submitting ? "Please wait…" : "Create account"}</Text>
      </TouchableOpacity>

      <Link href="/auth/login" style={{ color: "#bd4939", fontWeight: "700" }}>
        Already have an account? Log in
      </Link>
    </View>
  );
}
