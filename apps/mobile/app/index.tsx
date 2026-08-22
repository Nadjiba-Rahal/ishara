import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { shared } from "../lib/styles";

export default function HomeScreen() {
  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 38, height: 38, borderRadius: 19, borderBottomLeftRadius: 6, backgroundColor: "#e6634f", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>I</Text>
          </View>
          <Text style={{ color: "#202522", fontWeight: "800", letterSpacing: 2, fontSize: 18 }}>ISHARA</Text>
        </View>
        <Text style={shared.eyebrow}>A clearer way to learn ALSL</Text>
        <Text style={shared.title}>Find the sign.{"\n"}Feel the meaning.</Text>
        <Text style={shared.body}>
          Look up signs, translate with your camera, and practice at your own pace in one calm, useful place.
        </Text>
      </View>

      <View style={shared.card}>
        <Text style={{ fontWeight: "800", color: "#202522", fontSize: 18 }}>Dictionary</Text>
        <Text style={shared.body}>Search real ALSL entries sourced from 3DZSignDB.</Text>
        <Link href="/dictionary" style={{ color: "#1d78b8", fontWeight: "700" }}>
          Open dictionary →
        </Link>
      </View>

      <View style={shared.card}>
        <Text style={{ fontWeight: "800", color: "#202522", fontSize: 18 }}>Translate</Text>
        <Text style={shared.body}>
          Text/gloss lookup works today. Camera and speech input are being built in later phases.
        </Text>
        <Link href="/translate" style={{ color: "#1d78b8", fontWeight: "700" }}>
          Open translator →
        </Link>
      </View>

      <View style={shared.card}>
        <Text style={{ fontWeight: "800", color: "#202522", fontSize: 18 }}>Practice</Text>
        <Text style={shared.body}>Quiz yourself on imported dictionary entries.</Text>
        <Link href="/practice" style={{ color: "#1d78b8", fontWeight: "700" }}>
          Start practicing →
        </Link>
      </View>
    </ScrollView>
  );
}
