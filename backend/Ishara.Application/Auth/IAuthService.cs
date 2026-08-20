namespace Ishara.Application.Auth;

public interface IAuthService
{
  Task<AuthResult> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default);

  Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

  Task<AuthResult> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

  Task<AuthResult> LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default);
}
