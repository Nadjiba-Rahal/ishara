import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getSigns } from "../lib/api-client";
import type { SignDto } from "../lib/api-client";
import { colors, shared } from "../lib/styles";
import { StatusBadge } from "../lib/status-badge";

export default function TranslateScreen() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<SignDto[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  function search() {
    setSearched(true);
    setLoading(true);
    getSigns({ q: text, pageSize: 10 }).then((r) => {
      setResults(r.items);
      setLoading(false);
    });
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <Text style={shared.eyebrow}>Translation workspace</Text>
      <Text style={shared.title}>Make meaning visible.</Text>

      <View style={shared.card}>
        <Text style={{ fontWeight: "800", color: "#202522", fontSize: 18 }}>Text to sign</Text>
        <Text style={shared.body}>Look up dictionary entries by Arabic text or gloss.</Text>
        <TextInput
          style={shared.input}
          value={text}
          onChangeText={setText}
          onSubmitEditing={search}
          placeholder="e.g. مرحبا"
          returnKeyType="search"
        />
        <TouchableOpacity style={shared.buttonPrimary} onPress={search}>
          <Text style={shared.buttonPrimaryText}>{loading ? "Searching…" : "Find sign"}</Text>
        </TouchableOpacity>

        {searched && !loading ? (
          results && results.length > 0 ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              {results.map((sign) => (
                <Link key={sign.id} href={`/dictionary/${sign.id}`} asChild>
                  <View style={shared.card}>
                    <Text style={shared.cardTitleAr}>{sign.arabicLabel}</Text>
                    {sign.gloss ? <Text style={shared.cardSubtitle}>{sign.gloss}</Text> : null}
                  </View>
                </Link>
              ))}
            </View>
          ) : (
            <Text style={shared.body}>No matching dictionary entry yet.</Text>
          )
        ) : null}
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
      </View>

      <View style={shared.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontWeight: "700", color: "#13304a" }}>Speech → sign</Text>
          <StatusBadge status="unavailable" />
        </View>
        <Text style={shared.body}>
          Planned: microphone → speech recognition → text → gloss lookup (Phase 10). Not wired up yet.
        </Text>
      </View>

      <View style={shared.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontWeight: "700", color: "#13304a" }}>Sign → text (camera)</Text>
          <StatusBadge status="unavailable" />
        </View>
        <Text style={shared.body}>
          Camera recognition runs in the native WebView screen and reuses the web pipeline: camera frames → MediaPipe
          landmarks → preprocessing → 16-frame ONNX inference → text.
        </Text>
        <Link href="/camera-preview" asChild>
          <TouchableOpacity style={shared.buttonGhost}>
            <Text style={shared.buttonGhostText}>Open camera preview</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}
