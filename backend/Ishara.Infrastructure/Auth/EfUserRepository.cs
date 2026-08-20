using Ishara.Application.Auth;
using Ishara.Domain.Users;
using Ishara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ishara.Infrastructure.Auth;

public sealed class EfUserRepository(IsharaDbContext dbContext) : IUserRepository
{
  public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken = default) =>
    dbContext.Users.AnyAsync(user => user.Email == normalizedEmail, cancellationToken);

  public Task<User?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default) =>
    dbContext.Users
      .Include(user => user.RefreshTokens)
      .SingleOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);

  public Task<RefreshToken?> FindRefreshTokenAsync(string refreshTokenHash, CancellationToken cancellationToken = default) =>
    dbContext.RefreshTokens
      .Include(refreshToken => refreshToken.User)
      .ThenInclude(user => user.RefreshTokens)
      .SingleOrDefaultAsync(refreshToken => refreshToken.TokenHash == refreshTokenHash, cancellationToken);

  public async Task AddAsync(User user, CancellationToken cancellationToken = default)
  {
    dbContext.Users.Add(user);
    await dbContext.SaveChangesAsync(cancellationToken);
  }

  public void AddRefreshToken(RefreshToken refreshToken)
  {
    dbContext.RefreshTokens.Add(refreshToken);
  }

  public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
    dbContext.SaveChangesAsync(cancellationToken);
}
