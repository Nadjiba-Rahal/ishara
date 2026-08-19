# API

The Phase 2 API exposes:

- `GET /`
- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /openapi/v1.json` in development

Future phases will add documented REST endpoints and SignalR hubs.

`GET /api/health/ready` includes the PostgreSQL health check. It returns `503 Service Unavailable` when the configured database is not reachable, which is expected if local PostgreSQL or Docker Compose is not running.
