using System.Net.Mail;
using Ishara.Domain.Users;

namespace Ishara.Application.Auth;

public sealed class AuthService(
  IUserRepository users,
  IPasswordHasher passwordHasher,
  IJwtTokenService jwtTokenService,
  IRefreshTokenService refreshTokenService) : IAuthService
{
  public async Task<AuthResult> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default)
  {
    var normalizedEmail = NormalizeEmail(request.Email);
    var displayName = request.DisplayName.Trim();

    if (!IsValidEmail(normalizedEmail))
    {
      return AuthResult.Failure("invalid_email", "A valid email address is required.");
    }

    if (displayName.Length is < 2 or > 80)
    {
      return AuthResult.Failure("invalid_display_name", "Display name must be between 2 and 80 characters.");
    }

    if (request.Password.Length < 8)
    {
      return AuthResult.Failure("weak_password", "Password must be at least 8 characters long.");
    }

    if (await users.EmailExistsAsync(normalizedEmail, cancellationToken))
    {
      return AuthResult.Failure("email_taken", "An account with this email already exists.");
    }

    var user = new User(
      Guid.NewGuid(),
      normalizedEmail,
      displayName,
      passwordHasher.HashPassword(request.Password),
      UserRole.User,
      DateTimeOffset.UtcNow);

    AddRefreshToken(user, out var refreshToken, addToRepository: false);
    await users.AddAsync(user, cancellationToken);

    return AuthResult.Success(jwtTokenService.CreateToken(user, refreshToken));
  }

  public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
  {
    var normalizedEmail = NormalizeEmail(request.Email);
    var user = await users.FindByEmailAsync(normalizedEmail, cancellationToken);

    if (user is null || !passwordHasher.VerifyPassword(user.PasswordHash, request.Password))
    {
      return AuthResult.Failure("invalid_credentials", "Email or password is incorrect.");
    }

    AddRefreshToken(user, out var refreshToken);
    await users.SaveChangesAsync(cancellationToken);

    return AuthResult.Success(jwtTokenService.CreateToken(user, refreshToken));
  }

  public async Task<AuthResult> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
  {
    if (string.IsNullOrWhiteSpace(request.RefreshToken))
    {
      return AuthResult.Failure("invalid_refresh_token", "Refresh token is required.");
    }

    var tokenHash = refreshTokenService.HashToken(request.RefreshToken);
    var savedToken = await users.FindRefreshTokenAsync(tokenHash, cancellationToken);

    if (savedToken is null || !savedToken.IsActive(DateTimeOffset.UtcNow))
    {
      return AuthResult.Failure("invalid_refresh_token", "Refresh token is invalid or expired.");
    }

    savedToken.Revoke(DateTimeOffset.UtcNow);
    AddRefreshToken(savedToken.User, out var refreshToken);
    await users.SaveChangesAsync(cancellationToken);

    return AuthResult.Success(jwtTokenService.CreateToken(savedToken.User, refreshToken));
  }

  public async Task<AuthResult> LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
  {
    if (!string.IsNullOrWhiteSpace(request.RefreshToken))
    {
      var tokenHash = refreshTokenService.HashToken(request.RefreshToken);
      var savedToken = await users.FindRefreshTokenAsync(tokenHash, cancellationToken);

      if (savedToken is not null && savedToken.IsActive(DateTimeOffset.UtcNow))
      {
        savedToken.Revoke(DateTimeOffset.UtcNow);
        await users.SaveChangesAsync(cancellationToken);
      }
    }

    return AuthResult.Success(new AuthResponse(
      Guid.Empty,
      string.Empty,
      string.Empty,
      string.Empty,
      string.Empty,
      string.Empty,
      DateTimeOffset.UtcNow));
  }

  private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

  private static bool IsValidEmail(string email)
  {
    try
    {
      var address = new MailAddress(email);
      return string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase);
    }
    catch (FormatException)
    {
      return false;
    }
  }

  private void AddRefreshToken(User user, out string refreshToken, bool addToRepository = true)
  {
    refreshToken = refreshTokenService.CreateToken();

    var savedRefreshToken = new RefreshToken(
      Guid.NewGuid(),
      user.Id,
      refreshTokenService.HashToken(refreshToken),
      DateTimeOffset.UtcNow.AddDays(14),
      DateTimeOffset.UtcNow);

    if (addToRepository)
    {
      users.AddRefreshToken(savedRefreshToken);
    }
    else
    {
      user.RefreshTokens.Add(savedRefreshToken);
    }
  }
}
