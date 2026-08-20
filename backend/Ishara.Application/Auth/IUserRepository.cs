using Ishara.Domain.Users;

namespace Ishara.Application.Auth;

public interface IUserRepository
{
  Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken = default);

  Task<User?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);

  Task<RefreshToken?> FindRefreshTokenAsync(string refreshTokenHash, CancellationToken cancellationToken = default);

  Task AddAsync(User user, CancellationToken cancellationToken = default);

  void AddRefreshToken(RefreshToken refreshToken);

  Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
