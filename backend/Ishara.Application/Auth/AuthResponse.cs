namespace Ishara.Application.Auth;

public sealed record AuthResponse(
  Guid UserId,
  string Email,
  string DisplayName,
  string Role,
  string AccessToken,
  string RefreshToken,
  DateTimeOffset ExpiresAtUtc);
