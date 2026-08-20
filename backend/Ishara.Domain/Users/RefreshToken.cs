namespace Ishara.Domain.Users;

public sealed class RefreshToken
{
  private RefreshToken()
  {
  }

  public RefreshToken(
    Guid id,
    Guid userId,
    string tokenHash,
    DateTimeOffset expiresAtUtc,
    DateTimeOffset createdAtUtc)
  {
    Id = id;
    UserId = userId;
    TokenHash = tokenHash;
    ExpiresAtUtc = expiresAtUtc;
    CreatedAtUtc = createdAtUtc;
  }

  public Guid Id { get; private set; }

  public Guid UserId { get; private set; }

  public string TokenHash { get; private set; } = string.Empty;

  public DateTimeOffset ExpiresAtUtc { get; private set; }

  public DateTimeOffset CreatedAtUtc { get; private set; }

  public DateTimeOffset? RevokedAtUtc { get; private set; }

  public User User { get; private set; } = null!;

  public bool IsActive(DateTimeOffset nowUtc) =>
    RevokedAtUtc is null && ExpiresAtUtc > nowUtc;

  public void Revoke(DateTimeOffset revokedAtUtc)
  {
    RevokedAtUtc = revokedAtUtc;
  }
}
