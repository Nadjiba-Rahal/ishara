using Ishara.Domain.Users;

namespace Ishara.Application.Auth;

public interface IJwtTokenService
{
  AuthResponse CreateToken(User user, string refreshToken);
}
