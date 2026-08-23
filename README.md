# ISHARA

ISHARA is a full-stack AI platform for Algerian Sign Language (ALSL) communication and learning.

The long-term product goal is bidirectional communication:

- Sign to text
- Sign to speech
- Text to sign
- Speech to sign
- Real-time conversation support
- ALSL dictionary and learning workflows
- Research-grade model and dataset documentation

## Current Status

The web translation workspace contains the real browser pipeline: camera →
MediaPipe pose/hand landmarks → metadata-configured frame window → ONNX
inference → class label. The exported VDzSL v2 model is now installed in the
web and backend model slots. The backend exposes the same metadata-driven
model contract through `/api/recognition/predict`.

## Principles

- ALSL is not ASL. The platform must use ALSL-specific data when legally available.
- No fake datasets, fake confidence scores, or fake performance metrics.
- Camera data is sensitive. Process locally whenever possible and never store recordings by default.
- The project must run locally at zero cost.
- External datasets require license review before use.

## Technology Direction

- Backend: .NET 10, ASP.NET Core, Entity Framework Core, PostgreSQL, SignalR, JWT
- Web: Next.js, TypeScript, React, Three.js
- Mobile: React Native, Expo, TypeScript
- ML: Python, PyTorch, MediaPipe, OpenCV, scikit-learn
- Inference: ONNX Runtime in .NET
- DevOps: Docker Compose, GitHub Actions

## Repository Layout

```text
apps/
  web/
  mobile/
backend/
  Ishara.Api/
  Ishara.Application/
  Ishara.Domain/
  Ishara.Infrastructure/
ml/
avatar/
docs/
tests/
scripts/
docker/
```

## Local Development

Prerequisites:

- .NET SDK 10
- Node.js 24+
- npm 11+
- Python 3.12 for ML work
- Docker and Docker Compose

On Windows PowerShell, use `npm.cmd` because script execution policy may block `npm.ps1`.

### Web quick start

From the folder containing `docker-compose.yml`, Docker Compose can start the
database without any cloud API key:

```powershell
docker compose up postgres -d
```

The compose file has a local-only JWT fallback so this command does not fail
on missing `JWT__SIGNINGKEY`. For a named local configuration, copy
`.env.example` to `.env` and replace `JWT__SIGNINGKEY` with a random value of
at least 32 characters. No Google, OpenAI, or other external API key is
required by ISHARA.

Then, in separate terminals:

```powershell
dotnet run --project backend/Ishara.Api
cd apps\web
npm.cmd ci
$env:NEXT_PUBLIC_ISHARA_API_URL="http://localhost:5090"
npm.cmd run dev
```

Open `http://localhost:3000`. The browser camera requires `localhost` or HTTPS.
The first camera recognition attempt downloads the MediaPipe WASM runtime and
landmark models; internet access is required for that browser step. Camera
recognition is available at `/translate` and requires localhost or HTTPS.

For Android Emulator, set `isharaApiUrl` in `apps/mobile/app.json` to
`http://10.0.2.2:5090`. For a physical phone, use the computer's LAN IP, for
example `http://192.168.1.20:5090`, and run Expo with the phone and computer
on the same network. For iOS Simulator, `http://localhost:5090` normally
works.

Backend build:

```powershell
dotnet build backend/Ishara.slnx
```

Backend tests:

```powershell
dotnet test backend/Ishara.slnx
```

Create future backend migrations:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef migrations add <MigrationName> --project backend/Ishara.Infrastructure/Ishara.Infrastructure.csproj --startup-project backend/Ishara.Api/Ishara.Api.csproj --context IsharaDbContext --output-dir Persistence/Migrations
```

Local services:

```powershell
docker compose up --build
```

For local API authentication, configure `Jwt__SigningKey` with a strong secret through environment variables or user secrets before running the API.

3DZSignDB import:

```powershell
POST /api/signs/import/3dzsigndb
```

The import endpoint expects a server-local `categories_files.json` path and SigML directory from a legally obtained 3DZSignDB copy. The repository does not include copied ALSL sign data.

## Supplied recognition model and avatar

The project includes the exported VDzSL v2 model under
`ml/models/ishara-final/` and `apps/web/public/model/`, plus the supplied
CWASA/SigML package under `apps/web/public/avatar/`. The model reports 59.16%
stratified validation accuracy and 54.51% on the held-out signer test. These
are training-run metrics, not a guarantee for a user's camera.

The API loads the model from `ml/models/ishara-final/model.onnx` when run from
the repository root, or from an absolute `Recognition__ModelPath`.
`GET /api/recognition/status` reports the model's metadata-configured input
shape. `POST /api/recognition/predict` expects JSON with `frames` matching that
shape, containing normalized landmark features.

The avatar package is served at `/avatar/index.html`. It uses the included
CWASA runtime and real SigML assets; it is a standalone integration surface,
not an ALSL recognition model.

### Mobile

```powershell
cd apps\mobile
npm.cmd ci
npm.cmd start
```

The Expo client includes the native camera permission and opens the same
end-to-end recognition pipeline in its WebView. For a physical phone, set
`isharaWebUrl` to the computer's LAN address.

## License

Code is intended to be open source under the MIT License. Dataset and third-party asset licenses must be tracked separately.
