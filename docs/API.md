# API

The Phase 3 API exposes:

- `GET /`
- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /openapi/v1.json` in development
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/admin-check`

Future phases will add documented REST endpoints and SignalR hubs.

`GET /api/health/ready` includes the PostgreSQL health check. It returns `503 Service Unavailable` when the configured database is not reachable, which is expected if local PostgreSQL or Docker Compose is not running.

Authentication endpoints return JWT access tokens and opaque refresh tokens. Refresh tokens are stored only as hashes and are rotated on refresh.
