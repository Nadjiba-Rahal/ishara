namespace Ishara.Application.Auth;

public sealed record RegisterUserRequest(string Email, string DisplayName, string Password);
