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
- `GET /api/signs`
- `GET /api/signs/search?q=`
- `GET /api/signs/{id}`
- `POST /api/signs/import/3dzsigndb`
- `GET /api/categories`
- `GET /api/recognition/status`
- `POST /api/recognition/predict`

Recognition status reports `ready` only when the configured ONNX model and
labels load successfully. Prediction requests contain:

```json
{
  "frames": [[0, 0, "... 258 normalized features ..."], "... 16 frames total"]
}
```

The endpoint returns the predicted label, confidence, model version, dataset
version, and top-five predictions. It returns `503` with an unavailable
response when the model cannot load, and `400` for incorrect frame dimensions.

`GET /api/health/ready` includes the PostgreSQL health check. It returns `503 Service Unavailable` when the configured database is not reachable, which is expected if local PostgreSQL or Docker Compose is not running.

Authentication endpoints return JWT access tokens and opaque refresh tokens. Refresh tokens are stored only as hashes and are rotated on refresh.

`POST /api/signs/import/3dzsigndb` requires `Contributor`, `Moderator`, `Researcher`, or `Admin` authorization. The request points to server-local 3DZSignDB files; the API does not ship fabricated signs.
