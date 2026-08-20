namespace Ishara.Domain.Users;

public sealed class User
{
  private User()
  {
  }

  public User(
    Guid id,
    string email,
    string displayName,
    string passwordHash,
    UserRole role,
    DateTimeOffset createdAtUtc)
  {
    Id = id;
    Email = email;
    DisplayName = displayName;
    PasswordHash = passwordHash;
    Role = role;
    CreatedAtUtc = createdAtUtc;
  }

  public Guid Id { get; private set; }

  public string Email { get; private set; } = string.Empty;

  public string DisplayName { get; private set; } = string.Empty;

  public string PasswordHash { get; private set; } = string.Empty;

  public UserRole Role { get; private set; } = UserRole.User;

  public DateTimeOffset CreatedAtUtc { get; private set; }

  public List<RefreshToken> RefreshTokens { get; private set; } = [];
}
