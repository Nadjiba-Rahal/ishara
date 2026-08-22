# Roadmap

## Phase 0: Product and Architecture

Define architecture, requirements, roadmap, privacy rules, and dataset principles.

## Phase 1: Repository

Create monorepo, Git setup, documentation baseline, Docker setup, and buildable skeletons.

## Phase 2: Backend Foundation

Add ASP.NET Core foundation, health checks, Swagger/OpenAPI, EF Core, PostgreSQL, logging, and centralized errors.

Status: complete.

## Phase 3: Authentication

Add registration, login, JWT, password hashing, roles, and authorization.

Status: complete.

## Phase 4: Sign Dictionary

Add sign entities, translations, categories, search, pagination, and lawful seed data.

Status: complete.

Verification (this environment):
- `apps/web`: `npx tsc --noEmit` passes. A fresh production build was attempted
  after `npm ci`, but the sandbox killed Next.js during optimization because of
  its resource limit.
- `backend`: code-complete (dictionary domain, EF Core migration, importer, endpoints, tests) but **not locally compiled/tested** — this sandbox has no .NET SDK and no network access to nuget.org, so `dotnet build`/`dotnet test`/`dotnet ef database update` could not be run here. Run these locally before trusting the backend changes.

## Phase 5: Web UI

Build the accessible white/light-blue Next.js interface.

Status: complete for the features that currently have a backend to call.

Delivered:
- Site shell: nav, footer, skip link, white/blue design system in `app/styles.css`.
- Pages: `/`, `/dictionary`, `/dictionary/[id]`, `/translate`, `/practice`, `/about`, `/auth/login`,
  `/auth/register`, `/dashboard`.
- Dictionary: real server-side search/filter/pagination against `/api/signs` and `/api/categories`.
- Translate: real text/gloss lookup against `/api/signs`, browser speech lookup,
  and a link to the supplied CWASA/SigML avatar workspace. Camera capture is
  connected to model status but still needs browser-side landmark extraction.
- Practice: a real multiple-choice quiz generated from imported dictionary entries (client-side, no fake scores).
  Camera-scored practice is marked "Not connected yet" (Phase 12).
- Auth: registration/login/logout wired to the real `/api/auth/*` endpoints, with a session persisted in
  `localStorage`. This is flagged in `app/lib/auth-context.tsx` as a Phase 14 hardening item — an httpOnly
  cookie session would be more secure than client-readable storage.

Verification (this environment): TypeScript check passes. A prior production
build and route smoke test succeeded; the current build attempt is blocked by
the sandbox resource limit, as noted above. With no backend running, the app
degrades to honest empty states rather than erroring or fabricating data.

## Phase 6: Mobile

Build the Expo app using the same API.

Status: complete for the features that currently have a backend to call.

Delivered (`apps/mobile`, Expo + expo-router):
- Screens: home, dictionary list/detail, translate, practice, account, login/register, camera preview.
- Same API contract as web (`lib/api-client.ts`), same backend, no separate mobile backend.
- Auth session stored via `expo-secure-store` (on-device secure storage, stronger than the web app's localStorage
  fallback).
- Camera interface foundation using `expo-camera`: requests permission, shows a
  live preview, and reads recognition model status. No frames are stored.

Verification (this environment): the existing mobile source had previously
passed TypeScript verification. Re-verification after the recognition-status
change was blocked because the package firewall could not provide one locked
dependency. Running on an actual simulator/device was **not** verified — no
Xcode/Android SDK/emulator is available in this sandbox.

Recognition foundation verification:
- `python3 ml/smoke_test.py` passes using a synthetic development fixture only.
- Backend build/tests remain blocked because the .NET SDK is unavailable.

## Phase 7: Recognition foundation

Status: model adapter complete; runtime verification environment-blocked.

Delivered:
- JSONL landmark loader and translation/scale normalization in `ml/`.
- Dependency-free smoke test using a clearly synthetic `DEVELOPMENT_ONLY` fixture.
- `GET /api/recognition/status` and `POST /api/recognition/predict` contracts.
- ONNX adapter for the supplied `IsharaFinal` model, including metadata labels,
  softmax confidence, and top-five predictions.
- Safe unavailable response when the model path is missing or cannot load.

Blocked:
- The supplied model metadata reports VDzSL evaluation figures. Confirm that
  the camera landmark extraction uses the same 16×258 representation before
  treating live predictions as valid.

## Phases 8-21

Remain future work: browser/mobile landmark extraction, camera-scored practice,
conversation UI, community features, security hardening, and deployment.
