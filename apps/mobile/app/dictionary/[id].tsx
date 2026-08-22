import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { getSign } from "../../lib/api-client";
import type { SignDto } from "../../lib/api-client";
import { shared } from "../../lib/styles";

export default function SignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sign, setSign] = useState<SignDto | null | undefined>(undefined);

  useEffect(() => {
    if (id) {
      getSign(id).then(setSign);
    }
  }, [id]);

  if (sign === undefined) {
    return <ActivityIndicator style={{ marginTop: 40 }} color="#1d78b8" />;
  }

  if (sign === null) {
    return (
      <View style={[shared.screen, shared.content]}>
        <Text style={shared.title}>Sign not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <Text style={shared.eyebrow}>{sign.category ?? "Uncategorized"}</Text>
      <Text style={[shared.cardTitleAr, { fontSize: 32 }]}>{sign.arabicLabel}</Text>
      {sign.gloss ? <Text style={shared.body}>Gloss: {sign.gloss}</Text> : null}

      <View style={shared.card}>
        <Text style={{ fontWeight: "700", color: "#13304a" }}>Available representations</Text>
        <Row label="SigML (3D avatar data)" value={sign.hasSigml ? "Available" : "Not imported"} />
        <Row label="HamNoSys notation" value={sign.hasHamNoSys ? "Available" : "Not imported"} />
        <Row label="Media" value={sign.hasMedia ? "Available" : "Not imported"} />
        {sign.hasSigml ? (
          <Text style={shared.body}>
            Avatar playback from this SigML data is planned (Phase 11) and isn&apos;t built yet.
          </Text>
        ) : null}
      </View>

      <View style={shared.card}>
        <Text style={{ fontWeight: "700", color: "#13304a" }}>Source</Text>
        <Row label="Dataset" value={sign.sourceName} />
        <Row label="Source record ID" value={sign.sourceRecordId} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={shared.label}>{label}</Text>
      <Text style={shared.body}>{value}</Text>
    </View>
  );
}
