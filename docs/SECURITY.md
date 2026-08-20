# Security

Security priorities:

- No committed secrets.
- Strong password hashing.
- JWT validation with short-lived access tokens.
- Role-based authorization.
- Refresh tokens are opaque, stored as hashes, and rotated during refresh.
- JWT signing keys must come from environment variables or user secrets, never committed configuration.
- Input validation.
- Secure file upload handling.
- Restricted access to recordings and datasets.
- Structured logs without sensitive camera/audio payloads.
- CORS locked down outside development.
