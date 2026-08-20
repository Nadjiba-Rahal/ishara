namespace Ishara.Application.Auth;

public sealed record AuthResult(
  bool Succeeded,
  AuthResponse? Response,
  string? ErrorCode,
  string? Message)
{
  public static AuthResult Success(AuthResponse response) =>
    new(true, response, null, null);

  public static AuthResult Failure(string errorCode, string message) =>
    new(false, null, errorCode, message);
}
