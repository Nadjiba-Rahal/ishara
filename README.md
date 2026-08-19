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

Phase 2 backend foundation is complete. This repository currently contains the monorepo structure, backend solution skeleton, documentation baseline, local development configuration, OpenAPI, health checks, problem details, PostgreSQL wiring, and the initial EF Core migration baseline.

ISHARA does not currently translate ALSL. Future recognition features must expose uncertainty, model version, dataset version, and limitations.

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

## License

Code is intended to be open source under the MIT License. Dataset and third-party asset licenses must be tracked separately.
