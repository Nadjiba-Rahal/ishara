import { useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { shared } from "../lib/styles";

// The mobile client reuses the tested web recognition surface in a native
// WebView. This is intentional: Expo Camera does not expose raw frames to
// JavaScript, while the browser implementation already performs the complete
// MediaPipe -> 16-frame -> ONNX pipeline without changing preprocessing.
export default function CameraPreviewScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const webUrl = (Constants.expoConfig?.extra?.isharaWebUrl as string | undefined) ?? "http://localhost:3000/translate";

  useEffect(() => {
    if (open && permission?.granted === false) requestPermission();
  }, [open, permission?.granted, requestPermission]);

  if (!permission) return <View style={shared.screen}><ActivityIndicator /></View>;
  if (!permission.granted) {
    return <View style={[shared.screen, shared.content]}>
      <Text style={shared.title}>Camera access needed</Text>
      <Text style={shared.body}>ISHARA needs camera access for live sign recognition. Frames are processed transiently.</Text>
      <TouchableOpacity style={shared.buttonPrimary} onPress={requestPermission}><Text style={shared.buttonPrimaryText}>Grant camera access</Text></TouchableOpacity>
    </View>;
  }
  if (!open) {
    return <View style={[shared.screen, shared.content]}>
      <Text style={shared.title}>Sign recognition</Text>
      <Text style={shared.body}>The native screen opens the same camera, landmark, preprocessing, and ONNX pipeline as the web translator.</Text>
      <TouchableOpacity style={shared.buttonPrimary} onPress={() => setOpen(true)}><Text style={shared.buttonPrimaryText}>Start recognition</Text></TouchableOpacity>
    </View>;
  }
  return <View style={shared.screen}><WebView
    style={{ flex: 1 }}
    source={{ uri: webUrl }}
    javaScriptEnabled
    mediaPlaybackRequiresUserAction={false}
    allowsInlineMediaPlayback
    onPermissionRequest={(event: { nativeEvent: { grant: (resources: string[]) => void; resources: string[] } }) =>
      event.nativeEvent.grant(event.nativeEvent.resources)}
    onError={() => setOpen(false)}
  /></View>;
}