# ISHARA Mobile

Expo (React Native + expo-router) client for ISHARA. Consumes the **same** backend API as the web app — there is
no separate mobile backend.

## Structure

- `app/` — expo-router screens: home, dictionary list/detail, translate, practice, account, auth, camera preview.
- `lib/api-client.ts` — typed fetch client matching the real `backend/Ishara.Api` contract (signs, categories, auth).
- `lib/auth-context.tsx` — session state backed by `expo-secure-store` (secure token storage on-device).
- `lib/styles.ts` — shared white/light-blue design tokens matching the web app's palette.

## What's implemented

- Registration, login, logout against the real `/api/auth/*` endpoints, with tokens in SecureStore.
- Dictionary search + list + detail against `/api/signs` and `/api/categories`.
- Text/gloss lookup in the translate screen.
- A quiz-based practice mode generated from imported dictionary entries.
- Camera recognition through the native WebView screen. It requests the native
  camera permission and opens the same real browser pipeline used by the web
  client: MediaPipe landmarks, exact 258-feature preprocessing, a rolling
  16-frame window, and the bundled ONNX model.

## Configuration

Set `expo.extra.isharaApiUrl` and `expo.extra.isharaWebUrl` in `app.json`.
For a physical phone, use the computer's LAN IP instead of `localhost` for
both values, with the web and backend servers running on that computer.

## Verification (this environment)

The package configuration is prepared for Expo Go or a development build.
Device behavior still requires an actual iOS/Android simulator or physical
device.

Note: `npm install` requires `legacy-peer-deps=true` (set in `.npmrc`) because `expo-router`'s optional web/DOM
tooling (`@expo/ui`, `vaul`) pulls in `react-dom` peer ranges that don't apply to this React Native project.
